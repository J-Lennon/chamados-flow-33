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
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData>({
    kpiData: { new: 0, progress: 0, completed: 0, overdue: 0, slaClose: 0 },
    statusQueue: { new: 0, waiting: 0, accepted: 0, progress: 0, completed: 0 },
    priorityDistribution: { critical: 0, high: 0, medium: 0, low: 0 },
    urgentTickets: [],
    topAssignees: [],
    volumeData: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Buscar todos os tickets com informações dos usuários
      const { data: tickets, error } = await supabase
        .from("tickets")
        .select(`
          *,
          requester:profiles!tickets_requester_id_fkey(full_name),
          assignee:profiles!tickets_assigned_to_fkey(full_name)
        `)

      if (error) throw error

      if (!tickets || tickets.length === 0) {
        setData({
          kpiData: { new: 0, progress: 0, completed: 0, overdue: 0, slaClose: 0 },
          statusQueue: { new: 0, waiting: 0, accepted: 0, progress: 0, completed: 0 },
          priorityDistribution: { critical: 0, high: 0, medium: 0, low: 0 },
          urgentTickets: [],
          topAssignees: [],
          volumeData: []
        })
        setLoading(false)
        return
      }

      // Calcular KPIs
      const now = new Date()
      const kpiData = {
        new: tickets.filter(t => t.status === "new").length,
        progress: tickets.filter(t => t.status === "progress").length,
        completed: tickets.filter(t => t.status === "completed").length,
        overdue: tickets.filter(t => t.sla_due_date && new Date(t.sla_due_date) < now && t.status !== "completed").length,
        slaClose: tickets.filter(t => {
          if (!t.sla_due_date || t.status === "completed") return false
          const slaDate = new Date(t.sla_due_date)
          const hoursUntilSla = (slaDate.getTime() - now.getTime()) / (1000 * 60 * 60)
          return hoursUntilSla > 0 && hoursUntilSla <= 8
        }).length
      }

      // Status queue
      const statusQueue = {
        new: tickets.filter(t => t.status === "new").length,
        waiting: tickets.filter(t => t.status === "waiting").length,
        accepted: tickets.filter(t => t.status === "accepted").length,
        progress: tickets.filter(t => t.status === "progress").length,
        completed: tickets.filter(t => t.status === "completed").length
      }

      // Priority distribution
      const priorityDistribution = {
        critical: tickets.filter(t => t.priority === "critical").length,
        high: tickets.filter(t => t.priority === "high").length,
        medium: tickets.filter(t => t.priority === "medium").length,
        low: tickets.filter(t => t.priority === "low").length
      }

      // Urgent tickets (SLA próximo ou atrasado)
      const urgentTickets = tickets
        .filter(t => {
          if (!t.sla_due_date || t.status === "completed") return false
          const slaDate = new Date(t.sla_due_date)
          const hoursUntilSla = (slaDate.getTime() - now.getTime()) / (1000 * 60 * 60)
          return hoursUntilSla <= 8 // 8 horas ou menos
        })
        .sort((a, b) => {
          const dateA = a.sla_due_date ? new Date(a.sla_due_date).getTime() : 0
          const dateB = b.sla_due_date ? new Date(b.sla_due_date).getTime() : 0
          return dateA - dateB
        })
        .slice(0, 4)
        .map(t => {
          const slaDate = new Date(t.sla_due_date!)
          const hoursUntilSla = Math.round((slaDate.getTime() - now.getTime()) / (1000 * 60 * 60))
          
          return {
            id: `#${t.id.slice(0, 3)}`,
            title: t.title,
            requester: t.requester?.full_name || "Desconhecido",
            sla: hoursUntilSla < 0 ? `Atrasado ${Math.abs(hoursUntilSla)}h` : `${hoursUntilSla}h restantes`,
            priority: t.priority as "critical" | "high" | "medium" | "low",
            status: t.status as "new" | "waiting" | "accepted" | "progress" | "overdue" | "completed"
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
          name,
          count,
          avatar: name.split(" ").map(n => n[0]).join("").toUpperCase()
        }))

      // Volume por dia (últimos 14 dias)
      const volumeData = Array.from({ length: 14 }, (_, i) => {
        const date = new Date(now.getTime() - (13 - i) * 24 * 60 * 60 * 1000)
        const dateStr = date.toISOString().split('T')[0]
        
        const count = tickets.filter(t => {
          const ticketDate = new Date(t.created_at).toISOString().split('T')[0]
          return ticketDate === dateStr
        }).length

        return {
          date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          tickets: count
        }
      })

      setData({
        kpiData,
        statusQueue,
        priorityDistribution,
        urgentTickets,
        topAssignees,
        volumeData
      })
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, refetch: fetchDashboardData }
}
