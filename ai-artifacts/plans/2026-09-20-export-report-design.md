# Desain Fitur: Ekspor Laporan Keuangan Resmi (PDF & Excel/CSV)

- **Tanggal:** 2026-09-20
- **Status:** Menunggu Persetujuan Eksekusi
- **Aplikasi:** Cashflower (v1.1.1)

---

## 1. Latar Belakang & Masalah
Saat ini Cashflower memiliki penyimpanan offline-first lengkap (transaksi kas, hutang-piutang, budget, investasi) dan fitur cadangan data berbasis file JSON mentah (`.json`). Namun, format JSON hanya berguna untuk migrasi data antar perangkat dan tidak dapat dibaca secara mudah oleh manusia.

Dalam operasional harian (toko, kantor, kasir UMKM, atau keuangan pribadi), staf/pengguna membutuhkan:
1. Laporan formal yang siap dicetak atau dikirimkan ke atasan/pemilik bisnis via WhatsApp/Email sebagai laporan pertanggungjawaban kas harian/bulanan.
2. File spreadsheet (Excel/CSV) untuk keperluan pengolahan data lanjutan di Microsoft Excel atau Google Sheets.

---

## 2. Pendekatan yang Dipilih
Membangun modul **Ekspor Laporan Keuangan** dengan dua format utama:
1. **Dokumen PDF Resmi:** 
   - Template HTML terstruktur yang dikonversi ke PDF menggunakan `expo-print`.
   - Mengandung Kop Laporan (Nama Usaha/Toko, Periode, Pelapor).
   - Ringkasan Eksekutif: Total Pemasukan, Total Pengeluaran, Saldo Bersih Kas (Surplus/Defisit).
   - Rincian Pengeluaran per Kategori (Nominal & Persentase).
   - Tabel Lengkap Riwayat Mutasi Transaksi pada periode terpilih.
   - Kolom Tanda Tangan pengesahan (*Dibuat Oleh* dan *Disetujui Oleh*).
2. **Spreadsheet Excel / CSV:**
   - File CSV berstandar UTF-8 dengan BOM (`\uFEFF`) agar angka desimal dan karakter lokal terbaca langsung tanpa error di Microsoft Excel.
   - Berisi kolom: Tanggal, Jenis (Pemasukan/Pengeluaran), Kategori, Nama Transaksi, Nominal (Rp), Catatan.
3. **Mekanisme Distribusi:**
   - Menggunakan native share via `expo-sharing` untuk mengirim langsung ke WhatsApp, Google Drive, Email, atau Print.

---

## 3. Alternatif Lain yang Ditunda / Dipertimbangkan
* **Multi-Wallet / Multi-Akun (Kas Tunai, Rekening Bank, E-Wallet):** Ditunda untuk rilis berikutnya agar fokus terlebih dahulu pada kebutuhan pelaporan setoran.
* **Cicilan Hutang-Piutang Parsial & Foto Struk:** Ditunda untuk pengembangan selanjutnya.
* **Kunci Keamanan Biometrik / PIN:** Disiapkan untuk rilis v1.3.

---

## 4. Rincian Desain & Arsitektur

### 4.1 Titik Masuk Antarmuka (UI Entry Points)
* Tombol **Ekspor Laporan** di header tab **Grafik / Analisis** ([`analytics.tsx`](file:///home/kingfish/Documents/andro/cashflower/src/app/(tabs)/analytics.tsx)).
* Baris menu di tab **Pengaturan** ([`settings.tsx`](file:///home/kingfish/Documents/andro/cashflower/src/app/modal/settings.tsx)).

### 4.2 Modal Form Konfigurasi (`src/app/modal/export-report.tsx`)
* **Pilihan Periode:**
  * Bulan Ini (Default)
  * Bulan Lalu
  * 3 Bulan Terakhir
  * Rentang Tanggal Kustom (Tanggal Mulai s/d Selesai)
* **Pilihan Format:** PDF Resmi vs Excel/CSV.
* **Input Opsional Entitas:**
  * Nama Entitas / Toko / Unit Kerja.
  * Nama Pelapor / Penanggung Jawab Kas.
* **Tombol Aksi:** "Buat & Bagikan Laporan".

### 4.3 Utilitas Generator
* `src/utils/report-pdf.ts`: Membangun HTML string laporan dengan CSS styling yang bersih dan elegan, lalu memanggil `expo-print` untuk mencetak ke file PDF temporer.
* `src/utils/report-csv.ts`: Memformat baris transaksi menjadi CSV string, menyimpannya via `expo-file-system`.
* Berbagi dokumen via `expo-sharing`.

---

## 5. Rencana Pengujian & Verifikasi
1. Verifikasi ekspor PDF untuk transaksi 0 (empty state aman).
2. Verifikasi ekspor PDF dengan puluhan transaksi (tabel multi-halaman tidak terpotong jelek).
3. Verifikasi pembukaan file CSV di Excel/Sheets memastikan pemformatan angka dan karakter Rp rapi.
4. Verifikasi tombol share berfungsi pada Android (WhatsApp, Save to Drive, View).
