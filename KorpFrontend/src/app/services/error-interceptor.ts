import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, finalize } from 'rxjs';
import { LoadingService } from '../services/loading';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const loading = inject(LoadingService);

  loading.show();

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('Erro HTTP:', error);

      const message = getErrorMessage(error);
      alert(message);

      return throwError(() => error);
    }),

    finalize(() => {
      loading.hide();
    }),
  );
};

function getErrorMessage(error: HttpErrorResponse): string {
  switch (error.status) {
    case 0:
      return 'Servidor indisponível.';
    case 400:
      return error.error?.erro || 'Dados inválidos.';
    case 404:
      return 'Recurso não encontrado.';
    case 409:
      return 'Conflito de dados.';
    case 422:
      return 'Regra de negócio inválida (ex: saldo insuficiente).';
    case 500:
      return 'Erro interno do servidor.';
    default:
      return 'Erro inesperado.';
  }
}
