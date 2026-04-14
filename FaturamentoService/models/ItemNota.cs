using System.ComponentModel.DataAnnotations;

public class ItemNota
{
    public int Id { get; set; }

    [Required]
    public int ProdutoId { get; set; }

    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "A quantidade deve ser maior que zero.")]
    public int Quantidade { get; set; }

    [Required]
    public int NotaFiscalId { get; set; } // relação tratada pelo ef
    public NotaFiscal NotaFiscal { get; set; }

    public ItemNota() { }
    public ItemNota(int produtoId, int quantidade)
    {
        ProdutoId = produtoId;
        Quantidade = quantidade;
    }
}