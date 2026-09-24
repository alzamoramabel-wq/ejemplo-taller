import type { NotificacionResponse } from '../core/api/notificaciones-api.service';
import type { HistorialItem, SolicitudResponse } from '../core/api/solicitudes-api.service';
import type { EstadoDocumento } from '../core/models/documento.model';
import {
  CatalogoTifRegistro,
  CODIGO_DOCUMENTO as CODIGO_DOCUMENTO_TIF,
  ENTE_RECTOR_TIF,
  NOMBRE_DOCUMENTO as NOMBRE_DOCUMENTO_TIF,
  TipoInstrumentoFinancieroDatos,
} from '../modules/tesoreria/catalogo-tipos-instrumentos-financieros/models/catalogo-tif.model';
import {
  CODIGO_DOCUMENTO,
  CuentaBancariaDatos,
  CuentaBancariaRegistro,
  NOMBRE_DOCUMENTO,
} from '../modules/tesoreria/cuentas-bancarias/models/cuenta-bancaria.model';
import { USUARIOS_DEMO, UsuarioDemo } from './usuarios-demo';

/**
 * «Base de datos» del backend simulado: vive en el `localStorage` del navegador, así lo que hace un usuario lo ve
 * otro al iniciar sesión (en el mismo navegador). `reiniciarDatosDemo()` vuelve a los datos iniciales.
 */

const CLAVE = 'taller-siaf-rp:datos';
// v2: se agregó el catálogo de tipos de instrumentos financieros (registrosCatalogoTif, correlativoTif,
// correlativoRegistroTif) — al cambiar de nuevo la forma de los datos, subir este número.
const VERSION = 2;

export interface NotificacionMock extends NotificacionResponse {
  /** Destinatario: un usuario puntual o, si no hay, todos los perfiles con este rol. */
  paraUsuarioId?: string;
  paraRolCodigo?: 'CREADOR' | 'APROBADOR';
}

export interface DatosTaller {
  version: number;
  solicitudes: SolicitudResponse[];
  registros: CuentaBancariaRegistro[];
  registrosCatalogoTif: CatalogoTifRegistro[];
  notificaciones: NotificacionMock[];
  correlativoDocumento: number;
  correlativoRegistro: number;
  /** Correlativo del número de solicitud STIF (formato simple, sin prefijo: "0007", "0008"…). */
  correlativoTif: number;
  correlativoRegistroTif: number;
  secuencia: number;
}

export const TIPO_DOCUMENTO = { id: 'td-srcb', codigo: CODIGO_DOCUMENTO, nombre: NOMBRE_DOCUMENTO };
export const TIPO_DOCUMENTO_TIF = { id: 'td-stif', codigo: CODIGO_DOCUMENTO_TIF, nombre: NOMBRE_DOCUMENTO_TIF };
export const ENTIDAD_CREADORA = { id: 'ent-mef', codMef: '0001', siglas: 'MEF', nombre: 'Ministerio de Economía y Finanzas' };
export const UNIDAD_CREADORA = { id: 'uo-oga', sigla: 'OGA', nombre: 'Oficina General de Administración' };

export function leerDatos(): DatosTaller {
  try {
    const guardados = localStorage.getItem(CLAVE);
    if (guardados) {
      const datos = JSON.parse(guardados) as DatosTaller;
      if (datos.version === VERSION) return datos;
    }
  } catch {
    // Datos corruptos o sin acceso al almacenamiento: se empieza de nuevo.
  }
  const iniciales = crearDatosIniciales();
  guardarDatos(iniciales);
  return iniciales;
}

export function guardarDatos(datos: DatosTaller): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(datos));
  } catch {
    // Sin almacenamiento (modo privado estricto): los cambios duran lo que dure la pestaña.
  }
}

/** Vuelve a los datos iniciales de la demo. */
export function reiniciarDatosDemo(): void {
  guardarDatos(crearDatosIniciales());
}

export function nuevoId(datos: DatosTaller, prefijo: string): string {
  datos.secuencia += 1;
  return `${prefijo}-${datos.secuencia}`;
}

export function numeroDocumento(correlativo: number, fecha: Date): string {
  return `PCB-SRCB-${String(correlativo).padStart(5, '0')}-${fecha.getFullYear()}-MEF-OGA`;
}

export function filaHistorial(
  datos: DatosTaller,
  anterior: EstadoDocumento | null,
  nuevo: EstadoDocumento,
  fecha: string,
  usuario: UsuarioDemo,
  rol: { codigo: string; nombre: string },
  comentario: string | null = null,
): HistorialItem {
  return {
    id: nuevoId(datos, 'hist'),
    estadoAnterior: anterior,
    estadoNuevo: nuevo,
    comentario,
    createdAt: fecha,
    creador: { nombres: usuario.nombres, apellidoPaterno: usuario.apellidoPaterno, apellidoMaterno: usuario.apellidoMaterno },
    perfil: { cfgPerfil: { rol } },
  };
}

// ─── Datos iniciales ───────────────────────────────────────────────

const ROL_CREADOR = { codigo: 'CREADOR', nombre: 'Creador' };
const ROL_APROBADOR = { codigo: 'APROBADOR', nombre: 'Aprobador' };

interface Semilla {
  datos: CuentaBancariaDatos;
  /** Día en que se creó la solicitud (yyyy-mm-dd). */
  creada: string;
  estado: 'ELABORADO' | 'VERIFICADO' | 'APROBADO' | 'OBSERVADO' | 'RECHAZADO';
  justificacion: string;
  comentario?: string;
  registroInactivo?: boolean;
}

function cuenta(banco: string, tipo: 'CORRIENTE' | 'AHORROS', moneda: 'PEN' | 'USD', n: number, denominacion: string, apertura: string, recaudadora: boolean): CuentaBancariaDatos {
  return {
    bancoCodigo: banco,
    tipoCuenta: tipo,
    moneda,
    numeroCuenta: `${banco}100${String(58213400000000 + n * 7919).slice(-14)}`,
    denominacion,
    fechaApertura: apertura,
    esRecaudadora: recaudadora,
  };
}

const SEMILLAS: Semilla[] = [
  { creada: '2026-01-16', estado: 'APROBADO', justificacion: 'Cuenta para la recaudación de tasas por procedimientos administrativos.', datos: cuenta('018', 'CORRIENTE', 'PEN', 1, 'Recaudación de tasas administrativas', '2026-01-15', true) },
  { creada: '2026-02-04', estado: 'APROBADO', justificacion: 'Cuenta para pagos a proveedores del exterior en dólares.', datos: cuenta('002', 'CORRIENTE', 'USD', 2, 'Pagos a proveedores del exterior', '2026-02-03', false) },
  { creada: '2026-02-23', estado: 'APROBADO', justificacion: 'Cuenta de ahorros para el fondo de caja chica de la oficina.', datos: cuenta('003', 'AHORROS', 'PEN', 3, 'Fondo de caja chica', '2026-02-20', false) },
  { creada: '2026-03-12', estado: 'APROBADO', justificacion: 'Cuenta para la recaudación de multas administrativas.', datos: cuenta('011', 'CORRIENTE', 'PEN', 4, 'Recaudación de multas', '2026-03-11', true) },
  { creada: '2026-04-09', estado: 'APROBADO', justificacion: 'Cuenta para las transferencias a unidades ejecutoras.', datos: cuenta('018', 'CORRIENTE', 'PEN', 5, 'Transferencias a unidades ejecutoras', '2026-04-08', false) },
  { creada: '2026-05-20', estado: 'APROBADO', justificacion: 'Cuenta para garantías recibidas en moneda extranjera.', datos: cuenta('009', 'AHORROS', 'USD', 6, 'Garantías en moneda extranjera', '2026-05-19', false), registroInactivo: true },
  { creada: '2026-06-03', estado: 'APROBADO', justificacion: 'Cuenta para la recaudación de servicios no exclusivos.', datos: cuenta('018', 'CORRIENTE', 'PEN', 7, 'Recaudación de servicios no exclusivos', '2026-06-02', true) },
  { creada: '2026-07-15', estado: 'APROBADO', justificacion: 'Cuenta de ahorros para encargos a las oficinas desconcentradas.', datos: cuenta('002', 'AHORROS', 'PEN', 8, 'Encargos a oficinas desconcentradas', '2026-07-14', false) },
  { creada: '2026-08-06', estado: 'RECHAZADO', justificacion: 'Cuenta para la recaudación de derechos de trámite.', datos: cuenta('009', 'CORRIENTE', 'PEN', 9, 'Recaudación de derechos de trámite', '2026-08-05', true), comentario: '[Información incorrecta] La cuenta ya está registrada con el código CB-0004.' },
  { creada: '2026-08-24', estado: 'VERIFICADO', justificacion: 'Cuenta en dólares para los fondos de cooperación internacional.', datos: cuenta('003', 'CORRIENTE', 'USD', 10, 'Fondos de cooperación internacional', '2026-08-21', false) },
  { creada: '2026-09-02', estado: 'OBSERVADO', justificacion: 'Cuenta para la recaudación por alquiler de ambientes.', datos: cuenta('011', 'CORRIENTE', 'PEN', 11, 'Recaudación de alquileres', '2026-09-01', true), comentario: 'Adjunte la constancia de apertura emitida por el banco.' },
  { creada: '2026-09-09', estado: 'ELABORADO', justificacion: 'Cuenta de ahorros para el fondo de viáticos.', datos: cuenta('018', 'AHORROS', 'PEN', 12, 'Fondo de viáticos', '2026-09-08', false) },
];

function enFecha(dia: string, horas: number, dias = 0): string {
  const fecha = new Date(`${dia}T00:00:00`);
  fecha.setDate(fecha.getDate() + dias);
  fecha.setHours(horas, 15 + dias * 7, 0, 0);
  return fecha.toISOString();
}

// ─── Semillas: catálogo de tipos de instrumentos financieros (STIF) ─

interface SemillaTif {
  numero: string;
  tipo: Omit<TipoInstrumentoFinancieroDatos, 'id'>;
  creada: string;
  estado: 'ELABORADO' | 'APROBADO' | 'ELIMINADO';
  justificacion: string;
}

function tipoInstrumento(codigoTif: string, tipo: string, abreviatura: string, descripcion: string, fechaDesde: string): Omit<TipoInstrumentoFinancieroDatos, 'id'> {
  return { codigoTif, tipo, abreviatura, descripcion, esInstrumentoFinanciero: true, vigente: true, fechaDesde, fechaHasta: '', subtipos: [] };
}

const SEMILLAS_TIF: SemillaTif[] = [
  { numero: '0001', creada: '2026-01-20', estado: 'ELIMINADO', justificacion: 'Registro duplicado del tipo de instrumento.', tipo: tipoInstrumento('TIF-01', 'Bonos soberanos', 'BS', 'Títulos de deuda emitidos por el Tesoro Público a mediano y largo plazo.', '2026-01-19') },
  { numero: '0002', creada: '2026-02-11', estado: 'APROBADO', justificacion: 'Alta del tipo de instrumento para registrar letras del Tesoro.', tipo: tipoInstrumento('TIF-02', 'Letras del Tesoro', 'LT', 'Títulos de deuda de corto plazo emitidos por el Tesoro Público.', '2026-02-10') },
  { numero: '0003', creada: '2026-03-05', estado: 'APROBADO', justificacion: 'Alta del tipo de instrumento para pagarés del Tesoro.', tipo: tipoInstrumento('TIF-03', 'Pagarés del Tesoro', 'PT', 'Instrumentos de deuda de corto plazo colocados entre entidades del sector público.', '2026-03-04') },
  { numero: '0004', creada: '2026-07-02', estado: 'ELABORADO', justificacion: 'Alta del tipo de instrumento para depósitos a plazo.', tipo: tipoInstrumento('TIF-04', 'Depósitos a plazo', 'DP', 'Depósitos de la entidad colocados a un plazo fijo determinado.', '2026-07-01') },
  { numero: '0005', creada: '2026-08-14', estado: 'ELABORADO', justificacion: 'Alta del tipo de instrumento para operaciones de reporte.', tipo: tipoInstrumento('TIF-05', 'Operaciones de reporte', 'REPO', 'Operaciones de venta con pacto de recompra de valores.', '2026-08-13') },
  { numero: '0006', creada: '2026-09-10', estado: 'ELABORADO', justificacion: 'Alta del tipo de instrumento para permutas financieras.', tipo: tipoInstrumento('TIF-06', 'Permutas financieras', 'SWAP', 'Contratos de intercambio de flujos financieros entre dos partes.', '2026-09-09') },
];

function crearSemillasTif(datos: DatosTaller, ana: UsuarioDemo, luis: UsuarioDemo): void {
  for (const semilla of SEMILLAS_TIF) {
    const id = nuevoId(datos, 'sol');
    const creada = enFecha(semilla.creada, 9);
    const historial: HistorialItem[] = [
      filaHistorial(datos, null, 'NUEVO', creada, ana, ROL_CREADOR),
      filaHistorial(datos, 'NUEVO', 'ELABORADO', enFecha(semilla.creada, 9, 0), ana, ROL_CREADOR),
    ];
    if (semilla.estado === 'ELIMINADO') {
      historial.push(filaHistorial(datos, 'ELABORADO', 'ELIMINADO', enFecha(semilla.creada, 9, 1), ana, ROL_CREADOR));
    }
    if (semilla.estado === 'APROBADO') {
      historial.push(filaHistorial(datos, 'ELABORADO', 'VERIFICADO', enFecha(semilla.creada, 10, 1), ana, ROL_CREADOR));
      historial.push(filaHistorial(datos, 'VERIFICADO', 'APROBADO', enFecha(semilla.creada, 11, 2), luis, ROL_APROBADOR));
    }
    const ultima = historial[historial.length - 1].createdAt;
    const tipoConId: TipoInstrumentoFinancieroDatos = { id: nuevoId(datos, 'tif-item'), ...semilla.tipo };

    const solicitud: SolicitudResponse = {
      id,
      numero: semilla.numero,
      catDocumento: TIPO_DOCUMENTO_TIF,
      tipoAccion: 'creacion',
      estado: semilla.estado,
      asuntoMotivo: `[${ENTE_RECTOR_TIF.toUpperCase()}] ${semilla.justificacion}`,
      entidadCreadora: ENTIDAD_CREADORA,
      unidadCreadora: UNIDAD_CREADORA,
      creador: { id: ana.id, nombres: ana.nombres, apellidoPaterno: ana.apellidoPaterno, apellidoMaterno: ana.apellidoMaterno },
      fechaRegistro: creada,
      createdAt: creada,
      updatedAt: ultima,
      itemsCuenta: [],
      detalleCatalogoTif: { documentoId: id, tipos: [tipoConId] },
      sustentos: [],
      historialEstados: historial,
    };
    datos.solicitudes.push(solicitud);

    if (semilla.estado === 'APROBADO') {
      datos.correlativoRegistroTif += 1;
      datos.registrosCatalogoTif.push({
        ...tipoConId,
        id: nuevoId(datos, 'tif'),
        codigo: `TIF-${String(datos.correlativoRegistroTif).padStart(4, '0')}`,
        estado: 'Activo',
        documentoId: id,
        numeroDocumento: semilla.numero,
        fechaRegistro: ultima,
      });
    }
  }
}

function crearDatosIniciales(): DatosTaller {
  const datos: DatosTaller = {
    version: VERSION,
    solicitudes: [],
    registros: [],
    registrosCatalogoTif: [],
    notificaciones: [],
    correlativoDocumento: 0,
    correlativoRegistro: 0,
    correlativoTif: SEMILLAS_TIF.length,
    correlativoRegistroTif: 0,
    secuencia: 0,
  };
  const ana = USUARIOS_DEMO[0];
  const luis = USUARIOS_DEMO[1];

  for (const semilla of SEMILLAS) {
    const id = nuevoId(datos, 'sol');
    datos.correlativoDocumento += 1;
    const creada = enFecha(semilla.creada, 9);
    const numero = numeroDocumento(datos.correlativoDocumento, new Date(creada));
    const historial: HistorialItem[] = [
      filaHistorial(datos, null, 'NUEVO', creada, ana, ROL_CREADOR),
      filaHistorial(datos, 'NUEVO', 'ELABORADO', enFecha(semilla.creada, 9, 0), ana, ROL_CREADOR),
    ];
    if (semilla.estado !== 'ELABORADO') {
      historial.push(filaHistorial(datos, 'ELABORADO', 'VERIFICADO', enFecha(semilla.creada, 10, 1), ana, ROL_CREADOR));
    }
    if (['APROBADO', 'OBSERVADO', 'RECHAZADO'].includes(semilla.estado)) {
      historial.push(filaHistorial(datos, 'VERIFICADO', semilla.estado, enFecha(semilla.creada, 11, 2), luis, ROL_APROBADOR, semilla.comentario ?? null));
    }
    const ultima = historial[historial.length - 1].createdAt;

    const solicitud: SolicitudResponse = {
      id,
      numero,
      catDocumento: TIPO_DOCUMENTO,
      tipoAccion: 'creacion',
      estado: semilla.estado,
      asuntoMotivo: `[OFICINA GENERAL DE ADMINISTRACIÓN] ${semilla.justificacion}`,
      entidadCreadora: ENTIDAD_CREADORA,
      unidadCreadora: UNIDAD_CREADORA,
      creador: { id: ana.id, nombres: ana.nombres, apellidoPaterno: ana.apellidoPaterno, apellidoMaterno: ana.apellidoMaterno },
      fechaRegistro: creada,
      createdAt: creada,
      updatedAt: ultima,
      itemsCuenta: [],
      detalleCuentaBancaria: { documentoId: id, ...semilla.datos },
      sustentos: [
        {
          id: nuevoId(datos, 'sus'),
          tipoSustento: 'sustento',
          archivo: { nombreOriginal: `Constancia de apertura ${String(datos.correlativoDocumento).padStart(2, '0')}.pdf`, storagePath: 'taller' },
        },
      ],
      historialEstados: historial,
    };
    datos.solicitudes.push(solicitud);

    if (semilla.estado === 'APROBADO') {
      datos.correlativoRegistro += 1;
      datos.registros.push({
        id: nuevoId(datos, 'cb'),
        codigo: `CB-${String(datos.correlativoRegistro).padStart(4, '0')}`,
        estado: semilla.registroInactivo ? 'Inactivo' : 'Activo',
        entidadSiglas: 'MEF',
        documentoId: id,
        numeroDocumento: numero,
        fechaRegistro: ultima,
        ...semilla.datos,
      });
    }
  }

  crearSemillasTif(datos, ana, luis);

  // Notificaciones: el aprobador tiene una solicitud por aprobar; el creador, una observada y otras ya leídas.
  const aviso = (s: SolicitudResponse, tipo: string, titulo: string, mensaje: string, leida: boolean, destino: Pick<NotificacionMock, 'paraUsuarioId' | 'paraRolCodigo'>): NotificacionMock => ({
    id: nuevoId(datos, 'not'),
    tipo,
    titulo,
    mensaje,
    leida,
    leidaEn: leida ? s.updatedAt ?? null : null,
    createdAt: s.updatedAt ?? s.createdAt,
    documento: { id: s.id, numero: s.numero, catDocumento: TIPO_DOCUMENTO },
    ...destino,
  });
  const porEstado = (estado: string) => datos.solicitudes.filter((s) => s.estado === estado);
  for (const s of porEstado('VERIFICADO')) {
    datos.notificaciones.push(aviso(s, 'DOCUMENTO_VERIFICADO', 'Solicitud por aprobar', `La solicitud ${s.numero} fue verificada y espera su aprobación.`, false, { paraRolCodigo: 'APROBADOR' }));
  }
  for (const s of porEstado('OBSERVADO')) {
    datos.notificaciones.push(aviso(s, 'DOCUMENTO_OBSERVADO', 'Solicitud observada', `La solicitud ${s.numero} fue observada: revise el comentario y subsane.`, false, { paraUsuarioId: ana.id }));
  }
  for (const s of porEstado('RECHAZADO')) {
    datos.notificaciones.push(aviso(s, 'DOCUMENTO_RECHAZADO', 'Solicitud rechazada', `La solicitud ${s.numero} fue rechazada.`, true, { paraUsuarioId: ana.id }));
  }
  const ultimaAprobada = porEstado('APROBADO').at(-1);
  if (ultimaAprobada) {
    datos.notificaciones.push(aviso(ultimaAprobada, 'DOCUMENTO_APROBADO', 'Solicitud aprobada', `La solicitud ${ultimaAprobada.numero} fue aprobada.`, true, { paraUsuarioId: ana.id }));
  }

  return datos;
}
