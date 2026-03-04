import { useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useNavigate } from "react-router-dom"
import { Loader2, Headset } from "lucide-react"

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("signup-email") as string
    const password = formData.get("signup-password") as string
    const fullName = formData.get("full-name") as string

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { full_name: fullName },
        },
      })
      if (error) throw error
      toast({
        title: "Cadastro realizado!",
        description: "Verifique seu email para confirmar o cadastro.",
      })
    } catch (error: any) {
      toast({
        title: "Erro no cadastro",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    let loginInput = formData.get("signin-email") as string
    const password = formData.get("signin-password") as string

    try {
      const email = loginInput.includes('@') ? loginInput : `${loginInput.toLowerCase()}@telesdesk.com`
      const { error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      })
      if (error) throw error
      toast({
        title: "Login realizado!",
        description: "Bem-vindo ao TeleDesk",
      })
      navigate("/")
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.04),transparent_60%)]" />

      <Card className="relative w-full max-w-md border-border/60 shadow-lg">
        <CardHeader className="text-center space-y-4 pb-2">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary text-primary-foreground shadow-glow">
              <Headset className="h-6 w-6" />
            </div>
            <h1
              className="text-3xl font-black tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #B11226 0%, #D41B2E 50%, #B11226 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 1px 4px rgba(255,193,7,0.3))',
              }}
            >
              TeleDesk
            </h1>
          </div>
          <CardDescription className="text-muted-foreground">
            Sistema de Gerenciamento de Chamados
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Usuário ou Email</Label>
                  <Input id="signin-email" name="signin-email" type="text" placeholder="seu@email.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Senha</Label>
                  <Input id="signin-password" name="signin-password" type="password" placeholder="••••••••" required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Entrar
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full-name">Nome Completo</Label>
                  <Input id="full-name" name="full-name" type="text" placeholder="Seu nome" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" name="signup-email" type="email" placeholder="seu@email.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input id="signup-password" name="signup-password" type="password" placeholder="••••••••" required minLength={6} />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Cadastrar
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
