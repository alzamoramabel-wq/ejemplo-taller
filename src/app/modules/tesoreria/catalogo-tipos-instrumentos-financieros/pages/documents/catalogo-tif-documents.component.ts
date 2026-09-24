import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';

import { PermissionService } from '../../../../../core/auth/permission.service';
import { ESTADO } from '../../../../../core/models/documento.model';
import { SolicitudesFacadeService } from '../../../../../core/state/solicitudes-facade.service';
import { SolicitudesStateService } from '../../../../../core/state/solicitudes-state.service';
import { DocumentsRecordsPageComponent } from '../../../../../shared/components/documents-records-page/documents-records-page.component';
import type { DocumentsQuery, DocumentsRecordsConfig, DocumentsRecordsRow } from '../../../../../shared/types/documents-records.types';
import { createNewDocumentIdsSignal } from '../../../../../shared/utils/new-document-ids.util';
import { CatalogoTifApiService } from '../../api/catalogo-tif-api.service';
import { CATALOGO_TIF_DOCUMENTS_CONFIG } from '../../config/catalogo-tif-documents.config';
import { REQUEST_ROUTE } from '../../config/catalogo-tif.rutas';
import { CODIGO_DOCUMENTO, CatalogoTifRegistro, NOMBRE_DOCUMENTO } from '../../models/catalogo-tif.model';

/**
 * «Documentos y registros» del proceso. La pantalla entera la arma `siaf-documents-records-page`:
 * esta página solo carga la bandeja (documentos) y los tipos de instrumento aprobados (registros) y las pasa como filas.
 */
@Component({
  selector: 'siaf-catalogo-tif-documents',
  standalone: true,
  imports: [DocumentsRecordsPageComponent],
  template: `
    <siaf-documents-records-page
      [config]="pageConfig()"
      [loading]="cargando()"
      (documentsQueryChange)="onDocumentsQuery($event)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogoTifDocumentsComponent implements OnInit {
  private readonly solicitudesState = inject(SolicitudesStateService);
  private readonly solicitudesFacade = inject(SolicitudesFacadeService);
  private readonly permissions = inject(PermissionService);
  private readonly catalogoTifApi = inject(CatalogoTifApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly nuevos = createNewDocumentIdsSignal();

  private readonly registros = signal<CatalogoTifRegistro[]>([]);
  readonly cargando = signal(true);

  ngOnInit(): void {
    // Bandeja según el rol (el aprobador además refresca cada 30 s).
    this.solicitudesFacade.iniciarBandeja(this.permissions.currentRole(), this.destroyRef, [CODIGO_DOCUMENTO], { page: 1, limit: 10 });
    this.catalogoTifApi.listarRegistros().subscribe({
      next: (registros) => { this.registros.set(registros); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
  }

  /** Búsqueda y paginación de la pestaña Documentos (Enter, lupa o cambio de página). */
  onDocumentsQuery(q: DocumentsQuery): void {
    const query = { search: q.search, page: q.page, limit: q.limit };
    if (this.permissions.currentRole() === 'approver') this.solicitudesFacade.cargarBandejaAprobador([CODIGO_DOCUMENTO], query);
    else this.solicitudesFacade.cargarBandejaCreador([CODIGO_DOCUMENTO], query);
  }

  readonly pageConfig = computed((): DocumentsRecordsConfig => {
    const solicitudes = this.permissions.currentRole() === 'approver'
      ? this.solicitudesState.bandejaAprobador()
      : this.solicitudesState.bandejaCreador();
    const nuevos = this.nuevos();

    const documentRows: DocumentsRecordsRow[] = solicitudes.map((s) => ({
      document: s.tipoDocumento,
      documentId: s.id,
      isNew: nuevos.has(s.id),
      number: s.numero || '—',
      actionType: s.tipoAccion === 'creacion' ? 'Creación' : s.tipoAccion,
      status: s.estado,
      system: 'Sistema Nacional de Tesorería',
      date: s.fecha,
      entity: s.entidad || '—',
      creator: s.creador,
      linkRoute: `${REQUEST_ROUTE}/${s.id}`,
    }));

    const recordRows: DocumentsRecordsRow[] = this.registros().map((r) => ({
      recordId: r.id,
      status: r.estado,
      codigo: r.codigo,
      codigoTif: r.codigoTif,
      tipo: r.tipo,
      abreviatura: r.abreviatura,
      descripcion: r.descripcion,
      vigenteLabel: r.vigente ? 'Vigente' : 'No vigente',
      fechaDesde: r.fechaDesde ? r.fechaDesde.split('-').reverse().join('/') : '—',
      // Para el historial del registro: la solicitud que lo creó.
      document: NOMBRE_DOCUMENTO,
      documentId: r.documentoId,
      number: r.numeroDocumento,
      actionType: 'Creación',
      linkRoute: `${REQUEST_ROUTE}/${r.documentoId}`,
    }));

    return {
      ...CATALOGO_TIF_DOCUMENTS_CONFIG,
      documentRows,
      recordRows,
      serverQuery: { total: this.solicitudesState.bandejaTotal() },
    };
  });
}
