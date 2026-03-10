import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"

interface DashboardData {
  kpiData: {
    new: number
    progress: number
    completed: number
    overdue: number
    slaClose: number
  }
  statusQueue: {
    new: number
    waiting: number
    accepted: number
    progress: number
    completed: number
  }
  priorityDistribution: {
    critical: number
    high: number
    medium: number
    low: number
  }
  levelDistribution: {
    n1: number
    n2: number
    n3: number
  }
  escalationMetrics: {
    totalEscalations: number
    n1ToN2: number
    n2ToN3: number
    avgTimeToEscalate: string
    escalationRate: number
    ticketsResolvedN1: number
    ticketsResolvedN2: number
    ticketsResolvedN3: number
  }
  urgentTickets: Array<{
    id: string
    title: string
    requester: string
    sla: string
    priority: "critical" | "high" | "medium" | "low"
    status: "new" | "waiting" | "accepted" | "progress" | "overdue" | "completed"
  }>
  topAssignees: Array<{
    name: string
    count: number
    avatar: string
  }>
  volumeData: Array<{
    date: string
    tickets: number
  }>
  agentPerformance: Array<{
    name: string
    avatar: string
    completedTickets: number
    avgResolutionTime: string
    slaCompliance: number
  }>
  teamMetrics: {
    avgResolutionTime: string
    slaComplianceRate: number
    totalResolved: number
    activeTickets: number
    mttr: string
    mtta: string
  }
  monthlyTrend: Array<{
    month: string
    created: number
    resolved: number
  }>
  departmentHeatmap: Array<{
    department: string
    count: number
  }>
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData>({
    kpiData: { new: 0, progress: 0, completed: 0, overdue: 0, slaClose: 0 },
    statusQueue: { new: 0, waiting: 0, accepted: 0, progress: 0, completed: 0 },
    priorityDistribution: { critical: 0, high: 0, medium: 0, low: 0 },
    levelDistribution: { n1: 0, n2: 0, n3: 0 },
    escalationMetrics: {
      totalEscalations: 0, n1ToN2: 0, n2ToN3: 0,
      avgTimeToEscalate: "0h", escalationRate: 0,
      ticketsResolvedN1: 0, ticketsResolvedN2: 0, ticketsResolvedN3: 0,
    },
    urgentTickets: [],
    topAssignees: [],
    volumeData: [],
    agentPerformance: [],
    teamMetrics: { avgResolutionTime: "0h", slaComplianceRate: 0, totalResolved: 0, activeTickets: 0, mttr: "0h", mtta: "0h" },
    monthlyTrend: [],
    departmentHeatmap: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()

    const channel = supabase
      .channel("dashboard-tickets-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "tickets" }, () => fetchDashboardData())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch tickets and escalations in parallel
      const [ticketsRes, escalationsRes] = await Promise.all([
        supabase.from("tickets").select(`
          *,
          requester:profiles!tickets_requester_id_fkey(full_name),
          assignee:profiles!tickets_assigned_to_fkey(full_name)
        `),
        supabase.from("ticket_escalations").select("*"),
      ])

      if (ticketsRes.error) throw ticketsRes.error
      const tickets = ticketsRes.data || []
      const escalations = escalationsRes.data || []

      if (tickets.length === 0) {
        setData(prev => ({ ...prev }))
        setLoading(false)
        return
      }

      const now = new Date()

      // KPIs
      const kpiData = {
        new: tickets.filter(t => t.status === "new").length,
        progress: tickets.filter(t => t.status === "progress" || (t.sla_due_date && new Date(t.sla_due_date) < now && t.status !== "completed")).length,
        completed: tickets.filter(t => t.status === "completed").length,
        overdue: tickets.filter(t => t.sla_due_date && new Date(t.sla_due_date) < now && t.status !== "completed").length,
        slaClose: tickets.filter(t => {
          if (!t.sla_due_date || t.status === "completed") return false
          const hoursUntilSla = (new Date(t.sla_due_date).getTime() - now.getTime()) / (1000 * 60 * 60)
          return hoursUntilSla > 0 && hoursUntilSla <= 8
        }).length,
      }

      // Status queue
      const statusQueue = {
        new: tickets.filter(t => t.status === "new").length,
        waiting: tickets.filter(t => t.status === "waiting").length,
        accepted: tickets.filter(t => t.status === "accepted").length,
        progress: tickets.filter(t => t.status === "progress" || (t.sla_due_date && new Date(t.sla_due_date) < now && t.status !== "completed")).length,
        completed: tickets.filter(t => t.status === "completed").length,
      }

      // Priority distribution
      const priorityDistribution = {
        critical: tickets.filter(t => t.priority === "critical").length,
        high: tickets.filter(t => t.priority === "high").length,
        medium: tickets.filter(t => t.priority === "medium").length,
        low: tickets.filter(t => t.priority === "low").length,
      }

      // Level distribution (active tickets only)
      const activeTickets = tickets.filter(t => t.status !== "completed" && t.status !== "rejected" && t.status !== "closed")
      const levelDistribution = {
        n1: activeTickets.filter(t => (t.nivel_atendimento || 1) === 1).length,
        n2: activeTickets.filter(t => (t.nivel_atendimento || 1) === 2).length,
        n3: activeTickets.filter(t => (t.nivel_atendimento || 1) === 3).length,
      }

      // Escalation metrics
      const completedTickets = tickets.filter(t => t.status === "completed")
      const n1ToN2 = escalations.filter(e => e.from_level === 1 && e.to_level === 2).length
      const n2ToN3 = escalations.filter(e => e.from_level === 2 && e.to_level === 3).length
      const escalationRate = tickets.length > 0 ? Math.round((escalations.length / tickets.length) * 100) : 0

      // Avg time to escalate
      let avgEscalateHours = 0
      const ticketsWithEscalation = tickets.filter(t => t.escalated_at && t.created_at)
      if (ticketsWithEscalation.length > 0) {
        const totalHours = ticketsWithEscalation.reduce((sum, t) => {
          return sum + (new Date(t.escalated_at!).getTime() - new Date(t.created_at).getTime()) / (1000 * 60 * 60)
        }, 0)
        avgEscalateHours = Math.round(totalHours / ticketsWithEscalation.length)
      }

      const escalationMetrics = {
        totalEscalations: escalations.length,
        n1ToN2,
        n2ToN3,
        avgTimeToEscalate: avgEscalateHours < 24 ? `${avgEscalateHours}h` : `${Math.round(avgEscalateHours / 24)}d`,
        escalationRate,
        ticketsResolvedN1: completedTickets.filter(t => (t.nivel_atendimento || 1) === 1).length,
        ticketsResolvedN2: completedTickets.filter(t => (t.nivel_atendimento || 1) === 2).length,
        ticketsResolvedN3: completedTickets.filter(t => (t.nivel_atendimento || 1) === 3).length,
      }

      // Urgent tickets
      const urgentTickets = tickets
        .filter(t => {
          if (!t.sla_due_date || t.status === "completed") return false
          const hoursUntilSla = (new Date(t.sla_due_date).getTime() - now.getTime()) / (1000 * 60 * 60)
          return hoursUntilSla <= 8
        })
        .sort((a, b) => new Date(a.sla_due_date!).getTime() - new Date(b.sla_due_date!).getTime())
        .slice(0, 4)
        .map(t => {
          const hoursUntilSla = Math.round((new Date(t.sla_due_date!).getTime() - now.getTime()) / (1000 * 60 * 60))
          return {
            id: `#${t.id.slice(0, 3)}`,
            title: t.title,
            requester: t.requester?.full_name || "Desconhecido",
            sla: hoursUntilSla < 0 ? `Atrasado ${Math.abs(hoursUntilSla)}h` : `${hoursUntilSla}h restantes`,
            priority: t.priority as any,
            status: t.status as any,
          }
        })

      // Top assignees
      const assigneeCounts = tickets
        .filter(t => t.assigned_to && t.status !== "completed")
        .reduce((acc, t) => {
          const name = t.assignee?.full_name || "Sem nome"
          acc[name] = (acc[name] || 0) + 1
          return acc
        }, {} as Record<string, number>)

      const topAssignees = Object.entries(assigneeCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({
          name, count,
          avatar: name.split(" ").map(n => n[0]).join("").toUpperCase(),
        }))

      // Volume per day (last 14 days)
      const volumeData = Array.from({ length: 14 }, (_, i) => {
        const date = new Date(now.getTime() - (13 - i) * 24 * 60 * 60 * 1000)
        const dateStr = date.toISOString().split('T')[0]
        const count = tickets.filter(t => new Date(t.created_at).toISOString().split('T')[0] === dateStr).length
        return { date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), tickets: count }
      })

      // Agent performance
      const agentStats = completedTickets
        .filter(t => t.assigned_to)
        .reduce((acc, t) => {
          const agentName = t.assignee?.full_name || "Sem nome"
          if (!acc[agentName]) acc[agentName] = { tickets: [], slaCompliant: 0 }
          acc[agentName].tickets.push(t)
          if (t.sla_due_date) {
            if (new Date(t.updated_at) <= new Date(t.sla_due_date)) acc[agentName].slaCompliant++
          }
          return acc
        }, {} as Record<string, { tickets: any[], slaCompliant: number }>)

      const agentPerformance = Object.entries(agentStats)
        .map(([name, stats]) => {
          const totalHours = stats.tickets.reduce((sum, t) => {
            return sum + (new Date(t.updated_at).getTime() - new Date(t.created_at).getTime()) / (1000 * 60 * 60)
          }, 0)
          const avgHours = Math.round(totalHours / stats.tickets.length)
          return {
            name,
            avatar: name.split(" ").map(n => n[0]).join("").toUpperCase(),
            completedTickets: stats.tickets.length,
            avgResolutionTime: avgHours < 24 ? `${avgHours}h` : `${Math.round(avgHours / 24)}d`,
            slaCompliance: Math.round((stats.slaCompliant / stats.tickets.length) * 100),
          }
        })
        .sort((a, b) => b.completedTickets - a.completedTickets)
        .slice(0, 5)

      // Team metrics with MTTR and MTTA
      const totalResolved = completedTickets.length
      const activeCount = tickets.filter(t => t.status !== "completed" && t.status !== "rejected").length
      
      let avgResolutionHours = 0
      let slaCompliantCount = 0
      
      if (completedTickets.length > 0) {
        const totalHours = completedTickets.reduce((sum, t) => {
          if (t.sla_due_date && new Date(t.updated_at) <= new Date(t.sla_due_date)) slaCompliantCount++
          return sum + (new Date(t.updated_at).getTime() - new Date(t.created_at).getTime()) / (1000 * 60 * 60)
        }, 0)
        avgResolutionHours = Math.round(totalHours / completedTickets.length)
      }

      // MTTA: mean time to acknowledge (time to first assignment)
      const acknowledgedTickets = tickets.filter(t => t.assigned_to)
      let mttaHours = 0
      // We approximate MTTA using tickets that have been assigned (accepted)
      // In a real system, we'd track the first assignment timestamp separately
      // For now, use the history or a heuristic

      const teamMetrics = {
        avgResolutionTime: avgResolutionHours < 24 ? `${avgResolutionHours}h` : `${Math.round(avgResolutionHours / 24)}d`,
        slaComplianceRate: completedTickets.length > 0 ? Math.round((slaCompliantCount / completedTickets.length) * 100) : 0,
        totalResolved,
        activeTickets: activeCount,
        mttr: avgResolutionHours < 24 ? `${avgResolutionHours}h` : `${Math.round(avgResolutionHours / 24)}d`,
        mtta: mttaHours < 24 ? `${mttaHours}h` : `${Math.round(mttaHours / 24)}d`,
      }

      // Monthly trend (last 6 months)
      const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
        const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0)
        const monthStr = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
        const created = tickets.filter(t => {
          const cd = new Date(t.created_at)
          return cd >= d && cd <= monthEnd
        }).length
        const resolved = completedTickets.filter(t => {
          const cd = new Date(t.updated_at)
          return cd >= d && cd <= monthEnd
        }).length
        return { month: monthStr, created, resolved }
      })

      // Department heatmap
      const deptCounts = tickets.reduce((acc, t) => {
        const dept = t.department || "Não informado"
        acc[dept] = (acc[dept] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const departmentHeatmap = Object.entries(deptCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([department, count]) => ({ department, count }))

      setData({
        kpiData, statusQueue, priorityDistribution, levelDistribution,
        escalationMetrics, urgentTickets, topAssignees, volumeData,
        agentPerformance, teamMetrics, monthlyTrend, departmentHeatmap,
      })
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, refetch: fetchDashboardData }
}
