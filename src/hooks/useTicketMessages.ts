import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"

export interface TicketMessage {
  id: string
  ticket_id: string
  sender_id: string
  message: string
  is_internal: boolean
  created_at: string
  sender?: {
    full_name: string
  }
}

export function useTicketMessages(ticketId: string | null) {
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [loading, setLoading] = useState(false)

  const fetchMessages = async () => {
    if (!ticketId) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("ticket_messages")
        .select(`
          *,
          sender:profiles!ticket_messages_sender_id_fkey(full_name)
        `)
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error("Error fetching messages:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()

    if (!ticketId) return

    // Subscribe to message changes
    const channel = supabase
      .channel(`messages-${ticketId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ticket_messages",
          filter: `ticket_id=eq.${ticketId}`,
        },
        () => {
          fetchMessages()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [ticketId])

  return { messages, loading, refetch: fetchMessages }
}
