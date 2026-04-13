using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/notas")]
public class NotasController : ControllerBase
{
    public readonly AppDbContext _context;
    public NotasController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetNotas()
    {
        var notas = await _context.Notas.Include(n => n.Itens).ToListAsync();
        return Ok(notas);
    }


    [HttpGet("{id}")]
    public async Task<IActionResult> GetNotaById(int id)
    {
        var existe = await _context.Notas.Include(n => n.Itens).FirstOrDefaultAsync(n => n.Id == id);
        if (existe == null) return NotFound();

        return Ok(existe);
    }

    [HttpPost]
    public async Task<IActionResult> CriarNota(NotaFiscal nota)
    {
        if (nota.Itens == null || !nota.Itens.Any()) return BadRequest("A nota deve ter pelo menos um item");

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

        if (nota == null) return NotFound();

        if (nota.Status != "Aberta") return BadRequest("Nota já foi fechada");

        // HttpClientFactory seria melhor
        var client = new HttpClient();

        try
        {
            foreach (var item in nota.Itens)
            {
                // get no microsserviço de estoque p ver se existe o produto
                var getResponse = await client.GetAsync($"http://localhost:3000/api/produtos/{item.ProdutoId}");

                if (!getResponse.IsSuccessStatusCode) throw new Exception("Erro ao consultar estoque");

                var produtoJson = await getResponse.Content.ReadAsStringAsync(); // htpp como string
                var produto = System.Text.Json.JsonSerializer.Deserialize<Produto>(produtoJson, new System.Text.Json.JsonSerializerOptions // "quebra" a string p um objeto
                {
                    PropertyNameCaseInsensitive = true // ignora maiúsculas/minúsculas, importante pq o json do json-server vem com a primeira letra minuscula
                }) ?? throw new Exception("Erro ao desserializar produto");

                // validar saldo
                if (produto.Saldo < item.Quantidade) return BadRequest($"Produto de código {produto.Codigo} sem saldo suficiente");

                // atualizar saldo
                produto.Saldo -= item.Quantidade;
                var JsonContent = new StringContent(System.Text.Json.JsonSerializer.Serialize(produto), // objeto p json
                    System.Text.Encoding.UTF8, "application/json");

                var putResponse = await client.PutAsync($"http://localhost:3000/api/produtos/{item.ProdutoId}", JsonContent);
                if (!putResponse.IsSuccessStatusCode) throw new Exception("Erro ao atualizar estoque");
            }

            nota.Status = "Fechada";
            await _context.SaveChangesAsync();

            return Ok("Nota impressa com sucesso");
        }
        catch (Exception e)
        {
            return StatusCode(500, $"Erro ao imprimir nota: {e.Message}");
        }
    }
}