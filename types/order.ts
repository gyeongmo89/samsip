export interface Supplier {
  id: number;
  name: string;
  contact?: string | null;
  address?: string | null;
}

export interface Item {
  id: number;
  name: string;
  description?: string | null;
  price?: number | null;
}

export interface Unit {
  id: number;
  name: string;
  description?: string | null;
}

export interface Order {
  id: number;
  date: string | null;
  supplier_id: number;
  item_id: number;
  unit_id: number;
  quantity: number;
  price: number;
  total: number;
  payment_cycle: string;
  payment_method: string;
  client: string;
  notes: string | null;
  supplier: Supplier;
  item: Item;
  unit: Unit;
}

export interface OrderFormData {
  date: string;
  supplier_name: string;
  item_name: string;
  unit_name: string;
  quantity: string;
  price: string;
  total: string;
  payment_cycle: string;
  payment_method: string;
  client: string;
  notes: string;
}
