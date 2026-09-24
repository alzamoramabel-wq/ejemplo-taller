import { Routes } from '@angular/router';

/** Proceso de ejemplo del taller: Documentos y registros, la solicitud y la consulta. */
export const TESORERIA_ROUTES: Routes = [
  {
    path: 'procesos/registro-cuentas-bancarias',
    loadComponent: () =>
      import('./cuentas-bancarias/pages/documents/cuentas-bancarias-documents.component').then(
        (m) => m.CuentasBancariasDocumentsComponent,
      ),
  },
  {
    path: 'procesos/registro-cuentas-bancarias/solicitud',
    loadComponent: () =>
      import('./cuentas-bancarias/pages/solicitud/cuenta-bancaria-request.component').then(
        (m) => m.CuentaBancariaRequestComponent,
      ),
  },
  {
    path: 'procesos/registro-cuentas-bancarias/solicitud/:id',
    loadComponent: () =>
      import('./cuentas-bancarias/pages/solicitud/cuenta-bancaria-request.component').then(
        (m) => m.CuentaBancariaRequestComponent,
      ),
  },
  {
    path: 'procesos/registro-cuentas-bancarias/consultas',
    loadComponent: () =>
      import('./cuentas-bancarias/pages/consultas/cuentas-bancarias-consultas.component').then(
        (m) => m.CuentasBancariasConsultasComponent,
      ),
  },
  // ── Catálogo de tipos de instrumentos financieros ──
  {
    path: 'procesos/catalogo-tipos-instrumentos-financieros',
    loadComponent: () =>
      import('./catalogo-tipos-instrumentos-financieros/pages/documents/catalogo-tif-documents.component').then(
        (m) => m.CatalogoTifDocumentsComponent,
      ),
  },
  {
    path: 'procesos/catalogo-tipos-instrumentos-financieros/solicitud',
    loadComponent: () =>
      import('./catalogo-tipos-instrumentos-financieros/pages/solicitud/catalogo-tif-request.component').then(
        (m) => m.CatalogoTifRequestComponent,
      ),
  },
  {
    path: 'procesos/catalogo-tipos-instrumentos-financieros/solicitud/:id',
    loadComponent: () =>
      import('./catalogo-tipos-instrumentos-financieros/pages/solicitud/catalogo-tif-request.component').then(
        (m) => m.CatalogoTifRequestComponent,
      ),
  },
];
