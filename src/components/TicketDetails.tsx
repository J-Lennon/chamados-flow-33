import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { StatusBadge, PriorityBadge } from "./StatusBadge"
import { Ticket, useTickets } from "@/hooks/useTickets"
import { useTicketMessages } from "@/hooks/useTicketMessages"
import { useTicketHistory } from "@/hooks/useTicketHistory"
import { useAuth } from "@/hooks/useAuth"
import { useUserRole } from "@/hooks/useUserRole"
import {
  Clock,
  User,
  Building,
  MessageSquare,
  UserCheck,
  CheckCircle,
  X,
  Calendar
} from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface TicketDetailsProps {
  ticket: Ticket | null
  isOpen: boolean
  onClose: () => void
}

export function TicketDetails({ ticket, isOpen, onClose }: TicketDetailsProps) {
  const [rejectReason, setRejectReason] = useState("")
  const [newMessage, setNewMessage] = useState("")
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false)
  
  const { user } = useAuth()
  const { isAgent } = useUserRole(user?.id)
  const { acceptTicket, rejectTicket, sendMessage, completeTicket } = useTickets()
  const { messages } = useTicketMessages(ticket?.id || null)
  const { history } = useTicketHistory(ticket?.id || null)

  if (!ticket) return null

  const handleAcceptTicket = async () => {
    if (!user) return
    await acceptTicket(ticket.id, user.id)
    onClose()
  }

  const handleRejectTicket = async () => {
    if (!user || !rejectReason.trim()) return
    await rejectTicket(ticket.id, user.id, rejectReason)
    setRejectReason("")
    setIsRejectDialogOpen(false)
    onClose()
  }

  const handleSendMessage = async () => {
    if (!user || !newMessage.trim()) return
    await sendMessage(ticket.id, user.id, newMessage)
    setNewMessage("")
    setIsMessageDialogOpen(false)
  }

  const handleCompleteTicket = async () => {
    await completeTicket(ticket.id)
    onClose()
  }

  const getSLAStatus = (sla: string) => {
    const slaDate = new Date(sla)
    const now = new Date()
    const timeLeft = slaDate.getTime() - now.getTime()
    const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24))

    if (daysLeft < 0) {
      return { text: "Atrasado", variant: "destructive" as const, isUrgent: true }
    } else if (daysLeft <= 4) {
      return { text: `${daysLeft}d restantes - Em dia`, variant: "outline" as const, isUrgent: false }
    } else if (daysLeft <= 9) {
      return { text: `${daysLeft}d restantes - Próximo do prazo`, variant: "secondary" as const, isUrgent: true }
    } else {
      return { text: `${daysLeft}d restantes`, variant: "outline" as const, isUrgent: false }
    }
  }

  const slaStatus = getSLAStatus(ticket.sla_due_date)

  return (
    <Sheet open={isOpen} onOpenChange={() => onClose()}>
      <SheetContent className="w-[600px] sm:w-[700px] sm:max-w-[90vw]">
        <SheetHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <SheetTitle className="font-mono text-lg">#{ticket.id.slice(0, 8)}</SheetTitle>
                <StatusBadge status={ticket.status as any} />
                <PriorityBadge priority={ticket.priority as any} />
              </div>
              <h2 className="text-xl font-semibold leading-tight">{ticket.title}</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Actions - Only for agents/admins and based on ticket status */}
          {isAgent && ticket.status !== "completed" && ticket.status !== "closed" && (
            <div className="flex flex-wrap gap-2">
              {!ticket.assigned_to && (
                <Button size="sm" onClick={handleAcceptTicket}>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Aceitar
                </Button>
              )}
              
              {!ticket.assigned_to && (
                <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="destructive">
                      <X className="mr-2 h-4 w-4" />
                      Recusar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-background border shadow-lg">
                    <DialogHeader>
                      <DialogTitle>Recusar Chamado</DialogTitle>
                      <DialogDescription>
                        Por favor, informe o motivo da recusa deste chamado.
                      </DialogDescription>
                    </DialogHeader>
                    <Textarea
                      placeholder="Digite o motivo da recusa..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button variant="destructive" onClick={handleRejectTicket}>
                        Confirmar Recusa
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {ticket.assigned_to && (
                <>
                  <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Enviar Pergunta
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-background border shadow-lg">
                      <DialogHeader>
                        <DialogTitle>Enviar Pergunta ao Usuário</DialogTitle>
                        <DialogDescription>
                          Faça uma pergunta para esclarecer dúvidas sobre este chamado.
                        </DialogDescription>
                      </DialogHeader>
                      <Textarea
                        placeholder="Digite sua pergunta..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsMessageDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleSendMessage}>
                          Enviar Pergunta
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button size="sm" variant="outline" onClick={handleCompleteTicket}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Concluir
                  </Button>
                </>
              )}
            </div>
          )}
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* SLA Status */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">SLA:</span>
            <Badge variant={slaStatus.variant} className="text-xs">
              {slaStatus.text}
            </Badge>
            {slaStatus.isUrgent && (
              <span className="text-xs text-muted-foreground ml-auto">
                ⚠️ Atenção necessária
              </span>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="font-semibold">Descrição</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {ticket.description}
            </p>
          </div>

          <Separator />

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Solicitante</div>
                  <div className="text-sm text-muted-foreground">{ticket.requester?.full_name || "Desconhecido"}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Departamento</div>
                  <div className="text-sm text-muted-foreground">{ticket.department}</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Responsável</div>
                  <div className="text-sm text-muted-foreground">
                    {ticket.assignee?.full_name || "Não atribuído"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Criado em</div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Messages */}
          {messages.length > 0 && (
            <>
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Mensagens ({messages.length})
                </h3>
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div key={message.id} className="p-3 border rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">
                          {message.sender?.full_name || "Usuário"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(message.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-sm">{message.message}</p>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Activity Timeline */}
          <div className="space-y-3">
            <h3 className="font-semibold">Histórico de Atividades</h3>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma atividade registrada</p>
            ) : (
              <div className="space-y-4">
                {history.map((item, index) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {item.user?.full_name?.split(" ").map(n => n[0]).join("") || "?"}
                        </AvatarFallback>
                      </Avatar>
                      {index < history.length - 1 && (
                        <div className="w-px h-8 bg-border mt-2" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="text-sm">
                        <span className="font-medium">{item.user?.full_name || "Sistema"}</span>{" "}
                        <span className="text-muted-foreground">{item.action}</span>
                      </div>
                      {item.details && (
                        <div className="text-sm bg-muted/50 p-2 rounded border-l-2 border-primary/30">
                          {item.details}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ptBR })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}