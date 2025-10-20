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
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Loader2 } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface ProfileSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentName: string
  currentAvatar?: string
  userId: string
}

export function ProfileSettingsDialog({
  open,
  onOpenChange,
  currentName,
  currentAvatar,
  userId,
}: ProfileSettingsDialogProps) {
  const [name, setName] = useState(currentName)
  const [avatarUrl, setAvatarUrl] = useState(currentAvatar || "")
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      const file = event.target.files?.[0]
      if (!file) return

      // Validar tipo e tamanho do arquivo
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Erro",
          description: "Por favor, selecione uma imagem válida",
          variant: "destructive",
        })
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Erro",
          description: "A imagem deve ter menos de 5MB",
          variant: "destructive",
        })
        return
      }

      // Upload para o Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${Date.now()}.${fileExt}`
      
      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true
        })

      if (uploadError) throw uploadError

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      setAvatarUrl(publicUrl)
      
      toast({
        title: "Sucesso",
        description: "Foto carregada com sucesso",
      })
    } catch (error) {
      console.error("Error uploading avatar:", error)
      toast({
        title: "Erro ao fazer upload",
        description: "Não foi possível carregar a foto",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: name,
          avatar_url: avatarUrl || null,
        })
        .eq("id", userId)

      if (error) throw error

      toast({
        title: "Perfil atualizado",
        description: "Suas alterações foram salvas com sucesso",
      })
      
      onOpenChange(false)
      window.location.reload()
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Erro ao atualizar perfil",
        description: "Não foi possível salvar as alterações",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configurações do Perfil</DialogTitle>
          <DialogDescription>
            Atualize suas informações de perfil
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback>
                {name.split(" ").map(n => n[0]).join("").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <label htmlFor="avatar-upload">
              <Button variant="outline" size="sm" asChild disabled={uploading}>
                <span className="cursor-pointer">
                  <Camera className="mr-2 h-4 w-4" />
                  {uploading ? "Carregando..." : "Escolher foto"}
                </span>
              </Button>
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="avatar-url">URL da foto</Label>
            <Input
              id="avatar-url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://exemplo.com/foto.jpg"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="name">Nome completo</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading || uploading || !name}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
