# Cashflower

<!-- impeccable:product-schema 1 -->

## Platform

android

## Users

Pengguna gabungan: pengguna pribadi, trader/investor, dan pemilik usaha atau pegawai yang mencatat keuangan. Prioritas keputusan produk adalah pengguna pribadi.

## Product Purpose

Menggabungkan pencatatan keuangan harian, pengelolaan kas dan hutang/piutang, jurnal trading/investasi, serta pembukuan sederhana dalam satu aplikasi. Seluruh kebutuhan tersebut berada dalam lingkup produk; belum ada pembeda pasar khusus yang dikonfirmasi.

## Operating Context

Fokus platform saat ini adalah Android. Aplikasi harus dapat digunakan saat offline maupun online. Pencatatan keuangan inti tidak bergantung pada koneksi internet.

Alur yang tersedia mencakup mencatat pemasukan/pengeluaran, memantau saldo dan anggaran, mengelola hutang/piutang dan pembayaran, mencatat hasil trading, meninjau grafik, mengatur target pembelian, serta mengekspor dan mencadangkan data.

## Capabilities and Constraints

Kapabilitas berikut tercatat dalam implementasi dan dokumentasi repo:

- Transaksi pemasukan/pengeluaran dengan kategori, tanggal, catatan, pencarian, dan penyuntingan.
- Multi-dompet dan transfer antar dompet.
- Hutang/piutang dengan jatuh tempo dan pencatatan pembayaran.
- Jurnal trading/investasi dengan perhitungan laba/rugi.
- Anggaran, grafik keuangan, dan target pembelian.
- Ekspor laporan PDF/CSV serta backup/restore berbasis file.
- Pilihan bahasa Indonesia dan Inggris serta pengingat berbasis notifikasi.
- Penyimpanan data keuangan lokal menggunakan SQLite.
- Integrasi interstitial Google AdMob membutuhkan internet. Pemicu penambahan transaksi, hutang/piutang, dan trading mempunyai counter terpisah. Data disimpan sebelum pemicu iklan; ketika iklan belum siap, alur dilanjutkan tanpa menunggu.

Keberadaan kapabilitas dalam repo bukan klaim bahwa semua alur sudah diverifikasi di perangkat atau dirilis ke pengguna.

Keputusan terbuka:

- Belum ditentukan apakah mode online akan mencakup sinkronisasi, akun pengguna, atau layanan tambahan. Dukungan penggunaan online tidak dengan sendirinya berarti sinkronisasi cloud.
- Android merupakan fokus saat ini; rencana rilis iOS/web belum dikonfirmasi.
- Kebutuhan akun, kolaborasi, serta pembeda pasar belum dikonfirmasi.

## Brand Commitments

Nama produk yang sudah digunakan adalah Cashflower. Pertahankan istilah dan fungsi keuangan yang ada; init ini tidak menetapkan arah visual baru.

## Evidence on Hand

- `README.md`: dokumentasi fitur dan alur penggunaan; klaim versi, ukuran APK, privasi, dan performa di dalamnya perlu diverifikasi sebelum dipakai sebagai klaim publik.
- `src/app/`: layar dan alur aplikasi yang sudah ada.
- `src/db/`: implementasi penyimpanan lokal.
- `src/config/ads.ts` dan `src/services/ad-service.ts`: konfigurasi serta alur iklan.
- `assets/`: aset identitas dan gambar yang tersedia.

Tidak ada riset pengguna, testimoni, atau bukti pembeda pasar yang dikonfirmasi dalam sesi init ini. Jangan mengarang klaim tersebut.

## Product Principles

1. Utamakan kebutuhan pencatatan keuangan pribadi ketika kebutuhan berbagai kelompok pengguna bersinggungan.
2. Pertahankan cakupan kas harian, hutang/piutang, trading, dan pembukuan sederhana tanpa mewajibkan setiap pengguna memakai semua fitur.
3. Pastikan pencatatan inti dapat digunakan tanpa internet, sekaligus tetap dapat digunakan saat perangkat online.
4. Bedakan catatan hasil trading dari layanan eksekusi perdagangan; sinkronisasi cloud bukan kapabilitas yang telah dikonfirmasi.
