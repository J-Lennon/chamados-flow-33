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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { StatusBadge, PriorityBadge } from "./StatusBadge"
import { MoreHorizontal, Eye, Info } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Ticket, useTickets } from "@/hooks/useTickets"

export type { Ticket }

interface TicketsListProps {
  onTicketSelect?: (ticket: Ticket) => void
  statusFilter?: 'active' | 'completed'
}

export function TicketsList({ onTicketSelect, statusFilter }: TicketsListProps) {
  const [selectedTickets, setSelectedTickets] = useState<string[]>([])
  const { tickets, loading } = useTickets(statusFilter)

  const toggleTicketSelection = (ticketId: string) => {
    setSelectedTickets(prev => 
      prev.includes(ticketId) 
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    )
  }

  const selectAllTickets = () => {
    setSelectedTickets(
      selectedTickets.length === tickets.length 
        ? [] 
        : tickets.map(ticket => ticket.id)
    )
  }

  if (loading) {
    return <div className="text-center py-8">Carregando chamados...</div>
  }

  const getSLAStatus = (sla: string) => {
    const slaDate = new Date(sla)
    const now = new Date()
    const timeLeft = slaDate.getTime() - now.getTime()
    const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24))

    if (daysLeft < 0) {
      return { text: "Atrasado", variant: "destructive" as const }
    } else if (daysLeft <= 4) {
      return { text: `${daysLeft}d - Em dia`, variant: "outline" as const }
    } else if (daysLeft <= 9) {
      return { text: `${daysLeft}d - Próximo`, variant: "secondary" as const }
    } else {
      return { text: `${daysLeft}d restantes`, variant: "outline" as const }
    }
  }

  return (
    <div className="space-y-4">
      {selectedTickets.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-card border rounded-lg shadow-lg p-4 flex items-center gap-4">
            <span className="text-sm font-medium">
              {selectedTickets.length} chamado(s) selecionado(s)
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">Atribuir</Button>
              <Button size="sm" variant="outline">Mudar Status</Button>
              <Button size="sm" variant="outline">Fechar</Button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedTickets.length === tickets.length}
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
              <TableHead>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1 cursor-help">
                      SLA
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        <strong>SLA</strong> (Service Level Agreement) é o prazo acordado para resolução do chamado.
                        Indica quanto tempo resta até o vencimento.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableHead>
              <TableHead>Atualizado</TableHead>
              <TableHead className="w-[70px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                  Nenhum chamado encontrado
                </TableCell>
              </TableRow>
            ) : (
              tickets.map((ticket) => {
                const slaStatus = getSLAStatus(ticket.sla_due_date)
              
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
                    <TableCell className="font-mono text-sm">#{ticket.id.slice(0, 8)}</TableCell>
                    <TableCell className="max-w-[300px]">
                      <div className="truncate font-medium">{ticket.title}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {ticket.description}
                      </div>
                    </TableCell>
                    <TableCell>{ticket.requester?.full_name || "Desconhecido"}</TableCell>
                    <TableCell>{ticket.department || "N/A"}</TableCell>
                    <TableCell>
                      <StatusBadge status={ticket.status as any} />
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={ticket.priority as any} />
                    </TableCell>
                    <TableCell>
                      {ticket.assignee?.full_name ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                            {ticket.assignee.full_name.split(" ").map(n => n[0]).join("")}
                          </div>
                          <span className="text-sm">{ticket.assignee.full_name}</span>
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
                      {formatDistanceToNow(new Date(ticket.updated_at), { 
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
                          <DropdownMenuItem onClick={() => onTicketSelect?.(ticket)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalhes
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}