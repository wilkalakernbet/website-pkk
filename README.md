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

## Alur pesanan

- Pelanggan mengisi nama dan memilih `Ambil sendiri` atau `Diantar` dari keranjang.
- Pengantaran hanya menerima alamat sekitar `Citra Indah City` dan otomatis menambah ongkir Rp2.000.
- Setelah dikirim ke WhatsApp, pesanan tersimpan sebagai pesanan menunggu proses. Stok belum dipotong pada tahap ini.
- Setelah pembayaran dikonfirmasi melalui WhatsApp, admin membuka panel `Admin`, mengecek pesanan, lalu klik `Proses`. Pada tahap ini stok dipotong secara atomik.
- Invoice dapat dicetak dari pesanan. Pada dialog cetak browser, pilih `Save as PDF` untuk menyimpan invoice sebagai PDF.

Jika schema database sudah ada sebelum fitur pesanan ditambahkan, jalankan:

```bash
npm run db:push
```

Frontend berjalan di `http://localhost:5173`, API di `http://localhost:3001`.

## Deploy ke Vercel

Database PostgreSQL lokal tidak dapat diakses dari Vercel. Gunakan PostgreSQL online seperti Neon, lalu tambahkan environment variables berikut di project Vercel:

```text
DATABASE_URL=URL_POSTGRESQL_ONLINE
ADMIN_PASSWORD=password-admin
WHATSAPP_NUMBER=nomor-whatsapp
```

Setelah itu jalankan `prisma db push` dan `prisma db seed` menggunakan `DATABASE_URL` online, lalu deploy ulang. Backend sudah tersedia sebagai Vercel Function pada `/api`.

## Prisma Studio

Untuk membuka GUI database di browser:

```bash
npm run db:studio
```

Buka `http://localhost:5555`. Studio memakai `DATABASE_URL` dari `.env`, sehingga database harus sudah aktif.

Nomor WhatsApp pada frontend dapat diganti di `frontend/src/main.jsx`.
