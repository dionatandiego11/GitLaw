# GitLaw

Alpha local do GitLaw: uma plataforma de governanca legislativa inspirada em Git, com identidade civica, PRs legislativos, votos ponderados por bairro e forks de experimentacao local.

## O que esta funcional no alpha

- Conexao por carteira com fallback para sessao local de demonstracao
- Emissao local de cidadania com persistencia em disco
- Repositorio legislativo com detalhe, blame por artigo e historico de commits
- Criacao de PR legislativo em 3 passos
- Votacao ponderada por proximidade geografica
- Comentarios em propostas
- Forks de bairro com repositorio local

## Stack

- Frontend: React 19 + Vite + TypeScript + Tailwind CSS
- Backend local: Node.js + Express + persistencia em `data/store.json`
- Camada on-chain local: Hardhat 3 + Solidity + OpenZeppelin

## Como rodar

1. Instale as dependencias:
   `npm install`
2. Inicie a API local:
   `npm run api`
3. Em outro terminal, inicie o frontend:
   `npm run dev`
4. Abra:
   `http://localhost:3000`

## Como rodar a camada on-chain local

Os scripts `chain:*` usam um runtime Node 22 local empacotado no proprio projeto para manter compatibilidade com o Hardhat 3.

1. Suba um node local de desenvolvimento:
   `npm run chain:node`
2. Em outro terminal, compile os contratos:
   `npm run chain:compile`
3. Rode os testes:
   `npm run chain:test`
4. Com o node ainda ligado, publique os contratos localmente:
   `npm run chain:deploy`

O deploy gera um snapshot em `data/chain.deployment.json`.
Esse snapshot tambem fica disponivel pela API em `GET /api/chain/deployment`.

## Scripts

- `npm run dev`: frontend Vite
- `npm run dev:web`: alias para o frontend
- `npm run api`: API local Express
- `npm run chain:node`: sobe um node Hardhat local em `127.0.0.1:8545`
- `npm run chain:compile`: compila os contratos Solidity
- `npm run chain:test`: executa os testes Node.js do Hardhat
- `npm run chain:deploy`: publica os contratos no node local e gera o snapshot de enderecos
- `npm run build`: build do frontend
- `npm run lint`: typecheck do frontend

## Documentacao

A documentacao tecnica e institucional do projeto esta organizada em:

- `docs/README.md`: indice geral
- `docs/arquitetura/`: visao geral, arquitetura atual e arquitetura alvo
- `docs/dominio/`: entidades, maquina de estados e regras de negocio
- `docs/fluxos-legislativos/`: cidadania, proposta, votacao, consolidacao e variacoes locais
- `docs/protocolo/`: convergencia on-chain, eventos e garantias institucionais
- `docs/roadmap/`: alpha, beta e piloto municipal

## Persistencia

Os dados do alpha sao persistidos automaticamente em:

- `data/store.json`
- `data/chain.deployment.json`

Se quiser resetar o ambiente, remova esse arquivo e reinicie a API.
