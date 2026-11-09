import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const port = process.env.PORT || 3001;
const prisma = new PrismaClient();
const adminPassword = process.env.ADMIN_PASSWORD;

app.use(cors());
app.use(express.json({ limit: '8mb' }));

app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  } catch {
    res.status(503).json({ ok: false, message: 'Database belum terhubung.' });
  }
});

app.get('/api/products', async (_req, res) => {
  try {
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

const requireAdmin = (req, res, next) => {
  if (!adminPassword || req.headers['x-admin-password'] !== adminPassword) {
    return res.status(401).json({ message: 'Password admin salah atau belum diatur.' });
  }
  next();
};

app.get('/api/admin/products', requireAdmin, async (_req, res) => {
  try {
    const products = await prisma.product.findMany({ orderBy: { id: 'asc' } });
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal mengambil produk admin.' });
  }
});

app.post('/api/admin/products', requireAdmin, async (req, res) => {
  try {
    const { name, description, price, category, emoji, stock, imageUrl } = req.body;
    const product = await prisma.product.create({
      data: { name, description, price: Number(price), category, emoji, stock: Number(stock), imageUrl: imageUrl || null }
    });
    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Gagal menambah produk.' });
  }
});

app.put('/api/admin/products/:id', requireAdmin, async (req, res) => {
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

app.delete('/api/admin/products/:id', requireAdmin, async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Gagal menghapus produk.' });
  }
});
app.listen(port, () => console.log(`API berjalan di http://localhost:${port}`));
