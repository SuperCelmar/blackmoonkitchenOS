// Re-export types from Supabase client for consistency
export type { 
  UserRole, 
  OrderStatus, 
  OrderType, 
  PaymentMethod,
  Profile,
  Category,
  MenuItem as MenuItemDB,
  Order as OrderDB,
  OrderItem as OrderItemDB,
  OrderWithItems
} from './services/supabaseClient';

// Legacy enums for backward compatibility
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

// Frontend-friendly MenuItem (adapted from DB)
export interface MenuItem {
  id: string;
  code: string;
  nameFR: string;
  nameCN: string | null;
  descriptionFR: string | null;
  price: number;
  category: string | null; // category slug or id
  image: string | null;
  isPopular: boolean;
  isAvailable: boolean;
}

// Frontend OrderItem
export interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

// Frontend Order (adapted from DB)
export interface Order {
  id: string;
  tableNumber: string | null;
  type: OrderType;
  items: OrderItem[];
  status: OrderStatus;
  paymentMethod?: PaymentMethod | null;
  createdAt: number;
  totalAmount?: number;
}
