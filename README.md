# Sistema de Emissão de Notas Fiscais

Projeto desenvolvido como parte de um desafio técnico, com o objetivo de implementar um sistema completo de emissão de notas fiscais utilizando Angular no frontend e arquitetura de microsserviços no backend.

---

## Objetivo

Permitir o gerenciamento de produtos e a emissão de notas fiscais, garantindo:

- Controle de estoque
- Emissão de notas com múltiplos itens
- Atualização automática de saldo
- Tratamento de falhas entre serviços
- Boa experiência do usuário

---

## Arquitetura

O sistema foi estruturado seguindo o padrão de **microsserviços**, com separação clara de responsabilidades:

### EstoqueService
Responsável por:
- Cadastro de produtos
- Controle de saldo
- Atualização de estoque após faturamento

### FaturamentoService
Responsável por:
- Criação de notas fiscais
- Gerenciamento de status (Aberta / Fechada)
- Processamento de impressão
- Comunicação com o serviço de estoque

### Frontend (Angular)
Responsável por:
- Interface do usuário
- Consumo das APIs
- Tratamento global de erros
- Feedback visual (loading e mensagens)

---

## Tecnologias Utilizadas

### Frontend
- Angular (Standalone Components)
- RxJS (Observables e manipulação assíncrona)
- Signals (gerenciamento reativo de estado)
- HttpClient (requisições HTTP)
- CSS puro (estilização)

### Backend
- .NET (ASP.NET Core)
- Entity Framework Core (ORM para acesso ao banco de dados)
- API REST
- LINQ utilizado para consultas e manipulação de dados no backend
- Comunicação entre microsserviços via HTTP

### Banco de Dados
- SQLite

---

## Funcionalidades

### Cadastro de Produtos
- Código
- Descrição
- Saldo inicial
- Edição e exclusão

---

### Cadastro de Notas Fiscais
- Numeração sequencial
- Status (Aberta / Fechada)
- Múltiplos produtos por nota
- Controle de quantidade por item

---

### Impressão de Nota
- Exibe loading durante processamento
- Atualiza status para **Fechada**
- Atualiza saldo dos produtos
- Impede impressão de notas já fechadas

---

## Regras de Negócio

- Não é possível criar nota sem itens
- Não é possível imprimir nota já fechada
- O saldo dos produtos é atualizado após a impressão
- Itens duplicados são normalizados automaticamente
- Não é permitido saldo negativo

---

## Tratamento de Erros

Foi implementado um **HTTP Interceptor global**, responsável por:

- Capturar erros de requisições HTTP
- Traduzir códigos de erro (400, 404, 500, etc)
- Exibir mensagens amigáveis ao usuário

Exemplo:
- 400 → Dados inválidos
- 404 → Recurso não encontrado
- 500 → Erro interno do servidor

---

## Loading Global

Foi implementado um sistema de loading global utilizando:

- Interceptor HTTP
- Overlay visual com spinner
- Feedback durante operações assíncronas

---

## Uso de RxJS

- Utilizado para consumo de APIs via `HttpClient`
- Uso de `subscribe` para tratamento de respostas
- Integração com fluxo assíncrono do Angular

---

## Ciclo de Vida do Angular

- `ngOnInit` utilizado para carregamento inicial dos dados
- Separação clara entre inicialização e ações do usuário

---

## Estrutura do Projeto

/KorpFrontend (FrontEnd)
├── pages
├── services
├── models

/Microsserviços (BackEnd)
├── EstoqueService
├── FaturamentoService

---

## Como Executar o Projeto

### 1. Clonar repositório
```bash
git clone https://github.com/dev-kaio/Korp_Teste_KaioManfroDaSilva.git
```

## 2. Frontend
```bash
cd KorpFrontend
npm install
ng serve
```

## 3. Backend
# EstoqueService
```bash
cd EstoqueService
dotnet watch run
```

# FaturamentoService
```bash
cd FaturamentoService
dotnet watch run
```

---

## Cenário de Falha

O sistema foi preparado para lidar com falhas entre microsserviços.

Exemplo de cenário tratado:

- Falha no EstoqueService durante a impressão de uma nota
- O FaturamentoService não consegue concluir a operação
- O erro é propagado para o frontend
- O interceptor captura e exibe mensagem ao usuário

---

## Diferenciais Implementados

- Arquitetura em microsserviços
- Tratamento global de erros
- Loading global via interceptor
- Uso de Angular moderno (Signals)
- Separação de responsabilidades (UI vs lógica)
- Normalização de itens para evitar inconsistência

---

### Autor
Desenvolvido por Kaio Manfro da Silva

---

## Considerações Finais

O projeto foi desenvolvido com foco em boas práticas de arquitetura, separação de responsabilidades e experiência do usuário, buscando simular um cenário real de aplicação corporativa.
