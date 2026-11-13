## Folder listing dan foto

Satu properti = satu folder:

    assets/props/kp-01/
      property.json
      cover.webp       (opsional)
      room.webp        (opsional)

`property.json` berisi data listing. Path foto utama di field `photo` harus ditulis dari root situs, misalnya:

    "photo": "assets/props/kp-01/cover.webp"

Foto harus milik sendiri. Gunakan nama file sederhana, gambar WebP/JPG yang sudah dikompres, dan jangan menyalin foto atau ulasan Google Maps.

Setelah menambah atau mengubah folder properti, jalankan dari folder `redseller`:

    node tools/build_catalog.js

Katalog gabungan untuk halaman dibuat di `data/properties.json`. Perintah tambah/hapus/edit UI dan aturan AI ada di `AI_CONTEXT.md`.
