
export interface Product {
  code: string;
  description: string;
  total: number;
}

export enum MovementType {
  Entrada = 'Entrada',
  Salida = 'Salida',
}

export interface Transaction {
  date: string;
  code: string;
  description: string;
  type: MovementType;
  quantity: number;
  resultingBalance: number;
}
