# Arquitetura Alvo

## Estrutura recomendada

```text
gitlaw/
|- apps/
|  |- web/
|  `- api/
|- packages/
|  |- domain/
|  |- application/
|  |- infrastructure/
|  |- shared/
|  `- ui/
|- contracts/
|- scripts/
|- docs/
|- data/
`- tests/
```

## Responsabilidades

### `apps/web`

- paginas
- componentes
- providers
- rotas
- cliente HTTP

### `apps/api`

- adaptadores HTTP
- validacao de entrada
- execucao de casos de uso
- montagem de respostas

### `packages/domain`

- entidades
- value objects
- servicos de dominio
- maquina de estados

### `packages/application`

- casos de uso
- DTOs
- portas
- orquestracao de fluxo

### `packages/infrastructure`

- JSON store ou banco futuro
- repositorios concretos
- blockchain gateway
- autenticacao por carteira

### `packages/shared`

- tipos compartilhados
- validadores
- constantes
- utilitarios

### `contracts`

- cidadania
- repositorio legislativo
- votacao
- variacoes locais

## Beneficio arquitetural

Essa estrutura separa a regra legislativa da infraestrutura. O ganho principal e permitir:

- trocar JSON por Postgres sem reescrever o dominio
- aproximar API e contratos do mesmo vocabulario de negocio
- testar regra legislativa sem depender do Express
- manter o produto em monorepo tecnico sem perder a semantica institucional
