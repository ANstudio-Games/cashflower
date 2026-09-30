# Desain Integrasi Monetisasi Iklan (Google AdMob) - Cashflower

## 1. Latar Belakang & Tujuan
Aplikasi Cashflower mengadopsi monetisasi iklan berbasis Google AdMob dengan model **High-Frequency Monetization**:
1. Menampilkan iklan **Banner** di bagian bawah aplikasi pada navigasi tab utama.
2. Menampilkan iklan **Interstitial Video** secara berkala (misal: setiap 3 kali pencatatan transaksi) setelah data transaksi berhasil disimpan.

---

## 2. Pendekatan yang Dipilih
- **Library**: `react-native-google-mobile-ads`
- **AdMob App ID**: `ca-app-pub-2354120872211211~1163007966`
- **Strategi Environment**:
  - Saat `__DEV__` atau testing, otomatis menggunakan **Google Test Ad Unit IDs** (`TestIds.BANNER`, `TestIds.INTERSTITIAL`) agar terhindar dari pemblokiran (ban) akun AdMob akibat impression/klik sendiri saat development.
  - Saat rilis production, menggunakan Ad Unit ID asli milik pengguna.

---

## 3. Alur Pengguna (User Flow)

```
[User Buka Aplikasi / Pindah Tab Utama]
               │
               ▼
   [Tampil Sticky Banner Ad di Bawah Layar]

─── Alur Pencatatan Transaksi ───
[User Isi Form & Klik "Simpan Transaksi"]
               │
               ▼
[Simpan Data Transaksi ke Database SQLite]
               │
               ▼
   [Cek Kondisi Pemicu Iklan]
   - Transaksi ke-1: Langsung Tampilkan Iklan
   - Transaksi ke-2: Skip (Jeda)
   - Transaksi ke-3: Skip (Jeda)
   - Transaksi ke-4: Tampilkan Iklan
   - (seterusnya: jeda 2 kali transaksi)
               │
      Apakah Saatnya Muncul Iklan?
         ├── TIDAK ──► [Langsung Tutup Modal & Kembali ke Halaman Utama]
         └── YA ────► [Reset Counter Jeda]
                          │
                   Apakah Iklan Loaded?
                      ├── YA ────► [Tampilkan Interstitial Video Fullscreen]
                      │                     │
                      │                     ▼
                      │              [User Tutup Iklan (X)]
                      │                     │
                      │                     ▼
                      │              [Tutup Modal Transaksi & Preload Iklan Berikutnya]
                      │
                      └── TIDAK ──► [Langsung Tutup Modal Transaksi tanpa Delay]
```

---

## 4. Komponen & Tanggung Jawab

| Komponen / File | Tanggung Jawab |
|---|---|
| `app.json` | Konfigurasi AdMob App ID di plugin `react-native-google-mobile-ads` |
| `src/config/ads.ts` | Konfigurasi App ID, Unit ID (Test vs Production), dan frekuensi interval |
| `src/services/ad-service.ts` | Inisialisasi Mobile Ads SDK, listener lifecycle interstitial, background preloader, dan counter counter transaksi |
| `src/components/ads/ad-banner.tsx` | Komponen visual banner yang membungkus AdMob Banner, fallback anggun jika offline/gagal muat |
| `src/app/(tabs)/_layout.tsx` | Menyematkan `AdBanner` di bawah layar tab utama |
| `src/app/modal/add-transaction.tsx` | Memanggil trigger interstitial saat transaksi berhasil disimpan |

---

## 5. Penanganan Error & Kegagalan (Failure Behavior)
1. **Offline / Tidak Ada Sinyal**: Banner dan interstitial tidak akan memblokir user. Transaksi tetap tersimpan seketika dan modal langsung tertutup normal.
2. **Iklan Belum Selesai Muat (Not Ready)**: Tidak menampilkan loading screen yang membuat user menunggu. Langsung lanjutkan alur user dan muat ulang iklan untuk kesempatan berikutnya.
3. **Double Trigger**: Memastikan interstitial hanya ditutup dan dibuka satu kali per siklus transaksi.

---

## 6. Verifikasi & Pengujian
- Verifikasi instalasi package & autolinking native Android.
- Verifikasi banner memuat iklan uji Google Test di tab utama.
- Verifikasi interstitial video muncul setelah 3 kali pencatatan transaksi di environment dev.
- Verifikasi TypeScript clean (`npx tsc --noEmit`).
