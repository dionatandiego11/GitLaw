# Arquitetura Atual

## Camadas atuais

Hoje o GitLaw roda em quatro camadas:

1. React no frontend
2. Express na API local
3. persistencia em `data/store.json`
4. contratos locais como camada protocolar paralela

## Fluxo principal

```text
Browser
-> apps/web/src/main.tsx
-> AppProvider
-> /api/bootstrap e mutacoes HTTP
-> apps/api/src/server.js
-> packages/application
-> data/store.json
```

## Papel de cada camada

### Frontend

Responsavel por:

- sessao de usuario
- hidratacao inicial
- navegacao
- execucao das acoes de produto

Arquivos centrais:

- `apps/web/src/main.tsx`
- `src/context/AppProvider.tsx`
- `src/lib/api.ts`
- `src/App.tsx`

### API

Responsavel por:

- carregar estado
- aplicar regras de negocio
- sincronizar ciclo de vida das propostas
- salvar estado atualizado

Arquivos centrais:

- `apps/api/src/server.js`
- `packages/application/src/gitlaw-service.js`
- `packages/infrastructure/src/json-store.js`

### Persistencia

A fonte de verdade operacional hoje e o arquivo:

- `data/store.json`

Essa escolha e adequada para alpha local, mas nao para operacao concorrente de escala municipal.

### Contratos

Os contratos ja modelam:

- cidadania soulbound
- repositorio normativo
- votacao ponderada
- variacoes territoriais

Mas ainda nao comandam o fluxo principal do produto.

## Limites da arquitetura atual

- confianca excessiva no endereco enviado pelo cliente
- ausencia de autenticacao por assinatura
- sync de proposta oportunistica
- ausencia de banco com auditoria
- divergencia entre operacao off-chain e camada on-chain
