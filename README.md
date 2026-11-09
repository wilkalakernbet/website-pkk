# Andras Food

Website katalog makanan dengan React + Vite, Express, dan PostgreSQL.

## Struktur

- `frontend/` - aplikasi React, CSS, dan konfigurasi Vite
- `backend/` - API Express
- `prisma/` - model database dan seed katalog
- `package.json` - script untuk menjalankan keduanya bersama

## Menjalankan

1. Pastikan PostgreSQL aktif, lalu buat database `manatap_oya`.
2. Salin `.env.example` menjadi `.env`, lalu isi username, password, dan port PostgreSQL.
3. Buat tabel dan isi katalog dari Prisma:

```bash
 npm run db:init
```

4. Instal dependensi dan jalankan aplikasi:

```bash
npm install
npm run dev
```

## Admin produk

Klik tombol `Admin` di header website, lalu masukkan password dari `ADMIN_PASSWORD` di `.env`.
Panel admin dapat menambah produk, mengubah harga dan stok, serta menghapus produk. Produk dengan stok `0` otomatis tidak tampil di katalog.

Frontend berjalan di `http://localhost:5173`, API di `http://localhost:3001`.

## Prisma Studio

Untuk membuka GUI database di browser:

```bash
npm run db:studio
```

Buka `http://localhost:5555`. Studio memakai `DATABASE_URL` dari `.env`, sehingga database harus sudah aktif.

Nomor WhatsApp pada frontend dapat diganti di `frontend/src/main.jsx`.
