import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useNotifications } from "@/hooks/useNotifications"
import { useAuth } from "@/hooks/useAuth"

export function NotificationsPopover() {
  const { user } = useAuth()
  const { notificationCount } = useNotifications(user?.id)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {notificationCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
            >
              {notificationCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-2">
          <h4 className="font-medium leading-none">Notificações</h4>
          <p className="text-sm text-muted-foreground">
            {notificationCount === 0
              ? "Nenhuma notificação nova"
              : `Você tem ${notificationCount} chamado(s) aguardando atenção`}
          </p>
        </div>
        <ScrollArea className="h-[300px] mt-4">
          <div className="space-y-2">
            {notificationCount > 0 ? (
              <div className="text-sm p-4 border rounded-lg">
                <p className="font-medium">Chamados pendentes</p>
                <p className="text-muted-foreground mt-1">
                  {notificationCount} chamado(s) com status "Novo" ou "Pendente"
                </p>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center p-4">
                Nenhuma notificação no momento
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
