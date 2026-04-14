import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Produto } from '../models/produto';
import { Nota } from '../models/nota';

@Injectable({
  providedIn: 'root',
})
export class Api {
  constructor(private http: HttpClient) {}

  getProdutos() {
    return this.http.get<Produto[]>('http://localhost:3000/api/produtos');
  }

  criarProduto(produto: Produto) {
    return this.http.post<Produto>('http://localhost:3000/api/produtos', produto);
  }

  atualizarProduto(id: number, produto: Produto) {
    return this.http.put<Produto>(`http://localhost:3000/api/produtos/${id}`, produto);
  }

  excluirProduto(id: number) {
    return this.http.delete(`http://localhost:3000/api/produtos/${id}`);
  }

  // ROTAS DE NOTAS

  getNotas() {
    return this.http.get<Nota[]>('http://localhost:5046/api/notas');
  }

  criarNota(nota: Nota) {
    return this.http.post<Nota>('http://localhost:5046/api/notas', nota);
  }

  atualizarNota(nota: Nota) {
    return this.http.put<Nota>(`http://localhost:5046/api/notas/${nota.id}`, nota);
  }

  imprimirNota(id: number) {
    return this.http.post<Nota>(`http://localhost:5046/api/notas/${id}/imprimir`, {});
  }
}
