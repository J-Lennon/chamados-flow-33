import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { StatusBadge, PriorityBadge } from "./StatusBadge"
import { Ticket } from "./TicketsList"
import {
  Clock,
  User,
  Building,
  MessageSquare,
  Paperclip,
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

const mockActivities = [
  {
    id: 1,
    type: "status_change",
    user: "Carlos Silva",
    description: "alterou o status para Em Andamento",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 2,
    type: "assignment",
    user: "Ana Rodrigues",
    description: "atribuiu o chamado para Carlos Silva",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
  },
  {
    id: 3,
    type: "comment",
    user: "João Oliveira",
    description: "adicionou um comentário",
    comment: "Problema persiste após reinicialização da impressora.",
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
  },
  {
    id: 4,
    type: "created",
    user: "João Oliveira",
    description: "criou o chamado",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
]

const mockAttachments = [
  { id: 1, name: "erro_impressora.jpg", size: "245 KB", type: "image" },
  { id: 2, name: "log_sistema.txt", size: "12 KB", type: "text" },
]

export function TicketDetails({ ticket, isOpen, onClose }: TicketDetailsProps) {
  if (!ticket) return null

  const getSLAStatus = (sla: Date) => {
    const now = new Date()
    const timeLeft = sla.getTime() - now.getTime()
    const hoursLeft = timeLeft / (1000 * 60 * 60)

    if (hoursLeft < 0) {
      return { text: "Atrasado", variant: "destructive" as const, isUrgent: true }
    } else if (hoursLeft < 4) {
      return { text: `${Math.floor(hoursLeft)}h restantes`, variant: "destructive" as const, isUrgent: true }
    } else if (hoursLeft < 24) {
      return { text: `${Math.floor(hoursLeft)}h restantes`, variant: "secondary" as const, isUrgent: false }
    } else {
      const daysLeft = Math.floor(hoursLeft / 24)
      return { text: `${daysLeft}d restantes`, variant: "outline" as const, isUrgent: false }
    }
  }

  const slaStatus = getSLAStatus(ticket.sla)

  return (
    <Sheet open={isOpen} onOpenChange={() => onClose()}>
      <SheetContent className="w-[600px] sm:w-[700px] sm:max-w-[90vw]">
        <SheetHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <SheetTitle className="font-mono text-lg">{ticket.id}</SheetTitle>
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
              </div>
              <h2 className="text-xl font-semibold leading-tight">{ticket.title}</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Button size="sm">
              <UserCheck className="mr-2 h-4 w-4" />
              Aceitar
            </Button>
            <Button size="sm" variant="outline">
              <User className="mr-2 h-4 w-4" />
              Atribuir
            </Button>
            <Button size="sm" variant="outline">
              <MessageSquare className="mr-2 h-4 w-4" />
              Adicionar Nota
            </Button>
            <Button size="sm" variant="outline">
              <CheckCircle className="mr-2 h-4 w-4" />
              Fechar
            </Button>
          </div>
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
                  <div className="text-sm text-muted-foreground">{ticket.requester}</div>
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
                    {ticket.assignee || "Não atribuído"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Criado em</div>
                  <div className="text-sm text-muted-foreground">
                    {format(ticket.createdAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Attachments */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              Anexos ({mockAttachments.length})
            </h3>
            <div className="space-y-2">
              {mockAttachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center gap-3 p-2 border rounded-lg">
                  <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{attachment.name}</div>
                    <div className="text-xs text-muted-foreground">{attachment.size}</div>
                  </div>
                  <Button size="sm" variant="outline">
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Activity Timeline */}
          <div className="space-y-3">
            <h3 className="font-semibold">Histórico de Atividades</h3>
            <div className="space-y-4">
              {mockActivities.map((activity, index) => (
                <div key={activity.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {activity.user.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    {index < mockActivities.length - 1 && (
                      <div className="w-px h-8 bg-border mt-2" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="text-sm">
                      <span className="font-medium">{activity.user}</span>{" "}
                      <span className="text-muted-foreground">{activity.description}</span>
                    </div>
                    {activity.comment && (
                      <div className="text-sm bg-muted/50 p-2 rounded border-l-2 border-primary/30">
                        {activity.comment}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(activity.timestamp, { addSuffix: true, locale: ptBR })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}