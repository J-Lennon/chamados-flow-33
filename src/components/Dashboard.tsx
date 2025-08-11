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
  TrendingUp,
  TrendingDown,
  Users,
  ArrowRight,
  BarChart3,
  PieChart,
  Calendar,
  Download
} from "lucide-react"

const kpiData = [
  {
    title: "Novos",
    value: 12,
    trend: { value: "+8%", isPositive: false },
    icon: AlertTriangle,
    color: "text-status-new"
  },
  {
    title: "Em Andamento",
    value: 24,
    trend: { value: "+12%", isPositive: true },
    icon: Clock,
    color: "text-status-progress"
  },
  {
    title: "Concluídos",
    value: 87,
    trend: { value: "+23%", isPositive: true },
    icon: CheckCircle,
    color: "text-status-completed"
  },
  {
    title: "Atrasados",
    value: 5,
    trend: { value: "-2%", isPositive: true },
    icon: AlertTriangle,
    color: "text-status-overdue"
  },
  {
    title: "SLA Próximo",
    value: 8,
    trend: { value: "+15%", isPositive: false },
    icon: Clock,
    color: "text-status-waiting"
  }
]

const statusQueue = [
  { status: "Novos", count: 12, href: "/tickets?status=new" },
  { status: "Em Espera", count: 8, href: "/tickets?status=waiting" },
  { status: "Aceitos", count: 15, href: "/tickets?status=accepted" },
  { status: "Em Andamento", count: 24, href: "/tickets?status=progress" },
  { status: "Concluídos", count: 87, href: "/tickets?status=completed" },
]

const priorityDistribution = [
  { priority: "critical", label: "Crítica", count: 5, percentage: 12 },
  { priority: "high", label: "Alta", count: 18, percentage: 43 },
  { priority: "medium", label: "Média", count: 15, percentage: 36 },
  { priority: "low", label: "Baixa", count: 4, percentage: 9 },
] as const

const urgentTickets = [
  {
    id: "#002",
    title: "Sistema ERP fora do ar",
    requester: "Maria Santos",
    sla: "2h restantes",
    priority: "critical" as const,
    status: "progress" as const
  },
  {
    id: "#005",
    title: "Backup do servidor falhou",
    requester: "Sistema Automático",
    sla: "Atrasado 2h",
    priority: "critical" as const,
    status: "overdue" as const
  },
  {
    id: "#001",
    title: "Impressora não funciona",
    requester: "João Oliveira",
    sla: "4h restantes",
    priority: "high" as const,
    status: "new" as const
  },
  {
    id: "#008",
    title: "Rede lenta no setor vendas",
    requester: "Pedro Costa",
    sla: "6h restantes",
    priority: "high" as const,
    status: "accepted" as const
  }
]

const topAssignees = [
  { name: "Carlos Silva", count: 12, avatar: "CS" },
  { name: "Ana Rodrigues", count: 9, avatar: "AR" },
  { name: "Roberto Lima", count: 8, avatar: "RL" },
  { name: "Fernanda Costa", count: 6, avatar: "FC" },
  { name: "Marcos Santos", count: 5, avatar: "MS" }
]

const volumeData = Array.from({ length: 14 }, (_, i) => ({
  date: new Date(Date.now() - (13 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: '2-digit' 
  }),
  tickets: Math.floor(Math.random() * 15) + 5
}))

export function Dashboard() {
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
          const TrendIcon = kpi.trend.isPositive ? TrendingUp : TrendingDown
          
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
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendIcon className={`mr-1 h-3 w-3 ${
                    kpi.trend.isPositive ? 'text-green-500' : 'text-red-500'
                  }`} />
                  <span className={
                    kpi.trend.isPositive ? 'text-green-500' : 'text-red-500'
                  }>
                    {kpi.trend.value}
                  </span>
                  <span className="ml-1">vs período anterior</span>
                </div>
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
            {priorityDistribution.map((item) => (
              <div key={item.priority} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={item.priority} />
                  <span className="text-sm">{item.count}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {item.percentage}%
                </div>
              </div>
            ))}
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
              {volumeData.map((day, index) => (
                <div key={index} className="flex flex-col items-center gap-2 flex-1">
                  <div 
                    className="bg-primary rounded-t-sm w-full min-h-[4px]"
                    style={{ height: `${(day.tickets / 20) * 100}%` }}
                    title={`${day.date}: ${day.tickets} chamados`}
                  />
                  <span className="text-xs text-muted-foreground rotate-45 origin-center">
                    {day.date}
                  </span>
                </div>
              ))}
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
            {topAssignees.map((assignee, index) => (
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
            ))}
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
            {urgentTickets.map((ticket) => (
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
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}