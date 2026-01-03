import { supabase, MenuItemDB, Category, OrderDB, OrderItemDB, OrderWithItems, ensureAnonymousAuth } from './supabaseClient';
import { MenuItem, Order, OrderItem, OrderStatus, OrderType, PaymentMethod } from '../types';

// Convert DB MenuItem to frontend MenuItem
export function dbMenuItemToFrontend(item: MenuItemDB, categorySlug?: string | null): MenuItem {
  return {
    id: item.id,
    code: item.code,
    nameFR: item.name_fr,
    nameCN: item.name_cn,
    descriptionFR: item.description_fr,
    price: parseFloat(item.price.toString()),
    category: categorySlug || item.category_id || null,
    image: item.image_url,
    isPopular: item.is_popular,
    isAvailable: item.is_available,
  };
}

// Fetch all menu items
export async function fetchMenuItems(): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from('menu_items')
    .select(`
      *,
      categories!inner(slug)
    `)
    .eq('is_available', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching menu items:', error);
    throw error;
  }

  return (data || []).map((item: any) => {
    const categorySlug = item.categories?.slug || null;
    return dbMenuItemToFrontend(item, categorySlug);
  });
}

// Fetch menu items by category slug
export async function fetchMenuItemsByCategory(categorySlug: string): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from('menu_items')
    .select(`
      *,
      categories!inner(slug)
    `)
    .eq('is_available', true)
    .eq('categories.slug', categorySlug)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching menu items by category:', error);
    throw error;
  }

  return (data || []).map((item: any) => dbMenuItemToFrontend(item, categorySlug));
}

// Fetch all categories
export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }

  return data || [];
}

// Fetch all menu items (including unavailable ones) for admin
export async function fetchAllMenuItems(): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from('menu_items')
    .select(`
      *,
      categories(slug)
    `)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching all menu items:', error);
    throw error;
  }

  return (data || []).map((item: any) => {
    const categorySlug = item.categories?.slug || null;
    return dbMenuItemToFrontend(item, categorySlug);
  });
}

// Update menu items (bulk upsert)
export async function updateMenuItems(items: MenuItem[]): Promise<void> {
  // First, fetch all categories to map slugs to IDs
  const categories = await fetchCategories();
  const categoryMap = new Map<string, string>();
  categories.forEach(cat => {
    categoryMap.set(cat.slug, cat.id);
  });

  // Separate new items (timestamp IDs) from existing items (UUIDs)
  const newItems: MenuItem[] = [];
  const existingItems: MenuItem[] = [];
  
  items.forEach(item => {
    // Check if ID is a timestamp (new item created in admin panel)
    const isNewItem = /^\d+$/.test(item.id);
    if (isNewItem) {
      newItems.push(item);
    } else {
      existingItems.push(item);
    }
  });

  // Convert frontend MenuItems to DB format
  const convertToDB = (item: MenuItem, includeId: boolean) => {
    const categoryId = item.category ? categoryMap.get(item.category) || null : null;
    
    const dbItem: any = {
      code: item.code,
      name_fr: item.nameFR,
      name_cn: item.nameCN || null,
      description_fr: item.descriptionFR || null,
      price: item.price,
      category_id: categoryId,
      image_url: item.image || null,
      is_popular: item.isPopular,
      is_available: item.isAvailable,
    };

    if (includeId) {
      dbItem.id = item.id;
    }

    return dbItem;
  };

  // Update existing items using upsert with id as conflict target
  if (existingItems.length > 0) {
    const dbExistingItems = existingItems.map(item => convertToDB(item, true));
    const { error: updateError } = await supabase
      .from('menu_items')
      .upsert(dbExistingItems, {
        onConflict: 'id',
      });

    if (updateError) {
      console.error('Error updating existing menu items:', updateError);
      throw updateError;
    }
  }

  // Insert new items (without ID, let Supabase generate UUID)
  if (newItems.length > 0) {
    const dbNewItems = newItems.map(item => convertToDB(item, false));
    const { error: insertError } = await supabase
      .from('menu_items')
      .insert(dbNewItems);

    if (insertError) {
      console.error('Error inserting new menu items:', insertError);
      throw insertError;
    }
  }
}

// Create an order
export async function createOrder(
  items: OrderItem[],
  paymentMethod: PaymentMethod,
  orderType: OrderType,
  tableNumber?: string | null
): Promise<OrderDB> {
  // Try to ensure user is authenticated (anonymous or regular)
  // If anonymous auth is disabled, we'll proceed without user ID
  let userId: string | null = null;
  try {
    userId = await ensureAnonymousAuth();
  } catch (authError: any) {
    // If anonymous auth is disabled, log warning but continue
    // The order will be created without a user association
    console.warn('Anonymous authentication disabled or failed:', authError.message);
    // Check if we have an existing session
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      userId = session.user.id;
    }
  }

  // Create the order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      table_number: tableNumber || null,
      type: orderType,
      status: 'PENDING',
      payment_method: paymentMethod,
      created_by: userId, // May be null if auth is disabled
    })
    .select()
    .single();

  if (orderError) {
    console.error('Error creating order:', orderError);
    throw orderError;
  }

  // Create order items
  const orderItems = items.map(item => ({
    order_id: order.id,
    menu_item_id: item.menuItem.id,
    quantity: item.quantity,
    unit_price: item.menuItem.price,
    notes: item.notes || null,
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) {
    console.error('Error creating order items:', itemsError);
    throw itemsError;
  }

  return order;
}

// Fetch the current user's active order (PENDING or VALIDATED status)
export async function fetchActiveOrder(): Promise<Order | null> {
  // Try to get user ID, but don't fail if anonymous auth is disabled
  let userId: string | null = null;
  try {
    userId = await ensureAnonymousAuth();
  } catch (authError: any) {
    // If anonymous auth is disabled, check for existing session
    console.warn('Anonymous authentication disabled or failed:', authError.message);
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      userId = session.user.id;
    } else {
      // No user session, return null (no active order)
      return null;
    }
  }

  // If we still don't have a user ID, return null
  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        menu_items (*)
      )
    `)
    .eq('created_by', userId)
    .in('status', ['PENDING', 'VALIDATED'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching active order:', error);
    throw error;
  }

  if (!data) {
    return null;
  }

  return dbOrderToFrontend(data);
}

// Fetch orders with items
export async function fetchOrdersWithItems(status?: OrderStatus): Promise<Order[]> {
  let query = supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        menu_items (*)
      )
    `)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }

  return (data || []).map(dbOrderToFrontend);
}

// Convert DB Order to frontend Order
function dbOrderToFrontend(order: any): Order {
  const items: OrderItem[] = ((order.order_items || []) as any[]).map((oi: any) => ({
    menuItem: dbMenuItemToFrontend(oi.menu_items, null),
    quantity: oi.quantity,
    notes: oi.notes || undefined,
  }));

  return {
    id: order.id,
    tableNumber: order.table_number,
    type: order.type as OrderType,
    items,
    status: order.status as OrderStatus,
    paymentMethod: order.payment_method as PaymentMethod | null,
    createdAt: new Date(order.created_at).getTime(),
    totalAmount: parseFloat(order.total_amount.toString()),
  };
}

// Update order status
export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId);

  if (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
}

// Update order table number
export async function updateOrderTable(orderId: string, tableNumber: string): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ table_number: tableNumber })
    .eq('id', orderId);

  if (error) {
    console.error('Error updating order table:', error);
    throw error;
  }
}

// Subscribe to orders changes
export function subscribeToOrders(
  callback: (order: Order) => void,
  status?: OrderStatus
) {
  const channel = supabase
    .channel('orders_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
      },
      async (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const orderId = (payload.new as any).id;
          const { data } = await supabase
            .from('orders')
            .select(`
              *,
              order_items (
                *,
                menu_items (*)
              )
            `)
            .eq('id', orderId)
            .single();

          if (data) {
            const frontendOrder = dbOrderToFrontend(data);
            if (!status || frontendOrder.status === status) {
              callback(frontendOrder);
            }
          }
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

