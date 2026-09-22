# 🌸 Cashflower

> **Aplikasi Pencatatan Keuangan, Arus Kas (Cash Flow), Hutang-Piutang, dan Jurnal Investasi Berbasis Offline-First.**

[![Version](https://img.shields.io/badge/version-1.3.0-teal.svg)](#)
[![Expo](https://img.shields.io/badge/Expo-SDK%2057-000020.svg?logo=expo)](#)
[![React Native](https://img.shields.io/badge/React%20Native-0.86-61DAFB.svg?logo=react)](#)
[![SQLite](https://img.shields.io/badge/Database-SQLite%20(Local)-003B57.svg?logo=sqlite)](#)
[![Offline First](https://img.shields.io/badge/Internet-100%25%20Offline-success.svg)](#)
[![Status](https://img.shields.io/badge/Status-Internal%20%2F%20Proprietary-red.svg)](#)

---

## 📌 Daftar Isi
1. [Mengenal Cashflower](#-mengenal-cashflower)
2. [Fitur-Fitur Utama](#-fitur-fitur-utama)
3. [Panduan Instalasi Cepat untuk Pegawai / Pengguna Android](#-panduan-instalasi-cepat-untuk-pegawai--pengguna-android)
4. [Panduan & SOP Penggunaan untuk Pegawai / Tim](#-panduan--sop-penggunaan-untuk-pegawai--tim)
   - [1. Mencatat Uang Keluar (Belanjaan) & Uang Masuk](#1-mencatat-uang-keluar-belanjaan--uang-masuk)
   - [2. Mengelola Hutang & Piutang](#2-mengelola-hutang--piutang)
   - [3. Memantau Batas Anggaran (Budgeting)](#3-memantau-batas-anggaran-budgeting)
   - [4. Melihat Grafik & Evaluasi Keuangan](#4-melihat-grafik--evaluasi-keuangan)
   - [5. Mencadangkan & Memulihkan Data (Backup & Restore)](#5-mencadangkan--memulihkan-data-backup--restore)
   - [6. Jurnal Trading & Investasi (Opsional)](#6-jurnal-trading--investasi-opsional)
   - [7. Mengekspor Laporan Keuangan (Setoran ke Atasan / Excel)](#7-mengekspor-laporan-keuangan-setoran-ke-atasan--excel)
   - [8. Mengatur Target Pembelian & Rencana Impian (Plans)](#8-mengatur-target-pembelian--rencana-impian-plans)
   - [9. Manajemen Multi-Dompet & Transfer Saldo (Wallets)](#9-manajemen-multi-dompet--transfer-saldo-wallets)
5. [Struktur Direktori & Arsitektur (Untuk Developer)](#-struktur-direktori--arsitektur-untuk-developer)
6. [Panduan Menjalankan Project (Developer Quick Start)](#-panduan-menjalankan-project-developer-quick-start)
7. [Tanya Jawab (FAQ) & Kendala Teknis](#-tanya-jawab-faq--kendala-teknis)
8. [Hak Cipta & Kerahasiaan](#-hak-cipta--kerahasiaan-proprietary--internal-use)

---

## 💡 Mengenal Cashflower

**Cashflower** dirancang untuk memudahkan pencatatan keuangan bisnis, operasional toko/kantor, maupun keuangan pribadi. Aplikasi ini fokus pada kecepatan input, kesederhanaan tampilan, dan keandalan data.

### Mengapa Menggunakan Cashflower?
* 🚀 **100% Offline-First:** Dapat digunakan kapan saja dan di mana saja tanpa membutuhkan kuota atau sinyal internet.
* 🔒 **Data Aman & Privat:** Seluruh transaksi tersimpan langsung di dalam memori ponsel (menggunakan database SQLite lokal), tidak dikirimkan ke server luar.
* ⚡ **Ringan & Cepat:** Dibangun dengan performa tinggi, aplikasi terbuka seketika tanpa *loading* berlama-lama.
* 📦 **Langsung Pakai (APK Siap Install):** Sudah tersedia file APK siap pasang untuk ponsel Android tim Anda tanpa perlu proses instalasi yang rumit.

---

## ✨ Fitur-Fitur Utama

| Menu / Fitur | Fungsi & Kegunaan |
| :--- | :--- |
| **🏠 Beranda** | Ringkasan saldo kas berjalan, total pemasukan vs pengeluaran, pintasan cepat, dan status anggaran bulanan. |
| **🧾 Riwayat Transaksi** | Daftar seluruh transaksi dengan fitur pencarian instan (nama barang/catatan), filter pemasukan/pengeluaran, dan filter per kategori. |
| **👥 Hutang & Piutang** | Catatan uang yang kita pinjamkan ke orang lain (**Piutang/Tagihan**) dan kewajiban bayar kita ke pihak lain (**Hutang**), lengkap dengan tanggal jatuh tempo. |
| **📊 Target Anggaran (Budgeting)** | Pemasangan batas maksimal belanja bulanan (secara global maupun per kategori) dengan indikator visual otomatis agar tidak boros. |
| **📈 Grafik & Analisis** | Visualisasi diagram donat pengeluaran per pos kategori dan grafik batang perbandingan arus kas berkala. |
| **💹 Trading & Investasi** | Jurnal pencatatan aset (Saham, Kripto, Forex, Emas, Reksa Dana) dengan kalkulasi otomatis PnL (laba/rugi) dan Win Rate. |
| **🎯 Target & Rencana Impian** | Wishlist barang yang ingin dibeli (e.g. Laptop, Kendaraan) dengan progres dana otomatis dari saldo kas kas berjalan serta fitur pin ke Beranda. |
| **👛 Multi-Dompet & Rekening** | Pemisahan saldo kas (Tunai, Rekening Bank BCA/Mandiri/BRI, E-Wallet GoPay/OVO/Dana) dengan fitur transfer antar dompet bebas biaya/admin dan pelaporan terpisah. |
| **📄 Ekspor Laporan Resmi** | Cetak laporan PDF resmi siap setor ke atasan (dengan kartu ringkasan, breakdown kategori, & kolom tanda tangan) atau spreadsheet Excel/CSV. |
| **☁️ Backup & Restore** | Cadangkan seluruh database dalam format file `.json` ke Google Drive, WhatsApp, atau penyimpanan lokal untuk dipulihkan sewaktu-waktu. |
| **🔔 Pengingat Otomatis** | Notifikasi harian pukul 20:00 malam untuk mencatat transaksi hari itu serta alarm peringatan jatuh tempo pinjaman. |

---

## 📱 Panduan Instalasi Cepat untuk Pegawai / Pengguna Android

Untuk pegawai atau pengguna baru yang ingin langsung memasang aplikasi di HP Android tanpa perlu memahami koding:

### 1. Pilih File APK yang Sesuai
Di folder utama repositori ini sudah disediakan 2 file installer:
* **`cashflower.apk`** *(Direkomendasikan)*: Berukuran sekitar **~33 MB**, dioptimalkan khusus untuk smartphone Android modern (arsitektur ARM64).
* **`cashflower-universal.apk`**: Berukuran sekitar **~59 MB**, versi kompatibel penuh yang bisa diinstall di semua jenis smartphone atau tablet Android tipe apapun.

### 2. Langkah-Langkah Pemasangan di HP Android
1. **Download / Kirim APK:** Salin file `cashflower.apk` ke HP Anda (bisa dikirim via WhatsApp, Telegram, Google Drive, atau kabel data USB).
2. **Buka File:** Ketuk file `cashflower.apk` di pengelola file (*File Manager*) HP Anda.
3. **Izinkan Sumber Tidak Dikenal:**
   * Jika muncul peringatan *"Demi keamanan, ponsel Anda tidak diizinkan memasang aplikasi yang tidak dikenal dari sumber ini"*, klik **Setelan (Settings)**.
   * Aktifkan centang **"Izinkan dari sumber ini"** (*Allow from this source*).
4. **Instal Aplikasi:** Klik tombol **Instal** dan tunggu beberapa detik sampai proses selesai.
5. **Buka Aplikasi:** Buka ikon **Cashflower 🌸** di layar utama HP Anda. Aplikasi langsung siap dipakai!

---

## 📖 Panduan & SOP Penggunaan untuk Pegawai / Tim

Agar pencatatan pembukuan rapi dan seragam, berikut panduan operasional harian yang dapat diikuti oleh staf/pegawai:

### 1. Mencatat Uang Keluar (Belanjaan) & Uang Masuk
Setiap ada uang keluar (beli perlengkapan, beli makan, bensin, bayar listrik/air) atau uang masuk (penjualan, pembayaran pelanggan, modal kas):
1. Buka aplikasi Cashflower.
2. Ketuk tombol **`+`** (di pojok kanan atas beranda atau tombol hijau di kartu saldo).
3. Pilih jenis transaksi:
   * **Pengeluaran** (warna merah): Uang kas berkurang.
   * **Pemasukan** (warna hijau): Uang kas bertambah.
4. Masukkan **Nominal (Rp)**: Ketik angka saja, format Rupiah akan diformat otomatis.
5. Isi **Keterangan / Nama Barang**: Tulis dengan jelas (contoh: *"Beli ATK kertas A4 & spidol"*, *"Bensin operasional delivery"*).
6. Pilih **Kategori** yang sesuai (contoh: *Kebutuhan Rumah/Kantor*, *Transportasi*, *Bisnis & Penjualan*, dll.).
7. *(Opsional)* Tulis catatan tambahan atau nomor nota pada kolom **Catatan**.
8. Ketuk tombol **Simpan Transaksi**.

> [!TIP]
> Jika ada salah ketik nominal atau nama barang, buka tab **Transaksi**, ketuk transaksi yang bersangkutan, dan pilih menu edit untuk memperbaikinya.

---

### 2. Mengelola Hutang & Piutang
Gunakan tab **Hutang** (ikon dua orang) untuk mencatat semua transaksi pinjam-meminjam atau bon belum lunas.

* **Piutang (Uang di Orang Lain / Tagih):**
  * Gunakan ini jika ada pelanggan yang belum bayar, pesanan belum lunas, atau rekan yang meminjam kas.
  * Masukkan nama orang/klien, nominal, dan tentukan **Jatuh Tempo** (kapan uang harus ditagih kembali).
* **Hutang (Uang Kita ke Orang Lain / Harus Dibayar):**
  * Gunakan ini jika kas kita berhutang ke supplier, membeli barang tempo, atau meminjam dana.
  * Catat tanggal jatuh tempo agar tidak terkena denda atau terlambat bayar.
* **Menandai Lunas:**
  * Jika hutang atau piutang sudah dibayarkan, cukup centang/ketuk tombol **Tandai Lunas**. Riwayatnya akan tetap tersimpan rapi tanpa hilang.

---

### 3. Memantau Batas Anggaran (Budgeting)
Untuk mencegah pengeluaran operasional membengkak:
1. Buka menu **Pengaturan** (ikon roda gigi di pojok kanan atas beranda) ➡️ **Atur Target Budgeting**.
2. Anda dapat mengatur:
   * **Limit Bulanan Global**: Batas total seluruh pengeluaran kas dalam 1 bulan (contoh: Rp 5.000.000).
   * **Limit Per Kategori**: Batas khusus pos tertentu (contoh: batas makan & minum Rp 1.500.000).
3. Pantau status warna bar di Beranda:
   * 🟢 **Hijau**: Pengeluaran aman (< 70% dari limit).
   * 🟡 **Kuning**: Pengeluaran mulai menipis (sudah mencapai >= 70%).
   * 🔴 **Merah**: Pengeluaran sudah melampaui batas (*Overbudget*). Segera hemat!

---

### 4. Melihat Grafik & Evaluasi Keuangan
Masuk ke tab **Grafik** (ikon pie chart) untuk evaluasi mingguan/bulanan:
* **Diagram Donat Pengeluaran:** Menunjukkan ke pos mana saja persentase uang kas paling banyak dibelanjakan (misal: 45% Belanja Barang, 25% Transportasi).
* **Grafik Arus Kas (Cash Flow):** Membandingkan total uang masuk vs total uang keluar untuk melihat apakah kas dalam kondisi surplus atau defisit.

---

### 5. Mencadangkan & Memulihkan Data (Backup & Restore)
Karena aplikasi ini 100% offline di HP masing-masing, sangat disarankan melakukan pencadangan data **minimal seminggu sekali** atau setiap akhir bulan:

#### Cara Cadangkan Data (Backup):
1. Buka tab **Beranda** ➡️ ketuk ikon **Pengaturan (Roda Gigi)** di kanan atas.
2. Ketuk **Cadangkan ke Google Drive / File**.
3. Pilih **Simpan ke Google Drive**, atau pilih **Kirim via WhatsApp / Email** langsung ke atasan/pemilik bisnis.
4. File cadangan akan berformat `.json` dengan nama seperti `cashflower_backup_20260920_1800.json`.

#### Cara Pulihkan Data (Restore):
Jika pegawai berganti ponsel atau ingin memindahkan data:
1. Pasang aplikasi Cashflower di ponsel baru.
2. Buka **Pengaturan** ➡️ ketuk **Pulihkan Data dari Cadangan**.
3. Pilih file cadangan `.json` yang sebelumnya sudah disimpan. Seluruh transaksi, hutang, dan kategori akan kembali seperti semula.

---

### 6. Jurnal Trading & Investasi (Opsional)
Bagi pengguna yang ingin memonitor portofolio instrumen finansial:
* Masuk ke tab **Investasi**.
* Catat transaksi: nama aset (misal: BBCA, BTC, Emas Antam), harga beli (*buy*), harga jual (*sell*), dan tanggal transaksi.
* Sistem otomatis menghitung nominal keuntungan/kerugian (PnL), persentase hasil (*yield return*), serta rasio kemenangan (*Win Rate*).

---

### 7. Mengekspor Laporan Keuangan (Setoran ke Atasan / Excel)
Jika pegawai atau staf kasir perlu menyetorkan pembukuan kas ke atasan/owner:
1. Masuk ke tab **Transaksi** atau **Grafik**, lalu ketuk tombol **Ekspor** di pojok kanan atas (atau buka **Pengaturan** ➡️ **Ekspor Laporan Keuangan**).
2. Pilih format yang dibutuhkan:
   * 📄 **Dokumen PDF Resmi:** Format profesional siap cetak / kirim langsung via WhatsApp dengan kop usaha, ringkasan Laba/Rugi, tabel breakdown pos belanja, dan kolom tanda tangan pengesahan staf & atasan.
   * 📊 **Spreadsheet Excel / CSV:** Format data tabel mentah berstandar UTF-8 yang dapat diolah lebih lanjut di Microsoft Excel atau Google Sheets.
3. Pilih periode waktu (*Bulan Ini*, *Bulan Lalu*, *3 Bulan*, atau *Rentang Tanggal Kustom*).
4. Masukkan nama usaha dan nama pelapor (opsional).
5. Ketuk **Cetak & Bagikan Laporan**. Dokumen akan langsung siap dikirimkan ke chat atasan atau disimpan ke Google Drive.

---

### 8. Mengatur Target Pembelian & Rencana Impian (Plans)
Untuk memotivasi dan memonitor kesiapan dana membeli barang impian (misal: Laptop kerja baru, perlengkapan toko, renovasi, kendaraan):
1. Buka kartu **Target Pembelian & Rencana** di Beranda (atau buka **Pengaturan** ➡️ **Target Pembelian & Rencana**).
2. Ketuk **+ Pasang Target Baru**.
3. Masukkan nama barang/kebutuhan, target harga (nominal Rp), kategori pengeluaran, dan aktifkan opsi **Sematkan ke Beranda (⭐ Pin)**.
4. **Progres Otomatis Berjalan:** Persentase dan kesiapan uang otomatis dihitung terhadap **Saldo Kas Berjalan Saat Ini** (Total Pemasukan - Pengeluaran).
5. Bila saldo kas Anda sudah mencukupi target belanja, badge status berubah menjadi 🟢 **Dana Siap Dibeli!**.
6. Ketuk **Beli & Catat Pengeluaran** untuk menandai target selesai sekaligus memotong kas pembukuan secara otomatis.

---

### 9. Manajemen Multi-Dompet & Transfer Saldo (Wallets)
Bila usaha atau pribadi memisahkan uang di berbagai tempat (misal: Uang Kas Toko/Tunai, Bank BCA, Bank Mandiri, GoPay/OVO):
1. **Mengatur Dompet:** Buka Beranda pada bagian **Dompet & Rekening** (atau buka **Pengaturan** ➡️ **Kelola Dompet & Rekening**).
2. **Tambah Dompet/Rekening:** Ketuk **+ Tambah**, pilih jenis (Tunai, Bank, E-Wallet, Lainnya), tentukan nama dan saldo awal jika ada.
3. **Pencatatan Transaksi:** Saat mencatat Pemasukan atau Pengeluaran, pilih dompet/rekening tujuan pemotongan kas.
4. **Transfer Antar Dompet:** Ketuk **Transfer Saldo**, pilih dompet asal, dompet tujuan, dan masukkan nominal. Saldo otomatis berpindah dan tercatat di riwayat mutasi tanpa mempengaruhi total arus kas laba-rugi.
5. **Mode Sederhana (Opsional):** Jika hanya ingin pembukuan kas tunggal, fitur multi-dompet dapat dimatikan melalui saklar di menu **Pengaturan**.

---

## 🧱 Struktur Direktori & Arsitektur (Untuk Developer)

Aplikasi dibangun menggunakan **React Native** dengan framework **Expo Router**, arsitektur berlapis yang rapi dan mudah dirawat:

```text
cashflower/
├── android/                    # Konfigurasi native Android & Gradle
├── assets/                     # Aset gambar, icon, logo, splash screen
│   └── images/                 # Icon aplikasi, splash, dan gambar pendukung
├── src/
│   ├── app/                    # Sistem navigasi file-based (Expo Router)
│   │   ├── (tabs)/             # Halaman utama dengan Bottom Tab Bar
│   │   │   ├── _layout.tsx     # Pengaturan Bottom Tabs (Beranda, Transaksi, Grafik, Hutang, Investasi)
│   │   │   ├── index.tsx       # Halaman Beranda (Saldo, Snapshot, Target Impian, Transaksi)
│   │   │   ├── transactions.tsx# Halaman Riwayat Transaksi & Filter
│   │   │   ├── analytics.tsx   # Halaman Grafik & Analitik Pengeluaran
│   │   │   ├── debts.tsx       # Halaman Manajemen Hutang & Piutang
│   │   │   └── investments.tsx # Halaman Portofolio Trading & Investasi
│   │   ├── modal/              # Halaman Form & Popup (Modal)
│   │   │   ├── add-transaction.tsx # Form Tambah & Edit Transaksi
│   │   │   ├── add-debt.tsx        # Form Tambah Hutang/Piutang
│   │   │   ├── add-investment.tsx  # Form Tambah Trading Aset
│   │   │   ├── add-category.tsx    # Form Kategori Kustom
│   │   │   ├── add-plan.tsx        # Form Tambah & Edit Target Pembelian
│   │   │   ├── plans.tsx           # Layar Pengelolaan Penuh Target & Rencana
│   │   │   ├── wallets.tsx         # Layar Pengelolaan Akun Dompet & Rekening
│   │   │   ├── add-wallet.tsx      # Form Tambah & Edit Akun Dompet
│   │   │   ├── transfer-funds.tsx  # Form Transfer Saldo Antar Dompet
│   │   │   ├── budget.tsx          # Form Pengaturan Target Anggaran
│   │   │   ├── export-report.tsx   # Form Ekspor Laporan Resmi (PDF & Excel)
│   │   │   └── settings.tsx        # Halaman Pengaturan, Notifikasi & Backup
│   │   └── _layout.tsx         # Root Layout & Provider Context
│   ├── components/             # Komponen UI Reusable
│   │   ├── balance-card.tsx         # Kartu Saldo Kas
│   │   ├── cashflow-bar-chart.tsx   # Grafik Batang Cash Flow
│   │   ├── category-donut-chart.tsx # Diagram Donat Kategori
│   │   ├── debt-item.tsx            # Komponen Kartu Hutang/Piutang
│   │   ├── investment-item.tsx      # Komponen Kartu Investasi
│   │   ├── plan-item.tsx            # Komponen Kartu Target Rencana & Progres
│   │   ├── wallet-card.tsx          # Komponen Kartu Dompet & Rekening
│   │   ├── transaction-item.tsx     # Komponen Baris Transaksi
│   │   └── empty-state.tsx          # Tampilan saat data kosong
│   ├── context/
│   │   └── finance-context.tsx # Global State Management (FinanceContext)
│   ├── db/
│   │   └── index.ts            # Schema SQLite, CRUD Operations, Export/Import
│   ├── theme/
│   │   └── colors.ts           # Token Warna, Tema, & Shadow Styles
│   ├── types/
│   │   └── index.ts            # Deklarasi Type & Interface TypeScript
│   └── utils/                  # Fungsi Bantuan (Helpers)
│       ├── backup.ts           # Logika Export JSON & Sharing Document
│       ├── format-currency.ts  # Formatter Rupiah (IDR) & Parser Input
│       ├── format-date.ts      # Formatter Tanggal (Indonesia)
│       ├── notifications.ts    # Penjadwal Pengingat Notifikasi Lokal
│       ├── report-csv.ts       # Generator File Spreadsheet Excel/CSV (UTF-8)
│       └── report-pdf.ts       # Generator Dokumen PDF Resmi & Template HTML Cetak
├── app.json                    # Konfigurasi Expo & Metadata Aplikasi
├── eas.json                    # Konfigurasi EAS Build & Profil Rilis APK
├── package.json                # Daftar Dependensi & Script Node.js
└── tsconfig.json               # Konfigurasi TypeScript
```

---

## 💻 Panduan Menjalankan Project (Developer Quick Start)

Bagi pengembang yang ingin memodifikasi kode atau menjalankan di lingkungan lokal:

### 1. Prasyarat Sistem
* **Node.js**: Versi `>= 18.0.0`
* **npm** atau **yarn**
* **Expo CLI** (termasuk dalam paket `npx`)
* *(Opsional)* **Android Studio** & Android SDK (jika ingin menjalankan di Emulator lokal) atau aplikasi **Expo Go** di HP fisik.

### 2. Instalasi Dependensi
Clone repositori ini dan pasang pustaka yang dibutuhkan:

```bash
# Masuk ke direktori proyek
cd cashflower

# Pasang seluruh dependensi
npm install
```

### 3. Menjalankan Server Pengembangan (Dev Server)
Jalankan perintah berikut:

```bash
npx expo start
```

Setelah server aktif:
* Tekan `a` untuk membuka di **Android Emulator** / HP Android yang terhubung via USB ADB.
* Tekan `w` untuk membuka di **Web Browser**.
* Scan kode QR menggunakan aplikasi **Expo Go** pada HP Android Anda.

### 4. Perintah Tambahan
```bash
# Menjalankan langsung ke perangkat Android
npm run android

# Menjalankan di browser
npm run web

# Pengecekan kode (Linting)
npm run lint
```

### 5. Membangun APK Rilis Baru (Build APK)
Aplikasi ini sudah dikonfigurasi menggunakan **EAS Build** (`eas.json`). Untuk membuat file APK standalone baru:

```bash
# Login ke akun Expo (jika belum)
npx eas-cli login

# Build APK versi preview / internal
npx eas-cli build -p android --profile preview
```

---

## ❓ Tanya Jawab (FAQ) & Kendala Teknis

### Q1: Apakah aplikasi ini memerlukan internet?
> **Jawab:** Tidak sama sekali. Aplikasi bekerja 100% offline. Anda bisa mencatat transaksi di area tanpa sinyal, di gudang, atau saat kuota internet habis.

### Q2: Di mana data saya disimpan? Apakah bos / orang lain bisa melihat langsung dari HP mereka?
> **Jawab:** Data disimpan di memori internal HP masing-masing melalui database SQLite lokal. Untuk melihat rekapan data di HP lain, gunakan fitur **Cadangkan ke Google Drive / File** di menu Pengaturan, lalu kirimkan file cadangan tersebut.

### Q3: Bagaimana jika HP hilang atau rusak?
> **Jawab:** Karena sistem bersifat offline-first, data hanya dapat dipulihkan jika Anda sebelumnya sudah pernah melakukan **Cadangkan Data (Backup)** ke Google Drive atau mengirim file `.json` ke chat/email. Oleh karena itu, biasakan melakukan backup secara rutin setiap minggu/bulan.

### Q4: Apakah bisa mengganti atau menambah kategori belanja baru?
> **Jawab:** Tentu saja. Di form tambah transaksi, terdapat opsi untuk membuat kategori baru lengkap dengan pilihan ikon dan warna sesuai kebutuhan bisnis Anda.

### Q5: Mengapa notifikasi pengingat jam 20:00 tidak muncul?
> **Jawab:** Pastikan izin notifikasi untuk aplikasi Cashflower sudah diaktifkan di setelan HP Android Anda:
> * Buka *Pengaturan HP* ➡️ *Aplikasi* ➡️ *Cashflower* ➡️ *Notifikasi* ➡️ Pilih *Izinkan Notifikasi*.
> * Pastikan fitur hemat daya baterai (*Battery Optimization*) tidak mematikan aktivitas latar belakang aplikasi.

---

## 🔒 Hak Cipta & Kerahasiaan (Proprietary / Internal Use)

Aplikasi dan seluruh kode sumber dalam repositori ini bersifat **Internal & Proprietary (Tertutup)**.
* Proyek ini ditujukan **khusus untuk penggunaan operasional internal tim / bisnis perusahaan**.
* **Proyek ini BUKAN open source**.
* Dilarang keras menyalin, mendistribusikan ulang, memodifikasi untuk publikasi luar, atau memperjualbelikan kode sumber dan aset aplikasi ini tanpa izin tertulis dari pemilik proyek.

---

<div align="center">
  <sub>Dibuat dengan ❤️ untuk kemudahan pengelolaan finansial yang rapi, transparan, dan bebas ribet.</sub>
</div>
