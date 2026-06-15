
-- PRODUCTS
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  image_url TEXT NOT NULL,
  category TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are publicly readable" ON public.products FOR SELECT USING (true);

-- CART
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;
GRANT ALL ON public.cart_items TO service_role;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own cart" ON public.cart_items FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ORDERS
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  shipping_name TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ORDER ITEMS
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  product_image TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  quantity INTEGER NOT NULL
);
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own order items" ON public.order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
CREATE POLICY "Users insert own order items" ON public.order_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

-- SEED PRODUCTS
INSERT INTO public.products (name, description, price_cents, image_url, category, stock) VALUES
('Aurora Wireless Headphones', 'Studio-grade over-ear headphones with active noise cancellation and 40-hour battery life. Crisp highs, deep lows, all-day comfort.', 24900, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80', 'Audio', 50),
('Nimbus Smart Watch', 'A featherlight smartwatch with always-on AMOLED, GPS, and health tracking. Built to last a week on one charge.', 32900, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80', 'Wearables', 40),
('Echo Bluetooth Speaker', 'Portable, waterproof speaker that fills any room with 360° sound. 24 hours of playback.', 8900, 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=80', 'Audio', 80),
('Lumen Desk Lamp', 'Minimalist LED desk lamp with adjustable warmth and brightness. Touch controls, wireless charging base.', 11900, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80', 'Home', 60),
('Vault Leather Wallet', 'Hand-stitched full-grain leather wallet with RFID blocking. Ages beautifully with daily use.', 6900, 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=80', 'Accessories', 100),
('Drift Backpack', 'Weather-resistant 20L commuter backpack with laptop sleeve and hidden security pocket.', 14900, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80', 'Bags', 70),
('Pixel Mechanical Keyboard', 'Hot-swappable 75% mechanical keyboard with PBT keycaps and per-key RGB.', 17900, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80', 'Computing', 35),
('Mist Ceramic Mug Set', 'Set of four hand-thrown ceramic mugs in soft matte glazes. Microwave and dishwasher safe.', 4900, 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800&q=80', 'Home', 90);
