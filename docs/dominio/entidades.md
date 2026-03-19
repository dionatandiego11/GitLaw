# Entidades

## Entidades atuais

### `Law`

Representa uma lei, codigo ou variacao local.

Campos centrais:

- id
- titulo
- numero
- categoria
- versao
- artigos
- commitIds
- `isFork`

### `Proposal`

Representa a unidade de deliberacao.

Campos centrais:

- lei alvo
- artigo alvo
- texto anterior
- texto proposto
- justificativa
- bairros impactados
- status
- quorum
- votos
- comentarios

### `VoteRecord`

Representa o voto de uma carteira com peso territorial.

Campos centrais:

- address
- choice
- weight
- bairroId
- createdAt

### `Citizen`

Representa cidadania territorial ativa.

Campos centrais:

- address
- bairroId
- bairroNome
- nivel
- ativo

### `Commit`

Representa o registro normativo consolidado.

Campos centrais:

- leiId
- prId
- hash
- mensagem
- versao
- articleChanges

### `ForkExperiment`

Representa uma variacao local ativa.

Campos centrais:

- leiOrigemId
- leiForkId
- bairroId
- objetivo
- duracaoMeses
- proposalIds

## Entidades recomendadas para a proxima fase

As seguintes entidades ainda aparecem apenas de forma implicita e deveriam ser promovidas:

- `Review`
- `AdmissibilityDecision`
- `Session`
- `AgendaItem`
- `DeliberationRecord`
- `AuthorityRole`

## Relacoes de dominio

```text
Citizen -> Proposal -> Vote
Proposal -> LegislativeCommit -> Law
Law -> LocalVariation -> Proposal
Proposal -> Review
Proposal -> DeliberationRecord
```

## Referencias atuais de codigo

- `src/shared/domain.ts`
- `packages/application/src/gitlaw-service.js`
- `packages/domain/src/gitlaw-domain.js`
