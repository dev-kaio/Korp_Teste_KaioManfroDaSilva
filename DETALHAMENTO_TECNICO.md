# Sistema de Emissão de Notas Fiscais

## Descrição

Sistema desenvolvido com arquitetura de microsserviços para gerenciamento de estoque e emissão de notas fiscais. A aplicação simula um cenário corporativo real, com separação de responsabilidades, comunicação entre serviços e controle de consistência de dados.

---

## Arquitetura da Solução

A aplicação é composta por dois microsserviços independentes e um frontend desacoplado.

### EstoqueService

Responsável pela gestão de produtos:

* Cadastro de produtos
* Edição e exclusão
* Controle de saldo em estoque
* Validação de regras de negócio (saldo não negativo, código único)

### FaturamentoService

Responsável pelas notas fiscais:

* Criação de notas com numeração sequencial
* Gerenciamento de status (Aberta / Fechada)
* Inclusão e manipulação de itens
* Processamento de impressão
* Comunicação com o serviço de estoque para validação e atualização de saldo

### Frontend (Angular)

Responsável por:

* Interface do usuário
* Consumo das APIs REST
* Tratamento global de erros
* Feedback visual (loading e mensagens)

---

## Tecnologias Utilizadas

### Frontend

* Angular (Standalone Components)
* RxJS (Observables para fluxo assíncrono)
* Signals (gerenciamento reativo de estado)
* HttpClient (requisições HTTP)
* CSS puro

### Backend

* ASP.NET Core
* Entity Framework Core (ORM)
* LINQ (consultas e manipulação de dados)
* API REST
* HttpClient (comunicação entre microsserviços)

### Banco de Dados

* SQLite

---

## Componentes Visuais

Não foram utilizadas bibliotecas externas de UI (como Angular Material ou Bootstrap).

A interface foi construída com:

* HTML
* CSS puro

Motivos:

* Maior controle sobre o layout
* Redução de dependências externas
* Simplicidade adequada ao escopo do projeto

---

## Comunicação entre Microsserviços

A comunicação entre os serviços é feita via HTTP.

Exemplo de consulta de produto:

```bash
var response = await _httpClient.GetAsync(
   $"http://localhost:3000/api/produtos/{item.ProdutoId}");
```

Atualização de estoque:

```bash
var putResponse = await _httpClient.PutAsync(
   $"http://localhost:3000/api/produtos/{item.ProdutoId}",
   jsonContent
);
```

Vantagens:

* Baixo acoplamento
* Independência entre serviços
* Simulação de ambiente distribuído

---

## Fluxo de Impressão de Nota

1. Usuário solicita impressão no frontend
2. Frontend envia requisição ao FaturamentoService

Processo no backend:

* Busca a nota
* Verifica se está "Aberta"
* Para cada item:

  * Consulta estoque
  * Valida saldo
  * Atualiza produto
* Atualiza status para "Fechada"
* Commit da transação

---

## Transações e Consistência

Uso de transação para garantir integridade:

```bash
using var transaction = await _context.Database.BeginTransactionAsync();
```

Rollback em caso de erro:

```bash
await transaction.RollbackAsync();
```

Garantias:

* Consistência dos dados
* Evita estados parciais

---

## Tratamento de Erros

### Backend

Middleware global:

```bash
app.UseMiddleware<ErrorMiddleware>();
```

Exemplo:

```bash
catch (Exception ex)
{
   context.Response.StatusCode = 500;
   context.Response.ContentType = "application/json";

   var response = new
   {
       erro = "Erro interno no servidor",
       detalhe = ex.Message
   };
}
```

### Frontend

Interceptor HTTP global:

* Trata erros automaticamente
* Padroniza mensagens

Exemplos:

* 400 → Dados inválidos
* 404 → Recurso não encontrado
* 500 → Erro interno

---

## Loading Global

Implementado via interceptor:

* Ativa ao iniciar requisição
* Desativa ao finalizar
* Exibe spinner global

---

## Uso de RxJS

```bash
this.api.getProdutos().subscribe((res) => {
 this.produtos.set(res);
});
```

Permite lidar com:

* Sucesso
* Erro
* Finalização

---

## Gerenciamento de Estado (Signals)

```bash
produtos = signal<Produto[]>([]);
```

Atualização:

```bash
this.produtos.set(res);
```

---

## Ciclo de Vida do Angular

```bash
ngOnInit() {
 this.carregarProdutos();
}
```

---

## Uso de LINQ

```bash
var ultimoNumero = await _context.Notas
   .MaxAsync(n => (int?)n.Numero) ?? 0;
```

```bash
var codigoDuplicado = await _context.Produtos
   .AnyAsync(p => p.Codigo == produto.Codigo && p.Id != id);
```

---

## DTOs

```bash
public class NotaResponse
{
   public int Id { get; set; }
   public int Numero { get; set; }
   public string? Status { get; set; }
   public List<ItemNotaResponse>? Itens { get; set; }
}
```

---

## Regras de Negócio

* Nota deve conter pelo menos um item
* Não é permitido editar nota fechada
* Não é permitido imprimir nota fechada
* Produto não pode ter saldo negativo
* Código deve ser único
* Estoque atualizado na impressão

---

## Dependências

### .NET

* EntityFrameworkCore
* Sqlite
* Swashbuckle (Swagger)

---

## Configurações

* CORS habilitado
* Swagger disponível para testes

---

## Considerações Finais

Projeto desenvolvido com foco em:

* Arquitetura escalável
* Separação de responsabilidades
* Baixo acoplamento
* Tratamento de erros centralizado
* Boa experiência do usuário
