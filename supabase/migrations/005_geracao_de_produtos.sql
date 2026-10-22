-- Controle da geração automática de produtos comprados (gerar-produto):
-- geracao_iniciada_em trava gerações simultâneas da mesma compra; geracao_erro guarda o
-- motivo da última falha, para a operação enxergar e a próxima tentativa refazer.
alter table public.compras
  add column if not exists geracao_iniciada_em timestamptz,
  add column if not exists geracao_erro text;
