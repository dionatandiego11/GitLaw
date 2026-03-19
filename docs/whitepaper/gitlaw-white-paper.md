# GitLaw White Paper

Versao de lancamento 0.1

## Resumo executivo

GitLaw e uma infraestrutura de tramitacao legislativa versionada que aplica principios de rastreabilidade, revisao e consolidacao ao ciclo de vida de normas publicas.

Em vez de copiar o vocabulario tecnico de plataformas de desenvolvimento, o sistema traduz essa logica para linguagem politico-administrativa:

- cidadania territorial
- admissibilidade
- proposta
- parecer e revisao
- deliberacao
- consolidacao normativa
- variacao territorial

O objetivo nao e transformar o processo legislativo em software por analogia superficial. O objetivo e construir uma camada institucional em que autoria, alteracao de texto, voto, historico normativo e experimentacao local possam ser observados, auditados e, progressivamente, verificados por infraestrutura protocolar.

Hoje, o GitLaw ja opera como motor funcional de tramitacao legislativa versionada. Ainda nao e um protocolo descentralizado pleno. Essa formulacao e deliberada: protege o projeto de prometer mais do que entrega, ao mesmo tempo em que reconhece o valor real do alpha como base institucional e tecnica.

## 1. Tese

Leis sao sistemas vivos de texto, autoridade e revisao. O problema e que grande parte da infraestrutura publica atual ainda trata a mudanca normativa como documento estatico, expediente isolado ou publicacao final, em vez de trata-la como processo versionado.

A tese do GitLaw e simples:

> o processo legislativo pode ser tratado como infraestrutura versionada, sem perder seu vocabulario institucional e sem reduzir a politica a um fluxo tecnico de engenharia.

Isso significa:

- cada proposta e uma alteracao rastreavel
- cada voto e uma decisao auditavel
- cada consolidacao e um registro normativo verificavel
- cada variacao local e uma iteracao territorial controlada

## 2. O problema que o GitLaw enfrenta

Os sistemas legislativos e regulatorios enfrentam cinco gargalos recorrentes.

### 2.1 Opacidade da mudanca normativa

O texto final costuma ser publico, mas o caminho entre a versao anterior e a nova redacao nem sempre e claro para a sociedade.

### 2.2 Fragmentacao institucional

Proposta, parecer, comentario, pauta, votacao e publicacao final costumam aparecer em bases, formatos e interfaces distintas.

### 2.3 Participacao pouco vinculada ao territorio

Em muitos modelos digitais, a participacao e tratada como opiniao geral, quando varias decisoes deveriam reconhecer impacto territorial, proximidade e pertencimento civico local.

### 2.4 Baixa legibilidade do historico

Mesmo quando ha transparencia formal, o historico institucional raramente e apresentado de modo que o cidadao consiga responder perguntas simples:

- o que mudou
- quem propos
- quem revisou
- quem votou
- qual versao passou a valer

### 2.5 Ausencia de infraestrutura de experimentacao local

Poucos sistemas tratam de forma clara a possibilidade de adaptar uma lei-base a um territorio especifico, mantendo nexo com a norma de origem e com a autorizacao institucional correspondente.

## 3. A resposta do GitLaw

GitLaw e uma plataforma institucional de versionamento legislativo com arquitetura hibrida.

No nivel do produto, ele organiza:

- leis vigentes
- propostas de alteracao
- comentarios e revisao
- votos ponderados por impacto territorial
- consolidacao normativa
- variacoes locais autorizadas

No nivel da arquitetura, ele separa:

- dominio institucional
- regras de aplicacao
- persistencia e auditoria
- eventos criticos verificaveis em contratos

No nivel protocolar, ele ancora progressivamente os atos mais sensiveis:

- emissao de cidadania
- criacao de proposta
- voto
- aprovacao ou rejeicao final
- registro do commit normativo
- abertura de variacao territorial

## 4. O que o GitLaw e e o que ele nao e

### 4.1 O que ele e

- um motor de tramitacao legislativa versionada
- uma interface publica para leitura e participacao institucional
- uma arquitetura hibrida preparada para convergencia on-chain
- uma camada de experimentacao territorial controlada

### 4.2 O que ele nao e

- nao e uma rede social de opiniao generica
- nao e apenas um portal de transparencia documental
- nao e uma promessa vazia de descentralizacao total
- nao substitui, por si so, os papeis juridicos e politicos das instituicoes

## 5. Principios de desenho

O GitLaw foi desenhado a partir de sete principios.

### 5.1 Rastreabilidade

Toda alteracao relevante deve preservar origem, autoria, contexto e resultado.

### 5.2 Legibilidade publica

A logica do sistema pode ser sofisticada, mas a interface e o vocabulario precisam permanecer compreensiveis para o cidadao.

### 5.3 Territorialidade

Participacao civica nao e apenas identidade. E identidade vinculada a territorio, impacto e elegibilidade.

### 5.4 Admissibilidade antes de deliberacao

Nem todo texto deve abrir votacao automaticamente. O sistema reconhece uma etapa de revisao e admissibilidade.

### 5.5 Consolidacao como efeito real

O centro do processo nao e apenas aprovar uma proposta. E consolidar texto vigente com historico preservado.

### 5.6 Hibridismo institucional

Nem tudo deve estar on-chain. O sistema separa cuidadosamente o que precisa de verificabilidade protocolar do que deve continuar como experiencia, busca, comentario e operacao off-chain.

### 5.7 Honestidade tecnica

O GitLaw prefere afirmar com precisao o que ja e verificavel, o que ainda e simulacao institucional e o que sera delegado a contratos em fases posteriores.

## 6. Modelo institucional

O GitLaw opera em seis funcoes institucionais centrais.

### 6.1 Cidadania territorial

A unidade basica de legitimidade e a carteira associada a um territorio validado. Isso estrutura:

- elegibilidade para propor
- elegibilidade para votar
- contexto de impacto
- pertencimento politico local

### 6.2 Admissibilidade

Antes da deliberacao, a proposta passa por filtros minimos de consistencia institucional, como:

- conflito normativo
- impacto orcamentario
- constitucionalidade minima
- condicoes redacionais

### 6.3 Tramitacao

A proposta nao e um documento isolado. Ela percorre um ciclo:

- publicacao
- revisao
- abertura para voto
- encerramento
- desfecho institucional

### 6.4 Deliberacao

A votacao considera:

- cidadania ativa
- janela temporal
- quorum
- peso territorial
- resultado formal

### 6.5 Consolidacao

Quando aprovada, a proposta gera efeito normativo: o texto da lei e atualizado, a alteracao e registrada e a relacao entre proposta e redacao final permanece auditavel.

### 6.6 Variacao territorial

A variacao territorial traduz a logica de fork para o vocabulario politico-administrativo. Em vez de um desvio tecnico arbitrario, ela representa:

- adaptacao local autorizada
- experimento regulatorio em territorio definido
- derivacao vinculada a uma lei-base

## 7. Modelo de dominio

O nucleo conceitual do sistema hoje se organiza em torno das seguintes entidades.

### 7.1 Law

Representa uma norma vigente ou uma derivacao territorial, com:

- versao
- artigos
- historico de commits
- vinculacao com consolidacoes anteriores

### 7.2 Proposal

Representa a unidade deliberativa. Conecta:

- autoria
- lei-alvo
- artigo-alvo
- justificativa
- texto proposto
- bairros impactados
- estado de tramitacao

### 7.3 Vote

Representa o registro individual de participacao, incluindo:

- endereco votante
- escolha
- peso territorial
- momento do voto

### 7.4 Citizen

Representa a identidade civica territorialmente validada.

### 7.5 LegislativeCommit

Representa o registro normativo produzido quando uma proposta aprovada altera o texto vigente.

### 7.6 LocalVariation

Representa uma derivacao territorial ativa, vinculada a autorizacao institucional previa.

### 7.7 Activity

Representa a camada de notificacao e projecao operacional para a experiencia do usuario.

## 8. Maquina institucional da proposta

Uma proposta no GitLaw nao vive apenas em telas. Ela vive em uma maquina de estados formal.

Estados principais:

- `em-revisao`
- `aberto`
- `aprovado`
- `rejeitado`

Transicoes principais:

- revisao inicial por admissibilidade
- abertura para voto
- aprovacao por quorum e maioria favoravel
- rejeicao por falta de quorum
- rejeicao por maioria contraria
- encerramento por empate
- expiracao em revisao sem liberar votacao

Essa formalizacao impede ambiguidades operacionais e aproxima o sistema de uma tramitacao institucional verificavel.

## 9. Arquitetura tecnica

O GitLaw hoje opera em um monorepo tecnico com separacao de camadas.

### 9.1 Apps

- `apps/web`: interface publica em React
- `apps/api`: API local em Express

### 9.2 Packages

- `packages/domain`: regras e entidades do dominio
- `packages/application`: casos de uso e orquestracao
- `packages/infrastructure`: persistencia, auditoria e sincronizacao protocolar
- `packages/shared`: tipos e constantes compartilhadas

### 9.3 Contracts

Os contratos organizam a fronteira protocolar do sistema:

- cidadania
- repositorio normativo
- votacao ponderada
- variacoes territoriais

## 10. Arquitetura operacional atual

Hoje o sistema roda de forma funcional com:

- frontend React
- API local Express
- persistencia em disco
- auditoria append-only
- autenticacao por assinatura de carteira
- sincronizacao protocolar para eventos criticos suportados

Essa camada operacional ja permite demonstrar um fluxo completo:

1. autenticacao
2. emissao de cidadania
3. criacao de proposta
4. comentario
5. voto
6. aprovacao ou rejeicao
7. consolidacao normativa
8. variacao territorial

## 11. Fronteira entre off-chain e on-chain

Um dos pontos centrais do GitLaw e a definicao explicita da fronteira entre aquilo que precisa de verificabilidade protocolar e aquilo que deve permanecer off-chain.

### 11.1 Eventos criticos on-chain

Os seguintes eventos sao tratados como material institucional critico:

- `CitizenIssued`
- `ProposalCreated`
- `VoteCast`
- `ProposalApproved`
- `ProposalRejected`
- `LawCommitRecorded`
- `LocalVariationOpened`

Esses eventos compoem a espinha dorsal de legitimidade, deliberacao e consolidacao do sistema.

### 11.2 Eventos mantidos off-chain

Os seguintes eventos permanecem off-chain por razoes de UX, custo, volume ou natureza operacional:

- `ProposalMovedToReview`
- `ProposalOpenedForVoting`
- `CommentAdded`
- `ActivitiesMarkedRead`
- `SessionAuthenticated`

Essa divisao e intencional. Ela evita inflar a camada protocolar com dados de interface e, ao mesmo tempo, preserva ancoragem forte para atos institucionais sensiveis.

## 12. Cidadania, votacao e variacao territorial

Tres pilares diferenciam o GitLaw de sistemas civicos genericos.

### 12.1 Cidadania

A cidadania nao e um perfil abstrato. Ela e uma credencial territorial que condiciona participacao material.

### 12.2 Votacao ponderada

O voto considera impacto territorial. Isso permite deliberacao mais aderente ao contexto da materia e do bairro atingido.

### 12.3 Variacao territorial autorizada

A variacao local nao nasce como acao livre e imediata. Ela depende de proposta institucional de autorizacao e so depois pode ser ativada no territorio correspondente.

Esse ponto e decisivo: ele transforma a analogia com fork em mecanismo administrativo serio, e nao em improviso sem governanca.

## 13. Garantias e premissas de confianca

O GitLaw trabalha com uma arquitetura de confianca em camadas.

### 13.1 Garantias atuais

- rastreabilidade de proposta, voto, comentario e consolidacao
- autenticacao por assinatura de carteira
- auditoria append-only de mutacoes
- ancoragem on-chain dos eventos criticos suportados

### 13.2 Limitacoes atuais

- a persistencia principal ainda e baseada em arquivos
- a operacao institucional completa ainda depende da API local
- nem toda camada de autoridade institucional foi modelada como entidade propria

### 13.3 Direcao de evolucao

O caminho natural de robustez inclui:

- banco relacional com trilha de auditoria forte
- maior formalizacao de pareceres e autoridades
- expansao gradual da camada protocolar
- piloto institucional com operacao em contexto real

## 14. Estrategia de lancamento

O GitLaw deve ser apresentado publicamente com enquadramento preciso.

Mensagem recomendada:

> GitLaw e um motor alpha de tramitacao legislativa versionada, com arquitetura hibrida preparada para convergencia institucional on-chain.

Esse enquadramento tem tres vantagens:

- explica o que ja existe
- nao exagera o grau atual de descentralizacao
- posiciona o produto como infraestrutura civico-institucional em evolucao

### 14.1 O que demonstrar no lancamento

- criacao de proposta com autoria de carteira
- revisao e abertura de votacao
- voto territorial com peso
- consolidacao normativa com historico
- ativacao de variacao territorial autorizada

### 14.2 O que comunicar com clareza

- o produto ja funciona como motor institucional
- a camada protocolar ja ancora eventos criticos
- a arquitetura ainda e hibrida
- a descentralizacao plena e um horizonte de convergencia, nao um slogan vazio

## 15. Roadmap institucional

### 15.1 Alpha

Foco em:

- prova do fluxo completo
- legibilidade publica
- auditoria local
- validacao do modelo de participacao territorial

### 15.2 Beta

Foco em:

- persistencia mais robusta
- formalizacao de autoridade e parecer
- interfaces mais maduras para operacao institucional
- ampliacao da verificabilidade on-chain

### 15.3 Piloto municipal

Foco em:

- adaptacao a regras institucionais reais
- governanca operacional com atores publicos
- integracao com documentos e rotinas administrativas
- validacao de aderencia juridica e politica

## 16. Metricas de sucesso

Para avaliar maturidade do produto, o GitLaw deve observar ao menos:

- tempo medio entre proposta e desfecho
- percentual de propostas que atingem quorum
- percentual de propostas que expiram em revisao
- taxa de participacao por bairro
- numero de consolidacoes normativas rastreaveis
- numero de variacoes territoriais autorizadas e ativas
- consistencia entre eventos off-chain e ancoragem on-chain

## 17. Riscos e respostas

### 17.1 Risco de sobrepromessa

Resposta:

comunicar explicitamente a arquitetura hibrida e o estagio atual do protocolo.

### 17.2 Risco de complexidade excessiva para o usuario

Resposta:

manter linguagem politico-administrativa simples, sem expor jargao de engenharia como eixo principal da experiencia.

### 17.3 Risco de divergencia entre camada operacional e protocolar

Resposta:

preservar fila protocolar clara, smoke tests de fluxo e politicas explicitas de quais eventos devem ser ancorados.

### 17.4 Risco de inadequacao institucional

Resposta:

tratar o alpha como base de experimentacao guiada por regras de negocio, nao como substituto imediato do processo formal existente.

## 18. Conclusao

GitLaw propoe uma mudanca importante no modo como sistemas civicos e legislativos podem ser construidos.

Ele nao trata a lei como arquivo morto nem a participacao como gesto difuso. Trata o processo normativo como infraestrutura viva de autoria, revisao, deliberacao e consolidacao.

Seu valor esta justamente em combinar tres coisas que raramente aparecem juntas:

- linguagem institucional compreensivel
- arquitetura de software organizada por dominio
- convergencia gradual para verificabilidade protocolar

O estado atual do projeto ja e suficientemente forte para lancamento como alpha serio. E, ao mesmo tempo, suficientemente honesto para reconhecer que a descentralizacao plena ainda e um horizonte de implementacao, e nao um fato consumado.

Esse equilibrio entre ambicao institucional e precisao tecnica e o que torna o GitLaw defensavel como produto, arquitetura e proposta publica.
