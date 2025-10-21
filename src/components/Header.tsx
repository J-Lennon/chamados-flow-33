import { useState, useEffect } from "react"
import { Search, Moon, Sun, User, Settings, LogOut } from "lucide-react"
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
  const [profile, setProfile] = useState<{ full_name: string; avatar_url?: string } | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">
            Telesdesk
          </span>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar chamados, solicitantes..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <NotificationsPopover />

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
              {isAdmin && (
                <>
                  <CreateUserDialog 
                    trigger={
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <User className="mr-2 h-4 w-4" />
                        <span>Criar Usuário</span>
                      </DropdownMenuItem>
                    }
                  />
                  <DropdownMenuSeparator />
                </>
              )}
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
        <ProfileSettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          currentName={profile.full_name}
          currentAvatar={profile.avatar_url}
          userId={user.id}
        />
      )}
    </header>
  )
}