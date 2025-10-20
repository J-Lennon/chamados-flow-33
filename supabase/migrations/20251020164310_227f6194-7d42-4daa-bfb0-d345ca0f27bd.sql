-- Limpar dados de teste do sistema
-- Remove todas as mensagens de chamados
DELETE FROM ticket_messages;

-- Remove todo o histórico de chamados
DELETE FROM ticket_history;

-- Remove todos os chamados
DELETE FROM tickets;
