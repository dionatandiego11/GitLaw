# Eventos de Dominio

## Objetivo

Criar um eixo de auditoria institucional independente da camada de interface.

## Eventos recomendados

- `CitizenIssued`
- `ProposalCreated`
- `ProposalMovedToReview`
- `ProposalOpenedForVoting`
- `VoteCast`
- `ProposalApproved`
- `ProposalRejected`
- `LawConsolidated`
- `LocalVariationOpened`
- `CommentAdded`

## Diferenca entre atividade e evento

`Activity`

- e projetada para a interface
- serve notificacao e feed pessoal

Evento de dominio

- serve auditoria
- serve integracao
- serve reconstruir fatos institucionais

## Recomendacao

O sistema deve manter os dois niveis:

- evento como fonte de verdade institucional
- atividade como projecao para UX

## Estado atual

Hoje ha `Activity`, mas ainda nao ha barramento explicito de eventos de dominio.

## Referencias atuais

- `packages/application/src/gitlaw-service.js`
- `src/shared/domain.ts`
