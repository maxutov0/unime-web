export async function up({ run }){
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      is_admin TINYINT(1) NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);
  await run(`CREATE INDEX idx_users_email ON users(email);`);

  await run(`
    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(64) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
      category VARCHAR(100),
      stock INT NOT NULL DEFAULT 0,
      thumbnail VARCHAR(512),
      images_json TEXT,
      tags_json TEXT,
      rating_avg DECIMAL(4,2) NOT NULL DEFAULT 0.00,
      rating_count INT NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);
  await run(`CREATE INDEX idx_products_category ON products(category);`);

  await run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id VARCHAR(64) NOT NULL,
      author VARCHAR(255),
      rating INT NOT NULL,
      comment TEXT,
      created_at TEXT NOT NULL
    );
  `);
  await run(`CREATE INDEX idx_reviews_product ON reviews(product_id);`);

  await run(`
    CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(64) PRIMARY KEY,
      created_at TEXT NOT NULL,
      user_id INT,
      customer_name VARCHAR(255),
      customer_email VARCHAR(255),
      customer_phone VARCHAR(50),
      customer_address TEXT,
      payment_method VARCHAR(50),
      payment_last4 VARCHAR(4),
      status VARCHAR(50)
    );
  `);
  await run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id VARCHAR(64) NOT NULL,
      product_id VARCHAR(64) NOT NULL,
      qty INT NOT NULL,
      price_snapshot DECIMAL(10,2) NOT NULL
    );
  `);
  await run(`CREATE INDEX idx_order_items_order ON order_items(order_id);`);

  await run(`
    CREATE TABLE IF NOT EXISTS custom_categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE
    );
  `);
}
