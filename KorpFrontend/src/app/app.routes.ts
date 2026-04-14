import { Routes } from '@angular/router';
import { NotasComponent } from './pages/notas-component/notas-component';
import { ProdutosComponent } from './pages/produtos-component/produtos-component';

export const routes: Routes = [
  { path: 'produtos', component: ProdutosComponent },
  { path: 'notas', component: NotasComponent },
  { path: '', redirectTo: 'produtos', pathMatch: 'full' },
];
