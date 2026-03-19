# Consolidacao

## Objetivo

Aplicar ao texto vigente a alteracao aprovada e preservar historico institucional da mudanca.

## Fluxo atual

1. proposta aprovada e identificada
2. backend localiza a lei e o artigo alvo
3. texto do artigo e substituido
4. versao da lei e incrementada
5. commit legislativo e criado
6. atividades sao geradas

## Efeitos do fluxo

- atualizacao do texto normativo
- criacao de historico de versao
- associacao entre proposta e commit
- rastreabilidade entre antes e depois

## Limite atual

A consolidacao ainda ocorre totalmente no backend local. O hash da redacao final ainda nao e a base autoritativa de uma camada on-chain.

## Evolucao recomendada

- hash oficial da redacao final
- registro normativo imutavel
- evento de consolidacao
- alinhamento entre commit local e commit protocolar

## Referencias atuais

- `packages/domain/src/gitlaw-domain.js`
- `contracts/GitLawRepository.sol`
