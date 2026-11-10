import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

process.env.DATABASE_URL ||= process.env.POSTGRES_PRISMA_URL;

const app = express();
const port = process.env.PORT || 3001;
const prisma = new PrismaClient();
const adminPassword = process.env.ADMIN_PASSWORD;

app.use(cors());
app.use(express.json({ limit: '8mb' }));

app.get(['/api/health', '/health'], async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  } catch {
    res.status(503).json({ ok: false, message: 'Database belum terhubung.' });
  }
});

app.get(['/api/products', '/products'], async (_req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const products = await prisma.product.findMany({
      where: { isAvailable: true, stock: { gt: 0 } },
      orderBy: [{ category: 'asc' }, { id: 'asc' }],
      select: { id: true, name: true, description: true, price: true, category: true, emoji: true, stock: true, imageUrl: true }
    });
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal mengambil katalog.' });
  }
});

app.post(['/api/orders', '/orders'], async (req, res) => {
  try {
    const customerName = String(req.body.customerName || '').trim();
    const method = req.body.method === 'DELIVERY' ? 'DELIVERY' : req.body.method === 'PICKUP' ? 'PICKUP' : '';
    const address = String(req.body.address || '').trim();
    const requestedItems = Array.isArray(req.body.items) ? req.body.items : [];
    const quantities = new Map();
    requestedItems.forEach((item) => {
      const id = Number(item.id);
      const quantity = Number(item.quantity);
      if (Number.isInteger(id) && Number.isInteger(quantity) && quantity > 0) {
        quantities.set(id, (quantities.get(id) || 0) + quantity);
      }
    });

    if (!customerName) return res.status(400).json({ message: 'Nama wajib diisi.' });
    if (!method) return res.status(400).json({ message: 'Pilih metode pesanan.' });
    if (method === 'DELIVERY' && (!address || !/citra\s+indah\s+city/i.test(address))) {
      return res.status(400).json({ message: 'Pengantaran hanya tersedia di sekitar Citra Indah City.' });
    }
    if (!quantities.size) return res.status(400).json({ message: 'Pesanan kosong.' });

    const products = await prisma.product.findMany({ where: { id: { in: [...quantities.keys()] }, isAvailable: true } });
    if (products.length !== quantities.size) return res.status(409).json({ message: 'Ada produk yang sudah tidak tersedia.' });
    const items = products.map((product) => ({ productId: product.id, productName: product.name, price: product.price, quantity: quantities.get(product.id) }));
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFee = method === 'DELIVERY' ? 2000 : 0;
    const order = await prisma.order.create({
      data: { customerName, method, address: method === 'DELIVERY' ? address : null, deliveryFee, subtotal, total: subtotal + deliveryFee, items: { create: items } },
      include: { items: true }
    });
    res.status(201).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal menyimpan pesanan.' });
  }
});

const requireAdmin = (req, res, next) => {
  if (!adminPassword || req.headers['x-admin-password'] !== adminPassword) {
    return res.status(401).json({ message: 'Password admin salah atau belum diatur.' });
  }
  next();
};

app.get(['/api/admin/orders', '/admin/orders'], requireAdmin, async (_req, res) => {
  try {
    const orders = await prisma.order.findMany({ include: { items: true }, orderBy: { createdAt: 'desc' } });
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal mengambil pesanan.' });
  }
});

app.post(['/api/admin/orders/:id/process', '/admin/orders/:id/process'], requireAdmin, async (req, res) => {
  try {
    const order = await prisma.$transaction(async (transaction) => {
      const current = await transaction.order.findUnique({ where: { id: Number(req.params.id) }, include: { items: true } });
      if (!current) throw new Error('ORDER_NOT_FOUND');
      if (current.status !== 'PENDING') throw new Error('ORDER_ALREADY_PROCESSED');
      for (const item of current.items) {
        const result = await transaction.product.updateMany({
          where: { id: item.productId, isAvailable: true, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } }
        });
        if (result.count !== 1) throw new Error('STOCK_NOT_ENOUGH');
      }
      return transaction.order.update({ where: { id: current.id }, data: { status: 'PROCESSED', processedAt: new Date() }, include: { items: true } });
    });
    res.json(order);
  } catch (error) {
    const messages = { ORDER_NOT_FOUND: ['Pesanan tidak ditemukan.', 404], ORDER_ALREADY_PROCESSED: ['Pesanan sudah diproses.', 409], STOCK_NOT_ENOUGH: ['Stok tidak cukup untuk memproses pesanan ini.', 409] };
    if (messages[error.message]) return res.status(messages[error.message][1]).json({ message: messages[error.message][0] });
    console.error(error);
    res.status(500).json({ message: 'Gagal memproses pesanan.' });
  }
});

app.get(['/api/admin/products', '/admin/products'], requireAdmin, async (_req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const products = await prisma.product.findMany({ orderBy: { id: 'asc' } });
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal mengambil produk admin.' });
  }
});

app.post(['/api/admin/products', '/admin/products'], requireAdmin, async (req, res) => {
  try {
    const { name, description, price, category, emoji, stock, imageUrl } = req.body;
    const numericStock = Number(stock);
    if (!name || !description || !category || !emoji || !Number.isInteger(numericStock) || numericStock < 0) {
      return res.status(400).json({ message: 'Data produk atau stok tidak valid.' });
    }
    const product = await prisma.product.create({
      data: { name, description, price: Number(price), category, emoji, stock: numericStock, imageUrl: imageUrl || null, isAvailable: numericStock > 0 }
    });
    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Gagal menambah produk.' });
  }
});

app.put(['/api/admin/products/:id', '/admin/products/:id'], requireAdmin, async (req, res) => {
  try {
    const { name, description, price, category, emoji, stock, imageUrl } = req.body;
    const product = await prisma.product.update({
      where: { id: Number(req.params.id) },
      data: { name, description, price: Number(price), category, emoji, stock: Number(stock), imageUrl: imageUrl || null, isAvailable: Number(stock) > 0 }
    });
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Gagal memperbarui produk.' });
  }
});

app.delete(['/api/admin/products/:id', '/admin/products/:id'], requireAdmin, async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Gagal menghapus produk.' });
  }
});
if (!process.env.VERCEL) {
  app.listen(port, () => console.log(`API berjalan di http://localhost:${port}`));
}

export default app;
