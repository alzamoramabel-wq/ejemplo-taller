/**
 * Árbol maestro de procesos + utilidad de búsqueda de ruta.
 * Vive en shared/utils/ (no en layout/) porque lo consumen tanto piezas
 * del shell (layout/process-menu-tree, layout/create-document) como
 * utilidades transversales de shared (breadcrumbs.util) — shared no debe
 * depender de layout, así que la fuente de verdad va acá.
 */
export interface ProcessMenuNode {
  id: string;
  label: string;
  selected?: boolean;
  // Solo debe marcarse en nodos raiz: la vista inicial muestra hasta el segundo nivel.
  expanded?: boolean;
  // Ruta de la página principal del módulo (documentos y registros)
  moduleRoute?: string;
  // Si un nodo tiene estas propiedades, Crear documento puede completar documento/tipo y navegar.
  createRoute?: string;
  documentOptions?: string[];
  documentCreateOptions?: Array<{
    label: string;
    route?: string;
    actionTypes?: string[];
  }>;
  actionTypeOptions?: string[];
  /**
   * Marca un nodo como módulo planificado pero aún no implementado.
   * El menú lo renderiza con texto atenuado y badge "Próximamente",
   * y el click no navega (solo expande si tiene hijos).
   */
  comingSoon?: boolean;
  /**
   * Encabezado de grupo no interactivo (ej. «CLASIFICADORES», «CATÁLOGOS»): agrupa hijos
   * visualmente (mayúsculas, ícono de cuadro en vez de flecha) pero no se selecciona, no
   * expande/colapsa por click y sus hijos siempre están visibles.
   */
  groupHeader?: boolean;
  children?: ProcessMenuNode[];
}

/**
 * Árbol de procesos del taller, según la captura del menú «Gestión de deuda pública / SNE»
 * (recibida como imagen, sin node-id de Figma verificable en esta sesión). Todo el árbol queda
 * como «Próximamente»: ningún proceso tiene pantallas ni rutas implementadas. Para sumar un
 * proceso real: una hoja con `moduleRoute` (Documentos y registros) y otra para sus consultas, y
 * sus rutas en `app.routes.ts`.
 */
export const DEFAULT_PROCESS_TREE: ProcessMenuNode[] = [
  {
    id: 'concertaciones',
    label: 'Concertaciones',
    comingSoon: true,
    children: [
      { id: 'concertaciones-documentos', label: 'Documentos y registros de concertaciones', comingSoon: true },
      { id: 'concertaciones-consultas', label: 'Consultas y reportes de concertaciones', comingSoon: true },
    ],
  },
  {
    id: 'servicio-deuda',
    label: 'Servicio de la deuda',
    comingSoon: true,
    children: [
      { id: 'servicio-deuda-documentos', label: 'Documentos y registros de servicio de la deuda', comingSoon: true },
      { id: 'servicio-deuda-consultas', label: 'Consultas y reportes de servicio de la deuda', comingSoon: true },
    ],
  },
  {
    id: 'pagos',
    label: 'Pagos',
    comingSoon: true,
    children: [
      { id: 'pagos-documentos', label: 'Documentos y registros de pagos', comingSoon: true },
      { id: 'pagos-consultas', label: 'Consultas y reportes de pagos', comingSoon: true },
    ],
  },
  {
    id: 'clasificadores-catalogos',
    label: 'Clasificadores y catálogos',
    expanded: true,
    comingSoon: true,
    children: [
      {
        id: 'clasificadores-catalogos-clasificadores',
        label: 'Clasificadores',
        groupHeader: true,
        children: [{ id: 'clasificador-participantes-sne', label: 'Clasificador de participantes del SNE', comingSoon: true }],
      },
      {
        id: 'clasificadores-catalogos-catalogos',
        label: 'Catálogos',
        groupHeader: true,
        children: [
          { id: 'catalogo-tipos-interes', label: 'Catálogo de tipos de interés', comingSoon: true },
          {
            id: 'catalogo-tipos-instrumentos-financieros',
            label: 'Catálogo de tipos de instrumentos financieros',
            selected: true,
            moduleRoute: '/procesos/catalogo-tipos-instrumentos-financieros',
            createRoute: '/procesos/catalogo-tipos-instrumentos-financieros/solicitud',
            documentOptions: ['Solicitud de tipos de instrumentos financieros'],
            documentCreateOptions: [
              {
                label: 'Solicitud de tipos de instrumentos financieros',
                route: '/procesos/catalogo-tipos-instrumentos-financieros/solicitud',
                actionTypes: ['Creación'],
              },
            ],
            actionTypeOptions: ['Creación'],
          },
        ],
      },
    ],
  },
  {
    id: 'consultas-reportes',
    label: 'Consultas y reportes',
    comingSoon: true,
    children: [{ id: 'consultas-reportes-deuda-publica', label: 'Consultas y reportes de deuda pública', comingSoon: true }],
  },
];

export function findProcessPathById(id: string, nodes: readonly ProcessMenuNode[] = DEFAULT_PROCESS_TREE): ProcessMenuNode[] {
  for (const node of nodes) {
    if (node.id === id) {
      return [node];
    }

    const childPath = findProcessPathById(id, node.children || []);

    if (childPath.length > 0) {
      return [node, ...childPath];
    }
  }

  return [];
}

/**
 * Árbol del menú "Ajustes" (módulo de administración). Lo pinta el mismo `siaf-process-menu-tree`
 * que el menú de procesos, con otros textos. En el taller no hay módulo de administración: las hojas
 * van como «Próximamente» y no navegan.
 */
export const ADMIN_MENU_TREE: ProcessMenuNode[] = [
  {
    id: 'administracion',
    label: 'Administración',
    expanded: true,
    children: [
      {
        id: 'usuarios-accesos',
        label: 'Usuarios y accesos',
        expanded: true,
        children: [
          { id: 'gestion-usuarios', label: 'Gestión de usuarios', comingSoon: true },
          { id: 'perfiles-funcionales', label: 'Perfiles funcionales', comingSoon: true },
        ],
      },
      {
        id: 'organizacion',
        label: 'Organización',
        children: [
          { id: 'entidades', label: 'Entidades', comingSoon: true },
          { id: 'unidades', label: 'Unidades orgánicas', comingSoon: true },
        ],
      },
    ],
  },
];
