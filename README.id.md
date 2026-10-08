# Cashflower

[English](README.md) · Bahasa Indonesia · [简体中文](README.zh-CN.md)

Cashflower adalah aplikasi pencatatan keuangan pribadi untuk Android, dibangun dengan Expo dan React Native. Catatan keuangan disimpan di database SQLite lokal. Aplikasi ini menyediakan pencatatan arus kas, utang-piutang, anggaran, rencana pembelian, dan jurnal investasi.

## Fitur

- Mencatat pemasukan dan pengeluaran beserta kategori, tanggal, dan catatan.
- Mencari transaksi dan memfilter berdasarkan jenis, kategori, atau dompet.
- Memisahkan saldo tunai, rekening bank, dan e-wallet. Transfer antar dompet tidak dihitung sebagai pemasukan atau pengeluaran.
- Mengatur batas pengeluaran bulanan, termasuk batas per kategori.
- Mencatat utang, piutang, jatuh tempo, dan pembayaran.
- Mengalokasikan dana ke rencana pembelian dan mencatat pengeluaran saat pembelian selesai.
- Mencatat transaksi investasi dengan ringkasan laba, rugi, dan win rate.
- Melihat grafik arus kas dan rincian pengeluaran.
- Mengekspor laporan PDF atau CSV, serta mencadangkan dan memulihkan catatan melalui file JSON.
- Mengaktifkan pengingat lokal untuk pencatatan harian dan pembayaran utang yang mendekati jatuh tempo.

Antarmuka tersedia dalam bahasa Indonesia, Inggris, dan Mandarin.

## Data dan koneksi internet

Catatan keuangan disimpan di perangkat. Simpan cadangan di luar aplikasi sebelum mengganti ponsel atau menghapus aplikasi. Data dari perangkat yang hilang tidak dapat dipulihkan melalui repositori ini.

Pencatatan keuangan utama dapat digunakan tanpa internet. Namun, aplikasi menyertakan Google Mobile Ads, sehingga tidak semua bagian aplikasi bebas dari akses jaringan. Membagikan laporan atau cadangan melalui layanan lain juga mungkin memerlukan internet.

## Menjalankan proyek

Pasang Node.js versi LTS terkini dan npm. Untuk build Android lokal, Anda juga memerlukan Android Studio, Android SDK, dan JDK yang sudah dikonfigurasi.

Jalankan dari direktori proyek:

```sh
npm install
npx expo run:android
```

Nyalakan emulator Android terlebih dahulu, atau hubungkan ponsel Android dengan USB debugging aktif. Perintah ini membangun dan memasang aplikasi native, lalu menjalankan server pengembangan. Perintah yang sama dapat digunakan di PowerShell pada Windows.

Untuk sesi berikutnya, jalankan Metro:

```sh
npx expo start
```

Buka aplikasi pengembangan yang sudah terpasang di perangkat. Jika dependensi native atau config plugin berubah, jalankan kembali `npx expo run:android` untuk membangun ulang aplikasi.

### Expo Go dan web

Expo Go tidak dapat menggantikan build native proyek ini. Dependensi `react-native-google-mobile-ads` tidak tersedia di Expo Go.

Untuk mencoba target web:

```sh
npm run web
```

Target web bukan pengganti pengujian Android. Integrasi native seperti iklan, notifikasi, berbagi file, dan pencetakan dapat berperilaku berbeda atau tidak tersedia di browser.

## Pemeriksaan kode

```sh
# TypeScript
npx tsc --noEmit

# Unit test (memerlukan Bun)
bun test tests

# Lint
npm run lint
```

Pengujian mencakup input nominal, pengaman penyimpanan, alokasi dana rencana, kebijakan pengingat, frekuensi iklan, dan beberapa pemeriksaan UI. Pengujian ini tidak menggantikan pengujian langsung di perangkat.

## Build Android

Profil build tersedia di `eas.json`. EAS Build memerlukan akun Expo dan dapat dikenai batas penggunaan atau biaya layanan.

```sh
npx eas-cli login

# APK untuk pengujian internal
npx eas-cli build --platform android --profile preview

# Android App Bundle untuk distribusi melalui toko aplikasi
npx eas-cli build --platform android --profile production
```

Profil `development` juga tersedia untuk build development client. Periksa application ID, kredensial penandatanganan, dan konfigurasi iklan sebelum mendistribusikan build.

## Struktur kode

```text
src/
  app/          Layar, tab, dan rute modal Expo Router
  components/   Komponen UI dan grafik
  config/       Konfigurasi aplikasi, termasuk iklan
  context/      State aplikasi bersama
  db/           Skema SQLite dan operasi database
  i18n/         Terjemahan dan utilitas bahasa
  services/     Layanan aplikasi
  theme/        Warna dan gaya visual bersama
  types/        Model TypeScript
  utils/        Format data, laporan, cadangan, dan pengingat
tests/          Unit test
assets/         Ikon dan gambar
```

`app.json` memuat versi dan konfigurasi Expo. `package.json` berisi dependensi dan perintah lokal. `DESIGN.md` mendokumentasikan aturan visual aplikasi.

## Lisensi

Repositori ini bersifat privat dan proprietary. `package.json` mencantumkan `UNLICENSED`; proyek ini tidak memberikan lisensi open source. Distribusi ulang kode sumber atau aset memerlukan izin pemilik.
