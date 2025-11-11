import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

export interface Ticket {
  id: string
  title: string
  description: string
  status: string
  priority: string
  requester_id: string
  assigned_to?: string
  department: string
  sla_due_date: string
  created_at: string
  updated_at: string
  requester?: {
    full_name: string
  }
  assignee?: {
    full_name: string
  }
}

export function useTickets(statusFilter?: 'active' | 'completed') {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchTickets = async () => {
    try {
      let query = supabase
        .from("tickets")
        .select(`
          *,
          requester:profiles!tickets_requester_id_fkey(full_name),
          assignee:profiles!tickets_assigned_to_fkey(full_name)
        `)

      // Aplicar filtro de status
      if (statusFilter === 'active') {
        query = query.in('status', ['new', 'progress', 'waiting', 'accepted'])
      } else if (statusFilter === 'completed') {
        query = query.in('status', ['completed', 'closed', 'rejected'])
      }

      const { data, error } = await query.order("created_at", { ascending: false })

      if (error) throw error
      setTickets(data || [])
    } catch (error) {
      console.error("Error fetching tickets:", error)
      toast({
        title: "Erro ao carregar chamados",
        description: "Não foi possível carregar os chamados",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const acceptTicket = async (ticketId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from("tickets")
        .update({ 
          status: "accepted", 
          assigned_to: userId 
        })
        .eq("id", ticketId)

      if (error) throw error

      toast({
        title: "Chamado aceito",
        description: "O chamado foi atribuído a você",
      })

      await fetchTickets()
    } catch (error) {
      console.error("Error accepting ticket:", error)
      toast({
        title: "Erro ao aceitar chamado",
        description: "Não foi possível aceitar o chamado",
        variant: "destructive",
      })
    }
  }

  const rejectTicket = async (ticketId: string, userId: string, reason: string) => {
    try {
      const { error: updateError } = await supabase
        .from("tickets")
        .update({ status: "rejected" })
        .eq("id", ticketId)

      if (updateError) throw updateError

      // Salvar motivo da recusa nas mensagens
      const { error: messageError } = await supabase
        .from("ticket_messages")
        .insert({
          ticket_id: ticketId,
          sender_id: userId,
          message: `Chamado recusado. Motivo: ${reason}`,
          is_internal: false,
        })

      if (messageError) throw messageError

      toast({
        title: "Chamado recusado",
        description: "O chamado foi recusado com sucesso",
      })

      await fetchTickets()
    } catch (error) {
      console.error("Error rejecting ticket:", error)
      toast({
        title: "Erro ao recusar chamado",
        description: "Não foi possível recusar o chamado",
        variant: "destructive",
      })
    }
  }

  const sendMessage = async (ticketId: string, userId: string, message: string) => {
    try {
      const { error } = await supabase
        .from("ticket_messages")
        .insert({
          ticket_id: ticketId,
          sender_id: userId,
          message,
          is_internal: false,
        })

      if (error) throw error

      toast({
        title: "Pergunta enviada",
        description: "Sua pergunta foi enviada ao solicitante",
      })
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Erro ao enviar pergunta",
        description: "Não foi possível enviar a pergunta",
        variant: "destructive",
      })
    }
  }

  const completeTicket = async (ticketId: string) => {
    try {
      const { error } = await supabase
        .from("tickets")
        .update({ status: "completed" })
        .eq("id", ticketId)

      if (error) throw error

      toast({
        title: "Chamado concluído",
        description: "O chamado foi marcado como concluído",
      })

      await fetchTickets()
    } catch (error) {
      console.error("Error completing ticket:", error)
      toast({
        title: "Erro ao concluir chamado",
        description: "Não foi possível concluir o chamado",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchTickets()

    // Subscribe to ticket changes
    const channel = supabase
      .channel("tickets-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tickets",
        },
        () => {
          fetchTickets()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [statusFilter])

  return {
    tickets,
    loading,
    acceptTicket,
    rejectTicket,
    sendMessage,
    completeTicket,
    refetch: fetchTickets,
  }
}
