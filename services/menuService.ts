import { supabase, MenuItemDB, Category, OrderDB, OrderItemDB, OrderWithItems, ensureAnonymousAuth } from './supabaseClient';
import { MenuItem, Order, OrderItem, OrderStatus, OrderType, PaymentMethod } from '../types';
import { getOrCreateSessionId, getSessionId } from './sessionService';

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
  // Check if user is authenticated (regular user, not anonymous)
  let userId: string | null = null;
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    userId = session.user.id;
  }

  // Get or create session ID for unauthenticated users
  const sessionId = userId ? null : getOrCreateSessionId();

  // Create the order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      table_number: tableNumber || null,
      type: orderType,
      status: 'PENDING',
      payment_method: paymentMethod,
      created_by: userId, // null for unauthenticated users
      session_id: sessionId, // null for authenticated users
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
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id || null;
  
  // Get session ID for unauthenticated users
  const sessionId = userId ? null : getSessionId();
  
  // If neither userId nor sessionId exists, return null
  if (!userId && !sessionId) {
    return null;
  }

  // Build query based on authentication method
  let query = supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        menu_items (*, categories(slug))
      )
    `)
    .in('status', ['PENDING', 'VALIDATED']);

  if (userId) {
    // Authenticated user: query by created_by
    query = query.eq('created_by', userId);
  } else if (sessionId) {
    // Unauthenticated user: query by session_id
    query = query.eq('session_id', sessionId);
  }

  const { data, error } = await query
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
        menu_items (*, categories(slug))
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
  const items: OrderItem[] = ((order.order_items || []) as any[]).map((oi: any) => {
    const categorySlug = oi.menu_items?.categories?.slug || null;
    return {
      menuItem: dbMenuItemToFrontend(oi.menu_items, categorySlug),
      quantity: oi.quantity,
      notes: oi.notes || undefined,
      isPrepared: oi.is_prepared || false,
      orderItemId: oi.id,
    };
  });

  return {
    id: order.id,
    tableNumber: order.table_number,
    type: order.type as OrderType,
    items,
    status: order.status as OrderStatus,
    paymentMethod: order.payment_method as PaymentMethod | null,
    createdAt: new Date(order.created_at).getTime(),
    totalAmount: parseFloat(order.total_amount.toString()),
    numberOfPeople: order.number_of_people || 1,
    mainsStarted: order.mains_started || false,
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

// Update order number of people
export async function updateOrderPeopleCount(orderId: string, numberOfPeople: number): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ number_of_people: numberOfPeople })
    .eq('id', orderId);

  if (error) {
    console.error('Error updating order number of people:', error);
    throw error;
  }
}

// Generic update function for order fields
export async function updateOrder(
  orderId: string,
  updates: { numberOfPeople?: number; tableNumber?: string; status?: OrderStatus; mainsStarted?: boolean }
): Promise<void> {
  const dbUpdates: any = {};
  
  if (updates.numberOfPeople !== undefined) {
    dbUpdates.number_of_people = updates.numberOfPeople;
  }
  if (updates.tableNumber !== undefined) {
    dbUpdates.table_number = updates.tableNumber;
  }
  if (updates.status !== undefined) {
    dbUpdates.status = updates.status;
  }
  if (updates.mainsStarted !== undefined) {
    dbUpdates.mains_started = updates.mainsStarted;
  }

  const { error } = await supabase
    .from('orders')
    .update(dbUpdates)
    .eq('id', orderId);

  if (error) {
    console.error('Error updating order:', error);
    throw error;
  }
}

// Update order item prepared status
export async function updateOrderItemPrepared(orderItemId: string, isPrepared: boolean): Promise<void> {
  const { error } = await supabase
    .from('order_items')
    .update({ is_prepared: isPrepared })
    .eq('id', orderItemId);

  if (error) {
    console.error('Error updating order item prepared status:', error);
    throw error;
  }
}

// Start mains preparation (Pousse signal)
export async function startMains(orderId: string): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ mains_started: true })
    .eq('id', orderId);

  if (error) {
    console.error('Error starting mains:', error);
    throw error;
  }
}

// Subscribe to orders changes
export function subscribeToOrders(
  callback: (order: Order) => void,
  status?: OrderStatus
) {
  const fetchAndCallback = async (orderId: string) => {
    const { data } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          menu_items (*, categories(slug))
        )
      `)
      .eq('id', orderId)
      .single();

    if (data) {
      const frontendOrder = dbOrderToFrontend(data);
      console.log('Processed order update:', {
        id: frontendOrder.id,
        status: frontendOrder.status,
        tableNumber: frontendOrder.tableNumber,
        itemCount: frontendOrder.items.length,
      });
      if (!status || frontendOrder.status === status) {
        callback(frontendOrder);
      }
    } else {
      console.warn('Order not found after realtime event:', orderId);
    }
  };

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
        console.log('Realtime order change received:', {
          eventType: payload.eventType,
          orderId: (payload.new as any)?.id || (payload.old as any)?.id,
          newStatus: (payload.new as any)?.status,
          newTableNumber: (payload.new as any)?.table_number,
        });

        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const orderId = (payload.new as any).id;
          await fetchAndCallback(orderId);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'order_items',
      },
      async (payload) => {
        console.log('Realtime order item change received:', {
          eventType: payload.eventType,
          orderItemId: (payload.new as any)?.id || (payload.old as any)?.id,
          orderId: (payload.new as any)?.order_id || (payload.old as any)?.order_id,
          isPrepared: (payload.new as any)?.is_prepared,
        });

        if (payload.eventType === 'UPDATE') {
          const orderId = (payload.new as any)?.order_id || (payload.old as any)?.order_id;
          if (orderId) {
            await fetchAndCallback(orderId);
          }
        }
      }
    )
    .subscribe((status) => {
      console.log('Realtime subscription status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('Successfully subscribed to orders changes');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('Realtime channel error - check RLS policies and network connection');
      } else if (status === 'TIMED_OUT') {
        console.warn('Realtime subscription timed out');
      } else if (status === 'CLOSED') {
        console.warn('Realtime channel closed');
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}

// Upload image to Supabase Storage
export async function uploadMenuImage(file: File, menuItemId: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${menuItemId}-${Date.now()}.${fileExt}`;
  const filePath = `menu-images/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('menu-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    console.error('Error uploading image:', uploadError);
    throw uploadError;
  }

  // Get public URL
  const { data } = supabase.storage
    .from('menu-images')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

// Fetch today's revenue and orders
export async function fetchTodayRevenue(): Promise<{ total: number; orders: Order[] }> {
  // Check authentication
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Not authenticated. Please log in as dev.');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  console.log('Fetching revenue from:', today.toISOString(), 'to', tomorrow.toISOString());
  console.log('User ID:', session.user.id);

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        menu_items (*, categories(slug))
      )
    `)
    .eq('status', 'PAID')
    .gte('created_at', today.toISOString())
    .lt('created_at', tomorrow.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching today\'s revenue:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error details:', JSON.stringify(error, null, 2));
    throw new Error(`Failed to fetch revenue: ${error.message} (Code: ${error.code})`);
  }

  console.log('Fetched orders count:', data?.length || 0);
  console.log('Raw data sample:', data?.[0] ? JSON.stringify(data[0], null, 2) : 'No data');

  const orders = (data || []).map(dbOrderToFrontend);
  const total = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

  console.log('Total revenue:', total, 'from', orders.length, 'orders');

  return { total, orders };
}

// Fetch all paid orders (for admin aggregation)
export async function fetchAllPaidOrders(): Promise<{ total: number; orders: Order[] }> {
  // Check authentication
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Not authenticated. Please log in as dev.');
  }

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        menu_items (*, categories(slug))
      )
    `)
    .eq('status', 'PAID')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all paid orders:', error);
    throw new Error(`Failed to fetch all paid orders: ${error.message}`);
  }

  const orders = (data || []).map(dbOrderToFrontend);
  const total = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

  return { total, orders };
}

