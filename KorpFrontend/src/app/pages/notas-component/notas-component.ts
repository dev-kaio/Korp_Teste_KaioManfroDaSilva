import { Component, OnInit, signal } from '@angular/core';
import { Api } from '../../services/api';
import { Nota } from '../../models/nota';
import { ItemNota } from '../../models/itemNota';
import { Produto } from '../../models/produto';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotaDTO } from '../../models/NotaDTO';

@Component({
  selector: 'app-notas-component',
  imports: [CommonModule, FormsModule],
  standalone: true,
  templateUrl: './notas-component.html',
  styleUrl: './notas-component.css',
})
export class NotasComponent implements OnInit {
  notas = signal<Nota[]>([]);
  produtos = signal<Produto[]>([]);

  notasExpandidas = new Set<number>();

  produtoSelecionadoId: number = 0;
  quantidadeSelecionada: number = 1;

  produtoSelecionadoEditId: number = 0;
  quantidadeSelecionadaEdit: number = 1;

  novaNota: NotaDTO = {
    status: 'Aberta',
    itens: [],
  };

  notaEditando: Nota | null = null;
  itensEditados: ItemNota[] = [];

  constructor(private api: Api) {}

  ngOnInit() {
    this.carregarNotas();
    this.carregarProdutos();
  }

  carregarNotas() {
    this.api.getNotas().subscribe((res) => {
      this.notas.set(res);
    });
  }

  carregarProdutos() {
    this.api.getProdutos().subscribe((res) => {
      this.produtos.set(res);
    });
  }

  // Expansão de notas
  toggleNotaExpandida(notaId: number) {
    if (this.notasExpandidas.has(notaId)) {
      this.notasExpandidas.delete(notaId);
    } else {
      this.notasExpandidas.add(notaId);
    }
  }

  isNotaExpandida(notaId: number): boolean {
    return this.notasExpandidas.has(notaId);
  }

  adicionarItem() {
    if (this.produtoSelecionadoId && this.quantidadeSelecionada > 0) {
      const itemExistente = this.novaNota.itens.find(
        (item) => item.produtoId === this.produtoSelecionadoId,
      );

      if (itemExistente) {
        itemExistente.quantidade += this.quantidadeSelecionada;
      } else {
        this.novaNota.itens.push({
          produtoId: this.produtoSelecionadoId,
          quantidade: this.quantidadeSelecionada,
        });
      }

      this.produtoSelecionadoId = 0;
      this.quantidadeSelecionada = 1;
    } else {
      alert('Selecione um produto e uma quantidade válida!');
    }
  }

  removerItem(index: number) {
    this.novaNota.itens.splice(index, 1);
  }

  criarNota() {
    if (this.novaNota.itens.length === 0) {
      alert('Adicione pelo menos um produto à nota!');
      return;
    }

    this.api.criarNota(this.novaNota).subscribe({
      next: () => {
        alert('Nota fiscal criada com sucesso!');
        this.carregarNotas();
        this.novaNota = {
          status: 'Aberta',
          itens: [],
        };
      },
    });
  }

  // Editar nota (remover/alterar itens)

  iniciarEdicaoNota(nota: Nota) {
    this.notaEditando = nota;
    // fazer copia  dos itens
    this.itensEditados = nota.itens.map((item) => ({ ...item }));
  }

  cancelarEdicaoNota() {
    this.notaEditando = null;
    this.itensEditados = [];
  }

  removerItemEditado(index: number) {
    this.itensEditados.splice(index, 1);
  }

  alterarQuantidadeItem(index: number, novaQuantidade: number) {
    if (novaQuantidade > 0) {
      this.itensEditados[index].quantidade = novaQuantidade;
    }
  }

  adicionarItemEditado() {
    if (this.produtoSelecionadoEditId && this.quantidadeSelecionadaEdit > 0) {
      const itemExistente = this.itensEditados.find(
        (item) => item.produtoId === this.produtoSelecionadoEditId,
      );

      if (itemExistente) {
        itemExistente.quantidade += this.quantidadeSelecionadaEdit;
      } else {
        this.itensEditados.push({
          produtoId: this.produtoSelecionadoEditId,
          quantidade: this.quantidadeSelecionadaEdit,
        });
      }

      this.produtoSelecionadoEditId = 0;
      this.quantidadeSelecionadaEdit = 1;
    } else {
      alert('Selecione um produto e uma quantidade válida!');
    }
  }

  salvarEdicaoNota() {
    if (!this.notaEditando || !this.notaEditando.id) return;

    if (this.itensEditados.length === 0) {
      alert('A nota deve ter pelo menos um item!');
      return;
    }

    const itensNormalizados = this.normalizarItens(this.itensEditados);

    const notaAtualizada: Nota = {
      ...this.notaEditando,
      itens: itensNormalizados,
    };

    this.api.atualizarNota(notaAtualizada).subscribe({
      next: () => {
        alert('Nota atualizada com sucesso!');
        this.carregarNotas();
        this.cancelarEdicaoNota();
        if (this.notaEditando) {
          this.notasExpandidas.delete(this.notaEditando.id!);
        }
      },
    });
  }

  // juntar itens quando sao adicionados em nota ja criada
  normalizarItens(itens: ItemNota[]): ItemNota[] {
    const mapa = new Map<number, number>();

    for (const item of itens) {
      const atual = mapa.get(item.produtoId) || 0;
      mapa.set(item.produtoId, atual + item.quantidade);
    }

    return Array.from(mapa.entries()).map(([produtoId, quantidade]) => ({
      produtoId,
      quantidade,
    }));
  }

  // Impressão
  imprimirNota(id: number) {
    this.api.imprimirNota(id).subscribe({
      next: () => {
        alert('Nota impressa com sucesso! Status atualizado para Fechada.');
        this.carregarNotas();
      },
    });
  }

  // Helpers
  getProdutoDescricao(produtoId: number): string {
    const produto = this.produtos().find((p) => p.id === produtoId);
    return produto ? produto.descricao : `Produto ${produtoId}`;
  }
}
