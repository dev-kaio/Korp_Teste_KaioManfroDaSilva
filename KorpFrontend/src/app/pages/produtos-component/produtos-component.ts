import { Component, OnInit, signal } from '@angular/core';
import { Api } from '../../services/api';
import { Produto } from '../../models/produto';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-produtos-component',
  imports: [CommonModule, FormsModule],
  templateUrl: './produtos-component.html',
  standalone: true,
  styleUrl: './produtos-component.css',
})
export class ProdutosComponent implements OnInit {
  produtos = signal<Produto[]>([]);

  mensagemErro = '';
  mostrar = false;
  carregando = false;

  novoProduto: Produto = {
    codigo: '',
    descricao: '',
    saldo: 1,
  };

  produtoEditando: Produto | null = null;
  produtoEditado: Produto = {
    codigo: '',
    descricao: '',
    saldo: 0,
  };

  constructor(private api: Api) {}

  ngOnInit() {
    this.carregarProdutos();
  }

  carregarProdutos() {
    this.api.getProdutos().subscribe((res) => {
      this.produtos.set(res);
    });
  }

  criarProduto() {
    if (this.novoProduto.saldo <= 0) {
      this.mostrarErro('Saldo deve ser maior que 0!');
      return;
    }

    if (!this.novoProduto.codigo || !this.novoProduto.descricao) {
      this.mostrarErro('Preencha código e descrição!');
      return;
    }

    this.carregando = true;

    this.api.criarProduto(this.novoProduto).subscribe({
      next: () => {
        this.carregarProdutos();
        this.novoProduto = {
          codigo: '',
          descricao: '',
          saldo: 1,
        };
      },
      complete: () => {
        this.carregando = false;
      },
    });
  }

  iniciarEdicao(produto: Produto) {
    this.produtoEditando = produto;
    this.produtoEditado = { ...produto };
  }

  cancelarEdicao() {
    this.produtoEditando = null;
    this.produtoEditado = {
      codigo: '',
      descricao: '',
      saldo: 0,
    };
  }

  salvarEdicao() {
    if (!this.produtoEditando?.id) return;

    if (this.produtoEditado.saldo <= 0) {
      this.mostrarErro('Saldo deve ser maior que 0!');
      return;
    }

    if (!this.produtoEditado.codigo || !this.produtoEditado.descricao) {
      this.mostrarErro('Preencha código e descrição!');
      return;
    }

    this.carregando = true;

    this.api.atualizarProduto(this.produtoEditando.id, this.produtoEditado).subscribe({
      next: () => {
        this.carregarProdutos();
        this.cancelarEdicao();
      },
      complete: () => {
        this.carregando = false;
      },
    });
  }

  excluirProduto(id: number, descricao: string) {
    if (!confirm(`Excluir "${descricao}"?`)) return;

    this.carregando = true;

    this.api.excluirProduto(id).subscribe({
      next: () => {
        this.carregarProdutos();
      },
      complete: () => {
        this.carregando = false;
      },
    });
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
