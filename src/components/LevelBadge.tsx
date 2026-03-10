import { Badge } from "@/components/ui/badge"
import { Shield } from "lucide-react"

interface LevelBadgeProps {
  level: number
}

const levelConfig: Record<number, { label: string; className: string }> = {
  1: { label: "N1", className: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
  2: { label: "N2", className: "bg-orange-500/10 text-orange-600 border-orange-500/30" },
  3: { label: "N3", className: "bg-red-500/10 text-red-600 border-red-500/30" },
}

export function LevelBadge({ level }: LevelBadgeProps) {
  const config = levelConfig[level] || levelConfig[1]

  return (
    <Badge variant="outline" className={`text-xs gap-1 ${config.className}`}>
      <Shield className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}
