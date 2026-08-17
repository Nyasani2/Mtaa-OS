-- Create storage bucket for product images (run in Supabase)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('shop-products', 'shop-products', true)
ON CONFLICT (id) DO NOTHING;

-- If shop_products table doesn't exist, create it:
/*
CREATE TABLE IF NOT EXISTS shop_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  stock_quantity integer NOT NULL DEFAULT 0,
  images text[],
  barcode text,
  category text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
*/
