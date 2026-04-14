import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  console.log(`HTTP Request: ${req.method} ${req.url}`);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.error instanceof ErrorEvent) {
        console.error('Client Error:', error.error.message);
        alert(`Erro de conexão: ${error.error.message}`);
      } else {
        console.error(`Server Error:`, {
          status: error.status,
          message: error.message,
          details: error.error,
        });

        switch (error.status) {
          case 0:
            alert('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
            break;
          case 400:
            alert(`Dados inválidos: ${error.error?.message || 'Verifique os campos preenchidos'}`);
            break;
          case 404:
            alert(`Recurso não encontrado: ${error.error?.message || 'Verifique a URL'}`);
            break;
          case 409:
            alert(`Conflito: ${error.error?.message || 'Já existe um registro com esses dados'}`);
            break;
          case 422:
            alert(`Não processado: ${error.error?.message || 'Saldo insuficiente'}`);
            break;
          case 500:
            alert(`Erro interno do servidor. Tente novamente mais tarde.`);
            break;
          default:
            alert(`Erro ${error.status}: ${error.error?.message || 'Algo deu errado'}`);
        }
      }

      // lança o erro novamente p o component
      return throwError(() => error);
    }),
  );
};
