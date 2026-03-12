# KasirPro

Aplikasi kasir berbasis web (single-page) dengan fitur utama:

- Manajemen produk (tambah produk, ubah stok, hapus produk)
- Keranjang transaksi (multi-item, qty, hapus item)
- Perhitungan otomatis subtotal, diskon, pajak, total, dan kembalian
- Checkout pembayaran dengan validasi nominal bayar
- Riwayat transaksi + ringkasan omzet
- Cetak struk transaksi terakhir
- Penyimpanan data lokal via `localStorage`

## Menjalankan

Karena aplikasi statis, cukup buka `index.html` langsung di browser.

Atau gunakan server lokal:

```bash
python3 -m http.server 8000
```

Lalu buka `http://localhost:8000`.
