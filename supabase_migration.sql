-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('guest', 'waiter', 'admin', 'chef');
CREATE TYPE order_status AS ENUM ('PENDING', 'VALIDATED', 'READY', 'PAID');
CREATE TYPE order_type AS ENUM ('DINE_IN', 'TAKEAWAY');
CREATE TYPE payment_method AS ENUM ('CARD', 'TICKET_CARD', 'CASH', 'PAPER_TICKET');

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'guest',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_fr TEXT NOT NULL,
  name_en TEXT,
  slug TEXT UNIQUE NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu items table
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name_fr TEXT NOT NULL,
  name_cn TEXT,
  description_fr TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  image_url TEXT,
  is_popular BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_number TEXT,
  type order_type NOT NULL,
  status order_status NOT NULL DEFAULT 'PENDING',
  payment_method payment_method,
  total_amount DECIMAL(10, 2) DEFAULT 0 CHECK (total_amount >= 0),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  validated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items table (junction table)
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_menu_items_category ON menu_items(category_id);
CREATE INDEX idx_menu_items_available ON menu_items(is_available) WHERE is_available = TRUE;
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_menu_item ON order_items(menu_item_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate order total
CREATE OR REPLACE FUNCTION calculate_order_total(order_uuid UUID)
RETURNS DECIMAL(10, 2) AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(quantity * unit_price) FROM order_items WHERE order_id = order_uuid),
    0
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger to update order total when order_items change
CREATE OR REPLACE FUNCTION update_order_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE orders
  SET total_amount = calculate_order_total(COALESCE(NEW.order_id, OLD.order_id))
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_order_total_on_items_change
  AFTER INSERT OR UPDATE OR DELETE ON order_items
  FOR EACH ROW EXECUTE FUNCTION update_order_total();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Service role can manage all profiles"
  ON profiles FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Categories policies (public read)
CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin')
    )
  );

-- Menu items policies (public read)
CREATE POLICY "Anyone can view available menu items"
  ON menu_items FOR SELECT
  USING (is_available = TRUE);

CREATE POLICY "Admins can view all menu items"
  ON menu_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'chef')
    )
  );

CREATE POLICY "Admins can manage menu items"
  ON menu_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin')
    )
  );

-- Orders policies
-- Allow authenticated users (including anonymous) to create orders
CREATE POLICY "Users can create orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to see their own orders (covers anonymous users)
CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('waiter', 'admin', 'chef')
    )
  );

CREATE POLICY "Waiters and admins can update orders"
  ON orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('waiter', 'admin')
    )
  );

CREATE POLICY "Chefs can update order status"
  ON orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('chef', 'admin')
    )
  );

-- Order items policies
-- Allow authenticated users to create order items for their orders
CREATE POLICY "Users can create order items for their orders"
  ON order_items FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.created_by = auth.uid()
    )
  );

-- Allow users to view order items for accessible orders
CREATE POLICY "Users can view order items for accessible orders"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (
        orders.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('waiter', 'admin', 'chef')
        )
      )
    )
  );

CREATE POLICY "Waiters and admins can update order items"
  ON order_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('waiter', 'admin')
    )
  );

CREATE POLICY "Waiters and admins can delete order items"
  ON order_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('waiter', 'admin')
    )
  );

