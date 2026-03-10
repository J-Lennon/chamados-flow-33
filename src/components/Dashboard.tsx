import { useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { PriorityBadge } from "./StatusBadge"
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  Users,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  TrendingUp,
  Target,
  Zap,
  ArrowUpCircle,
  Shield,
  ArrowRight,
  Building,
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
      toast({ title: "Gerando PDF...", description: "Por favor, aguarde." })
      const canvas = await html2canvas(dashboardRef.current, { scale: 2, logging: false, useCORS: true })
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("l", "mm", "a4") // landscape for more space
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
      const x = (pdfWidth - imgWidth * ratio) / 2
      pdf.addImage(imgData, "PNG", x, 5, imgWidth * ratio, imgHeight * ratio)
      
      // Add pages if content is too tall
      const totalPages = Math.ceil((imgHeight * ratio) / (pdfHeight - 10))
      if (totalPages > 1) {
        for (let i = 1; i < totalPages; i++) {
          pdf.addPage()
          pdf.addImage(imgData, "PNG", x, 5 - i * (pdfHeight - 10), imgWidth * ratio, imgHeight * ratio)
        }
      }
      
      pdf.save(`dashboard-teledesk-${new Date().toISOString().split('T')[0]}.pdf`)
      toast({ title: "PDF exportado com sucesso!" })
    } catch (error) {
      console.error("Error exporting PDF:", error)
      toast({ title: "Erro ao exportar PDF", variant: "destructive" })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    )
  }

  const kpiData = [
    { title: "Novos", value: data.kpiData.new, icon: AlertTriangle, color: "text-blue-500", bgColor: "bg-blue-500/10" },
    { title: "Em Andamento", value: data.kpiData.progress, icon: Clock, color: "text-secondary", bgColor: "bg-secondary/10" },
    { title: "Concluídos", value: data.kpiData.completed, icon: CheckCircle, color: "text-green-500", bgColor: "bg-green-500/10" },
    { title: "Atrasados", value: data.kpiData.overdue, icon: AlertTriangle, color: "text-primary", bgColor: "bg-primary/10" },
    { title: "SLA Próximo", value: data.kpiData.slaClose, icon: Clock, color: "text-orange-500", bgColor: "bg-orange-500/10" },
  ]

  const statusQueue = [
    { status: "Novos", count: data.statusQueue.new, color: "bg-blue-500" },
    { status: "Em Espera", count: data.statusQueue.waiting, color: "bg-purple-500" },
    { status: "Aceitos", count: data.statusQueue.accepted, color: "bg-cyan-500" },
    { status: "Em Andamento", count: data.statusQueue.progress, color: "bg-secondary" },
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

  const esc = data.escalationMetrics
  const totalResolved = esc.ticketsResolvedN1 + esc.ticketsResolvedN2 + esc.ticketsResolvedN3

  return (
    <div className="space-y-6" ref={dashboardRef}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 rounded-2xl bg-card border border-border shadow-sm">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight">Dashboard Executivo</h2>
          <p className="text-muted-foreground flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4 text-secondary" />
            Visão estratégica com métricas de escalonamento e performance em tempo real
          </p>
        </div>
        <Button onClick={handleExportPDF} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar PDF
        </Button>
      </div>

      {/* Team Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Taxa de SLA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-primary">{data.teamMetrics.slaComplianceRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Meta: 95%</p>
            <Progress value={data.teamMetrics.slaComplianceRate} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-secondary" />
              MTTR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-secondary">{data.teamMetrics.mttr}</div>
            <p className="text-xs text-muted-foreground mt-1">Tempo médio de resolução</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Total Resolvidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-green-600">{data.teamMetrics.totalResolved}</div>
            <p className="text-xs text-muted-foreground mt-1">Chamados finalizados</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Chamados Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-blue-600">{data.teamMetrics.activeTickets}</div>
            <p className="text-xs text-muted-foreground mt-1">Em atendimento</p>
          </CardContent>
        </Card>
      </div>

      {/* ====== ESCALATION FLOW DIAGRAM ====== */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpCircle className="h-5 w-5 text-orange-500" />
            Fluxo de Escalonamento
          </CardTitle>
          <CardDescription>Diagrama do fluxo entre níveis de atendimento com métricas de resolução</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            {/* Flow diagram */}
            <div className="flex items-center justify-center gap-2 md:gap-4 w-full flex-wrap">
              {/* N1 */}
              <div className="flex flex-col items-center gap-2 min-w-[140px]">
                <div className="w-32 h-32 rounded-2xl bg-blue-500/10 border-2 border-blue-500/30 flex flex-col items-center justify-center gap-1 relative">
                  <Shield className="h-6 w-6 text-blue-500" />
                  <span className="text-2xl font-black text-blue-600">{data.levelDistribution.n1}</span>
                  <span className="text-xs font-medium text-blue-500">Nível 1</span>
                  <span className="text-[10px] text-muted-foreground">Suporte Básico</span>
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold text-green-600">{esc.ticketsResolvedN1} resolvidos</div>
                  <div className="text-[10px] text-muted-foreground">
                    {totalResolved > 0 ? Math.round((esc.ticketsResolvedN1 / totalResolved) * 100) : 0}% do total
                  </div>
                </div>
              </div>

              {/* Arrow N1 → N2 */}
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1">
                  <ArrowRight className="h-5 w-5 text-orange-500" />
                </div>
                <Badge variant="outline" className="text-[10px] border-orange-500/30 text-orange-600">
                  {esc.n1ToN2} escalonados
                </Badge>
              </div>

              {/* N2 */}
              <div className="flex flex-col items-center gap-2 min-w-[140px]">
                <div className="w-32 h-32 rounded-2xl bg-orange-500/10 border-2 border-orange-500/30 flex flex-col items-center justify-center gap-1">
                  <Shield className="h-6 w-6 text-orange-500" />
                  <span className="text-2xl font-black text-orange-600">{data.levelDistribution.n2}</span>
                  <span className="text-xs font-medium text-orange-500">Nível 2</span>
                  <span className="text-[10px] text-muted-foreground">Suporte Técnico</span>
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold text-green-600">{esc.ticketsResolvedN2} resolvidos</div>
                  <div className="text-[10px] text-muted-foreground">
                    {totalResolved > 0 ? Math.round((esc.ticketsResolvedN2 / totalResolved) * 100) : 0}% do total
                  </div>
                </div>
              </div>

              {/* Arrow N2 → N3 */}
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1">
                  <ArrowRight className="h-5 w-5 text-red-500" />
                </div>
                <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-600">
                  {esc.n2ToN3} escalonados
                </Badge>
              </div>

              {/* N3 */}
              <div className="flex flex-col items-center gap-2 min-w-[140px]">
                <div className="w-32 h-32 rounded-2xl bg-red-500/10 border-2 border-red-500/30 flex flex-col items-center justify-center gap-1">
                  <Shield className="h-6 w-6 text-red-500" />
                  <span className="text-2xl font-black text-red-600">{data.levelDistribution.n3}</span>
                  <span className="text-xs font-medium text-red-500">Nível 3</span>
                  <span className="text-[10px] text-muted-foreground">Especialista</span>
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold text-green-600">{esc.ticketsResolvedN3} resolvidos</div>
                  <div className="text-[10px] text-muted-foreground">
                    {totalResolved > 0 ? Math.round((esc.ticketsResolvedN3 / totalResolved) * 100) : 0}% do total
                  </div>
                </div>
              </div>
            </div>

            {/* Summary stats below */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mt-4 pt-4 border-t border-border">
              <div className="text-center">
                <div className="text-2xl font-black">{esc.totalEscalations}</div>
                <div className="text-xs text-muted-foreground">Total Escalonamentos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black">{esc.escalationRate}%</div>
                <div className="text-xs text-muted-foreground">Taxa de Escalonamento</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black">{esc.avgTimeToEscalate}</div>
                <div className="text-xs text-muted-foreground">Tempo Médio p/ Escalonar</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-green-600">
                  {totalResolved > 0 ? Math.round((esc.ticketsResolvedN1 / totalResolved) * 100) : 0}%
                </div>
                <div className="text-xs text-muted-foreground">Resolução no N1</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {kpiData.map((kpi, index) => {
          const Icon = kpi.icon
          return (
            <Card key={index} className="rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
                <div className={`p-2 rounded-xl ${kpi.bgColor}`}>
                  <Icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black">{kpi.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Monthly Trend */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Tendência Mensal (6 meses)
          </CardTitle>
          <CardDescription>Comparativo de chamados criados vs resolvidos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.monthlyTrend.map((month) => {
              const maxVal = Math.max(...data.monthlyTrend.map(m => Math.max(m.created, m.resolved)), 1)
              return (
                <div key={month.month} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium w-16">{month.month}</span>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-blue-500">Criados: {month.created}</span>
                      <span className="text-green-500">Resolvidos: {month.resolved}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 h-5">
                    <div
                      className="bg-blue-500/70 rounded-sm transition-all"
                      style={{ width: `${(month.created / maxVal) * 100}%`, minWidth: month.created > 0 ? '4px' : '0' }}
                    />
                    <div
                      className="bg-green-500/70 rounded-sm transition-all"
                      style={{ width: `${(month.resolved / maxVal) * 100}%`, minWidth: month.resolved > 0 ? '4px' : '0' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Agent Performance */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Performance dos Agentes
          </CardTitle>
          <CardDescription>Métricas individuais de eficiência e produtividade</CardDescription>
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
                        <div className="text-sm text-muted-foreground">{agent.completedTickets} chamados concluídos</div>
                      </div>
                      <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Tempo médio: </span>
                        <span className="font-semibold">{agent.avgResolutionTime}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">SLA: </span>
                        <span className={`font-semibold ${agent.slaCompliance >= 95 ? 'text-green-600' : agent.slaCompliance >= 80 ? 'text-secondary' : 'text-primary'}`}>
                          {agent.slaCompliance}%
                        </span>
                      </div>
                    </div>
                    <Progress value={agent.slaCompliance} className="h-2" />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado de performance disponível</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Status Queue */}
        <Card className="lg:col-span-2 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Fila por Status
            </CardTitle>
            <CardDescription>Distribuição de chamados por status atual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              {statusQueue.map((item) => (
                <div key={item.status} className="text-center space-y-3">
                  <div className={`h-20 ${item.color} rounded-xl flex items-center justify-center`}>
                    <div className="text-3xl font-bold text-white">{item.count}</div>
                  </div>
                  <div className="text-sm font-medium">{item.status}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              Prioridades
            </CardTitle>
            <CardDescription>Distribuição por nível de prioridade</CardDescription>
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
                    <div className="text-sm text-muted-foreground font-semibold">{item.percentage}%</div>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum chamado cadastrado</p>
            )}
          </CardContent>
        </Card>

        {/* Department Heatmap */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              Chamados por Setor
            </CardTitle>
            <CardDescription>Heatmap de demanda por departamento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.departmentHeatmap.length > 0 ? (
              data.departmentHeatmap.map((dept) => {
                const maxDept = Math.max(...data.departmentHeatmap.map(d => d.count), 1)
                const intensity = dept.count / maxDept
                const bgOpacity = Math.max(0.1, intensity)
                return (
                  <div key={dept.department} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: `rgba(177, 18, 38, ${bgOpacity * 0.2})` }}>
                    <span className="text-sm font-medium">{dept.department}</span>
                    <Badge variant="outline" className="text-xs font-bold">{dept.count}</Badge>
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum dado disponível</p>
            )}
          </CardContent>
        </Card>

        {/* Volume Chart */}
        <Card className="lg:col-span-2 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Volume por Dia
            </CardTitle>
            <CardDescription>Chamados abertos nos últimos 14 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-end justify-between gap-1">
              {data.volumeData.map((day, index) => {
                const maxTickets = Math.max(...data.volumeData.map(d => d.tickets), 1)
                const height = (day.tickets / maxTickets) * 100
                return (
                  <div key={index} className="flex flex-col items-center gap-2 flex-1 group">
                    <div className="text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      {day.tickets}
                    </div>
                    <div
                      className="bg-primary/80 hover:bg-primary rounded-t-md w-full min-h-[4px] transition-colors"
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                    <div className="text-[10px] text-muted-foreground truncate w-full text-center">
                      {day.date}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Assignees */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Top Responsáveis
            </CardTitle>
            <CardDescription>Agentes com mais chamados atribuídos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.topAssignees.length > 0 ? (
              data.topAssignees.map((assignee, index) => (
                <div key={assignee.name} className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    {assignee.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{assignee.name}</div>
                    <div className="text-xs text-muted-foreground">{assignee.count} chamados</div>
                  </div>
                  <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum dado disponível</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
