import { useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface ClassifyResult {
  priority: string
  category: string
  urgency: string
  summary: string
  isWellDescribed: boolean
  improvementSuggestion: string
}

interface SuggestResponseResult {
  suggestedResponse: string
  internalNote: string
}

interface KnowledgeArticleResult {
  title: string
  problem: string
  solution: string
  tags: string[]
}

export function useAI() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const classifyTicket = async (ticketData: {
    title: string
    description: string
    department?: string
  }): Promise<ClassifyResult | null> => {
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke("ai-ticket", {
        body: { action: "classify", ticketData },
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error)

      return data.data as ClassifyResult
    } catch (error: any) {
      console.error("AI classify error:", error)
      toast({
        title: "Erro na classificação IA",
        description: error.message || "Não foi possível classificar o chamado",
        variant: "destructive",
      })
      return null
    } finally {
      setLoading(false)
    }
  }

  const suggestResponse = async (ticketData: {
    title: string
    description: string
    status: string
    priority: string
    messages?: Array<{ sender: string; message: string }>
  }): Promise<SuggestResponseResult | null> => {
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke("ai-ticket", {
        body: { action: "suggest_response", ticketData },
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error)

      return data.data as SuggestResponseResult
    } catch (error: any) {
      console.error("AI suggest error:", error)
      toast({
        title: "Erro na sugestão IA",
        description: error.message || "Não foi possível gerar sugestão",
        variant: "destructive",
      })
      return null
    } finally {
      setLoading(false)
    }
  }

  const generateKnowledgeArticle = async (ticketData: {
    title: string
    description: string
    messages?: Array<{ sender: string; message: string }>
  }): Promise<KnowledgeArticleResult | null> => {
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke("ai-ticket", {
        body: { action: "generate_knowledge_article", ticketData },
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error)

      return data.data as KnowledgeArticleResult
    } catch (error: any) {
      console.error("AI knowledge article error:", error)
      toast({
        title: "Erro ao gerar artigo",
        description: error.message || "Não foi possível gerar o artigo",
        variant: "destructive",
      })
      return null
    } finally {
      setLoading(false)
    }
  }

  return { classifyTicket, suggestResponse, generateKnowledgeArticle, loading }
}
