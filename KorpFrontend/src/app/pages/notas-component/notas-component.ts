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

  mostrar = false;
  mensagemErro = '';
  carregando = false;

  notasExpandidas = new Set<number>();

  produtoSelecionadoId = 0;
  quantidadeSelecionada = 1;

  produtoSelecionadoEditId = 0;
  quantidadeSelecionadaEdit = 1;

  novaNota: NotaDTO = {
    status: 'Aberta',
    itens: [],
  };

  notaEditando: Nota | null = null;
  itensEditados: ItemNota[] = [];

  constructor(private api: Api) {}

  ngOnInit() {
    this.api.getProdutos().subscribe((produtos) => {
      this.produtos.set(produtos);

      this.api.getNotas().subscribe((notas) => {
        this.notas.set(notas);
      });
    });
  }

  carregarNotas() {
    this.api.getNotas().subscribe((res) => {
      this.notas.set(res);
    });
  }

  toggleNotaExpandida(notaId: number) {
    this.notasExpandidas.has(notaId)
      ? this.notasExpandidas.delete(notaId)
      : this.notasExpandidas.add(notaId);
  }

  isNotaExpandida(notaId: number) {
    return this.notasExpandidas.has(notaId);
  }

  adicionarOuSomarItem(lista: ItemNota[], produtoId: number, quantidade: number) {
    const itemExistente = lista.find((item) => item.produtoId === produtoId);

    if (itemExistente) {
      itemExistente.quantidade += quantidade;
    } else {
      lista.push({ produtoId, quantidade });
    }
  }

  normalizarItens(itens: ItemNota[]): ItemNota[] {
    const mapa = new Map<number, number>();

    for (const item of itens) {
      mapa.set(item.produtoId, (mapa.get(item.produtoId) || 0) + item.quantidade);
    }

    return Array.from(mapa.entries()).map(([produtoId, quantidade]) => ({
      produtoId,
      quantidade,
    }));
  }

  adicionarItem() {
    if (!this.produtoSelecionadoId || this.quantidadeSelecionada <= 0) {
      this.mostrarErro('Selecione um produto e uma quantidade válida!');
      return;
    }

    this.adicionarOuSomarItem(
      this.novaNota.itens,
      this.produtoSelecionadoId,
      this.quantidadeSelecionada,
    );

    this.produtoSelecionadoId = 0;
    this.quantidadeSelecionada = 1;
  }

  removerItem(index: number) {
    this.novaNota.itens.splice(index, 1);
  }

  criarNota() {
    if (!this.novaNota.itens.length) {
      this.mostrarErro('Adicione pelo menos um produto à nota!');
      return;
    }

    const itensNormalizados = this.normalizarItens(this.novaNota.itens);

    this.api.criarNota({ ...this.novaNota, itens: itensNormalizados }).subscribe({
      next: () => {
        this.carregarNotas();
        this.novaNota = { status: 'Aberta', itens: [] };
      },
    });
  }

  iniciarEdicaoNota(nota: Nota) {
    this.notaEditando = nota;
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
    if (!this.produtoSelecionadoEditId || this.quantidadeSelecionadaEdit <= 0) {
      this.mostrarErro('Selecione um produto e uma quantidade válida!');
      return;
    }

    this.adicionarOuSomarItem(
      this.itensEditados,
      this.produtoSelecionadoEditId,
      this.quantidadeSelecionadaEdit,
    );

    this.produtoSelecionadoEditId = 0;
    this.quantidadeSelecionadaEdit = 1;
  }

  salvarEdicaoNota() {
    if (!this.notaEditando?.id) return;

    if (!this.itensEditados.length) {
      this.mostrarErro('A nota deve ter pelo menos um item!');
      return;
    }

    const itensNormalizados = this.normalizarItens(this.itensEditados);

    const notaAtualizada: Nota = {
      ...this.notaEditando,
      itens: itensNormalizados,
    };

    this.api.atualizarNota(notaAtualizada).subscribe({
      next: () => {
        this.carregarNotas();
        this.cancelarEdicaoNota();
        this.notasExpandidas.delete(this.notaEditando!.id!);
      },
    });
  }

  imprimirNota(id: number) {
    this.api.imprimirNota(id).subscribe({
      next: () => {
        this.carregarNotas();
      },
    });
  }

  getProdutoDescricao(produtoId: number): string {
    const produto = this.produtos().find((p) => p.id === produtoId);
    return produto ? produto.descricao : `Produto ${produtoId}`;
  }

  mostrarErro(msg: string, duracao = 3000) {
    this.mensagemErro = msg;
    this.mostrar = true;

    setTimeout(() => {
      this.mensagemErro = '';
      this.mostrar = false;
    }, duracao);
  }
}
