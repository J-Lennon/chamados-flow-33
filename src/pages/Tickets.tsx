import { useState } from "react"
import { TicketsList, Ticket } from "@/components/TicketsList"
import { TicketFilters } from "@/components/TicketFilters"
import { TicketDetails } from "@/components/TicketDetails"

export default function Tickets() {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const handleTicketSelect = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setIsDetailsOpen(true)
  }

  const handleDetailsClose = () => {
    setIsDetailsOpen(false)
    setSelectedTicket(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold">Meus Chamados</h1>
        <p className="text-muted-foreground">
          Gerencie e acompanhe todos os chamados de suporte
        </p>
      </div>

      {/* Filters */}
      <TicketFilters />

      {/* Tickets List */}
      <TicketsList onTicketSelect={handleTicketSelect} />

      {/* Ticket Details */}
      <TicketDetails
        ticket={selectedTicket}
        isOpen={isDetailsOpen}
        onClose={handleDetailsClose}
      />
    </div>
  )
}