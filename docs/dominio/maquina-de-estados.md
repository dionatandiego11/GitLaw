# Maquina de Estados

## Estado atual da proposta

Hoje a proposta opera, de forma efetiva, nos seguintes estados:

```text
rascunho implicito
-> em-revisao
-> aberto
-> aprovado
-> rejeitado
```

### Gatilhos atuais

`criacao`

- CI heuristico decide entre `aberto` e `em-revisao`

`aberto -> aprovado`

- quorum atingido
- votos favoraveis maiores que contrarios

`aberto -> rejeitado`

- expira sem quorum
- ou empata
- ou termina com maioria contraria

`em-revisao -> rejeitado`

- expira sem liberar votacao

## Estado alvo recomendado

Para uma leitura institucional mais forte, a proposta deveria evoluir para:

```text
rascunho
-> em-revisao
-> aberto
-> aprovado
-> rejeitado
-> consolidado
-> arquivado
```

## Separacao desejada

Essa evolucao permitiria separar melhor:

- admissibilidade
- deliberacao
- aprovacao
- consolidacao normativa
- encerramento administrativo

## Gatilhos alvo

- validacao minima
- parecer favoravel
- abertura formal de votacao
- expiracao
- quorum
- maioria
- consolidacao do texto
- arquivamento

## Referencias atuais

- `packages/domain/src/gitlaw-domain.js`
- `test/server/proposal-lifecycle.test.js`
