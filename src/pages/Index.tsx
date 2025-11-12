import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { User } from "@supabase/supabase-js"
import { supabase } from "@/integrations/supabase/client"
import { useUserRole } from "@/hooks/useUserRole"
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
  const { isAdmin } = useUserRole(user?.id)

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Header />
      
      <main className="container mx-auto p-6">
        <Tabs defaultValue={isAdmin ? "dashboard" : "tickets"} className="space-y-6">
          <TabsList className="bg-card/50 backdrop-blur-sm border border-primary/20">
            {isAdmin && <TabsTrigger value="dashboard" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground">Dashboard</TabsTrigger>}
            <TabsTrigger value="tickets" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground">Chamados</TabsTrigger>
          </TabsList>
          
          {isAdmin && (
            <TabsContent value="dashboard">
              <Dashboard />
            </TabsContent>
          )}
          
          <TabsContent value="tickets" className="space-y-4">
            <Tabs defaultValue="active" className="space-y-4">
              <TabsList className="bg-card/50 backdrop-blur-sm border border-primary/20">
                <TabsTrigger value="active" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground">Chamados Ativos</TabsTrigger>
                <TabsTrigger value="completed" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground">Chamados Concluídos</TabsTrigger>
              </TabsList>
              
              <TabsContent value="active">
                <TicketFilters onFiltersChange={() => {}} />
                <TicketsList onTicketSelect={handleTicketSelect} statusFilter="active" />
              </TabsContent>
              
              <TabsContent value="completed">
                <TicketFilters onFiltersChange={() => {}} />
                <TicketsList onTicketSelect={handleTicketSelect} statusFilter="completed" />
              </TabsContent>
            </Tabs>
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
