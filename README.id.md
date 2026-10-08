# Cashflower

[English](README.md) · Bahasa Indonesia · [简体中文](README.zh-CN.md)

Cashflower adalah aplikasi pencatatan keuangan milik **ANstudio**. Gunakan untuk mencatat pemasukan dan pengeluaran, mengelola dompet, memantau utang-piutang, serta mengatur anggaran dan rencana pembelian.

## Cara menggunakan

### Mencatat pemasukan dan pengeluaran

Ketuk **+**, pilih pemasukan atau pengeluaran, lalu isi nominal, judul, kategori, dan tanggal. Tambahkan catatan jika diperlukan, kemudian simpan. Gunakan tab **Transaksi** untuk mencari, memfilter, mengedit, atau menghapus catatan.

### Mengelola dompet

Buka pengelolaan dompet melalui **Beranda** atau **Pengaturan** untuk menambahkan uang tunai, rekening bank, atau e-wallet. Pilih dompet saat mencatat transaksi. Gunakan transfer untuk memindahkan dana antar dompet tanpa menghitungnya sebagai pemasukan atau pengeluaran.

### Mencatat utang dan piutang

Buka **Hutang** untuk mencatat uang yang Anda pinjam atau pinjamkan. Isi nama orang, nominal, dan tanggal jatuh tempo, lalu catat pembayaran saat dilakukan.

### Mengatur anggaran dan rencana pembelian

Atur batas pengeluaran bulanan melalui pengaturan anggaran. Untuk pembelian yang direncanakan, buat rencana pembelian, alokasikan dana, lalu catat pembelian saat selesai.

### Melihat ringkasan

Gunakan **Grafik** untuk melihat pemasukan, pengeluaran, dan rincian kategori. Tab **Investasi** digunakan untuk mencatat transaksi investasi dan melihat laba-rugi, bukan untuk melakukan perdagangan aset.

### Mengekspor dan mencadangkan data

Ekspor laporan dalam format PDF atau CSV. Melalui **Pengaturan**, buat cadangan JSON dan simpan di luar aplikasi. Untuk memindahkan catatan ke perangkat lain, pulihkan file cadangan di perangkat tersebut.

Catatan keuangan disimpan secara lokal. Buat cadangan sebelum menghapus data aplikasi atau browser, menghapus aplikasi, atau mengganti perangkat. Pencatatan utama dapat digunakan tanpa internet, tetapi iklan dan layanan berbagi eksternal mungkin menggunakan koneksi internet.

Bahasa antarmuka dapat diubah melalui **Pengaturan**. Tersedia bahasa Indonesia, Inggris, dan Mandarin.

## Mencoba di browser

Pasang [Node.js versi LTS terkini](https://nodejs.org/), unduh proyek ini, lalu buka terminal di folder proyek. Di Windows, Anda dapat menggunakan PowerShell.

```sh
npm install
npm run web
```

Buka alamat lokal yang muncul di terminal. Biarkan terminal tetap berjalan selama menggunakan aplikasi. Tekan **Ctrl+C** untuk menghentikannya.

Perintah ini menjalankan versi web di komputer Anda. Beberapa fitur, termasuk notifikasi, iklan, berbagi file, dan pencetakan, mungkin berbeda dari Android atau tidak tersedia di browser. Gunakan data contoh saat pertama kali mencoba.

## Kepemilikan dan lisensi

Cashflower dimiliki oleh **ANstudio**. Seluruh hak dilindungi.

Proyek ini merupakan perangkat lunak proprietary, bukan open source. Petunjuk di atas menjelaskan cara menggunakan dan mencoba aplikasi; petunjuk tersebut tidak memberikan izin untuk menyalin, memodifikasi, mendistribusikan ulang, memublikasikan, atau menjual perangkat lunak maupun asetnya. Ketentuan lengkap tersedia dalam [LICENSE](LICENSE).
