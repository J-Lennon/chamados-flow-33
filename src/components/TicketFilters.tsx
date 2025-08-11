import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Filter, X, Search } from "lucide-react"
import { TicketStatus, TicketPriority } from "./StatusBadge"

interface FilterState {
  search: string
  status: TicketStatus[]
  priority: TicketPriority[]
  department: string[]
  assignee: string[]
  dateRange: {
    from?: Date
    to?: Date
  }
  onlyMyTickets: boolean
}

const initialFilters: FilterState = {
  search: "",
  status: [],
  priority: [],
  department: [],
  assignee: [],
  dateRange: {},
  onlyMyTickets: false,
}

const statusOptions = [
  { value: "new", label: "Novo" },
  { value: "progress", label: "Em Andamento" },
  { value: "waiting", label: "Em Espera" },
  { value: "accepted", label: "Aceito" },
  { value: "completed", label: "Concluído" },
  { value: "overdue", label: "Atrasado" },
] as const

const priorityOptions = [
  { value: "low", label: "Baixa" },
  { value: "medium", label: "Média" },
  { value: "high", label: "Alta" },
  { value: "critical", label: "Crítica" },
] as const

const departmentOptions = [
  "Financeiro",
  "Contabilidade", 
  "Vendas",
  "RH",
  "TI",
  "Marketing",
  "Operações"
]

const assigneeOptions = [
  "Carlos Silva",
  "Ana Rodrigues", 
  "Roberto Lima",
  "Fernanda Costa",
  "Marcos Santos"
]

interface TicketFiltersProps {
  onFiltersChange?: (filters: FilterState) => void
}

export function TicketFilters({ onFiltersChange }: TicketFiltersProps) {
  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const [isOpen, setIsOpen] = useState(false)

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters }
    setFilters(updated)
    onFiltersChange?.(updated)
  }

  const clearFilters = () => {
    setFilters(initialFilters)
    onFiltersChange?.(initialFilters)
  }

  const toggleArrayFilter = <T,>(
    key: keyof FilterState,
    value: T,
    currentArray: T[]
  ) => {
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value]
    
    updateFilters({ [key]: newArray })
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.search) count++
    if (filters.status.length) count++
    if (filters.priority.length) count++
    if (filters.department.length) count++
    if (filters.assignee.length) count++
    if (filters.onlyMyTickets) count++
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <div className="space-y-4">
      {/* Search and Filter Button */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar chamados..."
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="pl-10"
          />
        </div>
        
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="mr-2 h-4 w-4" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          
          <SheetContent className="w-[400px] sm:w-[540px]">
            <SheetHeader>
              <SheetTitle>Filtros de Chamados</SheetTitle>
              <SheetDescription>
                Configure os filtros para encontrar os chamados que você precisa.
              </SheetDescription>
            </SheetHeader>
            
            <div className="grid gap-6 py-6">
              {/* Status */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Status</Label>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((status) => (
                    <div key={status.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status.value}`}
                        checked={filters.status.includes(status.value)}
                        onCheckedChange={() => 
                          toggleArrayFilter('status', status.value, filters.status)
                        }
                      />
                      <Label 
                        htmlFor={`status-${status.value}`}
                        className="text-sm cursor-pointer"
                      >
                        {status.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Prioridade</Label>
                <div className="flex flex-wrap gap-2">
                  {priorityOptions.map((priority) => (
                    <div key={priority.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`priority-${priority.value}`}
                        checked={filters.priority.includes(priority.value)}
                        onCheckedChange={() => 
                          toggleArrayFilter('priority', priority.value, filters.priority)
                        }
                      />
                      <Label 
                        htmlFor={`priority-${priority.value}`}
                        className="text-sm cursor-pointer"
                      >
                        {priority.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Department */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Departamento</Label>
                <Select
                  onValueChange={(value) => 
                    toggleArrayFilter('department', value, filters.department)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {departmentOptions.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {filters.department.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {filters.department.map((dept) => (
                      <Badge key={dept} variant="secondary" className="text-xs">
                        {dept}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 ml-1 p-0"
                          onClick={() => 
                            toggleArrayFilter('department', dept, filters.department)
                          }
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Assignee */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Responsável</Label>
                <Select
                  onValueChange={(value) => 
                    toggleArrayFilter('assignee', value, filters.assignee)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    {assigneeOptions.map((assignee) => (
                      <SelectItem key={assignee} value={assignee}>
                        {assignee}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {filters.assignee.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {filters.assignee.map((assignee) => (
                      <Badge key={assignee} variant="secondary" className="text-xs">
                        {assignee}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 ml-1 p-0"
                          onClick={() => 
                            toggleArrayFilter('assignee', assignee, filters.assignee)
                          }
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Only My Tickets */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="only-my-tickets"
                  checked={filters.onlyMyTickets}
                  onCheckedChange={(checked) => 
                    updateFilters({ onlyMyTickets: !!checked })
                  }
                />
                <Label htmlFor="only-my-tickets" className="text-sm cursor-pointer">
                  Somente meus chamados
                </Label>
              </div>
            </div>

            <SheetFooter>
              <Button variant="outline" onClick={clearFilters}>
                Limpar
              </Button>
              <Button onClick={() => setIsOpen(false)}>
                Aplicar Filtros
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary" className="text-xs">
              Busca: "{filters.search}"
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 ml-1 p-0"
                onClick={() => updateFilters({ search: "" })}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {filters.status.map((status) => (
            <Badge key={status} variant="secondary" className="text-xs">
              Status: {statusOptions.find(s => s.value === status)?.label}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 ml-1 p-0"
                onClick={() => toggleArrayFilter('status', status, filters.status)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          
          {filters.priority.map((priority) => (
            <Badge key={priority} variant="secondary" className="text-xs">
              Prioridade: {priorityOptions.find(p => p.value === priority)?.label}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 ml-1 p-0"
                onClick={() => toggleArrayFilter('priority', priority, filters.priority)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}