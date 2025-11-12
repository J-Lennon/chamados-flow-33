import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { User } from "@supabase/supabase-js"
import { supabase } from "@/integrations/supabase/client"
import { Header } from "@/components/Header"
import { UsersManagement } from "@/components/UsersManagement"

const Users = () => {
  const [user, setUser] = useState<User | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (!session?.user) {
        navigate("/auth")
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) {
        navigate("/auth")
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Header />
      
      <main className="container mx-auto p-6">
        <UsersManagement />
      </main>
    </div>
  )
}

export default Users
