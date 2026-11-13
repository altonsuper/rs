# PLAYBOOK — jadi agen RedSeller yang dipercaya, dengan sumber daya minim

**Tesis satu kalimat:** jangan bangun aplikasi booking. Bangun **meja layanan (desk) untuk menginap lama & rombongan di satu kota**, di atas WhatsApp, dan tumbuh lewat orang yang sudah punya audiens.

---

## 1. Angka yang menentukan segalanya

RedSeller memberi **±10% komisi per penjualan, dibayar tiap 2 minggu**, gratis daftar, kamu booking di aplikasi lalu bagikan kode booking ke tamu. Jalur kode promo/affiliate lebih kecil, sampai ±6%.

| Bentuk order | Room-nights | Komisi kamu | Waktu chat |
|---|---|---|---|
| 1 kamar, 1 malam | 1 | ±Rp 15rb | ±15 menit |
| 1 kamar, 14 malam (keluarga pasien) | 14 | ±Rp 195rb | ±20 menit |
| 5 kamar, 30 malam (crew proyek) | 150 | ±Rp 1,7jt | ±1 jam |

Effort hampir sama. Hasilnya beda 100×.

> **North star: ROOM-NIGHTS PER ORDER.** Bukan jumlah order, bukan followers, bukan jumlah chat.
> Kalau rata-rata kamu di bawah 3, kamu sedang bekerja keras untuk uang receh — geser niche, jangan tambah jam kerja.

Konsekuensi lain: dengan Rp 15rb per order, **iklan berbayar secara matematis tidak mungkin**. Pertumbuhan hanya dari: repeat, referral partner, dan audiens milik sendiri (daftar Alert).

---

## 2. Yang sudah dibangun di folder ini

| File | Fungsi | Kenapa ini yang dipilih |
|---|---|---|
| `index.html` | Etalase kamar terkurasi. **Nol kolom input** — tap kartu → WhatsApp sudah terisi | Kartu kamarnya adalah form-nya. Tanggal dibicarakan di chat, bukan di formulir. |
| `admin.html` | Alat kurasi: tambah/ubah/hapus/urutkan/tayangkan + skor kelayakan + export JSON | Ini "backend"-nya. Tanpa server, tanpa database. |
| `assets/props/<id>/property.json` | **Sumber data tiap listing.** Foto properti disimpan di folder yang sama. | Perubahan satu properti tidak mengubah file listing lain. |
| `data/site.json` | Metadata brand, WhatsApp, jam layanan, dan disclaimer. | Satu sumber untuk informasi situs. |
| `data/properties.json` | Katalog publik gabungan hasil `node tools/build_catalog.js`. | Dipakai etalase dan admin; jangan edit data listing langsung di file hasil generate. |
| `AI_CONTEXT.md` | Protokol perintah AI untuk menambah/menghapus listing dan edit UI. | Ikuti supaya folder, path foto, dan katalog tetap sinkron. |
| `ARCHITECTURE.md` | Jawaban teknis: kenapa bukan scraper, cara deploy, batas Git | Baca sebelum menambah teknologi apa pun. |
| `stay-ledger.xlsx` | CRM + komisi + partner + daftar Alert + dashboard | Menggantikan software. Rumus jalan juga di Google Sheets. |
| `wa-templates.md` | 16 script siap tempel + setup WhatsApp Business | Kecepatan & konsistensi = keunggulan yang tidak bisa dibeli aplikasi. |
| `tools/make_ledger.py` | Generator ulang spreadsheet | Kalau struktur perlu diubah, ubah skrip, bukan file manual. |

**Tiga mekanisme yang membuatnya-scalable tanpa biaya:**

1. **Kartu → WhatsApp, bukan formulir.** Tamu tidak mengisi apa pun. Kartu yang dia tap sudah membawa nama properti, kode, dan patokan ke dalam pesan. Nol hosting, nol database, nol friksi.
2. **Kode referral di link.** `index.html?src=KOSBUDI` → otomatis tercatat di pesan → otomatis terhitung di sheet Partner. Atribusi tanpa teknologi tracking.
3. **Daftar Alert.** Orang yang minta dikabari kamar murah = audiens milik sendiri, tersegmentasi per lokasi & budget. Bisa dihubungi gratis, selamanya. Ini aset paling berharga yang bisa kamu bangun dengan Rp 0.

---

## 3. Yang harus kamu lakukan sebelum menyebar link

1. Perbarui `data/site.json` dengan metadata brand dan nomor WhatsApp admin (format `62…`, tanpa `+`).
2. Ganti data contoh pada `assets/props/<id>/property.json` dengan **properti yang benar-benar sudah kamu cek**. Jangan tampilkan properti fiktif — itu membunuh trust yang jadi satu-satunya produk kamu.
3. Cek ulang asumsi potongan menginap lama (`longStay.weekly` / `monthly`) di aplikasi RedSeller. Kalau tidak ada, **set 0** dan ganti angle ke "jarak terdekat + bisa tambah malam mendadak".
4. Upload `stay-ledger.xlsx` ke Google Drive → buka dengan Google Sheets → *Save as Google Sheets*. Hapus 4 baris CONTOH.
5. Pasang 16 quick reply dari `wa-templates.md` + label + jam operasional jujur.

---

## 4. Rencana 14 hari (target: 1 order gemuk, bukan 100 chat)

**Hari 1 — pilih satu niche + satu kota.**
Kandidat dengan permintaan berulang & kamar banyak malam: keluarga pasien RS rujukan, crew proyek/kontraktor, karyawan baru relokasi, mahasiswa baru/wisuda, musim ujian (CPNS/UTBK). Pilih **satu** yang kamu punya akses orang dalamnya.

**Hari 2–3 — verifikasi 10 properti.**
Cek di RedSeller: harga, jarak jalan kaki asli, tipe kamar, ada lift/tidak, jendela/tidak, aturan deposit. Foto & catatan jujur. Ini kerja paling membosankan dan paling menentukan — tidak ada yang bisa mengambilnya dari kamu.

**Hari 4 — pasang alat.**
Nomor WA + brand + halaman + ledger + quick reply. Selesai dalam 2 jam.

**Hari 5–7 — buka daftar Alert.**
Sebar link halaman ke 5 grup WA relevan + status WA. Pesan: *"Kalau butuh kamar dekat {RS/kampus}, isi ini, saya kabari kalau ada yang murah."* Target: **30 nomor** masuk daftar Alert.

**Hari 8–11 — dekati 10 penjaga gerbang (gatekeeper).**
Pemilik kos, koperasi RS, admin HR kontraktor, ketua grup WA, ojol, organizer wisuda. Pakai `/partner`. Target: **3 partner aktif**, masing-masing kirim 1 tamu percobaan.

**Hari 12–14 — tutup 1 order rombongan/long-stay.**
Pakai `/crew` ke 5 kontraktor/HR. Satu order 5 kamar × 30 malam mengalahkan 100 order transit.

**Setiap Senin:** buka Dashboard, lihat 3 angka — room-nights/order, repeat rate, partner share.

---

## 5. Kapan lanjut, kapan berhenti (biar tidak buang sumber daya)

| Sinyal setelah 30 hari | Artinya | Tindakan |
|---|---|---|
| Room-nights/order ≥ 7 | Modelnya benar | Tambah partner di niche yang sama |
| 3+ partner mengirim order | Distribusi bekerja | Rekrut 10 partner lagi, jangan pindah kota |
| Repeat rate ≥ 25% | Trust-nya nyata | Mulai minta testimoni tertulis |
| Room-nights/order < 3 & komisi < Rp 500rb | Kamu jual ke pasar yang salah | **Ganti niche**, bukan ganti aplikasi |
| Batal > 15% | Janji kamu lebih besar dari kenyataan | Perbaiki catatan properti & skrip `/pilih` |
| Alert > 100 tapi konversi ~0 | Daftar murah tidak bernilai | Ganti pemicu: dari "harga murah" ke "kamar kosong di tanggal sibuk" |

**Aturan sumber daya:** uang keluar hanya untuk (a) nomor WA kedua, (b) domain, (c) goodwill refund. Belum ada iklan, belum ada langganan software, belum ada developer.

---

## 6. Tangga otomasi — naik hanya kalau langkah itu berulang 20×

| Tingkat | Pemicu | Yang diotomasi | Alat | Biaya |
|---|---|---|---|---|
| 0 (sekarang) | — | Tidak ada. WA Business + Sheets | gratis | Rp 0 |
| 1 | quote ditulis ulang 20× | Template quote terisi dari Sheets | Apps Script / salin-tempel | Rp 0 |
| 2 | pengingat H-1 terlewat 2× | Reminder H-1 & H+1 otomatis | Kalender + Apps Script | Rp 0 |
| 3 | lead > 10/hari | Balasan pertama + tanya 4 data | WhatsApp Cloud API / n8n free tier | Rp 0–150rb/bl |
| 4 | partner > 10 | Laporan bagi hasil bulanan otomatis | Apps Script → PDF/WA | Rp 0 |
| 5 | order > 150/bulan | Halaman per patokan (SEO) + pembayaran | Static site + payment link | < Rp 200rb/bl |

Yang **tidak** dibangun di tingkat mana pun: mesin pencarian kamar, sinkronisasi ketersediaan, scraping harga, aplikasi mobile. Tanpa API resmi itu rapuh, mahal, dan melanggar aturan.

---

## 7. Rambu-rambu (jangan dilewati)

- **Cek tertulis ke mentor/CS RedSeller:** boleh markup? boleh sub-reseller? boleh terima uang tamu? boleh pakai kata "RedDoorz" di nama brand/domain? Simpan jawabannya.
- **Jangan tahan uang tamu** kalau bisa. Arahkan bayar ke RedDoorz/hotel. Lebih aman secara hukum, lebih dipercaya, dan tidak ada beban refund di kas kamu.
- **Branding:** "KamarPasti — mitra reseller resmi RedSeller RedDoorz". Jangan tampil sebagai situs resmi RedDoorz, jangan pakai logo mereka sebagai logo kamu, jangan daftar domain berisi merek mereka.
- **Data tamu:** cukup nama + WA + kode booking. Jangan simpan foto KTP atau data kartu di spreadsheet.
- **Ketergantungan satu pemasok:** KoolKost / SANS / Sunerra ada di aplikasi yang sama — pakai itu untuk variasi tanpa daftar program baru. Setelah niche stabil, baru pertimbangkan pasokan long-stay lain.
- **Janji garansi:** tulis batasnya (pengganti setara atau bantu refund sesuai ketentuan properti). Jangan janjikan uang kembali tanpa syarat kalau kamu tidak menanggung sendiri.

---

## 8. Jalur skala bulan 2–3 (urutan, jangan paralel)

1. **Dalam dulu, bukan lebar:** 10 partner aktif di niche & kota yang sama.
2. **Halaman per patokan:** "hotel murah dekat {RS/kampus/stasiun}" — statis, murah, trafik jangka panjang → link WA dengan `?src=MAPS-{patokan}`.
3. **Bukti sosial:** dinding testimoni (nama disamarkan, izin dulu) + cerita penyelamatan check-in.
4. **Baru kota kedua**, kalau kota pertama sudah punya ≥ 5 partner aktif dan room-nights/order ≥ 7. Kota kedua tanpa partner = mulai dari nol lagi.

---

## 9. Yang membuat ini "awesome" di mata tamu

Bukan teknologinya. Yang mereka ceritakan ke temannya:

> "Saya chat satu orang, dia tahu saya butuh dekat RS, dia bilang kamarnya tanpa jendela jadi saya tidak kaget, dia ingatkan besok check-in, dan waktu resepsionis bilang penuh, dia yang urus sampai saya dapat kamar."

Itu produknya. Halaman dan spreadsheet di folder ini cuma membuat hal itu bisa kamu ulang 100× tanpa kehilangan mutu.
