import { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '6282380286646';
const fallbackProducts = [
  { id: 1, name: 'Nasi Ayam Geprek', description: 'Ayam crispy, sambal bawang, dan nasi hangat yang bikin nagih.', price: 15000, category: 'Makanan', emoji: '🍗' },
  { id: 2, name: 'Mie Goreng Spesial', description: 'Mie goreng dengan telur, sayur segar, dan racikan bumbu gurih.', price: 13000, category: 'Makanan', emoji: '🍜' },
  { id: 3, name: 'Es Teh Manis', description: 'Teh dingin segar dengan rasa manis yang pas.', price: 4000, category: 'Minuman', emoji: '🧊' },
  { id: 4, name: 'Es Jeruk', description: 'Perasan jeruk asli, dingin, dan menyegarkan.', price: 6000, category: 'Minuman', emoji: '🍊' }
];

const formatPrice = (price) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price);

const emptyProduct = { name: '', description: '', price: 0, category: 'Makanan', emoji: '🍽️', stock: 0 };

function AdminPanel({ onClose }) {
  const [password, setPassword] = useState('');
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('Masukkan password admin untuk masuk.');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const request = (url, options = {}) => fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', 'x-admin-password': password, ...options.headers }
  });

  const loadProducts = () => request('/api/admin/products').then(async (response) => {
    if (!response.ok) throw new Error((await response.json()).message);
    setProducts(await response.json());
    setIsLoggedIn(true);
    setMessage('');
  }).catch((error) => setMessage(error.message));

  const submit = (event) => {
    event.preventDefault();
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/admin/products/${editingId}` : '/api/admin/products';
    request(url, { method, body: JSON.stringify({ ...form, price: Number(form.price), stock: Number(form.stock) }) })
      .then(async (response) => {
        if (!response.ok) throw new Error((await response.json()).message);
        setForm(emptyProduct);
        setEditingId(null);
        setMessage('Produk berhasil disimpan.');
        loadProducts();
      }).catch((error) => setMessage(error.message));
  };

  const remove = (product) => {
    if (!window.confirm(`Hapus ${product.name}?`)) return;
    request(`/api/admin/products/${product.id}`, { method: 'DELETE' })
      .then((response) => {
        if (!response.ok) throw new Error('Produk gagal dihapus.');
        loadProducts();
      }).catch((error) => setMessage(error.message));
  };

  const chooseImage = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return setMessage('File harus berupa gambar.');
    if (file.size > 5 * 1024 * 1024) return setMessage('Ukuran gambar maksimal 5 MB.');
    const reader = new FileReader();
    reader.onload = () => setForm((current) => ({ ...current, imageUrl: reader.result }));
    reader.readAsDataURL(file);
  };

  return <div className="admin-backdrop" onClick={onClose}><section className="admin-panel" onClick={(event) => event.stopPropagation()}>
    <div className="drawer-head"><div><p className="eyebrow">PENGELOLAAN TOKO</p><h2>Admin Andras Food</h2></div><button onClick={onClose} aria-label="Tutup admin">×</button></div>
    {!isLoggedIn ? <form className="admin-login" onSubmit={(event) => { event.preventDefault(); loadProducts(); }}><p>{message}</p><label>Password admin<small>Masukkan password admin toko.</small><span className="password-field"><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoFocus /><button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Sembunyikan' : 'Lihat'}</button></span></label><button className="primary-button" type="submit">Masuk <span>↗</span></button></form> : <>
      <form className="admin-form" onSubmit={submit}><h3>{editingId ? 'Edit produk' : 'Tambah produk'}</h3><label>Nama produk<small>Contoh: Nasi Ayam Geprek</small><input placeholder="Tulis nama menu" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label><label>Deskripsi<small>Jelaskan isi atau ciri khas menu secara singkat.</small><textarea placeholder="Contoh: Ayam crispy dengan sambal bawang" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required /></label><div className="admin-fields"><label>Harga<small>Dalam rupiah, tanpa titik.</small><input type="number" placeholder="15000" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} min="0" required /></label><label>Kategori<small>Contoh: Makanan atau Minuman</small><input placeholder="Makanan" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} required /></label><label>Emoji<small>Dipakai jika belum ada foto.</small><input placeholder="🍗" value={form.emoji} onChange={(event) => setForm({ ...form, emoji: event.target.value })} required /></label><label>Stok<small>Jumlah yang tersedia.</small><input type="number" placeholder="20" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} min="0" required /></label></div><label>Foto produk<small>Format JPG, PNG, atau WEBP. Maksimal 5 MB.</small><input type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseImage} /></label>{form.imageUrl && <img className="admin-image-preview" src={form.imageUrl} alt="Pratinjau produk" />}<div className="admin-actions"><button className="primary-button" type="submit">{editingId ? 'Simpan perubahan' : 'Tambah produk'}</button>{editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyProduct); }}>Batal</button>}</div></form>
      <p className="admin-message">{message}</p><div className="admin-products">{products.map((product) => <div className="admin-product" key={product.id}><span className="admin-emoji">{product.emoji}</span><div><strong>{product.name}</strong><small>{formatPrice(product.price)} · Stok: {product.stock}</small></div><button onClick={() => { setEditingId(product.id); setForm(product); }}>Edit</button><button className="danger-button" onClick={() => remove(product)}>Hapus</button></div>)}</div>
    </>}
  </section></div>;
}

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});
  const [category, setCategory] = useState('Semua');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [apiMessage, setApiMessage] = useState('');
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  useEffect(() => {
    fetch('/api/products')
      .then((response) => {
        if (!response.ok) throw new Error('API belum siap');
        return response.json();
      })
      .then(setProducts)
      .catch(() => {
        setProducts(fallbackProducts);
        setApiMessage('Menampilkan menu contoh. Hubungkan PostgreSQL untuk memuat katalog.');
      });
  }, []);

  const categories = ['Semua', ...new Set(products.map((product) => product.category))];
  const visibleProducts = products.filter((product) => category === 'Semua' || product.category === category);
  const cartItems = Object.values(cart);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const updateCart = (product, change) => {
    setCart((current) => {
      const nextQuantity = (current[product.id]?.quantity || 0) + change;
      const next = { ...current };
      if (nextQuantity <= 0) delete next[product.id];
      else next[product.id] = { ...product, quantity: nextQuantity };
      return next;
    });
  };

  const message = useMemo(() => {
    const lines = cartItems.map((item) => `${item.quantity}x ${item.name} - ${formatPrice(item.price * item.quantity)}`);
    return `Halo Andras Food, saya mau pesan:\n\n${lines.join('\n')}\n\nTotal: ${formatPrice(totalPrice)}\n\nNama:\nAlamat / ambil sendiri:`;
  }, [cartItems, totalPrice]);

  const checkout = () => {
    if (!cartItems.length) return;
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <header className="site-header">
        <a className="brand" href="#beranda"><span className="brand-mark">A</span><span>Andras <em>Food</em></span></a>
        <nav><a href="#menu">Menu</a><a href="#cerita">Cerita Kami</a><a href="#pesan">Cara Pesan</a><a href="#kontak">Kontak</a></nav>
        <div className="header-actions"><button className="admin-button" onClick={() => setIsAdminOpen(true)}>Admin</button><button className="cart-button" onClick={() => setIsCartOpen(true)} aria-label="Buka keranjang">Keranjang <b>{totalItems}</b></button></div>
      </header>

      <main>
        <section className="hero" id="beranda">
          <div className="hero-copy"><p className="eyebrow">WARUNG RASA RUMAHAN · SEJAK 2024</p><h1>Rasa yang bikin<br /><span>betah.</span></h1><p className="hero-text">Menu sederhana, bahan segar, dan racikan yang dibuat sepenuh hati untuk mengisi hari kamu.</p><a className="primary-button" href="#menu">Pesan sekarang <span>↘</span></a></div>
          <div className="hero-plate"><div className="sun">✦</div><div className="food-art">🍗</div><p>fresh from<br />our kitchen</p></div>
          <div className="hero-note"><strong>01</strong><span>Hangat, pedas,<br />selalu pas.</span></div>
        </section>

        <section className="menu-section" id="menu">
          <div className="section-heading"><div><p className="eyebrow">PILIHAN HARI INI</p><h2>Yang lagi<br /><i>diinginkan?</i></h2></div><p className="section-intro">Dimasak saat dipesan, jadi selalu datang dengan rasa terbaiknya.</p></div>
          {apiMessage && <div className="api-note">{apiMessage}</div>}
          <div className="category-tabs">{categories.map((item) => <button className={category === item ? 'active' : ''} key={item} onClick={() => setCategory(item)}>{item}</button>)}</div>
          <div className="product-grid">{visibleProducts.map((product) => <article className="product-card" key={product.id}><div className="product-image">{product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : <span>{product.emoji}</span>}<small>{product.category}</small></div><div className="product-info"><h3>{product.name}</h3><p>{product.description}</p><div className="product-bottom"><strong>{formatPrice(product.price)}</strong><button className="add-button" onClick={() => updateCart(product, 1)}>Tambah <span>+</span></button></div></div></article>)}</div>
        </section>

        <section className="story-section" id="cerita"><div className="story-stamp">made with<br /><strong>♡</strong><br />by Andras Food</div><div><p className="eyebrow">CERITA KAMI</p><h2>Masakan kecil,<br /><i>rasa yang besar.</i></h2><p className="story-copy">Andras Food lahir dari dapur sederhana dan keinginan untuk menyajikan makanan enak yang terasa dekat. Setiap porsi kami siapkan dengan bahan segar, harga ramah, dan standar kebersihan yang kami jaga.</p><div className="values"><span>01 <b>Bahan segar</b></span><span>02 <b>Harga ramah</b></span><span>03 <b>Higienis</b></span></div></div></section>

        <section className="steps-section" id="pesan"><div className="section-heading"><div><p className="eyebrow">SEMUDAH ITU</p><h2>Pesan dalam<br /><i>empat langkah.</i></h2></div></div><div className="steps"><div><b>01</b><h3>Pilih menu</h3><p>Temukan makanan dan minuman favoritmu.</p></div><div><b>02</b><h3>Atur jumlah</h3><p>Tambah pesanan ke keranjang sesuai selera.</p></div><div><b>03</b><h3>Kirim via WhatsApp</h3><p>Periksa total lalu kirim detail pesanan.</p></div><div><b>04</b><h3>Pesanan tiba</h3><p>Konfirmasi pembayaran dan tunggu pesananmu.</p></div></div></section>

        <section className="contact-section" id="kontak"><p className="eyebrow">MARI MAKAN</p><h2>Ketemu di<br /><i>Andras Food.</i></h2><div className="contact-grid"><div><span>WHATSAPP</span><strong>+62 823-8028-6646</strong></div><div><span>INSTAGRAM</span><strong>@andras.food</strong></div><div><span>JAM BUKA</span><strong>10.00 — 21.00 WITA</strong></div></div></section>
      </main>

      <footer><span>© 2026 Andras Food</span><span>Rasa yang bikin betah.</span></footer>
      {isAdminOpen && <AdminPanel onClose={() => setIsAdminOpen(false)} />}
      {isCartOpen && <div className="cart-backdrop" onClick={() => setIsCartOpen(false)}><aside className="cart-drawer" onClick={(event) => event.stopPropagation()}><div className="drawer-head"><div><p className="eyebrow">PESANANMU</p><h2>Keranjang</h2></div><button onClick={() => setIsCartOpen(false)} aria-label="Tutup keranjang">×</button></div>{cartItems.length ? <><div className="cart-list">{cartItems.map((item) => <div className="cart-row" key={item.id}><span className="cart-emoji">{item.emoji}</span><div><h3>{item.name}</h3><p>{formatPrice(item.price)}</p></div><div className="quantity"><button onClick={() => updateCart(item, -1)}>-</button><b>{item.quantity}</b><button onClick={() => updateCart(item, 1)}>+</button></div></div>)}</div><div className="cart-total"><span>Total</span><strong>{formatPrice(totalPrice)}</strong></div><button className="whatsapp-button" onClick={checkout}>Pesan via WhatsApp <span>↗</span></button></> : <div className="empty-cart"><span>◎</span><p>Keranjangmu masih kosong.</p><a href="#menu" onClick={() => setIsCartOpen(false)}>Lihat menu</a></div>}</aside></div>}
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
