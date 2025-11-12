import { useState, useEffect } from "react"
import { Search, Moon, Sun, User, Settings, LogOut, UserPlus, Users, Plus } from "lucide-react"
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
  const { isAdmin } = useUserRole(user?.id)
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
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso",
      })
    } catch (error) {
      toast({
        title: "Erro ao sair",
        description: "Não foi possível desconectar",
        variant: "destructive",
      })
    }
  }

  const initials = profile?.full_name
    ?.split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase() || "U"

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/20 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-lg shadow-primary/5">
      <div className="container flex h-16 items-center gap-4">
        {/* Logo - Clickable */}
        <button 
          onClick={() => navigate("/")}
          className="flex items-center gap-2 group hover:scale-105 transition-all duration-300"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/50 rounded-lg blur-sm group-hover:blur-md transition-all"></div>
            <div className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground px-3 py-1.5 rounded-lg font-bold text-xl tracking-tight shadow-lg">
              TD
            </div>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            TeleDesk
          </span>
        </button>

        {/* Search */}
        <div className="flex-1 max-w-lg">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/5 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-hover:text-primary transition-colors" />
            <Input
              placeholder="Buscar chamados, solicitantes..."
              className="pl-10 bg-muted/50 border-primary/20 hover:border-primary/40 focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Create Ticket - Available for all users */}
          <Button
            variant="default"
            size="sm"
            onClick={() => setCreateTicketOpen(true)}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:scale-105"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Chamado
          </Button>

          {/* Notifications */}
          <NotificationsPopover />

          {/* Admin Actions - Only for admins */}
          {isAdmin && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCreateUserOpen(true)}
                title="Criar usuário comum"
              >
                <UserPlus className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/users")}
                title="Ver todos os usuários"
              >
                <Users className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Alternar tema</span>
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="font-medium">{profile?.full_name || "Usuário"}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </p>
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
          
          <CreateTicketDialog
            open={createTicketOpen}
            onOpenChange={setCreateTicketOpen}
          />
          
          {isAdmin && (
            <CreateUserDialog 
              open={createUserOpen}
              onOpenChange={setCreateUserOpen}
            />
          )}
        </>
      )}
    </header>
  )
}