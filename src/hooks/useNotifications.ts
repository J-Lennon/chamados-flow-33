import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"

export function useNotifications(userId: string | undefined) {
  const [notificationCount, setNotificationCount] = useState(0)

  const fetchNotificationCount = async () => {
    if (!userId) return

    try {
      // Contar tickets novos ou não atribuídos
      const { count, error } = await supabase
        .from("tickets")
        .select("*", { count: "exact", head: true })
        .in("status", ["new", "pending"])

      if (error) throw error
      setNotificationCount(count || 0)
    } catch (error) {
      console.error("Error fetching notifications:", error)
    }
  }

  useEffect(() => {
    fetchNotificationCount()

    if (!userId) return

    // Subscribe to ticket changes
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tickets",
        },
        () => {
          fetchNotificationCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  return { notificationCount, refetch: fetchNotificationCount }
}
