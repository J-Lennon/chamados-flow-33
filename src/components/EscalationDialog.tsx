import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ArrowUpCircle, Loader2 } from "lucide-react"
import { useEscalation } from "@/hooks/useEscalation"

interface EscalationDialogProps {
  ticketId: string
  currentLevel: number
  userId: string
  empresaId: string | null
  onEscalated: () => void
}

export function EscalationDialog({
  ticketId,
  currentLevel,
  userId,
  empresaId,
  onEscalated,
}: EscalationDialogProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const { escalateTicket, loading } = useEscalation()

  const handleEscalate = async () => {
    if (!reason.trim()) return
    const success = await escalateTicket(ticketId, currentLevel, reason, userId, empresaId)
    if (success) {
      setReason("")
      setOpen(false)
      onEscalated()
    }
  }

  const levelLabels: Record<number, string> = {
    1: "Nível 1 → Nível 2",
    2: "Nível 2 → Nível 3",
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="border-orange-500/50 text-orange-600 hover:bg-orange-500/10">
          <ArrowUpCircle className="mr-2 h-4 w-4" />
          Escalonar ({levelLabels[currentLevel] || `N${currentLevel} → N${currentLevel + 1}`})
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Escalonar Chamado</DialogTitle>
          <DialogDescription>
            Este chamado será encaminhado do Nível {currentLevel} para o Nível {currentLevel + 1}.
            O responsável atual será removido para que o próximo nível possa assumir.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="Descreva o motivo do escalonamento..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="min-h-[100px]"
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleEscalate}
            disabled={loading || !reason.trim()}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Escalonamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
