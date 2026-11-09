import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const products = [
  { name: 'Nasi Ayam Geprek', description: 'Ayam crispy, sambal bawang, dan nasi hangat yang bikin nagih.', price: 15000, category: 'Makanan', emoji: '🍗', stock: 20 },
  { name: 'Mie Goreng Spesial', description: 'Mie goreng dengan telur, sayur segar, dan racikan bumbu gurih.', price: 13000, category: 'Makanan', emoji: '🍜', stock: 20 },
  { name: 'Es Teh Manis', description: 'Teh dingin segar dengan rasa manis yang pas.', price: 4000, category: 'Minuman', emoji: '🧊', stock: 30 },
  { name: 'Es Jeruk', description: 'Perasan jeruk asli, dingin, dan menyegarkan.', price: 6000, category: 'Minuman', emoji: '🍊', stock: 30 }
];

try {
  for (const product of products) {
    await prisma.product.upsert({
      where: { name: product.name },
      update: product,
      create: product
    });
  }
  console.log(`Seeded ${products.length} products.`);
} finally {
  await prisma.$disconnect();
}
