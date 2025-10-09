import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"

export interface TicketHistoryItem {
  id: string
  ticket_id: string
  action: string
  details: string
  performed_by?: string
  created_at: string
  user?: {
    full_name: string
  }
}

export function useTicketHistory(ticketId: string | null) {
  const [history, setHistory] = useState<TicketHistoryItem[]>([])
  const [loading, setLoading] = useState(false)

  const fetchHistory = async () => {
    if (!ticketId) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("ticket_history")
        .select(`
          *,
          user:profiles!ticket_history_performed_by_fkey(full_name)
        `)
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setHistory(data || [])
    } catch (error) {
      console.error("Error fetching history:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()

    if (!ticketId) return

    // Subscribe to history changes
    const channel = supabase
      .channel(`history-${ticketId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ticket_history",
          filter: `ticket_id=eq.${ticketId}`,
        },
        () => {
          fetchHistory()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [ticketId])

  return { history, loading, refetch: fetchHistory }
}
