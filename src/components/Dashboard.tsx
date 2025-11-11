import { useRef } from "react"
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
import { Progress } from "@/components/ui/progress"
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
  Download,
  TrendingUp,
  Target,
  Zap
} from "lucide-react"
import { useDashboardData } from "@/hooks/useDashboardData"
import { Skeleton } from "@/components/ui/skeleton"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import { useToast } from "@/hooks/use-toast"

export function Dashboard() {
  const { data, loading } = useDashboardData()
  const dashboardRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const handleExportPDF = async () => {
    if (!dashboardRef.current) return

    try {
      toast({
        title: "Gerando PDF...",
        description: "Por favor, aguarde enquanto preparamos o relatório.",
      })

      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
      })

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4")
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
      const imgX = (pdfWidth - imgWidth * ratio) / 2
      const imgY = 10

      pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio)
      pdf.save(`dashboard-${new Date().toISOString().split('T')[0]}.pdf`)

      toast({
        title: "PDF exportado com sucesso!",
        description: "O relatório foi salvo no seu computador.",
      })
    } catch (error) {
      console.error("Error exporting PDF:", error)
      toast({
        title: "Erro ao exportar PDF",
        description: "Não foi possível gerar o relatório.",
        variant: "destructive",
      })
    }
  }

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
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      trend: "+12%"
    },
    {
      title: "Em Andamento",
      value: data.kpiData.progress,
      icon: Clock,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      trend: "+5%"
    },
    {
      title: "Concluídos",
      value: data.kpiData.completed,
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      trend: "+18%"
    },
    {
      title: "Atrasados",
      value: data.kpiData.overdue,
      icon: AlertTriangle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      trend: "-3%"
    },
    {
      title: "SLA Próximo",
      value: data.kpiData.slaClose,
      icon: Clock,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      trend: "+8%"
    }
  ]

  const statusQueue = [
    { status: "Novos", count: data.statusQueue.new, color: "bg-blue-500" },
    { status: "Em Espera", count: data.statusQueue.waiting, color: "bg-purple-500" },
    { status: "Aceitos", count: data.statusQueue.accepted, color: "bg-cyan-500" },
    { status: "Em Andamento", count: data.statusQueue.progress, color: "bg-amber-500" },
    { status: "Concluídos", count: data.statusQueue.completed, color: "bg-green-500" },
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
    <div className="space-y-6" ref={dashboardRef}>
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Dashboard Executivo
          </h1>
          <p className="text-muted-foreground mt-1">
            Visão estratégica e análise de performance da equipe
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
          
          <Button variant="default" size="sm" onClick={handleExportPDF}>
            <Download className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Team Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Taxa de SLA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{data.teamMetrics.slaComplianceRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Meta: 95%</p>
            <Progress value={data.teamMetrics.slaComplianceRate} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Total Resolvidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{data.teamMetrics.totalResolved}</div>
            <p className="text-xs text-muted-foreground mt-1">Chamados finalizados</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              Tempo Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{data.teamMetrics.avgResolutionTime}</div>
            <p className="text-xs text-muted-foreground mt-1">Resolução média</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Chamados Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{data.teamMetrics.activeTickets}</div>
            <p className="text-xs text-muted-foreground mt-1">Em atendimento</p>
          </CardContent>
        </Card>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {kpiData.map((kpi) => {
          const Icon = kpi.icon
          
          return (
            <Card key={kpi.title} className="relative overflow-hidden hover:shadow-lg transition-shadow">
              <div className={`absolute inset-0 ${kpi.bgColor} opacity-50`} />
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {kpi.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${kpi.color}`} />
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-bold">{kpi.value}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  {kpi.trend} vs mês anterior
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Agent Performance */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Performance dos Agentes
          </CardTitle>
          <CardDescription>
            Métricas individuais de eficiência e produtividade
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.agentPerformance.length > 0 ? (
              data.agentPerformance.map((agent, index) => (
                <div key={agent.name} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground text-lg font-bold">
                    {agent.avatar}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{agent.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {agent.completedTickets} chamados concluídos
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Tempo médio: </span>
                        <span className="font-semibold">{agent.avgResolutionTime}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">SLA: </span>
                        <span className={`font-semibold ${agent.slaCompliance >= 95 ? 'text-green-600' : agent.slaCompliance >= 80 ? 'text-amber-600' : 'text-red-600'}`}>
                          {agent.slaCompliance}%
                        </span>
                      </div>
                    </div>
                    <Progress value={agent.slaCompliance} className="h-2" />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum dado de performance disponível
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Status Queue */}
        <Card className="lg:col-span-2 border-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Fila por Status
              </CardTitle>
              <CardDescription>
                Distribuição de chamados por status atual
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              {statusQueue.map((item) => (
                <div key={item.status} className="text-center space-y-3">
                  <div className={`h-20 ${item.color} rounded-lg flex items-center justify-center`}>
                    <div className="text-3xl font-bold text-white">{item.count}</div>
                  </div>
                  <div className="text-sm font-medium">{item.status}</div>
                  <Button variant="ghost" size="sm" className="text-xs h-auto p-1 hover:bg-primary/10">
                    Ver todos
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              Prioridades
            </CardTitle>
            <CardDescription>
              Distribuição por nível de prioridade
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {priorityWithPercentage.length > 0 ? (
              priorityWithPercentage.map((item) => (
                <div key={item.priority} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={item.priority} />
                      <span className="text-sm font-medium">{item.count}</span>
                    </div>
                    <div className="text-sm text-muted-foreground font-semibold">
                      {item.percentage}%
                    </div>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
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
        <Card className="lg:col-span-2 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
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
                const height = (day.tickets / maxTickets) * 100
                return (
                  <div key={index} className="flex flex-col items-center gap-2 flex-1 group">
                    <div 
                      className="bg-gradient-to-t from-primary to-primary/50 rounded-t-lg w-full min-h-[4px] transition-all group-hover:from-primary group-hover:to-primary/70"
                      style={{ height: `${height}%` }}
                      title={`${day.date}: ${day.tickets} chamados`}
                    />
                    <span className="text-xs text-muted-foreground rotate-45 origin-center whitespace-nowrap">
                      {day.date}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Assignees */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Mais Demandados
            </CardTitle>
            <CardDescription>
              Responsáveis com mais chamados ativos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.topAssignees.length > 0 ? (
              data.topAssignees.map((assignee, index) => (
                <div key={assignee.name} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-sm font-bold shadow-lg">
                    {assignee.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">
                      {assignee.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {assignee.count} chamados ativos
                    </div>
                  </div>
                  <Badge 
                    variant={index === 0 ? "default" : "secondary"} 
                    className="text-xs font-bold"
                  >
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
      <Card className="border-2 border-red-200 dark:border-red-900">
        <CardHeader className="flex flex-row items-center justify-between bg-red-50 dark:bg-red-950/20">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Chamados Urgentes
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
        <CardContent className="pt-6">
          <div className="space-y-4">
            {data.urgentTickets.length > 0 ? (
              data.urgentTickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between p-4 border-2 rounded-lg bg-card hover:shadow-md transition-shadow">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-sm font-bold bg-muted px-2 py-1 rounded">{ticket.id}</span>
                      <StatusBadge status={ticket.status} />
                      <PriorityBadge priority={ticket.priority} />
                    </div>
                    <div className="text-sm font-semibold truncate mb-1">{ticket.title}</div>
                    <div className="text-xs text-muted-foreground">
                      Solicitante: {ticket.requester}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <Badge 
                      variant={ticket.sla.includes("Atrasado") ? "destructive" : "secondary"}
                      className="text-xs font-semibold"
                    >
                      {ticket.sla}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8 bg-green-50 dark:bg-green-950/20 rounded-lg border-2 border-green-200 dark:border-green-900">
                ✅ Nenhum chamado urgente no momento
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}