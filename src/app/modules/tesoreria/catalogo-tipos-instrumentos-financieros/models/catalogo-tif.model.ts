/**
 * Proceso «Catálogo de tipos de instrumentos financieros» (documento STIF).
 *
 * Una solicitud propone uno o más tipos de instrumento financiero (con sus subtipos). El creador los agrega a la
 * lista, graba y verifica; el aprobador aprueba, observa o rechaza. Al aprobarse, cada tipo pasa a los registros
 * (pestaña Registros) y a la consulta.
 *
 * Nota: campos de la solicitud tomados de la referencia de Figma. Los subtipos usan un subconjunto de campos
 * (código, tipo, abreviatura, descripción) al no haber referencia visual de su formulario — se puede ampliar después.
 */

export const CODIGO_DOCUMENTO = 'STIF';
export const NOMBRE_DOCUMENTO = 'Solicitud de tipos de instrumentos financieros';

/** Entidad rectora del catálogo (fija, no depende de la unidad del creador). */
export const ENTE_RECTOR_TIF = 'Dirección General del Tesoro Público';

export interface SubtipoInstrumentoFinancieroDatos {
  id: string;
  codigo: string;
  tipo: string;
  abreviatura: string;
  descripcion: string;
}

export interface TipoInstrumentoFinancieroDatos {
  id: string;
  codigoTif: string;
  tipo: string;
  abreviatura: string;
  descripcion: string;
  esInstrumentoFinanciero: boolean;
  vigente: boolean;
  /** yyyy-mm-dd */
  fechaDesde: string;
  /** yyyy-mm-dd */
  fechaHasta: string;
  subtipos: SubtipoInstrumentoFinancieroDatos[];
}

/** Un tipo de instrumento financiero aprobado: la pestaña Registros y la consulta. */
export interface CatalogoTifRegistro extends TipoInstrumentoFinancieroDatos {
  /** Código correlativo del registro (TIF-0001). */
  codigo: string;
  estado: 'Activo' | 'Inactivo';
  /** Solicitud que lo creó. */
  documentoId: string;
  numeroDocumento: string;
  /** Fecha de aprobación (ISO). */
  fechaRegistro: string;
}
