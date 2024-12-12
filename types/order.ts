export interface Supplier {
  id: number;
  name: string;
  contact?: string;
  address?: string;
}

export interface Item {
  id: number;
  name: string;
  description?: string;
}

export interface Unit {
  id: number;
  name: string;
}

export interface OrderFormData {
  supplier_id: string;
  item_id: string;
  unit_id: string;
  price: string;
  quantity: string;
  total: string;
  payment_cycle: string;
  date: string;
  customer: string;
  note: string;
}

export interface OrderData {
  supplier_id: number;
  item_id: number;
  unit_id: number;
  price: number;
  quantity: number;
  total: number;
  payment_cycle: string;
  date: string;
  customer: string;
  note: string;
}
