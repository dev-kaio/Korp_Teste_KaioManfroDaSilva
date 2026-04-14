public class NotaResponse
{
    public int Id { get; set; }
    public int Numero { get; set; }
    public string? Status { get; set; }
    public List<ItemNotaResponse>? Itens { get; set; }
}