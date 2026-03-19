# Criacao de Proposta

## Objetivo

Transformar uma demanda legislativa em unidade formal de deliberacao.

## Fluxo atual

1. cidadao ativo escolhe lei e artigo
2. informa titulo, justificativa e novo texto
3. define bairros impactados
4. backend calcula CI legislativo
5. proposta nasce em `aberto` ou `em-revisao`

## Validacoes atuais

- cidadania ativa obrigatoria
- lei obrigatoria
- artigo obrigatorio
- titulo minimo
- justificativa minima
- texto proposto minimo
- bairros impactados validos

## Saida do fluxo

A proposta passa a conter:

- texto anterior
- texto novo
- justificativa
- impacto territorial
- CI heuristico
- prazo de votacao
- quorum

## Limite atual

Nao existe entidade formal de rascunho nem etapa de submissao para relatoria.

## Referencias atuais

- `packages/application/src/gitlaw-service.js`
- `src/pages/NovaProposta.tsx`
