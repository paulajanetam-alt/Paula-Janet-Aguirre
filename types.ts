
export interface Instrumento {
  id: number;
  nombre: string;
  tipo: string;
  eje: string;
  inicio: number;
  fin: number | string;
  temporalidad: number | string;
  estado: string;
  seguimiento: string;
  observatorio?: string;
  actualizado?: string;
  enlace?: string;
  pdf_informe?: string;
  excel_link?: string;
}
