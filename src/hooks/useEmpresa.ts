import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"

export function useEmpresa(userId: string | undefined) {
  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEmpresa = async () => {
      if (!userId) {
        setEmpresaId(null)
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("empresa_id")
          .eq("id", userId)
          .single()

        if (error) throw error
        setEmpresaId(data?.empresa_id || null)
      } catch (error) {
        console.error("Error fetching empresa:", error)
        setEmpresaId(null)
      } finally {
        setLoading(false)
      }
    }

    fetchEmpresa()
  }, [userId])

  return { empresaId, loading }
}
