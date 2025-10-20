import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { StatusBadge, PriorityBadge } from "./StatusBadge"
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  Users,
  ArrowRight,
  BarChart3,
  PieChart,
  Calendar,
  Download
} from "lucide-react"
import { useDashboardData } from "@/hooks/useDashboardData"
import { Skeleton } from "@/components/ui/skeleton"

export function Dashboard() {
  const { data, loading } = useDashboardData()

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  const kpiData = [
    {
      title: "Novos",
      value: data.kpiData.new,
      icon: AlertTriangle,
      color: "text-status-new"
    },
    {
      title: "Em Andamento",
      value: data.kpiData.progress,
      icon: Clock,
      color: "text-status-progress"
    },
    {
      title: "Concluídos",
      value: data.kpiData.completed,
      icon: CheckCircle,
      color: "text-status-completed"
    },
    {
      title: "Atrasados",
      value: data.kpiData.overdue,
      icon: AlertTriangle,
      color: "text-status-overdue"
    },
    {
      title: "SLA Próximo",
      value: data.kpiData.slaClose,
      icon: Clock,
      color: "text-status-waiting"
    }
  ]

  const statusQueue = [
    { status: "Novos", count: data.statusQueue.new },
    { status: "Em Espera", count: data.statusQueue.waiting },
    { status: "Aceitos", count: data.statusQueue.accepted },
    { status: "Em Andamento", count: data.statusQueue.progress },
    { status: "Concluídos", count: data.statusQueue.completed },
  ]

  const priorityDistribution = [
    { priority: "critical" as const, label: "Crítica", count: data.priorityDistribution.critical },
    { priority: "high" as const, label: "Alta", count: data.priorityDistribution.high },
    { priority: "medium" as const, label: "Média", count: data.priorityDistribution.medium },
    { priority: "low" as const, label: "Baixa", count: data.priorityDistribution.low },
  ]

  const totalTickets = priorityDistribution.reduce((sum, p) => sum + p.count, 0)
  const priorityWithPercentage = priorityDistribution.map(p => ({
    ...p,
    percentage: totalTickets > 0 ? Math.round((p.count / totalTickets) * 100) : 0
  }))
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral dos chamados e indicadores principais
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select defaultValue="30">
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="14">Últimos 14 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {kpiData.map((kpi) => {
          const Icon = kpi.icon
          
          return (
            <Card key={kpi.title} className="bg-gradient-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {kpi.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${kpi.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Status Queue */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Fila por Status
              </CardTitle>
              <CardDescription>
                Distribuição de chamados por status atual
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {statusQueue.map((item) => (
                <div key={item.status} className="text-center space-y-2">
                  <div className="text-2xl font-bold">{item.count}</div>
                  <div className="text-sm text-muted-foreground">{item.status}</div>
                  <Button variant="ghost" size="sm" className="text-xs h-auto p-1">
                    Ver todos
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Prioridades
            </CardTitle>
            <CardDescription>
              Distribuição por nível de prioridade
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {priorityWithPercentage.length > 0 ? (
              priorityWithPercentage.map((item) => (
                <div key={item.priority} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={item.priority} />
                    <span className="text-sm">{item.count}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {item.percentage}%
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum chamado cadastrado
              </p>
            )}
          </CardContent>
        </Card>

        {/* Volume Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Volume por Dia
            </CardTitle>
            <CardDescription>
              Chamados abertos nos últimos 14 dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-end justify-between gap-1">
              {data.volumeData.map((day, index) => {
                const maxTickets = Math.max(...data.volumeData.map(d => d.tickets), 1)
                return (
                  <div key={index} className="flex flex-col items-center gap-2 flex-1">
                    <div 
                      className="bg-primary rounded-t-sm w-full min-h-[4px]"
                      style={{ height: `${(day.tickets / maxTickets) * 100}%` }}
                      title={`${day.date}: ${day.tickets} chamados`}
                    />
                    <span className="text-xs text-muted-foreground rotate-45 origin-center">
                      {day.date}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Assignees */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Mais Demandados
            </CardTitle>
            <CardDescription>
              Responsáveis com mais chamados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.topAssignees.length > 0 ? (
              data.topAssignees.map((assignee, index) => (
                <div key={assignee.name} className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    {assignee.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {assignee.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {assignee.count} chamados ativos
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    #{index + 1}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum chamado atribuído
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Urgent Tickets */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-status-overdue" />
              Precisa de Atenção
            </CardTitle>
            <CardDescription>
              Chamados com SLA próximo do limite ou atrasados
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            Ver todos
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.urgentTickets.length > 0 ? (
              data.urgentTickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-medium">{ticket.id}</span>
                      <StatusBadge status={ticket.status} />
                      <PriorityBadge priority={ticket.priority} />
                    </div>
                    <div className="text-sm font-medium truncate">{ticket.title}</div>
                    <div className="text-xs text-muted-foreground">
                      Solicitante: {ticket.requester}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={ticket.sla.includes("Atrasado") ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {ticket.sla}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum chamado requer atenção no momento
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}