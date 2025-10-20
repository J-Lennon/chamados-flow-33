import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { UserPlus, Loader2 } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface CreateUserDialogProps {
  trigger?: React.ReactNode
}

export function CreateUserDialog({ trigger }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState<"user" | "agent" | "admin">("user")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log("Criando usuário:", { email, name, role })
      
      // Generate temporary password
      const tempPassword = Math.random().toString(36).slice(-8) + "Aa1!"
      
      const redirectUrl = `${window.location.origin}/`
      
      // Create user with signUp
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: tempPassword,
        options: {
          data: {
            full_name: name,
          },
          emailRedirectTo: redirectUrl,
        },
      })

      if (signUpError) throw signUpError
      if (!authData.user) throw new Error("Failed to create user")

      // Wait for trigger to create profile and default role
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Update role if not 'user' (default from trigger)
      if (role !== "user") {
        const { error: roleError } = await supabase
          .from("user_roles")
          .update({ role: role })
          .eq("user_id", authData.user.id)

        if (roleError) {
          console.error("Error updating role:", roleError)
          throw roleError
        }
      }

      toast({
        title: "Usuário criado!",
        description: `${name} foi adicionado como ${role === "admin" ? "Administrador" : role === "agent" ? "Agente" : "Usuário"}. Senha: ${tempPassword}`,
      })

      setOpen(false)
      setEmail("")
      setName("")
      setRole("user")
    } catch (error: any) {
      console.error("Erro ao criar usuário:", error)
      toast({
        title: "Erro ao criar usuário",
        description: error.message || "Tente novamente",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" title="Criar novo usuário">
            <UserPlus className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Usuário</DialogTitle>
          <DialogDescription>
            Adicione um novo usuário ao sistema. Um email de confirmação será enviado.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Digite o nome completo"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@empresa.com"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="role">Tipo de Usuário</Label>
              <Select value={role} onValueChange={(value: any) => setRole(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="agent">Agente</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Usuário
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}