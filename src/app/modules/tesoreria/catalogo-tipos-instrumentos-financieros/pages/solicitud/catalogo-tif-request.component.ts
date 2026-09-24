import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { CatalogosApiService, TipoDocumentoResponse } from '../../../../../core/api/catalogos-api.service';
import { SolicitudResponse, SolicitudesApiService } from '../../../../../core/api/solicitudes-api.service';
import { CurrentUserService } from '../../../../../core/auth/current-user.service';
import { PermissionService } from '../../../../../core/auth/permission.service';
import { ESTADO, MOTIVOS_RECHAZO } from '../../../../../core/models/documento.model';
import { SolicitudesFacadeService } from '../../../../../core/state/solicitudes-facade.service';
import { BreadcrumbItem } from '../../../../../shared/components/breadcrumb/breadcrumb.component';
import { DetailHistoryTabsComponent } from '../../../../../shared/components/detail-history-tabs/detail-history-tabs.component';
import { HistorialSource, buildCurrentComment, buildHistoryEntries } from '../../../../../shared/components/detail-history-tabs/detail-history-tabs.utils';
import { RequestApprovalModalsComponent } from '../../../../../shared/components/request-approval-modals/request-approval-modals.component';
import { SolicitudeFormCardComponent } from '../../../../../shared/components/solicitude-form-card/solicitude-form-card.component';
import { SolicitudeHeaderState } from '../../../../../shared/components/solicitude-header/solicitude-header.component';
import { SolicitudeInfoCardComponent, SolicitudeInfoField } from '../../../../../shared/components/solicitude-info-card/solicitude-info-card.component';
import { SolicitudePageLayoutComponent } from '../../../../../shared/components/solicitude-page-layout/solicitude-page-layout.component';
import { ActionTrackerComponent, ActionTrackerSummary } from '../../../../../shared/ui/action-tracker/action-tracker.component';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { DateTimePickerComponent } from '../../../../../shared/ui/date-time-picker/date-time-picker.component';
import { DocumentSummaryCardComponent } from '../../../../../shared/ui/document-summary-card/document-summary-card.component';
import { FlowStatus } from '../../../../../shared/ui/flow-status-tag/flow-status-tag.component';
import { RadioComponent } from '../../../../../shared/ui/radio/radio.component';
import { ReadonlyFieldComponent } from '../../../../../shared/ui/readonly-field/readonly-field.component';
import { SnackbarVariant } from '../../../../../shared/ui/snackbar/snackbar.component';
import { TextAreaControlComponent } from '../../../../../shared/ui/text-area-control/text-area-control.component';
import { TextFieldComponent } from '../../../../../shared/ui/text-field/text-field.component';
import { buildProcessBreadcrumbs } from '../../../../../shared/utils/breadcrumbs.util';
import { crearSnapshotFormulario, hayCambiosRespectoAlSnapshot } from '../../../../../shared/utils/form-snapshot.util';
import { MIN_CARACTERES_TEXTO_LIBRE, cumpleMinimoTextoLibre } from '../../../../../shared/utils/texto-libre.util';
import { CatalogoTifApiService } from '../../api/catalogo-tif-api.service';
import { PROCESS_ID, PROCESS_ROUTE, REQUEST_SEGMENT } from '../../config/catalogo-tif.rutas';
import {
  CODIGO_DOCUMENTO,
  ENTE_RECTOR_TIF,
  NOMBRE_DOCUMENTO,
  SubtipoInstrumentoFinancieroDatos,
  TipoInstrumentoFinancieroDatos,
} from '../../models/catalogo-tif.model';

/** Formulario para agregar (o editar) un tipo de instrumento financiero a la lista. */
interface FormularioTipo {
  codigoTif: string;
  tipo: string;
  abreviatura: string;
  descripcion: string;
  esInstrumentoFinanciero: 'SI' | 'NO' | '';
  vigente: 'SI' | 'NO' | '';
  fechaDesde: string;
  fechaHasta: string;
}

const FORMULARIO_TIPO_VACIO: FormularioTipo = {
  codigoTif: '',
  tipo: '',
  abreviatura: '',
  descripcion: '',
  esInstrumentoFinanciero: 'SI',
  vigente: 'SI',
  fechaDesde: '',
  fechaHasta: '',
};

/** Formulario para agregar un subtipo a un tipo de instrumento financiero de la lista. */
interface FormularioSubtipo {
  codigo: string;
  tipo: string;
  abreviatura: string;
  descripcion: string;
}

const FORMULARIO_SUBTIPO_VACIO: FormularioSubtipo = { codigo: '', tipo: '', abreviatura: '', descripcion: '' };

let contadorLocal = 0;
/** Id local para manejar la lista antes de grabar (no es el id del backend). */
function idLocal(prefijo: string): string {
  contadorLocal += 1;
  return `${prefijo}-${Date.now()}-${contadorLocal}`;
}

/**
 * Solicitud de tipos de instrumentos financieros (STIF): una solicitud propone uno o más tipos de instrumento
 * financiero (con sus subtipos), que se agregan a una lista antes de grabar.
 *
 * Grabar: crear la solicitud → guardar la lista de tipos → pasar a ELABORADO (genera el número). El creador edita,
 * verifica o elimina; el aprobador aprueba, observa o rechaza un documento VERIFICADO. Todo el estado vive en
 * signals y la cabecera se deriva del estado del documento.
 *
 * A diferencia de «Registro de cuentas bancarias» (una sola cuenta por solicitud), acá el creador arma una lista:
 * el botón (+) de «Tipos de instrumentos financieros» abre un formulario inline (Cancelar/Aceptar) que agrega una
 * fila a la lista, y cada fila tiene su propia lista anidada de «Subtipos». Los subtipos usan un subconjunto de
 * campos (código, tipo, abreviatura, descripción) al no haber referencia visual de su formulario.
 */
@Component({
  selector: 'siaf-catalogo-tif-request',
  standalone: true,
  imports: [
    ActionTrackerComponent,
    ButtonComponent,
    DateTimePickerComponent,
    DetailHistoryTabsComponent,
    DocumentSummaryCardComponent,
    RadioComponent,
    ReadonlyFieldComponent,
    RequestApprovalModalsComponent,
    SolicitudeFormCardComponent,
    SolicitudeInfoCardComponent,
    SolicitudePageLayoutComponent,
    TextAreaControlComponent,
    TextFieldComponent,
  ],
  templateUrl: './catalogo-tif-request.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogoTifRequestComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly currentUser = inject(CurrentUserService);
  private readonly permissions = inject(PermissionService);
  private readonly catalogosApi = inject(CatalogosApiService);
  private readonly solicitudesApi = inject(SolicitudesApiService);
  private readonly solicitudesFacade = inject(SolicitudesFacadeService);
  private readonly catalogoTifApi = inject(CatalogoTifApiService);

  readonly heading = NOMBRE_DOCUMENTO;
  readonly breadcrumbs: BreadcrumbItem[] = buildProcessBreadcrumbs(PROCESS_ID, PROCESS_ROUTE, NOMBRE_DOCUMENTO);
  readonly minCaracteresTexto = MIN_CARACTERES_TEXTO_LIBRE;
  readonly opcionesSiNo = [
    { label: 'Sí', value: 'SI' },
    { label: 'No', value: 'NO' },
  ];

  private solicitudId: string | null = null;
  private tiposDocumento: TipoDocumentoResponse[] = [];

  // ── Estado del documento ──────────────────────────────────────────
  private readonly solicitud = signal<SolicitudResponse | null>(null);
  readonly estado = computed(() => (this.solicitud()?.estado ?? 'NUEVO').toUpperCase());
  readonly editando = signal(false);
  readonly cargando = signal(false);
  readonly saving = signal(false);

  readonly headerRole = computed<'creator' | 'approver'>(() => (this.permissions.currentRole() === 'approver' ? 'approver' : 'creator'));
  readonly elaborado = computed(() => this.estado() !== 'NUEVO');
  readonly soloLectura = computed(() => this.elaborado() && !this.editando());
  readonly puedeVerificar = computed(() => ['ELABORADO', 'OBSERVADO'].includes(this.estado()));
  readonly numeroDocumento = computed(() => this.solicitud()?.numero ?? '');

  readonly headerState = computed<SolicitudeHeaderState>(() => {
    if (this.editando()) return 'edit';
    switch (this.estado()) {
      case 'APROBADO': return 'approved';
      case 'OBSERVADO': return 'observed';
      case 'RECHAZADO': return 'rejected';
      case 'VERIFICADO': return 'verified';
      case 'ELIMINADO': return 'deleted';
      case 'ELABORADO': return 'elaborated';
      default: return 'new';
    }
  });

  readonly estadoDocumento = computed<FlowStatus>(() => {
    const etiquetas: Record<string, FlowStatus> = {
      APROBADO: ESTADO.APROBADO,
      OBSERVADO: ESTADO.OBSERVADO,
      RECHAZADO: ESTADO.RECHAZADO,
      VERIFICADO: ESTADO.VERIFICADO,
      ELIMINADO: ESTADO.ELIMINADO,
    };
    return etiquetas[this.estado()] ?? ESTADO.ELABORADO;
  });

  // ── Cabecera de la solicitud (fecha + ente rector, fijo para este catálogo) ────
  readonly camposEntidad = computed<SolicitudeInfoField[]>(() => [
    { label: 'Fecha', value: '' },
    { label: 'Ente rector', value: ENTE_RECTOR_TIF.toUpperCase() },
  ]);

  // ── Lista de tipos de instrumentos financieros ─────────────────────
  readonly tipos = signal<TipoInstrumentoFinancieroDatos[]>([]);
  readonly justificacion = signal('');

  readonly agregandoTipo = signal(false);
  readonly formTipo = signal<FormularioTipo>({ ...FORMULARIO_TIPO_VACIO });
  readonly errorCodigoDuplicado = computed(() => {
    const codigo = this.formTipo().codigoTif.trim();
    return codigo && this.tipos().some((t) => t.codigoTif.trim().toLowerCase() === codigo.toLowerCase()) ? 'Ya existe un tipo con este código TIF.' : '';
  });
  readonly formTipoCompleto = computed(() => {
    const f = this.formTipo();
    return !!f.codigoTif.trim() && !!f.tipo.trim() && !!f.abreviatura.trim() && !!f.descripcion.trim() && !!f.esInstrumentoFinanciero && !this.errorCodigoDuplicado();
  });

  /** Id del tipo cuyo panel de "agregar subtipo" está abierto (uno a la vez). */
  readonly agregandoSubtipoDe = signal<string | null>(null);
  readonly formSubtipo = signal<FormularioSubtipo>({ ...FORMULARIO_SUBTIPO_VACIO });
  readonly formSubtipoCompleto = computed(() => {
    const f = this.formSubtipo();
    return !!f.codigo.trim() && !!f.tipo.trim() && !!f.abreviatura.trim() && !!f.descripcion.trim();
  });

  // Grabar solo con cambios: la foto se toma al pulsar Editar; sin foto (documento nuevo) se asume que hay cambios.
  private readonly fotoEdicion = signal<string | null>(null);
  private readonly fotoActual = computed(() => crearSnapshotFormulario({ tipos: this.tipos(), justificacion: this.justificacion().trim() }));
  private readonly hayCambios = computed(() => hayCambiosRespectoAlSnapshot(this.fotoEdicion(), this.fotoActual()));

  readonly formValido = computed(() =>
    !this.soloLectura() && this.tipos().length > 0 && cumpleMinimoTextoLibre(this.justificacion()) && this.hayCambios(),
  );

  // ── Historial y trazabilidad (del historial de estados) ───────────
  private readonly fuentesHistorial = computed<HistorialSource[]>(() =>
    (this.solicitud()?.historialEstados ?? []).map((h) => ({
      estadoBackend: h.estadoNuevo,
      fechaISO: h.createdAt,
      comentario: h.comentario,
      usuario: h.creador ? `${h.creador.nombres} ${h.creador.apellidoPaterno} ${h.creador.apellidoMaterno}` : '',
      rol: h.perfil?.cfgPerfil?.rol?.nombre ?? '',
    })),
  );
  readonly historial = computed(() => buildHistoryEntries(this.fuentesHistorial()));
  readonly comentarioActual = computed(() => buildCurrentComment(this.estado(), this.fuentesHistorial()));

  readonly trazabilidad = computed<ActionTrackerSummary[]>(() => {
    const historial = this.solicitud()?.historialEstados ?? [];
    const ultimo = (estado: string) => [...historial].reverse().find((h) => h.estadoNuevo === estado);
    const quien = (estado: string, label: string): ActionTrackerSummary => {
      const h = ultimo(estado);
      const nombre = h?.creador ? `${h.creador.nombres} ${h.creador.apellidoPaterno} ${h.creador.apellidoMaterno}` : '';
      return { label, actionBy: nombre.toUpperCase(), date: h ? new Date(h.createdAt).toLocaleString('es-PE') : '' };
    };
    const tercero = this.estado() === 'OBSERVADO'
      ? quien('OBSERVADO', 'Observado por')
      : this.estado() === 'RECHAZADO' ? quien('RECHAZADO', 'Rechazado por') : quien('APROBADO', 'Aprobado por');
    return [quien('ELABORADO', 'Elaborado por'), quien('VERIFICADO', 'Verificado por'), tercero];
  });

  // ── Modales y avisos ──────────────────────────────────────────────
  readonly modalGrabar = signal(false);
  readonly modalVerificar = signal(false);
  readonly modalEliminar = signal(false);
  readonly modalAprobar = signal(false);
  readonly modalObservar = signal(false);
  readonly modalRechazar = signal(false);
  readonly comentario = signal('');
  readonly motivoRechazo = signal('');
  readonly motivosRechazo = [...MOTIVOS_RECHAZO];
  readonly avisoAbierto = signal(false);
  readonly aviso = signal<SnackbarVariant>('creation-elaborated');

  ngOnInit(): void {
    this.catalogosApi.listarTiposDocumento().subscribe((tipos) => (this.tiposDocumento = tipos));
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.cargar(id);

    const estadoNavegacion = history.state as { fromSave?: boolean } | null;
    if (estadoNavegacion?.fromSave) this.mostrarAviso('creation-elaborated');
  }

  regresar(): void {
    if (this.editando()) {
      this.editando.set(false);
      this.restaurarFormulario(this.solicitud());
      return;
    }
    void this.router.navigate([PROCESS_ROUTE]);
  }

  editar(): void {
    this.editando.set(true);
    this.avisoAbierto.set(false);
    this.fotoEdicion.set(this.fotoActual());
  }

  // ── Lista de tipos de instrumento financiero ───────────────────────
  abrirAgregarTipo(): void {
    this.formTipo.set({ ...FORMULARIO_TIPO_VACIO });
    this.agregandoTipo.set(true);
  }

  cancelarAgregarTipo(): void {
    this.agregandoTipo.set(false);
  }

  actualizarFormTipo<K extends keyof FormularioTipo>(campo: K, valor: FormularioTipo[K]): void {
    this.formTipo.update((f) => ({ ...f, [campo]: valor }));
  }

  aceptarAgregarTipo(): void {
    if (!this.formTipoCompleto()) return;
    const f = this.formTipo();
    const nuevo: TipoInstrumentoFinancieroDatos = {
      id: idLocal('tif'),
      codigoTif: f.codigoTif.trim(),
      tipo: f.tipo.trim(),
      abreviatura: f.abreviatura.trim(),
      descripcion: f.descripcion.trim(),
      esInstrumentoFinanciero: f.esInstrumentoFinanciero === 'SI',
      vigente: f.vigente === 'SI',
      fechaDesde: f.fechaDesde,
      fechaHasta: f.fechaHasta,
      subtipos: [],
    };
    this.tipos.update((lista) => [...lista, nuevo]);
    this.agregandoTipo.set(false);
  }

  eliminarTipo(id: string): void {
    this.tipos.update((lista) => lista.filter((t) => t.id !== id));
    if (this.agregandoSubtipoDe() === id) this.agregandoSubtipoDe.set(null);
  }

  // ── Subtipos de un tipo de instrumento financiero ──────────────────
  abrirAgregarSubtipo(tipoId: string): void {
    this.formSubtipo.set({ ...FORMULARIO_SUBTIPO_VACIO });
    this.agregandoSubtipoDe.set(tipoId);
  }

  cancelarAgregarSubtipo(): void {
    this.agregandoSubtipoDe.set(null);
  }

  actualizarFormSubtipo<K extends keyof FormularioSubtipo>(campo: K, valor: FormularioSubtipo[K]): void {
    this.formSubtipo.update((f) => ({ ...f, [campo]: valor }));
  }

  aceptarAgregarSubtipo(tipoId: string): void {
    if (!this.formSubtipoCompleto()) return;
    const f = this.formSubtipo();
    const nuevo: SubtipoInstrumentoFinancieroDatos = { id: idLocal('sub'), codigo: f.codigo.trim(), tipo: f.tipo.trim(), abreviatura: f.abreviatura.trim(), descripcion: f.descripcion.trim() };
    this.tipos.update((lista) => lista.map((t) => (t.id === tipoId ? { ...t, subtipos: [...t.subtipos, nuevo] } : t)));
    this.agregandoSubtipoDe.set(null);
  }

  eliminarSubtipo(tipoId: string, subtipoId: string): void {
    this.tipos.update((lista) => lista.map((t) => (t.id === tipoId ? { ...t, subtipos: t.subtipos.filter((s) => s.id !== subtipoId) } : t)));
  }

  // ── Grabar ────────────────────────────────────────────────────────
  onConfirmarGrabar(): void {
    this.modalGrabar.set(false);
    const tiposActuales = this.tipos();
    const guardarYElaborar = (id: string): Observable<unknown> =>
      this.catalogoTifApi.guardarDetalle(id, tiposActuales).pipe(
        switchMap(() => this.solicitudesApi.cambiarEstado(id, { estadoNuevo: 'ELABORADO' })),
      );

    this.saving.set(true);

    if (this.solicitudId) {
      const id = this.solicitudId;
      this.solicitudesApi.actualizar(id, { justificacion: this.justificacion(), organoLinea: this.organo() })
        .pipe(switchMap(() => guardarYElaborar(id)))
        .subscribe({
          next: () => { this.editando.set(false); this.mostrarAviso('creation-elaborated'); this.cargar(id); },
          error: () => this.cargar(id),
        });
      return;
    }

    const tipo = this.tiposDocumento.find((t) => t.codigo === CODIGO_DOCUMENTO);
    if (!tipo) { this.saving.set(false); return; }
    this.solicitudesFacade.crearSolicitud({
      tipoDocumentoId: tipo.id,
      tipoAccion: 'creacion',
      fechaRequerimiento: new Date().toISOString(),
      organoLinea: this.organo(),
      justificacion: this.justificacion(),
      cuentas: [],
    }).pipe(
      switchMap((creada) => { this.solicitudId = creada.id; return guardarYElaborar(creada.id).pipe(map(() => creada.id)); }),
    ).subscribe({
      next: (id) => { this.saving.set(false); void this.router.navigate([PROCESS_ROUTE, REQUEST_SEGMENT, id], { state: { fromSave: true } }); },
      error: () => {
        this.saving.set(false);
        if (this.solicitudId) void this.router.navigate([PROCESS_ROUTE, REQUEST_SEGMENT, this.solicitudId]);
      },
    });
  }

  // ── Acciones de estado ────────────────────────────────────────────
  onConfirmarVerificar(): void {
    this.modalVerificar.set(false);
    this.accion((id) => this.solicitudesApi.cambiarEstado(id, { estadoNuevo: 'VERIFICADO' }), 'creation-verified');
  }

  onConfirmarEliminar(): void {
    this.modalEliminar.set(false);
    this.accion((id) => this.solicitudesApi.cambiarEstado(id, { estadoNuevo: 'ELIMINADO' }), 'creation-deleted');
  }

  abrirAprobar(): void { this.comentario.set(''); this.modalAprobar.set(true); }
  abrirObservar(): void { this.comentario.set(''); this.modalObservar.set(true); }
  abrirRechazar(): void { this.comentario.set(''); this.motivoRechazo.set(''); this.modalRechazar.set(true); }

  cerrarModalesAprobador(): void {
    this.modalAprobar.set(false);
    this.modalObservar.set(false);
    this.modalRechazar.set(false);
  }

  onConfirmarAprobar(): void {
    this.modalAprobar.set(false);
    this.accion((id) => this.solicitudesFacade.aprobar(id), 'creation-approved');
  }

  onConfirmarObservar(): void {
    if (!this.comentario().trim()) return;
    this.modalObservar.set(false);
    this.accion((id) => this.solicitudesFacade.observar(id, this.comentario()), 'creation-observed');
  }

  onConfirmarRechazar(): void {
    if (!this.comentario().trim()) return;
    this.modalRechazar.set(false);
    this.accion((id) => this.solicitudesFacade.rechazar(id, this.comentario(), this.motivoRechazo() || undefined), 'creation-rejected');
  }

  private accion(llamada: (id: string) => Observable<unknown>, aviso: SnackbarVariant): void {
    const id = this.solicitudId;
    if (!id) return;
    this.saving.set(true);
    llamada(id).subscribe({
      next: () => { this.mostrarAviso(aviso); this.cargar(id); },
      error: () => this.saving.set(false),
    });
  }

  private mostrarAviso(variante: SnackbarVariant): void {
    this.aviso.set(variante);
    this.avisoAbierto.set(true);
  }

  private organo(): string {
    return (this.currentUser.user().unidad ?? this.currentUser.office ?? '').toUpperCase();
  }

  // ── Carga ─────────────────────────────────────────────────────────
  private cargar(id: string): void {
    this.cargando.set(true);
    this.solicitudesApi.obtenerDetalle(id).subscribe({
      next: (s) => {
        this.solicitudId = s.id;
        this.solicitud.set(s);
        this.editando.set(false);
        this.fotoEdicion.set(null);
        this.restaurarFormulario(s);
        this.cargando.set(false);
        this.saving.set(false);
      },
      error: () => { this.cargando.set(false); this.saving.set(false); },
    });
  }

  private restaurarFormulario(s: SolicitudResponse | null): void {
    this.tipos.set(s?.detalleCatalogoTif?.tipos ?? []);
    this.justificacion.set((s?.asuntoMotivo ?? '').replace(/^\[[^\]]*\]\s*/, ''));
    this.agregandoTipo.set(false);
    this.agregandoSubtipoDe.set(null);
  }
}
