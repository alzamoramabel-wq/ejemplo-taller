import { ESTADO } from '../../../../core/models/documento.model';
import type {
  DocumentsRecordsColumn,
  DocumentsRecordsConfig,
  DocumentsRecordsFilterOption,
  DocumentsRecordsMenuOption,
} from '../../../../shared/types/documents-records.types';
import { buildProcessBreadcrumbs } from '../../../../shared/utils/breadcrumbs.util';
import { NOMBRE_DOCUMENTO } from '../models/catalogo-tif.model';
import { CREATE_DOCUMENT_OPTIONS, PROCESS_ID, PROCESS_ROUTE, REQUEST_ROUTE } from './catalogo-tif.rutas';

/**
 * Configuración de «Documentos y registros» del proceso. La pantalla completa la pinta
 * `siaf-documents-records-page`: aquí solo se dice qué columnas, filtros y opciones tiene.
 */

const documentColumns: DocumentsRecordsColumn[] = [
  { key: 'document', label: 'Documento', visibility: 'visible', group: 'default', widthClass: 'w-[380px]', kind: 'document-link' },
  { key: 'number', label: 'Número', visibility: 'visible', group: 'default', widthClass: 'w-[280px]' },
  { key: 'actionType', label: 'Tipo de acción', visibility: 'visible', group: 'default', widthClass: 'w-[160px]' },
  { key: 'status', label: 'Estado', visibility: 'visible', group: 'default', widthClass: 'w-[150px]', kind: 'flow-status' },
  { key: 'system', label: 'Sistema', visibility: 'visible', group: 'default', widthClass: 'w-[240px]' },
  { key: 'date', label: 'Fecha de registro', visibility: 'hidden', group: 'more', widthClass: 'w-[170px]' },
  { key: 'creator', label: 'Creador', visibility: 'hidden', group: 'more', widthClass: 'w-[220px]' },
  { key: 'entity', label: 'Entidad', visibility: 'hidden', group: 'more', widthClass: 'w-[320px]' },
];

const recordColumns: DocumentsRecordsColumn[] = [
  { key: 'status', label: 'Estado', visibility: 'visible', group: 'default', widthClass: 'w-[120px]', kind: 'record-status' },
  { key: 'codigo', label: 'Código', visibility: 'visible', group: 'default', widthClass: 'w-[110px]' },
  { key: 'codigoTif', label: 'Código TIF', visibility: 'visible', group: 'default', widthClass: 'w-[130px]' },
  { key: 'tipo', label: 'Tipo', visibility: 'visible', group: 'default', widthClass: 'min-w-[220px]' },
  { key: 'abreviatura', label: 'Abreviatura', visibility: 'visible', group: 'default', widthClass: 'w-[150px]' },
  { key: 'descripcion', label: 'Descripción', visibility: 'visible', group: 'default', widthClass: 'min-w-[280px]' },
  { key: 'vigenteLabel', label: 'Vigencia', visibility: 'visible', group: 'default', widthClass: 'w-[110px]' },
  { key: 'fechaDesde', label: 'Vigente desde', visibility: 'visible', group: 'default', widthClass: 'w-[140px]' },
];

const fieldsMenuOptions: DocumentsRecordsMenuOption[] = [
  { label: 'Documento' },
  { label: 'Tipo de acción' },
  { label: 'Estado' },
  { label: 'Fecha de registro', hasChildren: true },
];

const filterCampoOptions: DocumentsRecordsFilterOption[] = [
  { label: 'Documento', value: 'document' },
  { label: 'Número', value: 'number' },
  { label: 'Tipo de acción', value: 'actionType' },
  { label: 'Estado', value: 'status' },
  { label: 'Fecha', value: 'date' },
];

const filterValorOptions: DocumentsRecordsFilterOption[] = [
  { label: ESTADO.ELABORADO, value: ESTADO.ELABORADO },
  { label: ESTADO.VERIFICADO, value: ESTADO.VERIFICADO },
  { label: ESTADO.APROBADO, value: ESTADO.APROBADO },
  { label: 'Creación', value: 'Creación' },
];

export const CATALOGO_TIF_DOCUMENTS_CONFIG: DocumentsRecordsConfig = {
  title: 'Catálogo de tipos de instrumentos financieros',
  processId: PROCESS_ID,
  defaultRequestRoute: REQUEST_ROUTE,
  createDocumentOptions: CREATE_DOCUMENT_OPTIONS,
  breadcrumbs: buildProcessBreadcrumbs(PROCESS_ID, PROCESS_ROUTE),
  documentRows: [],
  recordRows: [],
  documentColumns,
  recordColumns,
  documentTableMinWidthClass: 'min-w-[1600px]',
  recordTableMinWidthClass: 'min-w-[1400px]',
  recordTrackKey: 'recordId',
  recordHistoryDocumentLabel: NOMBRE_DOCUMENTO,
  // El historial de un registro es el de la solicitud que lo creó.
  recordHistoryKind: 'documento',
  statusFilterOptions: [ESTADO.ELABORADO, ESTADO.VERIFICADO, ESTADO.OBSERVADO, ESTADO.APROBADO, ESTADO.RECHAZADO],
  actionTypeFilterOptions: ['Creación'],
  filterCampoOptions,
  filterValorOptions,
  fieldsMenuOptions,
  recordFilter1Label: 'Estado',
  recordFilter1Key: 'status',
  recordFilter1Options: ['Activo', 'Inactivo'],
  recordFilterCampoOptions: [
    { label: 'Estado', value: 'status' },
    { label: 'Tipo', value: 'tipo' },
  ],
  recordFilterValorOptions: [
    { label: 'Activo', value: 'Activo' },
    { label: 'Inactivo', value: 'Inactivo' },
  ],
};
