# ARSITEKTUR — jawaban untuk Proj 1 & Proj 2

Ringkas: **Proj 1 benar, dan sudah dikerjakan. Proj 2 separuh benar — bagian "scraper"-nya justru yang harus dibuang.**

---

## PROJ 1 — penyederhanaan: kamu benar, dan ini lebih penting dari yang kamu kira

### Apa yang sebenarnya dilakukan WhatsApp RedDoorz

Dari halaman yang kamu kirim, alur WA resmi RedDoorz itu **7 langkah**: kirim nama kota → balas nomor urut properti → cek detail → tentukan tanggal & kamar → pilih OTA pesaing → **kirim 2 screenshot bukti harga** → balas "Done" → verifikasi → bayar.

Itu bukan layanan. Itu **mesin price-match**. Senjatanya adalah *harga*, dan mereka pemilik kamar — jadi mereka bisa selalu menang.

**Kesimpulan strategis yang keras: jangan pernah memposisikan diri sebagai "lewat kami lebih murah".** Kamu akan kalah, dan kamu akan terlihat bohong saat tamu membandingkan.

### Yang bisa kamu menang, dan sudah dibangun

| Mereka (bot resmi) | Kami (etalase ini) |
|---|---|
| 7 langkah + 2 screenshot | **1 tap** |
| Ketik kota, pilih nomor urut | Tap kamar yang sudah dikurasi |
| Semua properti dilempar ke tamu | Hanya yang sudah kami datangi |
| Menang di harga | Menang di **kepastian**: kamar ini minusnya apa, jaraknya berapa, depositnya berapa |
| Bot, lalu oper ke CS | Satu orang, satu nomor, dari tanya sampai check-in |

**Prinsip desain baru: tidak ada satu pun kolom input di halaman depan.** Nol. Sudah diuji otomatis (`ZERO typing fields → 0`).

Yang terjadi sekarang:
- Tamu tap kartu kamar → pesan WhatsApp sudah berisi nama properti + kode (`KP-03`) + patokan + `SRC:WEB-KP-03`.
- Tanggal, jumlah kamar, budget → **dibicarakan di chat**, seperti manusia normal. Bukan form.
- Bingung? Satu tombol "Minta dipilihkan". Tetap tanpa ketik.
- Filter cuma chip: `RS Sardjito` `Kampus UGM` `Stasiun Tugu` `🌙 Menginap lama`. Satu tap, bukan pencarian.

**Kartu kamar adalah form-nya.** Konteks dibawa oleh kartu, sisanya dibawa oleh percakapan. Itu penyederhanaan yang kamu maksud.

> Peluang yang perlu kamu konfirmasi ke RedDoorz: bolehkah reseller ikut mengklaim price-match untuk tamu? Kalau boleh, itu berubah jadi layanan ("kirim screenshot ke saya, saya yang urus") — senjata mereka jadi tenaga kerja kamu. **Jangan dijanjikan sebelum ada jawaban tertulis.**

---

## PROJ 2 — scraper Google Maps: ini bagian yang harus dibuang

Aku tahu ini bukan jawaban yang kamu harapkan. Tapi kamu minta "step carefully because resources are limited" — dan scraper adalah jalan yang **paling mahal**, bukan paling murah.

**1. Datanya salah.** Google Maps tidak punya harga kamar dan ketersediaan RedDoorz. Yang ada: nama, alamat, rating, ulasan, jam operasional. Data yang benar-benar bisa kamu jual tetap harus kamu ambil dari aplikasi RedSeller. Jadi scraper tidak menghapus pekerjaan utama kamu — ia cuma menambah pekerjaan baru.

**2. Dilarang.** Ketentuan Google Maps Platform punya klausul **3.2.3(a) No Scraping** — dilarang mengekstrak/mengambil/menyimpan konten Google Maps untuk dipakai di luar layanan mereka. Untuk bisnis yang seluruh produknya adalah *kepercayaan*, membangun di atas pelanggaran ToS adalah risiko yang tidak sepadan.

**3. Hitungan sumber dayanya tidak masuk.**

| Jalan | Waktu awal | Biaya rawat | Hasil |
|---|---|---|---|
| Scraper Maps + parser + pembersih data | berhari-hari | pecah tiap tampilan berubah, risiko blokir IP | data yang tetap kurang |
| **Kurasi manual 50 kamar × 3 menit** | **2,5 jam** | 30 menit/minggu refresh harga | data yang lebih baik dari milik siapa pun |

**4. Yang paling berharga justru tidak ada di internet mana pun.**

> Jarak jalan kaki sebenarnya (bukan garis lurus), kamar tanpa jendela, deposit tunai Rp 100rb, check-in cuma sampai 23.00, nama resepsionis yang kooperatif, apakah pemilik mau tarif bulanan.

Data itu **tidak bisa di-scrape oleh siapa pun** — termasuk pesaing kamu. Itulah satu-satunya parit pertahanan yang kamu punya. Menyalin data orang lain membuat kamu bisa digantikan; mencatat pengetahuan sendiri membuat kamu tidak bisa digantikan.

### Jadi backend-nya apa?

**Bukan scraper. Alat kurasi.** `admin.html` adalah "backend" kamu: ia menangkap pengetahuan kamu ke dalam JSON, dengan skor kelayakan supaya keputusan menayangkan sesuatu tidak asal-asalan.

Kalau nanti kamu benar-benar butuh data geo (jarak, peta):
- **Tempel link peta saja** (field `mapsUrl`). Mengarahkan orang ke Google Maps itu normal dan boleh. Yang dilarang menyalin isinya.
- Mau hitung jarak otomatis? Pakai **OpenStreetMap** (Nominatim/Overpass, lisensi ODbL — wajib atribusi). Legal, gratis, tanpa API key.
- Mau rating resmi? **Google Places API** resmi, bukan scraping — tapi patuhi aturan penyimpanan & atribusi mereka, dan tetap tidak memberi harga kamar.

---

## "No need DB, right?" — benar. Git adalah database kamu

```
kamarpasti/
├── index.html              etalase (baca JSON, nol input, 1 tap → WA)
├── admin.html              alat kurasi: tambah / ubah / hapus / urutkan / tayangkan
├── AI_CONTEXT.md           protokol AI untuk tambah / hapus properti dan edit UI
├── assets/props/           satu folder per properti: property.json + foto
│   └── kp-01/
│       ├── property.json
│       └── cover.webp      opsional
├── data/
│   ├── site.json           sumber metadata brand dan kontak
│   └── properties.json     katalog publik hasil generate
├── tools/build_catalog.js  gabungkan folder properti menjadi katalog etalase
├── stay-ledger.xlsx        CRM & komisi (Google Sheets)
├── wa-templates.md         16 script WhatsApp
├── PLAYBOOK.md             rencana bisnis 14 hari
└── tools/make_ledger.py    generator ulang spreadsheet
```

**Sumber data listing:** `assets/props/<id>/property.json`. Metadata situs ada di `data/site.json`. Jalankan `node tools/build_catalog.js` untuk membuat `data/properties.json`, lalu commit folder sumber dan katalog hasil generate. Etalase dan admin membaca katalog itu; situs statis tidak bisa menemukan folder baru secara otomatis.

Simpan foto di folder properti, misalnya `assets/props/kp-01/cover.webp`, lalu isi field `photo` dengan path tersebut. Katalog publik tidak menyertakan `notes`; jangan menaruh rahasia atau catatan internal di file yang berada di folder hosting.

**Alur admin:** draft di `localStorage` → export katalog gabungan ke `data/properties.json` → `node tools/build_catalog.js --sync-from-catalog` untuk memperbarui folder sumber dan membangun ulang katalog.

### Git menangani apa, dan tidak

| Git MENANGANI | Git TIDAK menangani |
|---|---|
| Riwayat perubahan per properti dan medianya (siapa, kapan, apa) | Ketersediaan & harga real-time |
| Rollback kalau salah hapus / salah harga | Data tamu & pesanan (itu di ledger/WA) |
| Cabang untuk draft kamar baru | Rahasia / API key (file situs ini publik!) |
| Deploy otomatis (push → situs berubah) | Dua orang mengedit file yang sama sekaligus |
| Audit: bukti kamar sudah diverifikasi tanggal berapa | Pencarian berat / ribuan listing |

**Dua jebakan yang harus kamu tahu:**
1. **Semua file di folder situs dapat diakses publik.** Katalog hasil generate membuang `notes`; jangan simpan nama/nomor pribadi, data tamu, atau rahasia di `assets/props/`.
2. **Konflik merge.** Setiap properti dan foto berada di folder masing-masing, jadi perubahan listing yang berbeda tidak perlu mengedit satu JSON besar sekaligus.

---

## "What environment is this app required to run?"

**Pengunjung tidak membutuhkan runtime.** Situs tetap HTML + CSS + JS biasa dengan katalog JSON statis. Untuk mengubah listing dari folder per-properti dan membangun ulang katalog, pengelola memerlukan Node.js.

| Lapisan | Kebutuhan |
|---|---|
| Pengunjung | Browser apa pun. Tidak install apa pun. |
| Situs | Hosting statis: GitHub Pages / Cloudflare Pages / Netlify. Gratis, HTTPS, CDN. |
| Admin | File HTML yang sama. Buka di HP atau laptop untuk edit draft dan export. |
| Build katalog | Node.js untuk menjalankan `node tools/build_catalog.js` setelah folder listing berubah. |
| Server/backend | **Tidak ada.** Tidak ada proses yang harus hidup. |
| Deploy | Build katalog → commit sumber dan hasil build → `git push`. |
| Biaya bulanan | Rp 0 (domain opsional ±Rp 150rb/tahun) |

Yang aku pakai di workspace ini (Python `http.server`) **hanya untuk pratinjau** — bukan syarat produksi.

### Cara online-kan
1. Buat repo GitHub, upload seluruh folder `kamarpasti/`.
2. **GitHub Pages:** Settings → Pages → Source: `Deploy from a branch` → Branch `main` / root → Save. Situs hidup di `https://<user>.github.io/<repo>/`.
   *(Alternatif: Cloudflare Pages / Netlify → hubungkan repo → build command kosong, publish directory `/`.)*
3. Sebelum deploy perubahan, jalankan `node tools/build_catalog.js` (atau `--sync-from-catalog` jika memakai export admin), lalu commit `data/site.json`, `assets/props/`, dan `data/properties.json`.
4. Selesai. Setiap commit = situs ter-update.

### Kerja dari HP
Buka `admin.html` → edit kamar (autosave) → **Salin JSON**. Untuk memperbarui sumber per-folder dan katalog, jalankan `node tools/build_catalog.js --sync-from-catalog` dari lingkungan yang memiliki Node.js, lalu commit folder sumber dan katalog.

---

## Kapan kamu benar-benar butuh backend (jangan sebelum ini)

| Pemicu nyata | Baru tambah | Perkiraan biaya |
|---|---|---|
| 2+ orang mengedit katalog | CMS berbasis Git (Decap/Sveltia) atau pecah JSON per kamar | Rp 0 |
| Tamu minta harga real-time | Bukan scraper — tanya API resmi ke RedDoorz | — |
| Sub-agen mau lihat komisi sendiri | 1 Cloudflare Worker + KV, baca ledger | Rp 0–100rb/bl |
| Terima pembayaran | Payment link (QRIS) — bukan bangun gateway | per transaksi |
| > 300 kamar & pencarian berat | Index pencarian statis (build-time), masih tanpa DB | Rp 0 |

Sampai pemicu itu muncul, setiap rupiah dan jam yang dipakai untuk backend adalah uang yang diambil dari kegiatan yang benar-benar menghasilkan: **mendatangi kamar dan bicara ke penjaga gerbang.**

---

## Status uji (otomatis, browser sungguhan)

53 pemeriksaan lulus, dijalankan di Chrome headless lewat Puppeteer:

- Etalase: **nol kolom input**, kartu & chip terbentuk dari data, draft tidak bocor, catatan internal tidak bocor, tap kartu → `wa.me` dengan kode properti + `SRC`, filter patokan & menginap lama benar, fallback tanpa jaringan hidup.
- Admin: statistik benar, skor kelayakan benar (85 tanpa foto → 100 dengan foto), **kompresi foto 2.801 KB → 65 KB**, tambah/ubah/hapus/urungkan/urutkan/cari/filter kedaluwarsa, hanya satu "Pilihan Kami", **export publik membuang catatan internal**, backup lokal menyimpannya.
- Loop penuh: edit di admin → muncul di etalase → nomor WA baru terpakai.
- Mobile 390 px: tidak ada overflow, editor bisa dipakai. Tanpa error JS/konsol.

---

## Yang harus kamu lakukan sekarang

1. Ganti `meta.wa` di Pengaturan (sekarang masih `6281234567890` — placeholder).
2. **Buang 6 kamar CONTOH.** Ganti dengan kamar yang benar-benar kamu datangi. Menayangkan properti fiktif = membunuh satu-satunya produk kamu.
3. Foto asli dari HP kamu. Skor tanpa foto tidak akan lewat 85, dan itu memang disengaja.
4. Minta jawaban tertulis dari RedDoorz: boleh tampilkan harga kisaran? boleh foto sendiri? boleh markup / sub-agen / terima uang tamu? boleh pakai kata "RedDoorz" di brand?
5. Baru sebar link.
