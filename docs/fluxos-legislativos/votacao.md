# Votacao

## Objetivo

Registrar deliberacao territorialmente ponderada sobre uma proposta legislativa.

## Fluxo atual

1. usuario elegivel abre proposta
2. sistema calcula peso territorial
3. usuario registra voto
4. proposta e reavaliada para aprovacao ou rejeicao

## Restricoes atuais

- so cidadania ativa vota
- proposta em revisao nao aceita voto
- proposta encerrada nao aceita voto
- carteira vota apenas uma vez
- prazo de votacao precisa estar aberto

## Pesos atuais

- impacto direto: peso integral
- bairro adjacente: peso intermediario
- demais bairros: peso reduzido

## Resultado atual

O backend resolve a proposta quando:

- atinge quorum
- ou expira o prazo

## Evolucao recomendada

- voto verificavel on-chain
- eventos assinados
- fechamento automatico temporal
- trilha formal de deliberacao

## Referencias atuais

- `packages/application/src/gitlaw-service.js`
- `contracts/WeightedVoting.sol`
- `test/nodejs/gitlaw-contracts.js`
