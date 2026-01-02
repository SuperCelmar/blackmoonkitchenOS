export enum Category {
  STARTER = 'STARTER',
  MAIN = 'MAIN',
  DESSERT = 'DESSERT',
}

export enum PaymentMethod {
  CARD = 'CARD',
  TICKET_CARD = 'TICKET_CARD',
  CASH = 'CASH',
  PAPER_TICKET = 'PAPER_TICKET',
}

export enum OrderStatus {
  PENDING = 'PENDING',       // Client placed, waiter needs to validate
  VALIDATED = 'VALIDATED',   // Sent to kitchen
  READY = 'READY',           // Kitchen finished
  PAID = 'PAID',             // Transaction complete
}

export enum OrderType {
  DINE_IN = 'DINE_IN',
  TAKEAWAY = 'TAKEAWAY',
}

export interface Table {
  id: string;
  label: string;
  x: number;
  y: number;
  type: 'RECT' | 'ROUND';
}

export interface MenuItem {
  id: string;
  code: string; // Short code for waiters/kitchen
  nameFR: string;
  nameCN: string;
  descriptionFR: string;
  price: number;
  category: Category;
  image: string;
}

export interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

export interface Order {
  id: string;
  tableNumber: string; // If takeaway, this might be a pickup number or empty
  type: OrderType;
  items: OrderItem[];
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  createdAt: number;
}
