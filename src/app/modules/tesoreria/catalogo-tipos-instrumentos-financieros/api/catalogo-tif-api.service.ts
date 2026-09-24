import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { APP_CONFIG } from '../../../../core/config/app.config';
import { CatalogoTifRegistro, TipoInstrumentoFinancieroDatos } from '../models/catalogo-tif.model';

/**
 * Endpoints propios del proceso. En el taller los responde el backend simulado
 * (`src/app/mock/mock-backend.interceptor.ts`); con un backend real serían las mismas URLs.
 */
@Injectable({ providedIn: 'root' })
export class CatalogoTifApiService {
  private readonly http = inject(HttpClient);
  private readonly base = APP_CONFIG.api.baseUrl;

  /** Guarda (o reemplaza) la lista de tipos de instrumento financiero de la solicitud. */
  guardarDetalle(solicitudId: string, tipos: TipoInstrumentoFinancieroDatos[]): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/solicitudes/${solicitudId}/catalogo-tif`, { tipos });
  }

  /** Tipos de instrumento financiero aprobados: pestaña Registros y consulta. */
  listarRegistros(): Observable<CatalogoTifRegistro[]> {
    return this.http.get<CatalogoTifRegistro[]>(`${this.base}/catalogo-tipos-instrumentos-financieros`);
  }
}
