import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"

export type UserRole = "admin" | "agent" | "user"

export function useUserRole(userId: string | undefined) {
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRole = async () => {
      if (!userId) {
        setRole(null)
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .order("role", { ascending: true })
          .limit(1)
          .single()

        if (error) throw error
        setRole(data.role as UserRole)
      } catch (error) {
        console.error("Error fetching user role:", error)
        setRole("user")
      } finally {
        setLoading(false)
      }
    }

    fetchRole()
  }, [userId])

  return { role, loading, isAdmin: role === "admin", isAgent: role === "agent" || role === "admin" }
}
