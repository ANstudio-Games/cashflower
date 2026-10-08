---
name: Cashflower
description: Buku Kas Modern — bersih, tenang, praktis; informasi keuangan lebih penting daripada dekorasi.
colors:
  primary: "#0D9488"
  primaryLight: "#CCFBF1"
  primarySoft: "#F0FDFA"
  primaryDark: "#0F766E"
  background: "#F8FAFC"
  surface: "#FFFFFF"
  surfaceHover: "#F1F5F9"
  border: "#E2E8F0"
  borderLight: "#F8FAFC"
  text: "#0F172A"
  textSecondary: "#475569"
  textMuted: "#94A3B8"
  income: "#10B981"
  incomeSoft: "#ECFDF5"
  incomeDark: "#047857"
  expense: "#EF4444"
  expenseSoft: "#FEF2F2"
  expenseDark: "#B91C1C"
  warning: "#F59E0B"
  warningSoft: "#FFFBEB"
  debt: "#F59E0B"
  debtSoft: "#FFFBEB"
  debtDark: "#B45309"
  receivable: "#6366F1"
  receivableSoft: "#EEF2FF"
  receivableDark: "#4338CA"
  investment: "#3B82F6"
  investmentSoft: "#EFF6FF"
  investmentDark: "#1D4ED8"
  info: "#3B82F6"
  infoSoft: "#EFF6FF"
typography:
  balance:
    fontSize: "28px"
    fontWeight: 700
    letterSpacing: "-0.5px"
  screen-title:
    fontSize: "18px"
    fontWeight: 700
  input:
    fontSize: "15px"
  button:
    fontSize: "16px"
    fontWeight: 700
  quick-action:
    fontSize: "14px"
    fontWeight: 600
  field-label:
    fontSize: "12px"
    fontWeight: 600
  tab-label:
    fontSize: "11px"
    fontWeight: 600
rounded:
  chip: "10px"
  field: "12px"
  action: "14px"
  amount-card: "16px"
  balance-card: "20px"
spacing:
  tight: "4px"
  small: "8px"
  medium: "12px"
  screen: "16px"
  card: "20px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    typography: "{typography.button}"
    rounded: "{rounded.action}"
    padding: "14px 0px"
  button-quick-add:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    typography: "{typography.quick-action}"
    rounded: "{rounded.field}"
    padding: "8px 14px"
  text-input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.input}"
    rounded: "{rounded.field}"
    padding: "12px 14px"
  category-chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.textSecondary}"
    rounded: "{rounded.chip}"
    padding: "8px 12px"
  balance-card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.balance-card}"
    padding: "20px"
  navigation:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.textMuted}"
    typography: "{typography.tab-label}"
---

# Design System: Cashflower

## Overview

**Creative North Star: "Buku Kas Modern"**

Bersih, tenang, praktis; informasi keuangan lebih penting daripada dekorasi. Cashflower menggunakan permukaan terang, aksen Teal Seimbang, dan hierarki angka yang jelas untuk membantu pengguna membaca dan mencatat keuangan sehari-hari.

Komponen terasa sederhana, jelas, dan nyaman disentuh. Kartu berlapis ringan dengan bayangan lembut memisahkan kelompok informasi tanpa efek melayang yang tebal. Bahasa ini dikonfirmasi pengguna untuk mendokumentasikan implementasi yang ada, bukan menetapkan redesign.

**Key Characteristics:**
- Angka keuangan menjadi fokus, bukan ornamen.
- Warna semantik membedakan jenis informasi.
- Permukaan putih, border halus, dan sudut membulat.
- Bayangan ringan mendukung pengelompokan.

Sumber utama: `src/theme/colors.ts`, `src/components/balance-card.tsx`, `src/app/modal/add-transaction.tsx`, dan `src/app/(tabs)/_layout.tsx`. Dokumen ini berdasarkan inspeksi kode; belum diverifikasi melalui screenshot perangkat. Frontmatter memakai notasi px untuk portabilitas format; pada React Native angka layout adalah unit logis, bukan piksel fisik. Nama skala di atas mendokumentasikan nilai yang diamati, bukan theme API baru.

## Colors

Teal Seimbang mengarahkan tindakan, sementara warna keuangan memberi makna pada angka dan status. Nilai normatif ada pada frontmatter dan mengikuti `src/theme/colors.ts`.

### Primary
- **Teal Seimbang** (`primary`): tombol utama, pintasan pencatatan, dan tab aktif.
- **Teal Lembut** (`primarySoft`, `primaryLight`): latar serta border informasi terkait aksi utama.
- **Teal Dalam** (`primaryDark`): teks pada permukaan teal lembut.

### Secondary
- **Hijau Pemasukan** (`income`, `incomeSoft`, `incomeDark`): pemasukan dan hasil positif.
- **Merah Pengeluaran** (`expense`, `expenseSoft`, `expenseDark`): pengeluaran dan hasil negatif.
- **Amber Kewajiban** (`debt`, `debtSoft`, `debtDark`): hutang; keluarga warning memakai warna dasar dan latar yang sama.
- **Indigo Piutang** (`receivable`, `receivableSoft`, `receivableDark`): uang yang perlu diterima.
- **Biru Investasi** (`investment`, `investmentSoft`, `investmentDark`): trading/investasi; info memakai warna dasar dan latar yang sama.

### Neutral
- `background`: latar layar terang.
- `surface`: kartu, field, dan navigasi.
- `surfaceHover`: latar netral sekunder; nama token ini tidak berarti semua komponen memiliki hover.
- `border` dan `borderLight`: garis pemisah dan batas permukaan.
- `text`: angka dan teks utama; `textSecondary`: pendamping; `textMuted`: petunjuk serta tab nonaktif.

**The Financial Meaning Rule.** Pertahankan arti warna pemasukan, pengeluaran, hutang, piutang, dan investasi; jangan menukar warna semantik demi dekorasi.

## Typography

Font mengikuti bawaan React Native/Android; komponen yang diperiksa tidak menetapkan `fontFamily` khusus. Tidak ada keluarga font atau line-height global yang bisa dicatat sebagai token terverifikasi.

### Hierarchy
- **Balance**: nominal saldo utama, tebal dan lebih besar daripada teks pendamping.
- **Screen title**: judul modal, tebal.
- **Input**: isi field standar; field nominal transaksi memakai ukuran 28 dan bobot 800 sebagai varian khusus.
- **Button / quick action**: teks aksi yang tegas.
- **Field label**: label ringkas; sejumlah label memakai huruf kapital.
- **Tab label**: label navigasi yang ringkas.

Ukuran dan bobot bukan skala terpusat dalam kode: ada variasi antar komponen. Frontmatter mencatat contoh berulang/representatif, bukan klaim semua teks sudah distandardisasi.

## Layout

Layar memakai susunan vertikal yang dapat di-scroll, dengan baris horizontal untuk ringkasan dan aksi. Padding layar/form yang diamati adalah 16 unit; kartu saldo memakai padding 20 dan margin horizontal 16. Chip kategori serta pilihan dompet memakai flex-wrap dan gap 8.

Form memiliki header, area scroll, kelompok input, dan tombol simpan. Insets status bar dan navigasi diperhitungkan pada layar terkait; form menggunakan KeyboardAvoidingView. Navigasi bawah memiliki lima tujuan. Tingginya dihitung sebagai 58 ditambah bottom inset dengan minimum Android 20.

Tidak ditemukan breakpoint tablet terpusat pada sumber yang diperiksa. Adaptasi tablet, keyboard, dan font besar perlu diuji di perangkat; dokumen ini tidak mengklaim pengujian tersebut sudah dilakukan.

## Elevation & Depth

**Berlapis ringan:** permukaan putih dibedakan dari latar dengan border serta bayangan lembut. Bayangan berperan sebagai pemisah kelompok, bukan dekorasi tebal.

### Shadow Vocabulary

`src/theme/colors.ts` menyediakan `shadowStyles.sm`, `md`, dan `lg`. Nilai persisnya dicatat dalam `.impeccable/design.json`; kartu saldo menggunakan `md`. Navigasi bawah memakai elevation Android 12 serta properti shadow tersendiri, bukan token bayangan kartu.

**The Light Layers Rule.** Pertahankan pemisahan lembut antar kartu; jangan mempertebal bayangan sebagai pengganti hierarki informasi.

## Shapes

Sudut membulat mengikuti fungsi: chip kategori lebih rapat, field dan tombol pintasan membulat sedang, tombol simpan lebih lunak, kartu saldo paling lebar. Radius normatif ada di frontmatter. Border kartu dan field yang diperiksa memakai ketebalan 1.

Tombol tutup modal berbentuk lingkaran 36 unit dengan hitSlop 12 pada form transaksi. Ukuran tampilan komponen tidak dengan sendirinya membuktikan seluruh target sentuh aplikasi memenuhi minimum Android 48 dp.

## Components

### Buttons

Aksi utama memakai teal dan teks putih. Tombol simpan transaksi memakai radius action, padding vertikal 14, dan gap ikon/teks 8. State pressed memakai opacity 0.85 dan scale 0.99. Target minimum aksi yang telah diperbaiki adalah 48 unit logis; label ikon tersedia pada aksi utama dan pilihan memiliki selected state. Ini bukan klaim seluruh aplikasi sudah lulus TalkBack. Pintasan pada kartu saldo memakai padding 8/14, radius field, opacity pressed 0.85, serta scale 0.98.

Delapan form inti memiliki guard simpan sinkron, disabled/busy accessibility state, dan satu label “Menyimpan…” saat pending. Tombol dengan state disabled memakai opacity 0.65; ini state sementara, bukan warna teks normal. Hover/focus styling global tidak terlihat pada komponen native yang diperiksa; jangan mengarang state tersebut sebagai fitur yang sudah ada.

### Chips

Chip kategori memakai permukaan putih, border tipis, radius chip, padding 8/12, dan label sekunder. Warna terpilih mengikuti kategori; pilihan pemasukan/pengeluaran memakai keluarga warna semantik masing-masing.

### Cards / Containers

Kartu saldo kembali ke susunan versi 1.6.0: saldo dan tombol catat berada dalam satu baris; pemasukan dan pengeluaran berdampingan di bawah. Ikon pemasukan/pengeluaran tetap berada dalam permukaan soft. Kartu memakai surface, radius balance-card, border tipis, padding card, dan shadow md. Kartu nominal form memakai radius amount-card dan padding 18.

### Inputs / Fields

Field standar berpermukaan putih, border netral, radius field, padding 12/14, dan teks utama. Textarea transaksi memiliki minHeight 80. Field nominal adalah varian besar dengan prefix mata uang dan format angka sesuai bahasa. Perubahan border khusus focus/error/disabled tidak ditemukan pada style field yang diperiksa; validasi menggunakan Alert pada alur simpan.

### Navigation

Lima tab: Beranda, Transaksi, Grafik, Hutang, dan Investasi. Tab aktif memakai primary dan ikon Ionicons solid; tab nonaktif memakai textMuted serta ikon outline. Ikon berukuran 22; label mengikuti tab-label. Pertahankan bottom inset agar tidak bertabrakan dengan navigasi sistem Android.

## Do's and Don'ts

### Do:
- **Do** utamakan keterbacaan nominal dan label pendamping.
- **Do** gunakan token warna yang ada dan pertahankan makna finansialnya.
- **Do** gunakan kartu berlapis ringan, border halus, dan sudut membulat sesuai fungsi.
- **Do** pertahankan ruang aman sistem dan uji nominal panjang serta ukuran font besar di Android.

### Don't:
- **Don't** tambahkan dekorasi yang mengalahkan informasi keuangan.
- **Don't** menukar warna profit/loss atau hutang/piutang demi variasi visual.
- **Don't** menambah bayangan tebal pada setiap permukaan.
- **Don't** menganggap tema gelap, adaptasi tablet, state focus, atau aksesibilitas menyeluruh sudah terverifikasi hanya berdasarkan dokumen ini.

<!-- Visual rollback requested: theme and existing StyleSheet blocks restored from 5358742 (1.6.0). Functional savings summaries/loading/errors remain. Legacy muted/accent contrast and small touch targets are not claimed WCAG compliant. -->
