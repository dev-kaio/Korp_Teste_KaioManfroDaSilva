import { ItemNota } from './itemNota';

export interface NotaDTO {
  status: 'Aberta' | 'Fechada';
  itens: ItemNota[];
}