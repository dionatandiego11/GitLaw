# Visao Geral

## Proposito

O GitLaw aplica logica de versionamento ao processo legislativo sem expor o usuario a um vocabulario tecnico de plataforma. O objetivo do sistema e registrar autoria, revisao, deliberacao e consolidacao normativa com rastreabilidade territorial.

## Quatro planos

O projeto deve ser lido em quatro planos:

1. plano institucional
2. plano de dominio
3. plano operacional
4. plano protocolar

Essa separacao evita misturar:

- o que o sistema representa politicamente
- as entidades do software
- a forma como o alpha roda hoje
- o que sera delegado a contratos e eventos verificaveis

## Repositorios tecnicos e repositorios institucionais

No GitLaw, a palavra repositorio aparece em dois sentidos.

### Repositorios tecnicos

Sao os modulos reais do codigo:

- frontend
- API
- dominio
- aplicacao
- infraestrutura
- contratos
- documentacao

### Repositorios institucionais

Sao os acervos logicos que o produto representa:

- legislacao vigente
- propostas legislativas
- emendas
- pareceres
- participacao social
- publicacoes oficiais

Recomendacao:

- no codigo, usar monorepo tecnico
- no produto, modelar multiplos repositorios legislativos logicos

## Leitura estrategica

O enquadramento tecnico mais preciso do projeto hoje e:

> GitLaw e um motor alpha de tramitacao legislativa versionada, com arquitetura hibrida preparada para convergencia institucional on-chain.
