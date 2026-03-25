-- Tabel produk
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price INT NOT NULL,
  cost INT NOT NULL,
  stock INT NOT NULL
);

-- Tabel transaksi
CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  items JSON NOT NULL,
  total INT NOT NULL,
  profit INT NOT NULL,
  date DATETIME NOT NULL
);
