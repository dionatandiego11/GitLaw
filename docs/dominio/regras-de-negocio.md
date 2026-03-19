# Regras de Negocio

## Elegibilidade

Hoje, quase toda acao material exige cidadania ativa:

- propor
- votar
- comentar
- abrir variacao local

## Peso territorial do voto

No backend local:

- bairro impactado: `1`
- bairro adjacente: `0.6`
- demais bairros: `0.3`

Na camada on-chain:

- bairro impactado: `100`
- bairro adjacente: `60`
- demais bairros: `30`

As proporcoes sao equivalentes, mudando apenas a escala numerica.

## CI legislativo

O CI atual e heuristico. Ele tenta inferir:

- conflito normativo
- risco orcamentario
- risco constitucional
- consistencia minima de redacao

Essa camada ainda nao substitui parecer formal.

## Aprovacao e rejeicao

Uma proposta pode:

- aprovar por quorum
- rejeitar por quorum insuficiente
- rejeitar por maioria contraria
- rejeitar por empate
- rejeitar por bloqueio de revisao

## Variacoes locais

Regras atuais:

- exigem cidadania ativa
- exigem bairro coincidente com a cidadania
- impedem duplicidade de variacao ativa para a mesma lei e bairro

## Matriz de autoridade recomendada

`Cidadao ativo`

- propor
- votar
- comentar
- abrir variacao local elegivel

`Revisor tecnico ou juridico`

- emitir parecer
- marcar exigencias

`Comissao ou mesa`

- pautar
- abrir deliberacao
- encerrar por decisao procedimental

`Sistema`

- consolidar texto aprovado
- registrar eventos criticos

## Referencias atuais

- `packages/application/src/gitlaw-service.js`
- `packages/domain/src/gitlaw-domain.js`
- `contracts/WeightedVoting.sol`
- `contracts/NeighborhoodForks.sol`
