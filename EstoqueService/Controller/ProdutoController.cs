using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/produtos")]
public class ProdutoController : ControllerBase
{
    private readonly AppDbContext _context;

    public ProdutoController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var produtos = await _context.Produtos.ToListAsync();
        return Ok(produtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Produto>> GetById(int id)
    {
        var produto = await _context.Produtos.FindAsync(id);
        if (produto == null) return NotFound(new { erro = "Produto não encontrado" });

        return Ok(produto);
    }

    [HttpGet("codigo/{codigo}")]
    public async Task<ActionResult<Produto>> GetByCodigo(string codigo)
    {
        var produto = await _context.Produtos.FirstOrDefaultAsync(p => p.Codigo == codigo);
        if (produto == null) return NotFound(new { erro = "Produto não encontrado" });

        return Ok(produto);
    }

    [HttpPost]
    public async Task<IActionResult> Post(Produto produto)
    {
        var jaExiste = await _context.Produtos.AnyAsync(p => p.Codigo == produto.Codigo);
        if (jaExiste) return BadRequest(new { erro = "Código já existe" });

        if (produto.Saldo < 0)
            return BadRequest(new { erro = "Saldo não pode ser negativo" });

        _context.Produtos.Add(produto);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = produto.Id }, produto);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutById(int id, Produto produto)
    {
        var existe = await _context.Produtos.FindAsync(id);
        if (existe == null) return NotFound(new { erro = "Produto não encontrado" });

        var codigoDuplicado = await _context.Produtos
            .AnyAsync(p => p.Codigo == produto.Codigo && p.Id != id);

        if (codigoDuplicado)
            return BadRequest(new { erro = "Código já existe" });

        if (produto.Saldo < 0)
            return BadRequest(new { erro = "Saldo não pode ser negativo" });

        existe.Codigo = produto.Codigo;
        existe.Descricao = produto.Descricao;
        existe.Saldo = produto.Saldo;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPut("codigo/{codigo}")]
    public async Task<IActionResult> PutByCodigo(string codigo, Produto produto)
    {
        var existe = await _context.Produtos
            .FirstOrDefaultAsync(p => p.Codigo == codigo);

        if (existe == null)
            return NotFound(new { erro = "Produto não encontrado" });

        var codigoDuplicado = await _context.Produtos
            .AnyAsync(p => p.Codigo == produto.Codigo && p.Id != existe.Id);

        if (codigoDuplicado)
            return BadRequest(new { erro = "Código já existe" });

        if (produto.Saldo < 0)
            return BadRequest(new { erro = "Saldo não pode ser negativo" });

        existe.Codigo = produto.Codigo;
        existe.Descricao = produto.Descricao;
        existe.Saldo = produto.Saldo;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var produto = await _context.Produtos.FindAsync(id);
        if (produto == null)
            return NotFound(new { erro = "Produto não encontrado" });

        _context.Produtos.Remove(produto);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}