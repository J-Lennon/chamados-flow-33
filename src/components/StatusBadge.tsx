import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type TicketStatus = "new" | "progress" | "waiting" | "accepted" | "completed" | "overdue"
export type TicketPriority = "low" | "medium" | "high" | "critical"

const statusConfig = {
  new: { label: "Novo", className: "bg-status-new text-status-new-foreground" },
  progress: { label: "Em Andamento", className: "bg-status-progress text-status-progress-foreground" },
  waiting: { label: "Em Espera", className: "bg-status-waiting text-status-waiting-foreground" },
  accepted: { label: "Aceito", className: "bg-status-accepted text-status-accepted-foreground" },
  completed: { label: "Concluído", className: "bg-status-completed text-status-completed-foreground" },
  overdue: { label: "Atrasado", className: "bg-status-overdue text-status-overdue-foreground" },
}

const priorityConfig = {
  low: { label: "Baixa", className: "bg-priority-low text-priority-low-foreground" },
  medium: { label: "Média", className: "bg-priority-medium text-priority-medium-foreground" },
  high: { label: "Alta", className: "bg-priority-high text-priority-high-foreground" },
  critical: { label: "Crítica", className: "bg-priority-critical text-priority-critical-foreground" },
}

interface StatusBadgeProps {
  status: TicketStatus
  className?: string
}

interface PriorityBadgeProps {
  priority: TicketPriority
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.new
  
  return (
    <Badge className={cn(config.className, className)}>
      {config.label}
    </Badge>
  )
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority] || priorityConfig.medium
  
  return (
    <Badge variant="outline" className={cn(config.className, "border-current", className)}>
      {config.label}
    </Badge>
  )
}