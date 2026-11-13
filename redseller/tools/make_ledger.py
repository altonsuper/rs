#!/usr/bin/env python3
"""
Membuat stay-ledger.xlsx  —  CRM + komisi tracker untuk reseller RedDoorz (RedSeller).

Jalankan ulang kapan saja:
    python3 tools/make_ledger.py
Butuh openpyxl. Kalau belum ada:
    python3 -m pip install openpyxl
(tanpa pip: unduh wheel openpyxl + et_xmlfile, extract ke .cache/pylibs,
 lalu PYTHONPATH=.cache/pylibs python3 tools/make_ledger.py)

Sheet: Mulai | Booking | Partner | Alert | Dashboard
North star metric: ROOM-NIGHTS PER ORDER (bukan jumlah order).
"""
import os
from datetime import date
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import CellIsRule
from openpyxl.utils import get_column_letter

OUT = os.path.join(os.path.dirname(__file__), "..", "stay-ledger.xlsx")
ROWS = 400          # baris siap pakai
FIRST = 4           # baris data pertama
LAST = FIRST + ROWS - 1

INK = "141821"; RED = "E11D2E"; MUTED = "5B6472"
HDR = PatternFill("solid", fgColor=INK)
TITLE = Font(bold=True, size=15, color=INK)
SUB = Font(size=10, color=MUTED, italic=True)
HF = Font(bold=True, size=10, color="FFFFFF")
MONEY = '"Rp "#,##0'
DATEF = "dd/mm/yyyy"
THIN = Side(style="thin", color="E6E9EF")
BOX = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)
BAND = PatternFill("solid", fgColor="FAFBFD")

wb = Workbook()


def head(ws, title, subtitle, headers, widths, tab=RED):
    ws.sheet_properties.tabColor = tab
    ws["A1"] = title; ws["A1"].font = TITLE
    ws["A2"] = subtitle; ws["A2"].font = SUB
    for i, (h, w) in enumerate(zip(headers, widths), start=1):
        c = ws.cell(row=3, column=i, value=h)
        c.font = HF; c.fill = HDR; c.border = BOX
        c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        ws.column_dimensions[get_column_letter(i)].width = w
    ws.row_dimensions[3].height = 30
    ws.freeze_panes = "C4"


def band(ws, ncols):
    for r in range(FIRST, FIRST + 40):
        for c in range(1, ncols + 1):
            cell = ws.cell(row=r, column=c)
            cell.border = BOX
            if r % 2 == 0:
                cell.fill = BAND


# ---------------------------------------------------------------- Booking
bk = wb.active
bk.title = "Booking"
head(bk, "BOOKING — satu baris per pesanan",
     "Isi kolom putih. Kolom abu-abu = rumus otomatis. Hapus 4 baris CONTOH sebelum dipakai. "
     "North star: room-nights per order.",
     ["Tgl Order", "Kode Booking", "Nama Tamu", "No WA", "Kota", "Properti / Patokan",
      "Check-in", "Check-out", "Kamar", "Malam", "Room-Nights", "Harga/Kamar/Malam",
      "Nilai Booking", "Komisi %", "Komisi", "Status", "Dibayar Oleh", "Sumber",
      "Kode Referral", "Batch Payout", "Tgl Payout", "Tamu", "Catatan"],
     [11, 15, 18, 15, 13, 26, 11, 11, 7, 7, 11, 15, 15, 9, 14, 12, 16, 12, 13, 12, 11, 10, 26])

for r in range(FIRST, LAST + 1):
    bk.cell(row=r, column=11, value=f'=IF(OR(I{r}="",J{r}=""),"",I{r}*J{r})')          # room-nights
    bk.cell(row=r, column=13, value=f'=IF(OR(K{r}="",L{r}=""),"",K{r}*L{r})')          # nilai booking
    bk.cell(row=r, column=14, value=0.10)
    bk.cell(row=r, column=15, value=f'=IF(OR(M{r}="",N{r}=""),"",M{r}*N{r})')          # komisi
    bk.cell(row=r, column=22, value=f'=IF(D{r}="","",IF(COUNTIF($D${FIRST}:D{r},D{r})>1,"REPEAT","BARU"))')
    for c in (11, 13, 15, 22):
        bk.cell(row=r, column=c).fill = PatternFill("solid", fgColor="F2F4F8")
        bk.cell(row=r, column=c).font = Font(bold=True, size=10, color=INK)
    for c in (1, 7, 8, 21):
        bk.cell(row=r, column=c).number_format = DATEF
    for c in (12, 13, 15):
        bk.cell(row=r, column=c).number_format = MONEY
    bk.cell(row=r, column=14).number_format = "0%"

samples = [
    [date(2026, 11, 1), "RD-CONTOH1", "Ibu Sari", "628111111111", "Yogyakarta",
     "RedDoorz dekat RS Sardjito", date(2026, 11, 3), date(2026, 11, 17), 1, 14, None,
     139000, None, 0.10, None, "Stayed", "Tamu bayar RedDoorz", "ALERT", "", "B-01",
     date(2026, 11, 14), None, "CONTOH — hapus. Keluarga pasien, minta kamar dekat lift."],
    [date(2026, 11, 2), "RD-CONTOH2", "Pak Hendra (CV Maju)", "628222222222", "Yogyakarta",
     "KoolKost Pogung", date(2026, 11, 5), date(2026, 12, 5), 5, 30, None,
     115000, None, 0.10, None, "Booked", "Tamu bayar RedDoorz", "PARTNER", "KOSBUDI", "",
     None, None, "CONTOH — hapus. Crew proyek, butuh invoice bulanan."],
    [date(2026, 11, 6), "RD-CONTOH3", "Dinda", "628333333333", "Yogyakarta",
     "RedDoorz Stasiun Tugu", date(2026, 11, 8), date(2026, 11, 9), 1, 1, None,
     159000, None, 0.10, None, "Stayed", "Tamu bayar RedDoorz", "WEB", "", "B-01",
     date(2026, 11, 14), None, "CONTOH — hapus. Transit semalam."],
    [date(2026, 11, 9), "RD-CONTOH4", "Ibu Sari", "628111111111", "Yogyakarta",
     "RedDoorz dekat RS Sardjito", date(2026, 11, 12), date(2026, 11, 19), 1, 7, None,
     139000, None, 0.10, None, "Booked", "Tamu bayar RedDoorz", "REPEAT", "", "",
     None, None, "CONTOH — hapus. Cukup chat 'seperti bulan lalu' → jadi order ke-2."],
]
for i, row in enumerate(samples):
    for c, v in enumerate(row, start=1):
        if v is not None and c not in (11, 13, 15, 22):
            bk.cell(row=FIRST + i, column=c, value=v)

for col, formula, opts in [
    ("P", None, '"Booked,Stayed,Cancelled,No-show"'),
    ("Q", None, '"Tamu bayar RedDoorz,Tamu bayar hotel,Kita talangi"'),
    ("R", None, '"WEB,ALERT,PARTNER,REPEAT,IG,TIKTOK,MAPS,DIRECT"'),
]:
    dv = DataValidation(type="list", formula1=opts, allow_blank=True, showDropDown=False)
    bk.add_data_validation(dv)
    dv.add(f"{col}{FIRST}:{col}{LAST}")

bk.conditional_formatting.add(f"P{FIRST}:P{LAST}",
    CellIsRule(operator="equal", formula=['"Stayed"'],
               fill=PatternFill("solid", fgColor="E8F6EF"), font=Font(color="0E8A55", bold=True)))
bk.conditional_formatting.add(f"P{FIRST}:P{LAST}",
    CellIsRule(operator="equal", formula=['"Cancelled"'],
               fill=PatternFill("solid", fgColor="FDECEE"), font=Font(color=RED, bold=True)))
bk.conditional_formatting.add(f"V{FIRST}:V{LAST}",
    CellIsRule(operator="equal", formula=['"REPEAT"'],
               fill=PatternFill("solid", fgColor="E8F6EF"), font=Font(color="0E8A55", bold=True)))
bk.conditional_formatting.add(f"K{FIRST}:K{LAST}",
    CellIsRule(operator="greaterThanOrEqual", formula=["30"],
               fill=PatternFill("solid", fgColor="FFF6E5"), font=Font(bold=True, color="8A5B00")))
band(bk, 23)

# ---------------------------------------------------------------- Partner
pt = wb.create_sheet("Partner")
head(pt, "PARTNER — pertumbuhan tanpa iklan",
     "Kode referral dipakai di link (index.html?src=KODE) dan di kolom 'Kode Referral' sheet Booking. "
     "Bagi komisi dibayar dari komisi kamu, bukan dari harga tamu.",
     ["Nama Partner", "Tipe", "Kontak WA", "Kode Referral", "Bagi Komisi %",
      "Order", "Room-Nights", "Komisi Kotor", "Bagian Partner", "Komisi Kita", "Status", "Catatan"],
     [20, 18, 15, 14, 12, 8, 12, 15, 15, 15, 12, 30], tab=INK)

for r in range(FIRST, LAST + 1):
    pt.cell(row=r, column=6, value=f'=IF(D{r}="","",COUNTIF(Booking!$S${FIRST}:$S${LAST},D{r}))')
    pt.cell(row=r, column=7, value=f'=IF(D{r}="","",SUMIF(Booking!$S${FIRST}:$S${LAST},D{r},Booking!$K${FIRST}:$K${LAST}))')
    pt.cell(row=r, column=8, value=f'=IF(D{r}="","",SUMIF(Booking!$S${FIRST}:$S${LAST},D{r},Booking!$O${FIRST}:$O${LAST}))')
    pt.cell(row=r, column=9, value=f'=IF(OR(H{r}="",E{r}=""),"",H{r}*E{r})')
    pt.cell(row=r, column=10, value=f'=IF(H{r}="","",H{r}-I{r})')
    for c in (6, 7, 8, 9, 10):
        pt.cell(row=r, column=c).fill = PatternFill("solid", fgColor="F2F4F8")
        pt.cell(row=r, column=c).font = Font(bold=True, size=10, color=INK)
    for c in (8, 9, 10):
        pt.cell(row=r, column=c).number_format = MONEY
    pt.cell(row=r, column=5).number_format = "0%"

pt_samples = [
    ["Budi (Kos Pogung)", "Pemilik kos", "628444444444", "KOSBUDI", 0.30, None, None, None, None, None,
     "Aktif", "CONTOH — hapus. Tamu kos yang kehabisan kamar + crew proyek."],
    ["Ani (Koperasi RS)", "Koperasi RS", "628555555555", "RSANI", 0.25, None, None, None, None, None,
     "Prospek", "CONTOH — hapus. Keluarga pasien, menginap 7–30 malam."],
]
for i, row in enumerate(pt_samples):
    for c, v in enumerate(row, start=1):
        if v is not None:
            pt.cell(row=FIRST + i, column=c, value=v)
dv = DataValidation(type="list", formula1='"Prospek,Aktif,Berhenti"', allow_blank=True, showDropDown=False)
pt.add_data_validation(dv); dv.add(f"K{FIRST}:K{LAST}")
band(pt, 12)

# ---------------------------------------------------------------- Alert
al = wb.create_sheet("Alert")
head(al, "ALERT — daftar tunggu kamar murah (aset audiens kamu)",
     "Ini pengganti aplikasi/notifikasi. Seminggu sekali cek harga di RedSeller, lalu kirim pesan "
     "ke orang yang cocok. Biaya akuisisi = Rp 0.",
     ["Tgl Masuk", "Nama", "No WA", "Kota / Patokan", "Budget Maks", "Butuh Mulai",
      "Butuh Sampai", "Fleksibel?", "Terakhir Dikabari", "Sudah Booking?", "Status", "Catatan"],
     [11, 18, 15, 26, 14, 12, 12, 11, 15, 14, 11, 26], tab="0E8A55")

for r in range(FIRST, LAST + 1):
    al.cell(row=r, column=10, value=f'=IF(C{r}="","",IF(COUNTIF(Booking!$D${FIRST}:$D${LAST},C{r})>0,"SUDAH","BELUM"))')
    al.cell(row=r, column=10).fill = PatternFill("solid", fgColor="F2F4F8")
    al.cell(row=r, column=10).font = Font(bold=True, size=10, color=INK)
    for c in (1, 6, 7, 9):
        al.cell(row=r, column=c).number_format = DATEF
    al.cell(row=r, column=5).number_format = MONEY

al_samples = [
    [date(2026, 11, 1), "Ibu Sari", "628111111111", "RS Sardjito, Yogyakarta", 150000,
     date(2026, 11, 3), date(2026, 11, 30), "Ya", date(2026, 11, 1), None, "AKTIF",
     "CONTOH — hapus. Kontrol rutin tiap minggu."],
    [date(2026, 11, 4), "Rizal", "628666666666", "Kampus UNY, Yogyakarta", 120000,
     date(2026, 11, 20), date(2026, 11, 22), "Tidak", None, None, "AKTIF",
     "CONTOH — hapus.Wisuda, butuh 2 kamar."],
]
for i, row in enumerate(al_samples):
    for c, v in enumerate(row, start=1):
        if v is not None and c != 10:
            al.cell(row=FIRST + i, column=c, value=v)
dv = DataValidation(type="list", formula1='"AKTIF,STOP"', allow_blank=True, showDropDown=False)
al.add_data_validation(dv); dv.add(f"K{FIRST}:K{LAST}")
al.conditional_formatting.add(f"J{FIRST}:J{LAST}",
    CellIsRule(operator="equal", formula=['"SUDAH"'],
               fill=PatternFill("solid", fgColor="E8F6EF"), font=Font(color="0E8A55", bold=True)))
band(al, 12)

# ---------------------------------------------------------------- Dashboard
db = wb.create_sheet("Dashboard")
db.sheet_properties.tabColor = "8A5B00"
db["A1"] = "DASHBOARD — 6 angka yang menentukan hidup mati usaha ini"; db["A1"].font = TITLE
db["A2"] = "Semua otomatis dari sheet Booking / Partner / Alert. Lihat seminggu sekali, tiap Senin."; db["A2"].font = SUB
for col, w in zip("ABCD", (4, 40, 20, 52)):
    db.column_dimensions[col].width = w

B = f"Booking!"
rng = lambda c: f"{B}${c}${FIRST}:${c}${LAST}"

metrics = [
    ("ORDER", None, None, None),
    (None, "Total order masuk", f'=COUNTA({rng("B")})', "Volume bukan tujuan utama."),
    (None, "Order selesai menginap (Stayed)", f'=COUNTIF({rng("P")},"Stayed")', "Komisi hanya cair kalau tamu menginap."),
    (None, "Order batal", f'=COUNTIF({rng("P")},"Cancelled")', "Kalau > 15%, masalahnya di ekspektasi/ketersediaan."),
    ("NILAI", None, None, None),
    (None, "Total room-nights", f'=SUM({rng("K")})', "★ NORTH STAR. Ini yang benar-benar menghasilkan uang."),
    (None, "Room-nights per order", f'=IFERROR(SUM({rng("K")})/COUNTA({rng("B")}),0)',
     "★ Target naikkan ke 10+. Di bawah 3 = kamu kerja keras dibayar receh."),
    (None, "Order ≥ 30 room-nights", f'=COUNTIF({rng("K")},">=30")', "Order 'gemuk'. Satu ini bisa setara 100 order biasa."),
    ("UANG", None, None, None),
    (None, "Nilai booking total", f'=SUM({rng("M")})', None),
    (None, "Komisi tercatat", f'=SUM({rng("O")})', "Masih termasuk yang belum menginap."),
    (None, "Komisi terealisasi (Stayed)", f'=SUMIF({rng("P")},"Stayed",{rng("O")})', "Ini yang layak kamu anggap pendapatan."),
    (None, "Komisi belum dibayar RedDoorz", f'=SUMIFS({rng("O")},{rng("P")},"Stayed",{rng("U")},"")',
     "Tagih kalau lewat 2 minggu. Payout RedSeller tiap 2 minggu."),
    (None, "Rata-rata komisi per order", f'=IFERROR(SUM({rng("O")})/COUNTA({rng("B")}),0)',
     "Kalau < Rp 30rb, kamu butuh order yang lebih gemuk, bukan lebih banyak chat."),
    ("PERTUMBUHAN", None, None, None),
    (None, "Tamu repeat", f'=COUNTIF({rng("V")},"REPEAT")', "Aset paling murah. Tamu ke-2 hampir tanpa effort."),
    (None, "Repeat rate", f'=IFERROR(COUNTIF({rng("V")},"REPEAT")/COUNTA({rng("B")}),0)', "Target 30%+ di niche long-stay."),
    (None, "Order dari partner", f'=COUNTIF({rng("R")},"PARTNER")', "Pertumbuhan tanpa biaya iklan."),
    (None, "Partner share of orders", f'=IFERROR(COUNTIF({rng("R")},"PARTNER")/COUNTA({rng("B")}),0)', "Target 40%+ dalam 3 bulan."),
    (None, "Orang di daftar Alert", f'=COUNTA(Alert!$C${FIRST}:$C${LAST})', "Audiens milik sendiri. Bisa di-broadcast gratis."),
    (None, "Alert yang sudah jadi booking", f'=COUNTIF(Alert!$J${FIRST}:$J${LAST},"SUDAH")', "Ukur apakah broadcast mingguan bekerja."),
    (None, "Partner aktif (ada order)", f'=COUNTIF(Partner!$F${FIRST}:$F${LAST},">0")', "10 partner aktif > 10.000 followers."),
    (None, "Total bagi hasil ke partner", f'=SUM(Partner!$I${FIRST}:$I${LAST})', "Biaya akuisisi kamu. Bandingkan dengan komisi."),
    ("SIMULASI TARGET", None, None, None),
]

r = 4
target_row = None
for tag, label, formula, note in metrics:
    if tag:
        c = db.cell(row=r, column=2, value=tag)
        c.font = Font(bold=True, size=11, color="FFFFFF"); c.fill = HDR
        db.cell(row=r, column=3).fill = HDR
        db.cell(row=r, column=4).fill = HDR
        r += 1
        continue
    db.cell(row=r, column=2, value=label).font = Font(size=11, bold=True)
    cell = db.cell(row=r, column=3, value=formula)
    cell.font = Font(size=12, bold=True, color=RED)
    cell.fill = PatternFill("solid", fgColor="F2F4F8")
    cell.alignment = Alignment(horizontal="right")
    cell.border = BOX
    if "rate" in label.lower() or "share" in label.lower():
        cell.number_format = "0%"
    elif "komisi" in label.lower() or "nilai" in label.lower() or "bagi hasil" in label.lower():
        cell.number_format = MONEY
    elif "per order" in label.lower():
        cell.number_format = "0.0"
    else:
        cell.number_format = "#,##0"
    if note:
        n = db.cell(row=r, column=4, value=note)
        n.font = Font(size=10, color=MUTED); n.alignment = Alignment(wrap_text=True, vertical="center")
    db.row_dimensions[r].height = 26
    r += 1

db.cell(row=r, column=2, value="Target komisi per bulan (ubah sendiri)").font = Font(size=11, bold=True)
tcell = db.cell(row=r, column=3, value=5000000)
tcell.number_format = MONEY; tcell.fill = PatternFill("solid", fgColor="FFF6E5")
tcell.font = Font(size=12, bold=True); tcell.border = BOX
target_row = r
r += 1
db.cell(row=r, column=2, value="Room-nights dibutuhkan / bulan").font = Font(size=11, bold=True)
c = db.cell(row=r, column=3,
            value=f'=IFERROR(C{target_row}/(AVERAGE({rng("L")})*AVERAGE({rng("N")})),0)')
c.number_format = "#,##0"; c.font = Font(size=12, bold=True, color=RED)
c.fill = PatternFill("solid", fgColor="F2F4F8"); c.border = BOX
db.cell(row=r, column=4, value="Berapa malam kamar yang harus kamu jual. Bukan berapa orang yang chat.").font = Font(size=10, color=MUTED)
r += 1
db.cell(row=r, column=2, value="Order dibutuhkan / bulan").font = Font(size=11, bold=True)
c = db.cell(row=r, column=3, value=f'=IFERROR(C{target_row}/AVERAGE({rng("O")}),0)')
c.number_format = "#,##0"; c.font = Font(size=12, bold=True, color=RED)
c.fill = PatternFill("solid", fgColor="F2F4F8"); c.border = BOX
db.cell(row=r, column=4, value="Kalau angka ini > 150, model bisnisnya harus digeser ke long-stay/rombongan.").font = Font(size=10, color=MUTED)
db.freeze_panes = "B4"

# ---------------------------------------------------------------- Mulai
rd = wb.create_sheet("Mulai", 0)
rd.sheet_properties.tabColor = "0E8A55"
rd.column_dimensions["A"].width = 3
rd.column_dimensions["B"].width = 104
rd["B2"] = "STAY LEDGER — Cara pakai (baca 2 menit)"; rd["B2"].font = Font(bold=True, size=16, color=INK)

lines = [
    ("h", "Kenapa file ini ada"),
    ("p", "Komisi RedSeller sekitar 10% dari nilai kamar, dibayar tiap 2 minggu. Kamar Rp 150rb = Rp 15rb per malam."),
    ("p", "Artinya: 1 kamar 1 malam hampir tidak menutup waktu kamu. 5 kamar × 30 malam = 150 room-night = satu order besar."),
    ("b", "Jadi yang dikejar bukan jumlah order, tapi ROOM-NIGHTS PER ORDER."),
    ("h", "Urutan pakai"),
    ("p", "1. Booking — tiap pesanan jadi satu baris. Kolom abu-abu jangan diisi, itu rumus."),
    ("p", "2. Alert — orang yang minta dikabari kamar murah. Ini audiens milik kamu, biaya Rp 0."),
    ("p", "3. Partner — pemilik kos, koperasi RS, admin HR, ketua grup WA. Beri kode referral."),
    ("p", "4. Dashboard — buka tiap Senin. Lihat 3 angka: room-nights/order, repeat rate, partner share."),
    ("h", "Aturan main yang bikin ini jalan"),
    ("b", "Isi No WA dengan format sama setiap kali (628xxx). Deteksi repeat bergantung pada ini."),
    ("b", "Kode referral partner ditulis persis sama di sheet Partner dan Booking."),
    ("b", "Tandai Stayed hanya setelah tamu benar-benar menginap — komisi baru sah di situ."),
    ("b", "Isi Tgl Payout saat uang masuk, supaya kolom 'belum dibayar' tidak menumpuk."),
    ("b", "Jangan simpan data KTP / nomor kartu di file ini. Cukup nama + WA + kode booking."),
    ("h", "Cara pasang di Google Sheets (biar bisa dari HP)"),
    ("p", "Google Drive → New → File upload → pilih file ini → buka dengan Google Sheets → File > Save as Google Sheets."),
    ("p", "Rumus COUNTIF/SUMIF/AVERAGE semuanya kompatibel. Bagikan ke partner hanya sheet Partner (jangan seluruh file)."),
    ("h", "Batas yang harus kamu tahu"),
    ("p", "File ini tidak terhubung ke RedDoorz. Harga & ketersediaan tetap kamu cek manual di aplikasi RedSeller."),
    ("p", "Itu memang disengaja: tanpa API, tanpa scraping, tanpa biaya server. Otomasi baru dibuat setelah ada langkah yang berulang 20×."),
]
r = 4
for kind, text in lines:
    c = rd.cell(row=r, column=2, value=text)
    if kind == "h":
        c.font = Font(bold=True, size=12, color="FFFFFF"); c.fill = HDR
        rd.row_dimensions[r].height = 24
        r += 1
    elif kind == "b":
        c.font = Font(size=11, bold=True, color=INK)
        c.alignment = Alignment(wrap_text=True, vertical="top")
        rd.row_dimensions[r].height = 30
        r += 1
    else:
        c.font = Font(size=11, color="39414F")
        c.alignment = Alignment(wrap_text=True, vertical="top")
        rd.row_dimensions[r].height = 30
        r += 1

wb.save(OUT)
print("saved:", os.path.normpath(OUT))
