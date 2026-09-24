import type { CreateDocumentProcessOption } from '../../../../shared/components/create-document/create-document.component';
import { NOMBRE_DOCUMENTO } from '../models/catalogo-tif.model';

/** Rutas e ids del proceso. Los ids existen en `DEFAULT_PROCESS_TREE` (shared/utils/process-tree.util.ts). */
export const PROCESS_ROUTE = '/procesos/catalogo-tipos-instrumentos-financieros';
export const REQUEST_SEGMENT = 'solicitud';
export const REQUEST_ROUTE = `${PROCESS_ROUTE}/${REQUEST_SEGMENT}`;

/** Hoja «Catálogo de tipos de instrumentos financieros» del árbol de procesos: arma las migas de pan. */
export const PROCESS_ID = 'catalogo-tipos-instrumentos-financieros';

/** Opción del panel «Crear documento» (shell y pestaña Documentos). */
export const CREATE_DOCUMENT_OPTIONS: CreateDocumentProcessOption[] = [
  {
    id: 'catalogo-tipos-instrumentos-financieros',
    label: 'Catálogo de tipos de instrumentos financieros',
    route: REQUEST_ROUTE,
    documents: [NOMBRE_DOCUMENTO],
    documentOptions: [{ label: NOMBRE_DOCUMENTO, route: REQUEST_ROUTE, actionTypes: ['Creación'] }],
    actionTypes: ['Creación'],
  },
];
