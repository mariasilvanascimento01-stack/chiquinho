PRAGMA foreign_keys = ON;

BEGIN IMMEDIATE;

CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
    old_price_cents INTEGER CHECK (old_price_cents IS NULL OR old_price_cents >= price_cents),
    image_path TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 60),
    email TEXT NOT NULL COLLATE NOCASE UNIQUE,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS coupons (
    code TEXT PRIMARY KEY COLLATE NOCASE,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'points')),
    discount_value INTEGER NOT NULL CHECK (discount_value > 0),
    minimum_order_cents INTEGER NOT NULL DEFAULT 0 CHECK (minimum_order_cents >= 0),
    requires_points INTEGER NOT NULL DEFAULT 0 CHECK (requires_points IN (0, 1)),
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    expires_at TEXT
);

CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT NOT NULL UNIQUE,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'confirmed', 'preparing', 'completed', 'cancelled')),
    coupon_code TEXT REFERENCES coupons(code) ON DELETE SET NULL,
    subtotal_cents INTEGER NOT NULL CHECK (subtotal_cents >= 0),
    discount_cents INTEGER NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
    total_cents INTEGER NOT NULL CHECK (total_cents >= 0 AND total_cents = subtotal_cents - discount_cents),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    line_total_cents INTEGER NOT NULL CHECK (line_total_cents = unit_price_cents * quantity)
);

CREATE TABLE IF NOT EXISTS customer_points (
    customer_id INTEGER PRIMARY KEY REFERENCES customers(id) ON DELETE CASCADE,
    balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS point_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    points_delta INTEGER NOT NULL CHECK (points_delta <> 0),
    reason TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS coupon_redemptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    coupon_code TEXT NOT NULL REFERENCES coupons(code),
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    redeemed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    UNIQUE (coupon_code, order_id)
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_created
    ON orders(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status_created
    ON orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order
    ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_customer
    ON point_transactions(customer_id, created_at DESC);

INSERT OR IGNORE INTO products (id, name, description, price_cents, old_price_cents, image_path) VALUES
    ('casquinhas', 'Casquinhas', 'Leve, crocante e com aquele sorvete cremoso que todo mundo ama.', 499, 600, 'CAS.jpg'),
    ('cascao', 'Cascões', 'Uma casquinha ainda mais especial para saborear sem pressa.', 749, 900, 'casss.png'),
    ('big-sundae', 'Big Sundae', 'Camadas de sabor, calda deliciosa e muitos pedacinhos.', 1499, 1800, 'BIGSUNDAE.jpg'),
    ('milk-shake', 'Milk Shakes', 'Bem geladinho, cremoso e perfeito para qualquer hora.', 1699, 2000, 'MILK.jpg'),
    ('shake-mix', 'Shake Mix', 'A mistura irresistível de sorvete com seus complementos favoritos.', 1899, 2200, 'SHAMIX.jpg'),
    ('top-mix', 'Top Mix', 'Sorvete cremoso com uma combinação deliciosa de texturas.', 2299, 2700, 'TOPMIX.jpg');

INSERT OR IGNORE INTO coupons (code, discount_type, discount_value, minimum_order_cents, requires_points) VALUES
    ('DOCE10', 'percentage', 10, 0, 0),
    ('SORVETE5', 'fixed', 500, 2500, 0),
    ('PONTOS5', 'points', 500, 2500, 1);

PRAGMA user_version = 1;

COMMIT;
