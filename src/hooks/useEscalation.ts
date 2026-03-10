import { useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

export function useEscalation() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const escalateTicket = async (
    ticketId: string,
    currentLevel: number,
    reason: string,
    userId: string,
    empresaId: string | null
  ) => {
    if (currentLevel >= 3) {
      toast({
        title: "Nível máximo",
        description: "Este chamado já está no nível máximo de atendimento (N3)",
        variant: "destructive",
      })
      return false
    }

    setLoading(true)
    try {
      const newLevel = currentLevel + 1

      // Update ticket level
      const { error: updateError } = await supabase
        .from("tickets")
        .update({
          nivel_atendimento: newLevel,
          escalated_from: userId,
          escalated_at: new Date().toISOString(),
          escalation_reason: reason,
          assigned_to: null, // Unassign so next level can pick up
          status: "new",
        })
        .eq("id", ticketId)

      if (updateError) throw updateError

      // Record escalation history
      const { error: historyError } = await supabase
        .from("ticket_escalations")
        .insert({
          ticket_id: ticketId,
          from_level: currentLevel,
          to_level: newLevel,
          escalated_by: userId,
          reason,
          empresa_id: empresaId,
        })

      if (historyError) throw historyError

      toast({
        title: `Escalonado para Nível ${newLevel}`,
        description: `Chamado encaminhado do N${currentLevel} para N${newLevel}`,
      })

      return true
    } catch (error: any) {
      console.error("Escalation error:", error)
      toast({
        title: "Erro ao escalonar",
        description: error.message || "Não foi possível escalonar o chamado",
        variant: "destructive",
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  return { escalateTicket, loading }
}
