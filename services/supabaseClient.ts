import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Ensures the user is signed in anonymously.
 * If no session exists, signs in anonymously.
 * Returns the user ID.
 */
export async function ensureAnonymousAuth(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.user) {
    return session.user.id;
  }

  // Sign in anonymously
  const { data, error } = await supabase.auth.signInAnonymously();
  
  if (error) {
    console.error('Error signing in anonymously:', error);
    throw error;
  }

  if (!data.user) {
    throw new Error('Failed to sign in anonymously: no user returned');
  }

  return data.user.id;
}

// Database types
export type UserRole = 'guest' | 'waiter' | 'admin' | 'chef';
export type OrderStatus = 'PENDING' | 'VALIDATED' | 'READY' | 'PAID';
export type OrderType = 'DINE_IN' | 'TAKEAWAY';
export type PaymentMethod = 'CARD' | 'TICKET_CARD' | 'CASH' | 'PAPER_TICKET';

export interface Profile {
  id: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name_fr: string;
  name_en: string | null;
  name_cn: string | null;
  slug: string;
  display_order: number;
  created_at: string;
}

export interface MenuItem {
  id: string;
  code: string;
  name_fr: string;
  name_cn: string | null;
  description_fr: string | null;
  price: number;
  category_id: string | null;
  image_url: string | null;
  is_popular: boolean;
  is_available: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  table_number: string | null;
  type: OrderType;
  status: OrderStatus;
  payment_method: PaymentMethod | null;
  total_amount: number;
  created_by: string | null;
  validated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  notes: string | null;
  created_at: string;
}

export interface OrderWithItems extends Order {
  order_items: (OrderItem & { menu_items: MenuItem })[];
}

