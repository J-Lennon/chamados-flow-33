import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { User } from "@supabase/supabase-js"
import { supabase } from "@/integrations/supabase/client"
import { Header } from "@/components/Header"
import { Dashboard } from "@/components/Dashboard"
import { TicketsList } from "@/components/TicketsList"
import { TicketDetails } from "@/components/TicketDetails"
import { TicketFilters } from "@/components/TicketFilters"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Ticket } from "@/hooks/useTickets"

const Index = () => {
  const [user, setUser] = useState<User | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
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

  const handleTicketSelect = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setIsDetailsOpen(true)
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto p-6">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="tickets">Chamados</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <Dashboard />
          </TabsContent>
          
          <TabsContent value="tickets" className="space-y-4">
            <TicketFilters />
            <TicketsList onTicketSelect={handleTicketSelect} />
          </TabsContent>
        </Tabs>
      </main>

      <TicketDetails
        ticket={selectedTicket}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />
    </div>
  )
}

export default Index
