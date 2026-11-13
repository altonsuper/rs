# Protokol AI untuk katalog Redseller AltonZ

Dokumen ini adalah instruksi kerja untuk AI saat menerima perintah tambah/hapus properti atau edit UI. Pertahankan data, jangan mengarang detail, dan jalankan validasi sebelum menyatakan selesai.

## Struktur sumber data

```text
redseller/
├── AI_CONTEXT.md
├── index.html                    # Etalase; membaca katalog hasil build
├── admin.html                    # Editor/pratinjau dan export katalog
├── data/
│   ├── site.json                 # Metadata brand, WA, jam, janji, disclaimer
│   └── properties.json           # Katalog publik hasil generate; jangan edit listing langsung
├── assets/props/
│   ├── README.txt
│   ├── kp-01/
│   │   ├── property.json         # Sumber data satu properti
│   │   └── cover.webp            # Foto utama opsional
│   └── _archive/                 # Listing yang dihapus; bukan sumber etalase
└── tools/build_catalog.js
```

`assets/props/<id>/property.json` berisi data satu listing. Field `photo` menunjuk file gambar relatif ke root situs, contoh `assets/props/kp-01/cover.webp`. File `data/properties.json` adalah gabungan publik yang dibaca halaman; folder baru baru tampil setelah katalog dibangun.

File di `assets/props/` dan `data/` dapat diakses publik. Jangan memasukkan catatan internal, nomor pribadi, data tamu, atau rahasia ke dalamnya. Generator menghapus field `notes` dari katalog publik.

## Bentuk perintah

### Tambah properti

Gunakan perintah:

```text
Tambah properti: [nama dan detail yang tersedia]
```

Prosedur:

1. Pastikan ID dan kode belum dipakai. Gunakan pola `kp-07` dan `KP-07`, lanjutkan nomor tertinggi.
2. Buat folder `assets/props/<id>/` dan `property.json` di dalamnya. Ikuti field listing lain sebagai skema.
3. Isi hanya detail yang diberikan atau sudah diverifikasi. Jika data belum ada, tanyakan; jangan membuat harga, fasilitas, jarak, atau tanggal verifikasi.
4. Default `published:false`, `featured:false`, `photo:""`. Tayang hanya jika diminta dan data listing sudah siap.
5. Jika ada foto, taruh file milik sendiri di folder properti, lalu isi `photo` dengan path seperti `assets/props/<id>/cover.webp`.
6. Jalankan `node tools/build_catalog.js`, lalu `node tools/build_catalog.js --check`.

### Hapus properti

Gunakan perintah:

```text
Hapus properti: <id atau kode>
```

Pastikan identitasnya unik. Pindahkan folder properti ke `assets/props/_archive/` agar foto dan data bisa dipulihkan; jangan hapus permanen kecuali diminta. Bangun ulang katalog dan pastikan listing tidak ada lagi di `data/properties.json` serta halaman hanya menampilkan properti `published:true`.

### Edit UI

Gunakan perintah:

```text
Edit UI: [perubahan tampilan yang diinginkan]
```

Ubah `index.html` untuk etalase atau `admin.html` untuk editor. Jangan menaruh detail listing langsung di HTML; semua listing harus tetap berasal dari `data/properties.json`. Pertahankan filter, tautan WhatsApp, mode mobile, aksesibilitas, dan jangan menambahkan klaim yang tidak didukung `data/site.json` atau data listing.

## Alur Admin

Admin bekerja dengan katalog gabungan dan draft lokal. Jika hasil **Export** admin ingin dijadikan sumber folder:

1. Simpan export admin sebagai `data/properties.json`.
2. Jalankan `node tools/build_catalog.js --sync-from-catalog`.
3. Periksa perubahan folder, metadata, dan katalog hasil generate.

Sinkronisasi mempertahankan foto di folder yang masih aktif, memindahkan listing yang dihapus ke `_archive`, dan menghapus `notes` dari file publik.

## Checklist selesai

- `node tools/build_catalog.js --check` berhasil.
- `node --check tools/build_catalog.js` berhasil.
- `node tools/test_build_catalog.js` berhasil.
- `data/properties.json` berisi gabungan terbaru, tanpa `notes`.
- Semua path `photo` yang diisi menunjuk file yang ada.
- Properti draft tidak muncul di halaman; WhatsApp, filter, admin, dan layout mobile tetap berfungsi.
- Jika ada perubahan UI, jalankan browser QA bila Puppeteer tersedia: `node tools/qa-browser-test.js`.
