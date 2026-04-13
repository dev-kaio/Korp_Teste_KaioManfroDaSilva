using Microsoft.EntityFrameworkCore;

public class AppDbContext : DbContext
{
    public DbSet<NotaFiscal> Notas { get; set; }
    public DbSet<ItemNota> Itens { get; set; }

    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }
}