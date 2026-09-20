# Desain Fitur: Target Pembelian & Rencana Impian (Plans / Wishlist)

- **Tanggal:** 2026-09-20
- **Status:** Diimplementasikan
- **Aplikasi:** Cashflower (v1.2.0)

---

## 1. Masalah & Kebutuhan
Banyak pengguna mencatat uang masuk dan uang keluar, namun kehilangan fokus terhadap *tujuan* finansial mereka (misalnya ingin membeli Laptop baru seharga 1 juta, mengganti HP, atau membeli inventaris usaha).
Pengguna membutuhkan:
1. Cara mencatat barang/rencana impian beserta target nominal dan kategorinya.
2. Mekanisme pelacakan dana otomatis yang mengikuti **Saldo Kas Berjalan** tanpa perlu menghitung manual.
3. Fitur **Pin / Star (⭐)** agar rencana-rencana prioritas selalu terpampang jelas di kartu Beranda sebagai pengingat visual.
4. Integrasi langsung saat barang berhasil dibeli ("Beli & Catat Pengeluaran") sehingga saldo kas berkurang realistis.

---

## 2. Keputusan Desain yang Disepakati (Melalui /grill-me)
* **Logika Perhitungan Progres:** Otomatis mengikuti `Saldo Kas Berjalan = Total Pemasukan - Total Pengeluaran`.
* **Sistem Pin:** Pengguna dapat menyematkan (pin/star) beberapa rencana sekaligus. Rencana ter-pin tampil langsung di widget Beranda.
* **Status Kesiapan Dana:**
  - 🟢 **Dana Siap Dibeli!** bila Saldo Kas $\ge$ Target Uang.
  - 🟡 **Kurang Rp [X] lagi** bila Saldo Kas $<$ Target Uang.
* **Navigasi:**
  - Tab Bar Bawah tetap 5 tab agar layar ponsel tidak sesak.
  - Kartu Widget interaktif di [Beranda](file:///home/kingfish/Documents/andro/cashflower/src/app/(tabs)/index.tsx).
  - Layar modal pengelolaan penuh di [`modal/plans.tsx`](file:///home/kingfish/Documents/andro/cashflower/src/app/modal/plans.tsx) (dengan tab "Target Aktif" vs "Sudah Tercapai").
  - Form tambah/ubah rencana di [`modal/add-plan.tsx`](file:///home/kingfish/Documents/andro/cashflower/src/app/modal/add-plan.tsx).
* **Alur Pembelian:** Saat dana siap dan barang dibeli, pengguna disodori opsi konfirmasi untuk mencatatnya otomatis ke transaksi kas pengeluaran (`addTransaction`) dan memindahkan plan ke status `is_completed = 1`.

---

## 3. Komponen & Berkas yang Dibuat / Diperbarui
1. [`src/types/index.ts`](file:///home/kingfish/Documents/andro/cashflower/src/types/index.ts): Interface `FinancialPlan` dan pembaruan `BackupData`.
2. [`src/db/index.ts`](file:///home/kingfish/Documents/andro/cashflower/src/db/index.ts): Tabel `financial_plans`, CRUD (`getPlans`, `addPlan`, `updatePlan`, `togglePlanPinned`, `completePlan`, `deletePlan`), serta dukungan Backup/Restore.
3. [`src/context/finance-context.tsx`](file:///home/kingfish/Documents/andro/cashflower/src/context/finance-context.tsx): State `plans`, fungsi `createPlan`, `editPlan`, `togglePinPlan`, `fulfillPlan`, `deletePlanById`.
4. [`src/components/plan-item.tsx`](file:///home/kingfish/Documents/andro/cashflower/src/components/plan-item.tsx): Komponen kartu target dengan progress bar dinamis terhadap saldo kas.
5. [`src/app/modal/plans.tsx`](file:///home/kingfish/Documents/andro/cashflower/src/app/modal/plans.tsx): Layar daftar target lengkap dengan pencarian, banner saldo, dan filter status.
6. [`src/app/modal/add-plan.tsx`](file:///home/kingfish/Documents/andro/cashflower/src/app/modal/add-plan.tsx): Form input target dengan pratinjau progres langsung dan toggle pin ⭐.
7. [`src/app/(tabs)/index.tsx`](file:///home/kingfish/Documents/andro/cashflower/src/app/(tabs)/index.tsx): Widget Target Impian di Beranda.
8. [`src/app/modal/settings.tsx`](file:///home/kingfish/Documents/andro/cashflower/src/app/modal/settings.tsx): Menu Target Pembelian di Pengaturan & pencatatan ringkasan data lokal.
9. [`README.md`](file:///home/kingfish/Documents/andro/cashflower/README.md): Dokumentasi fitur & SOP panduan operasional.
