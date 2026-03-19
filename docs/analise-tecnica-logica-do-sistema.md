# Analise Tecnica da Logica do Sistema GitLaw

Indice navegavel da documentacao detalhada:

- [Indice Geral](./README.md)
- [Arquitetura](./arquitetura/visao-geral.md)
- [Dominio](./dominio/entidades.md)
- [Fluxos Legislativos](./fluxos-legislativos/criacao-de-proposta.md)
- [Protocolo](./protocolo/convergencia-on-chain.md)
- [Roadmap](./roadmap/alpha.md)

## 1. Tese central

O GitLaw ja e funcional como simulador institucional de tramitacao legislativa versionada, mas ainda nao e um protocolo descentralizado pleno.

Essa formulacao e importante por dois motivos:

- evita vender descentralizacao que ainda nao existe
- preserva o valor tecnico do alpha, que ja possui uma espinha dorsal legislativa consistente

Em termos tecnicos e estrategicos, o estado atual do projeto pode ser resumido assim:

> GitLaw e um motor alpha de tramitacao legislativa versionada, com arquitetura hibrida preparada para convergencia institucional on-chain.

## 2. Leitura em quatro planos

Este documento separa a analise em quatro planos, para evitar confusao entre camadas conceituais diferentes.

1. Plano institucional
2. Plano de dominio
3. Plano operacional
4. Plano protocolar

Essa separacao e necessaria porque o projeto trabalha ao mesmo tempo com:

- uma representacao politico-administrativa
- um modelo de software
- uma implementacao operacional local
- uma infraestrutura protocolar futura

## 3. Plano institucional

O plano institucional descreve o que o sistema representa politicamente e administrativamente.

### 3.1 Cidadania territorial

A unidade basica de legitimidade do sistema nao e apenas a carteira, mas a carteira vinculada a um territorio.

No desenho institucional do GitLaw:

- participacao nao e puramente individual
- participacao e territorializada
- o bairro define pertencimento, elegibilidade e peso politico

Isso permite que o sistema trate a representacao civica como pertencimento institucional local, e nao apenas como autenticacao tecnica.

### 3.2 Admissibilidade

Nem toda proposta deve seguir diretamente para deliberacao. Ha uma etapa de admissibilidade, que no desenho institucional corresponde a filtros como:

- consistencia redacional
- risco de conflito normativo
- impacto orcamentario
- constitucionalidade minima

Hoje essa camada ainda e simulada por heuristicas, mas institucionalmente ela representa a funcao de triagem tecnico-juridica anterior a abertura de votacao.

### 3.3 Tramitacao

O sistema representa a tramitacao como uma linha de vida da materia legislativa.

Essa linha inclui:

- apresentacao da proposta
- revisao tecnica e juridica
- abertura para voto
- encerramento por prazo ou quorum
- desfecho institucional

Tramitacao, portanto, nao e apenas navegacao entre telas. E uma maquina de estados politico-administrativa.

### 3.4 Deliberacao

A votacao nao e tratada como simples soma de preferencias individuais. Ela incorpora:

- elegibilidade territorial
- ponderacao por impacto
- prazo
- quorum
- resultado formal

No plano institucional, deliberar significa produzir uma decisao valida, auditavel e vinculada ao territorio atingido.

### 3.5 Consolidacao

A proposta aprovada nao encerra o fluxo. O efeito institucional relevante e a consolidacao normativa.

Consolidar significa:

- atualizar o texto vigente
- manter historico da mudanca
- registrar autoria e justificativa
- preservar a rastreabilidade entre texto anterior e texto consolidado

Esse ponto e o coracao da traducao entre logica Git e processo legislativo.

### 3.6 Variacao local

A variacao local e a traducao institucional da ideia de fork.

No vocabulario politico-administrativo do sistema, isso representa:

- experimento normativo territorial
- adaptacao local de uma lei-base
- espaco institucional para iteracao regulatoria controlada

Isso e importante porque o sistema nao trata o fork como gesto tecnico abstrato. Ele o reinterpreta como arranjo local de experimentacao normativa.

## 4. Plano de dominio

O plano de dominio descreve as entidades do sistema e as relacoes entre elas.

### 4.1 Entidades centrais

`Law`

- representa uma norma vigente ou uma derivacao local
- contem versao, artigos, resumo, categoria e relacao com commits

`Proposal`

- representa a unidade deliberativa
- conecta autor, lei-alvo, artigo-alvo, texto proposto, justificativa, bairros impactados, status e votos

`Vote`

- representa o registro individual de participacao na deliberacao
- associa endereco, escolha, peso territorial e momento do voto

`Citizen`

- representa a elegibilidade civica territorial de uma carteira
- associa endereco, bairro, nivel e status ativo

`Review`

- ainda nao existe como entidade formal autonoma no codigo atual
- aparece implicitamente no `ProposalCI` e no status `em-revisao`
- deve evoluir para entidade propria, pois parecer e revisao sao funcoes institucionais de primeira ordem

`LegislativeCommit`

- hoje modelado como `Commit`
- representa o registro normativo consolidado gerado por proposta aprovada

`LocalVariation`

- hoje modelada como `ForkExperiment`
- representa uma derivacao territorial ativa de uma lei-base

`Activity`

- representa notificacoes e eventos projetados ao usuario
- e uma leitura operacional derivada do dominio

Arquivo-base do modelo:

- `src/shared/domain.ts`

### 4.2 Relacoes centrais

As relacoes de dominio mais importantes sao:

- um `Citizen` pertence a um `Neighborhood`
- uma `Proposal` incide sobre uma `Law`
- uma `Proposal` afeta um ou mais bairros
- uma `Proposal` acumula `Vote`
- uma `Proposal` aprovada gera um `LegislativeCommit`
- um `LegislativeCommit` altera uma `Law`
- uma `LocalVariation` deriva de uma `Law`
- uma `LocalVariation` pode acumular novas `Proposal`

### 4.3 Modelo conceitual resumido

```text
Citizen -> Proposal -> Vote -> Resolution -> LegislativeCommit -> Law
                      \
                       -> LocalVariation -> Proposal
```

### 4.4 Lacuna atual do dominio

O ponto mais evidente de evolucao do dominio e a ausencia de entidades explicitas para:

- parecer
- admissibilidade
- autoridade institucional
- pauta
- sessao
- deliberacao formal

Hoje esses conceitos aparecem parcialmente embutidos em flags, activities e estados. Para uma versao institucionalmente mais madura, eles devem ser promovidos a entidades ou agregados proprios.

## 5. Plano operacional

O plano operacional descreve como o sistema funciona hoje, de fato, no alpha local.

### 5.1 Estrutura atual

O sistema opera em quatro camadas pragmaticas:

1. React no frontend
2. Express na API local
3. JSON store como persistencia operacional
4. contratos locais como camada paralela de protocolo

### 5.2 React e hidratacao do estado

O frontend usa `AppProvider` como ponto de agregacao de estado. O ciclo e:

1. recuperar endereco da sessao em `localStorage`
2. consultar `GET /api/bootstrap`
3. preencher o estado global
4. reidratar tudo apos qualquer mutacao relevante

Esse modelo faz o frontend operar como projecao da API.

Arquivos centrais:

- `apps/web/src/main.tsx`
- `src/context/AppProvider.tsx`
- `src/lib/api.ts`
- `src/App.tsx`

### 5.3 API local Express

A API em `apps/api/src/server.js` faz:

- carregamento do store
- sincronizacao de ciclo de vida das propostas
- aplicacao de regras de negocio
- persistencia do novo estado

Rotas principais:

- sessao
- cidadania
- propostas
- votos
- comentarios
- atividades
- variacoes locais

### 5.4 Persistencia atual

A fonte de verdade operacional hoje e:

- `data/store.json`

Isso torna o sistema simples e demonstravel, mas traz limites claros:

- baixa escalabilidade
- risco de concorrencia
- ausencia de transacoes reais
- auditoria limitada

### 5.5 Bootstrap

O bootstrap agrega o estado principal do sistema em uma resposta unica:

- sessao atual
- leis
- commits
- propostas
- bairros
- variacoes locais
- atividades
- perfil
- feed

Essa estrategia facilita a UX do alpha, mas concentra muita responsabilidade em um payload unico.

### 5.6 localStorage

O endereco de sessao e mantido em `localStorage`. Isso e suficiente para alpha local, mas nao e um mecanismo forte de autenticacao.

Hoje, o sistema confia no endereco informado pelo cliente, sem exigir assinatura por nonce em todas as operacoes.

### 5.7 Sync oportunistica

A sincronizacao do ciclo de vida das propostas e oportunistica.

Isso significa:

- o backend chama `syncProposalLifecycles(store)`
- a atualizacao ocorre quando a API toca o estado
- nao existe job autonomo de encerramento temporal

Consequencia: a passagem de estados depende do uso do sistema, e nao de um scheduler institucional proprio.

### 5.8 Maquina de estados atual da proposta

Hoje a maquina de estados efetiva pode ser representada assim:

```text
rascunho implicito
-> em-revisao
-> aberto
-> aprovado
-> rejeitado
```

Na implementacao atual:

- `rascunho` ainda nao existe como estado persistido formal
- a proposta nasce em `aberto` ou `em-revisao`
- `aprovado` e terminal
- `rejeitado` e terminal

### 5.9 Gatilhos atuais de estado

```text
criacao da proposta
-> CI heuristico decide entre aberto e em-revisao

proposta aberta
-> atinge quorum e maioria favoravel
-> aprovado

proposta aberta
-> expira sem quorum
-> rejeitado por quorum insuficiente

proposta aberta
-> atinge quorum com empate
-> rejeitado por empate

proposta aberta
-> atinge quorum com maioria contraria
-> rejeitado por maioria contra

proposta em-revisao
-> expira
-> rejeitado por bloqueio de CI
```

### 5.10 Consolidacao operacional

Quando a proposta e aprovada, a API:

- altera o texto do artigo
- atualiza metadados do artigo
- incrementa a versao da lei
- cria um commit legislativo
- gera atividades

Ou seja: o merge legislativo real hoje acontece no backend local.

### 5.11 Variacao local operacional

Hoje a variacao local no backend:

- exige cidadania ativa
- exige que o bairro do autor coincida com o bairro da variacao
- impede duplicidade de variacao ativa para a mesma lei e bairro
- clona a lei base em uma nova lei derivada
- cria commit inicial de inauguracao da variacao

Essa logica esta em `packages/application/src/gitlaw-service.js` e `packages/domain/src/gitlaw-domain.js`.

## 6. Plano protocolar

O plano protocolar descreve o que deve migrar para a camada on-chain e o que deve permanecer off-chain.

### 6.1 O que a camada on-chain ja modela

Os contratos atuais ja modelam quatro eixos:

- cidadania soulbound
- repositorio normativo
- votacao ponderada
- elegibilidade para variacao territorial

Arquivos:

- `contracts/CidadaniaToken.sol`
- `contracts/GitLawRepository.sol`
- `contracts/WeightedVoting.sol`
- `contracts/NeighborhoodForks.sol`

### 6.2 O que deve ser delegado a on-chain

Em uma convergencia protocolar mais forte, os seguintes pontos devem ser autoridade da camada on-chain:

1. cidadania emitida por autoridade ou prova institucional
2. votacao verificavel com peso territorial explicito
3. hash da redacao final consolidada
4. registro de commits normativos
5. autorizacao formal de variacao territorial

### 6.3 Fronteira recomendada entre off-chain e on-chain

#### Off-chain

- UX
- navegacao
- comentarios
- feed
- busca textual
- documentos anexos
- cache e projecoes de leitura
- relatorios e dashboards

#### On-chain

- cidadania validada
- eventos criticos da proposta
- votos verificaveis
- consolidacao normativa por hash
- registros normativos imutaveis
- elegibilidade para variacao local

### 6.4 O que falta para a convergencia protocolar

Hoje ha uma divergencia estrutural:

- o produto opera pelo backend local
- os contratos existem, mas nao governam o fluxo principal do usuario

Sintomas disso:

- a API nao usa `ethers` nas operacoes de negocio do dia a dia
- o backend gera `txHash` local sem transacao real
- o deployment on-chain e exposto por snapshot, nao como backbone da operacao

Em outras palavras: a camada protocolar esta pronta para experimentacao, mas ainda nao e a autoridade do sistema.

## 7. Maquina de estados recomendada

Para subir o nivel institucional, a maquina de estados da proposta deveria evoluir para algo mais formal.

```text
rascunho
-> em-revisao
-> aberto
-> aprovado
-> rejeitado
-> consolidado
-> arquivado
```

Gatilhos recomendados:

- validacao minima
- bloqueio de admissibilidade
- parecer favoravel para abertura de voto
- expiracao
- quorum
- maioria deliberativa
- consolidacao normativa
- arquivamento institucional

Essa formalizacao separa melhor:

- deliberacao
- aprovacao
- consolidacao

Hoje esses momentos ainda estao parcialmente fundidos.

## 8. Matriz de autoridade

Uma versao institucional mais madura precisa declarar quem pode fazer o que.

### 8.1 Matriz recomendada

`Cidadao ativo`

- pode propor
- pode votar
- pode comentar
- pode abrir variacao local quando houver elegibilidade

`Relator ou revisor tecnico`

- pode emitir parecer
- pode sinalizar exigencias de redacao ou admissibilidade

`Comissao ou mesa`

- pode pautar
- pode liberar a fase deliberativa
- pode encerrar por decisao procedimental, quando cabivel

`Procuradoria ou juridico institucional`

- pode marcar vicio
- pode produzir parecer impeditivo ou condicionante

`Sistema`

- pode consolidar automaticamente a redacao apos aprovacao valida
- pode registrar eventos de dominio criticos
- pode arquivar materia encerrada por prazo ou decisao

Hoje, parte dessa matriz ainda nao existe formalmente no codigo. A maioria desses papeis esta implicita ou ausente.

## 9. Eventos de dominio

Para auditoria forte, o sistema deveria se organizar em torno de eventos explicitos.

### 9.1 Eventos recomendados

- `CitizenIssued`
- `ProposalCreated`
- `ProposalMovedToReview`
- `ProposalOpenedForVoting`
- `VoteCast`
- `ProposalApproved`
- `ProposalRejected`
- `LawConsolidated`
- `LocalVariationOpened`
- `CommentAdded`

### 9.2 Situacao atual

Hoje existe um sistema de `Activity`, mas ele e uma projecao voltada ao usuario, nao um barramento formal de eventos de dominio.

Diferenca importante:

- `Activity` fala com a interface
- evento de dominio fala com auditoria, integracao e consistencia institucional

## 10. Repositorios do produto e repositorios institucionais

No GitLaw existem dois sentidos diferentes para a palavra repositorio.

### 10.1 Repositorios tecnicos de codigo

Sao os modulos reais de software:

- frontend
- API
- dominio
- aplicacao
- infraestrutura
- contratos
- documentacao

### 10.2 Repositorios institucionais do produto

Sao os acervos logicos que o sistema representa:

- legislacao vigente
- propostas legislativas
- emendas
- pareceres
- participacao social
- publicacoes oficiais

Esses dois planos nao precisam coincidir.

A recomendacao mais coerente e:

- monorepo tecnico unico para o codigo real
- multiplos repositorios institucionais logicos no dominio do produto

## 11. Estrutura tecnica recomendada para o proximo estagio

Para o codigo real, a estrutura mais pragmatica neste momento e um monorepo tecnico.

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

### 11.1 Leitura arquitetural da estrutura sugerida

`apps/web`

- interface publica e operacao do usuario

`apps/api`

- entrada HTTP e adaptacao para casos de uso

`packages/domain`

- entidades, servicos de dominio e regras legislativas puras

`packages/application`

- casos de uso e portas

`packages/infrastructure`

- JSON store, banco futuro, blockchain gateway, autenticacao

`contracts`

- nucleo protocolar

`docs`

- arquitetura, dominio, fluxos e protocolo

`data`

- persistencia local de alpha

`tests`

- testes de dominio, aplicacao e contratos

## 12. Principais limites tecnicos do estado atual

### 12.1 Persistencia monolitica em JSON

Limita concorrencia, auditoria e escalabilidade.

### 12.2 Ausencia de autenticacao forte por assinatura

O sistema ainda confia excessivamente no endereco enviado pelo cliente.

### 12.3 Review institucional submodelado

Parecer, admissibilidade e autoridade ainda nao sao agregados formais do dominio.

### 12.4 Divergencia entre operacao e protocolo

O alpha opera localmente; o protocolo existe, mas ainda nao comanda o fluxo.

### 12.5 Temporalidade nao autonoma

Nao ha scheduler ou job institucional para fechamento de etapas.

## 13. O que o sistema ja faz bem

- materializa cidadania territorial como eixo de legitimidade
- organiza proposta, voto e consolidacao como ciclo coerente
- preserva historico de alteracao normativa
- traduz fork em variacao local institucional
- ja possui esqueleto on-chain compativel com o desenho futuro

## 14. Proximo passo tecnico recomendado

Se a evolucao seguir a ordem mais segura e produtiva, o caminho recomendado e:

1. separar `domain`, `application` e `infrastructure`
2. formalizar a maquina de estados da proposta
3. introduzir autenticacao por assinatura de carteira
4. migrar o store JSON para persistencia com auditoria
5. definir eventos criticos on-chain e manter o restante off-chain
6. convergir cidadania, votacao e variacao territorial com os contratos

## 15. Conclusao

O valor do GitLaw nao esta em fingir que o protocolo ja existe por completo. O valor esta em ter construido um motor legislativo local que:

- ja expressa a logica institucional correta
- ja usa uma semantica compativel com processo politico-administrativo
- ja se organiza para uma futura convergencia protocolar

Portanto, a leitura tecnicamente mais precisa do projeto e esta:

GitLaw ja e forte demais para ser apenas mockup e ainda cedo demais para ser tratado como protocolo pleno. Ele ocupa, hoje, um espaco valido e estrategicamente promissor: o de simulador institucional versionado com arquitetura preparada para evolucao on-chain.
