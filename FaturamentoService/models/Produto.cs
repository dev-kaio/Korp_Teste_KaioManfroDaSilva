using System.ComponentModel.DataAnnotations;

public class Produto
{
    public int Id { get; set; } // pk
    [Required]
    [MinLength(1)]
    public string Codigo { get; set; }
    [Required]
    public string Descricao { get; set; } // nome do produto
    [Required]
    [Range(0, int.MaxValue)]
    public int Saldo { get; set; } // qtde disponível em estoque
    public Produto() { }
}