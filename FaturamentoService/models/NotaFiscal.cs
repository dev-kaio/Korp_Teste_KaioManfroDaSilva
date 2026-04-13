using System.ComponentModel.DataAnnotations;

public class NotaFiscal
{
    public int Id { get; set; }

    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "O número da nota fiscal deve ser maior que zero.")]
    public int Numero { get; set; }

    [Required]
    public string Status { get; set; } = "Aberta";

    // inicialização para evitar null (n precisa de required por isso), precisa de verificação no controller p garantir q n venha vazia
    public List<ItemNota> Itens { get; set; } = new();
    public NotaFiscal() { }
    public NotaFiscal(int numero, string status)
    {
        Numero = numero;
        Status = "Aberta";
    }
}