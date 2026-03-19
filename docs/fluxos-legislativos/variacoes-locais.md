# Variacoes Locais

## Objetivo

Permitir experimentacao normativa territorial sem alterar imediatamente a lei base do municipio.

## Fluxo atual no backend

1. cidadao ativo seleciona lei base
2. informa nome, objetivo e duracao
3. sistema valida bairro da cidadania
4. sistema impede duplicidade de variacao ativa
5. lei base e clonada em uma lei derivada
6. commit inicial da variacao e criado

## Regras atuais

- cidadania ativa obrigatoria
- bairro da variacao deve coincidir com a cidadania
- apenas uma variacao ativa por lei e bairro

## Divergencia atual

No backend local, a variacao pode ser aberta diretamente por elegibilidade territorial.

Na camada on-chain, a variacao depende de:

- proposta aprovada
- elegibilidade verificada
- bairro autorizado

## Evolucao recomendada

- alinhar backend e protocolo
- exigir elegibilidade derivada da deliberacao
- registrar abertura da variacao como evento de dominio

## Referencias atuais

- `packages/application/src/gitlaw-service.js`
- `contracts/NeighborhoodForks.sol`
