require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// MySQL pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'warungku',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'API running' });
});

// Products endpoints
app.get('/api/products', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM products');
  res.json(rows);
});

app.post('/api/products', async (req, res) => {
  const { name, price, cost, stock } = req.body;
  const [result] = await pool.query('INSERT INTO products (name, price, cost, stock) VALUES (?, ?, ?, ?)', [name, price, cost, stock]);
  res.json({ id: result.insertId, name, price, cost, stock });
});

app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM products WHERE id = ?', [id]);
  res.json({ success: true });
});

// Transactions endpoints
app.get('/api/transactions', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM transactions ORDER BY date DESC');
  res.json(rows);
});

app.post('/api/transactions', async (req, res) => {
  const { items, total, profit } = req.body;
  const [result] = await pool.query('INSERT INTO transactions (items, total, profit, date) VALUES (?, ?, ?, NOW())', [JSON.stringify(items), total, profit]);
  res.json({ id: result.insertId, items, total, profit, date: new Date() });
});

app.listen(port, () => {
  console.log(`Backend API listening on port ${port}`);
});
