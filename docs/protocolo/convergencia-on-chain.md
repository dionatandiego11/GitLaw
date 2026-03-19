# Convergencia On-Chain

## Estado atual

Os contratos ja existem e estao funcionais em ambiente local, mas ainda nao comandam o fluxo principal do produto.

Hoje:

- o backend local e a autoridade operacional
- a blockchain e uma camada paralela
- o snapshot de deployment e usado para consulta e healthcheck

## Objetivo da convergencia

Transferir para on-chain os fatos institucionais que exigem:

- verificabilidade
- imutabilidade
- rastreabilidade forte
- resistencia a alteracao unilateral

## Candidatos naturais a on-chain

- emissao de cidadania
- voto verificavel
- hash da redacao final
- commit normativo
- elegibilidade de variacao territorial

## O que deve permanecer off-chain

- comentarios
- documentos
- feed
- busca
- cache
- experiencia de usuario

## Regra de desenho

UX e leitura ficam off-chain. Fatos institucionais criticos migram para on-chain.

## Referencias atuais

- `contracts/CidadaniaToken.sol`
- `contracts/GitLawRepository.sol`
- `contracts/WeightedVoting.sol`
- `contracts/NeighborhoodForks.sol`
