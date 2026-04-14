import { ItemNota } from './itemNota';

export interface Nota {
  id?: number;
  numero: number;
  status: 'Aberta' | 'Fechada';
  itens: ItemNota[];
}
