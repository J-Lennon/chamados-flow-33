import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatusBadge, PriorityBadge, TicketStatus, TicketPriority } from "./StatusBadge"
import { MoreHorizontal, Eye, UserCheck, MessageSquare, CheckCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

export interface Ticket {
  id: string
  title: string
  description: string
  requester: string
  department: string
  status: TicketStatus
  priority: TicketPriority
  assignee?: string
  sla: Date
  updatedAt: Date
  createdAt: Date
}

const mockTickets: Ticket[] = [
  {
    id: "#001",
    title: "Impressora não funciona no setor financeiro",
    description: "A impressora HP LaserJet do setor financeiro parou de funcionar após atualização do sistema.",
    requester: "João Oliveira",
    department: "Financeiro",
    status: "new",
    priority: "high",
    sla: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000),
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: "#002",
    title: "Não consigo acessar o sistema ERP",
    description: "Erro de login no sistema ERP após mudança de senha.",
    requester: "Maria Santos",
    department: "Contabilidade",
    status: "progress",
    priority: "critical",
    assignee: "Carlos Silva",
    sla: new Date(Date.now() + 4 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: "#003",
    title: "Solicitar novo monitor para estação de trabalho",
    description: "Monitor atual apresenta falhas na tela, necessário substituição.",
    requester: "Pedro Costa",
    department: "Vendas",
    status: "waiting",
    priority: "medium",
    assignee: "Ana Rodrigues",
    sla: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: "#004",
    title: "Email não está sincronizando",
    description: "Problemas de sincronização com o Outlook, emails não estão chegando.",
    requester: "Luciana Pereira",
    department: "RH",
    status: "accepted",
    priority: "medium",
    assignee: "Carlos Silva",
    sla: new Date(Date.now() + 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: "#005",
    title: "Backup do servidor falhou",
    description: "Procedimento de backup automatizado falhou, necessário verificação.",
    requester: "Sistema Automático",
    department: "TI",
    status: "overdue",
    priority: "critical",
    assignee: "Roberto Lima",
    sla: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
  },
]

interface TicketsListProps {
  onTicketSelect?: (ticket: Ticket) => void
}

export function TicketsList({ onTicketSelect }: TicketsListProps) {
  const [selectedTickets, setSelectedTickets] = useState<string[]>([])

  const toggleTicketSelection = (ticketId: string) => {
    setSelectedTickets(prev => 
      prev.includes(ticketId) 
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    )
  }

  const selectAllTickets = () => {
    setSelectedTickets(
      selectedTickets.length === mockTickets.length 
        ? [] 
        : mockTickets.map(ticket => ticket.id)
    )
  }

  const getSLAStatus = (sla: Date) => {
    const now = new Date()
    const timeLeft = sla.getTime() - now.getTime()
    const hoursLeft = timeLeft / (1000 * 60 * 60)

    if (hoursLeft < 0) {
      return { text: "Atrasado", variant: "destructive" as const }
    } else if (hoursLeft < 4) {
      return { text: `${Math.floor(hoursLeft)}h restantes`, variant: "destructive" as const }
    } else if (hoursLeft < 24) {
      return { text: `${Math.floor(hoursLeft)}h restantes`, variant: "secondary" as const }
    } else {
      const daysLeft = Math.floor(hoursLeft / 24)
      return { text: `${daysLeft}d restantes`, variant: "outline" as const }
    }
  }

  return (
    <div className="space-y-4">
      {/* Bulk actions */}
      {selectedTickets.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-card border rounded-lg shadow-lg p-4 flex items-center gap-4">
            <span className="text-sm font-medium">
              {selectedTickets.length} chamado(s) selecionado(s)
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                Atribuir
              </Button>
              <Button size="sm" variant="outline">
                Mudar Status
              </Button>
              <Button size="sm" variant="outline">
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedTickets.length === mockTickets.length}
                  onCheckedChange={selectAllTickets}
                />
              </TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Solicitante</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>SLA</TableHead>
              <TableHead>Atualizado</TableHead>
              <TableHead className="w-[70px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockTickets.map((ticket) => {
              const slaStatus = getSLAStatus(ticket.sla)
              
              return (
                <TableRow 
                  key={ticket.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onTicketSelect?.(ticket)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedTickets.includes(ticket.id)}
                      onCheckedChange={() => toggleTicketSelection(ticket.id)}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm">{ticket.id}</TableCell>
                  <TableCell className="max-w-[300px]">
                    <div className="truncate font-medium">{ticket.title}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {ticket.description}
                    </div>
                  </TableCell>
                  <TableCell>{ticket.requester}</TableCell>
                  <TableCell>{ticket.department}</TableCell>
                  <TableCell>
                    <StatusBadge status={ticket.status} />
                  </TableCell>
                  <TableCell>
                    <PriorityBadge priority={ticket.priority} />
                  </TableCell>
                  <TableCell>
                    {ticket.assignee ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                          {ticket.assignee.split(" ").map(n => n[0]).join("")}
                        </div>
                        <span className="text-sm">{ticket.assignee}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Não atribuído</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={slaStatus.variant} className="text-xs">
                      {slaStatus.text}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(ticket.updatedAt, { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <UserCheck className="mr-2 h-4 w-4" />
                          Aceitar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Adicionar nota
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Marcar como concluído
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}