import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://esm.sh/zod@3.25.76'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Validation schemas
const nameRegex = /^[a-zA-ZÀ-ÿ\s-]+$/

const createUserSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(50).regex(nameRegex, 'Only letters, spaces, and hyphens allowed'),
  lastName: z.string().trim().min(1, 'Last name is required').max(50).regex(nameRegex, 'Only letters, spaces, and hyphens allowed'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
  role: z.enum(['user', 'agent', 'admin']).default('user'),
})

const updateUserSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  fullName: z.string().trim().min(1).max(100).regex(nameRegex, 'Only letters, spaces, and hyphens allowed').optional(),
  password: z.string().min(8).max(72).optional(),
}).refine(data => data.fullName || data.password, { message: 'At least one field to update is required' })

const deleteUserSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
})

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify current user is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Verify admin or agent role
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!roleData || (roleData.role !== 'admin' && roleData.role !== 'agent')) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const body = await req.json()
    const { action, userData } = body

    if (!action || typeof action !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    switch (action) {
      case 'create': {
        const validated = createUserSchema.parse(userData)
        const firstName = validated.firstName.trim().replace(/\s+/g, ' ')
        const lastName = validated.lastName.trim().replace(/\s+/g, ' ')
        const username = `${firstName}.${lastName}`.toLowerCase().replace(/[^a-z.\-]/g, '')
        const email = `${username}@telesdesk.com`

        // Prevent agents from creating admin users
        if (roleData.role === 'agent' && validated.role === 'admin') {
          return new Response(JSON.stringify({ error: 'Agents cannot create admin users' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const fullName = `${firstName} ${lastName}`

        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: validated.password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName
          }
        })

        if (createError) throw createError

        // Assign role
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: newUser.user.id,
            role: validated.role
          })

        if (roleError) {
          console.error('Error assigning role:', roleError)
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            user: newUser,
            credentials: { username, password: validated.password, email }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'update': {
        const validated = updateUserSchema.parse(userData)
        const updateData: Record<string, unknown> = {}
        
        if (validated.fullName) {
          updateData.user_metadata = { full_name: validated.fullName }
        }
        if (validated.password) {
          updateData.password = validated.password
        }

        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          validated.userId,
          updateData
        )

        if (updateError) throw updateError

        if (validated.fullName) {
          await supabaseAdmin
            .from('profiles')
            .update({ full_name: validated.fullName })
            .eq('id', validated.userId)
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'delete': {
        const validated = deleteUserSchema.parse(userData)

        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(validated.userId)

        if (deleteError) throw deleteError

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    // Handle zod validation errors specifically
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Validation error', details: error.errors.map(e => e.message) }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
