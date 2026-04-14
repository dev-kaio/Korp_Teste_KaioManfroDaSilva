using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Net.Http;

[ApiController]
[Route("api/notas")]
public class NotasController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly HttpClient _httpClient;

    public NotasController(AppDbContext context, IHttpClientFactory httpClientFactory)
    {
        _context = context;
        _httpClient = httpClientFactory.CreateClient();
    }

    [HttpGet]
    public async Task<IActionResult> GetNotas()
    {
        var notas = await _context.Notas
            .Include(n => n.Itens)
            .ToListAsync();

        var notasResponse = new List<NotaResponse>();

        foreach (var nota in notas)
        {
            var itens = new List<ItemNotaResponse>();

            foreach (var item in nota.Itens)
            {
                var response = await _httpClient.GetAsync(
                    $"http://localhost:3000/api/produtos/{item.ProdutoId}");

                var produtoJson = await response.Content.ReadAsStringAsync();

                var produto = System.Text.Json.JsonSerializer.Deserialize<Produto>(produtoJson,
                    new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                itens.Add(new ItemNotaResponse
                {
                    ProdutoId = item.ProdutoId,
                    Quantidade = item.Quantidade,
                    Descricao = produto?.Descricao ?? "Desconhecido"
                });
            }

            notasResponse.Add(new NotaResponse
            {
                Id = nota.Id,
                Numero = nota.Numero,
                Status = nota.Status,
                Itens = itens
            });
        }

        return Ok(notasResponse);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetNotaById(int id)
    {
        var nota = await _context.Notas
            .Include(n => n.Itens)
            .FirstOrDefaultAsync(n => n.Id == id);

        if (nota == null)
            return NotFound(new { erro = "Nota não encontrada" });

        return Ok(nota);
    }

    [HttpPost]
    public async Task<IActionResult> CriarNota(NotaFiscal nota)
    {
        if (nota.Itens == null || !nota.Itens.Any())
            return BadRequest(new { erro = "A nota deve ter pelo menos um item" });

        var ultimoNumero = await _context.Notas.MaxAsync(n => (int?)n.Numero) ?? 0;
        nota.Numero = ultimoNumero + 1;

        nota.Status = "Aberta";

        _context.Notas.Add(nota);
        await _context.SaveChangesAsync();

        foreach (var item in nota.Itens)
        {
            item.NotaFiscalId = nota.Id;
        }

        return CreatedAtAction(nameof(GetNotaById), new { id = nota.Id }, nota);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> AtualizarNota(int id, NotaFiscal notaAtualizada)
    {
        var nota = await _context.Notas
            .Include(n => n.Itens)
            .FirstOrDefaultAsync(n => n.Id == id);

        if (nota == null)
            return NotFound(new { erro = "Nota não encontrada" });

        if (nota.Status != "Aberta")
            return BadRequest(new { erro = "Não é possível alterar uma nota fechada" });

        if (notaAtualizada.Itens == null || !notaAtualizada.Itens.Any())
            return BadRequest(new { erro = "A nota deve ter pelo menos um item" });

        _context.Itens.RemoveRange(nota.Itens);

        var novosItens = notaAtualizada.Itens.Select(i => new ItemNota
        {
            ProdutoId = i.ProdutoId,
            Quantidade = i.Quantidade,
            NotaFiscalId = nota.Id
        }).ToList();

        await _context.Itens.AddRangeAsync(novosItens);

        nota.Itens = novosItens;

        await _context.SaveChangesAsync();

        return Ok(nota);
    }

    [HttpDelete("{id}/itens/{itemId}")]
    public async Task<IActionResult> RemoverItem(int id, int itemId)
    {
        var nota = await _context.Notas
            .Include(n => n.Itens)
            .FirstOrDefaultAsync(n => n.Id == id);

        if (nota == null)
            return NotFound(new { erro = "Nota não encontrada" });

        if (nota.Status != "Aberta")
            return BadRequest(new { erro = "Não é possível alterar uma nota fechada" });

        var item = nota.Itens.FirstOrDefault(i => i.Id == itemId);

        if (item == null)
            return NotFound(new { erro = "Item não encontrado" });

        _context.Itens.Remove(item);

        await _context.SaveChangesAsync();

        return Ok(nota);
    }


    [HttpPost("{id}/imprimir")]
    public async Task<IActionResult> Imprimir(int id)
    {
        var nota = await _context.Notas
            .Include(n => n.Itens)
            .FirstOrDefaultAsync(n => n.Id == id);

        if (nota == null)
            return NotFound(new { erro = "Nota não encontrada" });

        if (nota.Status != "Aberta")
            return BadRequest(new { erro = "Nota já foi fechada" });

        using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            foreach (var item in nota.Itens)
            {
                var getResponse = await _httpClient.GetAsync(
                    $"http://localhost:3000/api/produtos/{item.ProdutoId}");

                if (!getResponse.IsSuccessStatusCode)
                    throw new Exception("Erro ao consultar estoque");

                var produtoJson = await getResponse.Content.ReadAsStringAsync();

                var produto = System.Text.Json.JsonSerializer.Deserialize<Produto>(
                    produtoJson,
                    new System.Text.Json.JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    }
                ) ?? throw new Exception("Erro ao desserializar produto");

                if (produto.Saldo < item.Quantidade)
                    return BadRequest(new
                    {
                        erro = $"Produto {produto.Codigo} sem saldo suficiente"
                    });

                produto.Saldo -= item.Quantidade;

                var jsonContent = new StringContent(
                    System.Text.Json.JsonSerializer.Serialize(produto),
                    System.Text.Encoding.UTF8,
                    "application/json"
                );

                var putResponse = await _httpClient.PutAsync(
                    $"http://localhost:3000/api/produtos/{item.ProdutoId}",
                    jsonContent
                );

                if (!putResponse.IsSuccessStatusCode)
                    throw new Exception("Erro ao atualizar estoque");
            }

            nota.Status = "Fechada";
            await _context.SaveChangesAsync();

            await transaction.CommitAsync();

            return Ok(new { mensagem = "Nota impressa com sucesso" });
        }
        catch (Exception)
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}