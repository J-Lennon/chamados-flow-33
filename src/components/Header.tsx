import { useState, useEffect } from "react"
import { Search, Moon, Sun, User, Settings, LogOut, UserPlus, Users, Plus, Headset } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "next-themes"
import { CreateUserDialog } from "./CreateUserDialog"
import { CreateTicketDialog } from "./CreateTicketDialog"
import { NotificationsPopover } from "./NotificationsPopover"
import { ProfileSettingsDialog } from "./ProfileSettingsDialog"
import { useAuth } from "@/hooks/useAuth"
import { useUserRole } from "@/hooks/useUserRole"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

export function Header() {
  const { theme, setTheme } = useTheme()
  const { user } = useAuth()
  const { isAdmin, isAgent } = useUserRole(user?.id)
  const { toast } = useToast()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<{ full_name: string; avatar_url?: string } | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [createUserOpen, setCreateUserOpen] = useState(false)
  const [createTicketOpen, setCreateTicketOpen] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .single()
      if (data) setProfile(data)
    }
    fetchProfile()
  }, [user?.id])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      toast({ title: "Logout realizado", description: "Você foi desconectado com sucesso" })
    } catch (error) {
      toast({ title: "Erro ao sair", description: "Não foi possível desconectar", variant: "destructive" })
    }
  }

  const initials = profile?.full_name
    ?.split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase() || "U"

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-sm">
      <div className="container flex h-16 items-center gap-4">
        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5 group hover:opacity-90 transition-opacity"
        >
          <div className="p-2 rounded-xl bg-primary text-primary-foreground shadow-glow">
            <Headset className="h-5 w-5" />
          </div>
          <span
            className="text-xl font-black tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #B11226 0%, #D41B2E 50%, #B11226 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 1px 4px rgba(255,193,7,0.3))',
            }}
          >
            TeleDesk
          </span>
        </button>

        {/* Search */}
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar chamados, solicitantes..."
              className="pl-10 bg-muted/50 border-border hover:border-primary/40 focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setCreateTicketOpen(true)}
            className="shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Chamado
          </Button>

          <NotificationsPopover />

          {(isAdmin || isAgent) && (
            <>
              <Button variant="ghost" size="icon" onClick={() => setCreateUserOpen(true)} title="Criar usuário">
                <UserPlus className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/users")} title="Ver todos os usuários">
                <Users className="h-4 w-4" />
              </Button>
            </>
          )}

          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Alternar tema</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="font-medium">{profile?.full_name || "Usuário"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {user && profile && (
        <>
          <ProfileSettingsDialog
            open={settingsOpen}
            onOpenChange={setSettingsOpen}
            currentName={profile.full_name}
            currentAvatar={profile.avatar_url}
            userId={user.id}
          />
          <CreateTicketDialog open={createTicketOpen} onOpenChange={setCreateTicketOpen} />
          {(isAdmin || isAgent) && (
            <CreateUserDialog open={createUserOpen} onOpenChange={setCreateUserOpen} />
          )}
        </>
      )}
    </header>
  )
}
