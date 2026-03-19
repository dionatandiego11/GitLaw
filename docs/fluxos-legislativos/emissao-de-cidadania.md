# Emissao de Cidadania

## Objetivo

Vincular uma carteira a um territorio para liberar participacao civica no sistema.

## Fluxo atual

1. usuario conecta carteira ou modo demo
2. envia bairro e documento
3. API valida bairro
4. sistema registra solicitacao
5. sistema ja emite cidadania ativa no alpha

## Regras atuais

- carteira obrigatoria
- bairro valido
- operacao idempotente quando ja existe cidadania ativa

## Limite atual

Hoje a validacao documental ainda nao e uma fila institucional real. Ela e uma simulacao local com emissao imediata.

## Evolucao recomendada

- nonce e assinatura da carteira
- fila de validacao
- parecer administrativo
- emissao por autoridade institucional ou contrato

## Referencias atuais

- `packages/application/src/gitlaw-service.js`
- `contracts/CidadaniaToken.sol`
