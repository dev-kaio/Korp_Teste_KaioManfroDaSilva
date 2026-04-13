using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text;
using System.Text.Json;

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

        return Ok(notas);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetNotaById(int id)
    {
        var nota = await _context.Notas
            .Include(n => n.Itens)
            .FirstOrDefaultAsync(n => n.Id == id);

        if (nota == null)
            return NotFound();

        return Ok(nota);
    }

    [HttpPost]
    public async Task<IActionResult> CriarNota(NotaFiscal nota)
    {
        if (nota.Itens == null || !nota.Itens.Any())
            return BadRequest("A nota deve ter pelo menos um item");

        // tratando numeracao sequencial
        var ultimoNumero = await _context.Notas
            .Select(n => n.Numero)
            .DefaultIfEmpty(0)
            .MaxAsync();

        nota.Numero = ultimoNumero + 1;
        nota.Status = "Aberta";

        _context.Notas.Add(nota);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetNotaById), new { id = nota.Id }, nota);
    }

    [HttpPost("{id}/imprimir")]
    public async Task<IActionResult> Imprimir(int id)
    {
        var nota = await _context.Notas
            .Include(n => n.Itens)
            .FirstOrDefaultAsync(n => n.Id == id);

        if (nota == null)
            return NotFound();

        if (nota.Status != "Aberta")
            return BadRequest("Nota já foi fechada");

        try
        {
            foreach (var item in nota.Itens)
            {
                var getResponse = await _httpClient.GetAsync(
                    $"http://localhost:3000/api/produtos/{item.ProdutoId}"
                );

                if (!getResponse.IsSuccessStatusCode)
                    return StatusCode(500, "Erro ao consultar produto no estoque");

                var produtoJson = await getResponse.Content.ReadAsStringAsync();

                var produto = JsonSerializer.Deserialize<Produto>(produtoJson, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (produto == null)
                    return StatusCode(500, "Erro ao desserializar produto");

                // tratamento de saldo
                if (produto.Saldo < item.Quantidade)
                {
                    return BadRequest($"Produto {produto.Codigo} sem saldo suficiente");
                }

                produto.Saldo -= item.Quantidade;

                var content = new StringContent(
                    JsonSerializer.Serialize(produto),
                    Encoding.UTF8,
                    "application/json"
                );

                var putResponse = await _httpClient.PutAsync(
                    $"http://localhost:3000/api/produtos/{item.ProdutoId}",
                    content
                );

                if (!putResponse.IsSuccessStatusCode)
                    return StatusCode(500, "Erro ao atualizar estoque");
            }

            nota.Status = "Fechada";
            await _context.SaveChangesAsync();

            return Ok(new { mensagem = "Nota impressa com sucesso" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                mensagem = "Erro ao comunicar com o serviço de estoque",
                detalhe = ex.Message
            });
        }
    }
}