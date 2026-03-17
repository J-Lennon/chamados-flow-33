import { useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useEmpresa } from "@/hooks/useEmpresa"
import { useAuth } from "@/hooks/useAuth"
import { useAI } from "@/hooks/useAI"
import { Plus, Loader2, Sparkles } from "lucide-react"

interface CreateTicketDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  onTicketCreated?: () => void
}

export function CreateTicketDialog({ 
  open, 
  onOpenChange, 
  trigger,
  onTicketCreated 
}: CreateTicketDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [city, setCity] = useState("")
  const [department, setDepartment] = useState("")
  const { toast } = useToast()
  const { user } = useAuth()
  const { empresaId } = useEmpresa(user?.id)
  const { classifyTicket, loading: aiLoading } = useAI()

  const handleOpenChange = (value: boolean) => {
    if (onOpenChange) {
      onOpenChange(value)
    } else {
      setIsOpen(value)
    }
  }

  const isControlled = open !== undefined

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error("Usuário não autenticado")
      }

      // AI classifies automatically
      let priority = "medium"
      let nivelAtendimento = 1
      
      const aiResult = await classifyTicket({ title, description, department })
      if (aiResult) {
        priority = aiResult.priority
        nivelAtendimento = aiResult.nivel_atendimento || 1
      }

      const { error } = await supabase.from("tickets").insert({
        title,
        description,
        priority,
        city,
        department,
        requester_id: user.id,
        status: "new",
        empresa_id: empresaId,
        nivel_atendimento: nivelAtendimento,
      })

      if (error) throw error

      toast({
        title: "Chamado criado!",
        description: `Prioridade definida pela IA: ${priority.toUpperCase()}`,
      })

      setTitle("")
      setDescription("")
      setCity("")
      setDepartment("")
      
      handleOpenChange(false)
      
      if (onTicketCreated) {
        onTicketCreated()
      }
    } catch (error: any) {
      toast({
        title: "Erro ao criar chamado",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isControlled ? open : isOpen} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Novo Chamado</DialogTitle>
          <DialogDescription>
            Preencha os detalhes do seu chamado abaixo
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Resumo do problema"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o problema em detalhes"
                rows={4}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="city">Cidade</Label>
              <Select value={city} onValueChange={setCity} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a cidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pelotas">Pelotas</SelectItem>
                  <SelectItem value="Rio Grande">Rio Grande</SelectItem>
                  <SelectItem value="Porto Alegre">Porto Alegre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="department">Departamento</Label>
              <Input
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Ex: TI, Suporte, RH"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              A prioridade e nível de atendimento serão definidos automaticamente pela IA
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Chamado
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
