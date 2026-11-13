"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const SITE_FILE = path.join(DATA_DIR, "site.json");
const CATALOG_FILE = path.join(DATA_DIR, "properties.json");
const PROPS_DIR = path.join(ROOT, "assets", "props");
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    throw new Error(`Tidak bisa membaca JSON ${path.relative(ROOT, file)}: ${error.message}`);
  }
}

function writeJSON(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tempFile = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(value, null, 2) + "\n", "utf8");
  fs.renameSync(tempFile, file);
}

function validateMeta(meta) {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) {
    throw new Error("data/site.json harus berisi object metadata.");
  }
  for (const key of ["brand", "tagline", "wa", "adminName", "city", "hours", "promise", "disclaimer", "updatedAt"]) {
    if (typeof meta[key] !== "string" || !meta[key].trim()) {
      throw new Error(`Metadata "${key}" wajib berupa teks dan tidak boleh kosong.`);
    }
  }
  if (!/^\d+$/.test(meta.wa)) throw new Error('Metadata "wa" harus berupa angka tanpa + atau spasi.');
}

function validateProperty(property, folderId, allowInternalNotes = false) {
  if (!property || typeof property !== "object" || Array.isArray(property)) {
    throw new Error(`${folderId}/property.json harus berisi object properti.`);
  }
  if (typeof property.id !== "string" || !ID_PATTERN.test(property.id)) {
    throw new Error(`${folderId}/property.json memiliki id tidak valid.`);
  }
  if (property.id !== folderId) {
    throw new Error(`ID "${property.id}" tidak sama dengan nama folder "${folderId}".`);
  }
  for (const key of ["code", "name", "city"]) {
    if (typeof property[key] !== "string" || !property[key].trim()) {
      throw new Error(`${folderId}/property.json wajib memiliki "${key}".`);
    }
  }
  if (typeof property.published !== "boolean" || typeof property.featured !== "boolean") {
    throw new Error(`${folderId}/property.json wajib memiliki published dan featured berupa boolean.`);
  }
  if (!Number.isFinite(property.order) || property.order < 1) {
    throw new Error(`${folderId}/property.json wajib memiliki order berupa angka minimal 1.`);
  }
  if (property.photo != null && typeof property.photo !== "string") {
    throw new Error(`${folderId}/property.json: photo harus berupa path/URL teks.`);
  }
  if (!allowInternalNotes && Object.prototype.hasOwnProperty.call(property, "notes")) {
    throw new Error(`${folderId}/property.json tidak boleh berisi notes internal karena file ini publik.`);
  }
  if (property.photo && property.photo.startsWith("assets/props/")) {
    const propertyDir = path.resolve(PROPS_DIR, folderId);
    const photoPath = path.resolve(ROOT, property.photo);
    if (!photoPath.startsWith(propertyDir + path.sep) || !fs.existsSync(photoPath)) {
      throw new Error(`${folderId}/property.json photo harus menunjuk file yang ada di folder properti ini.`);
    }
  }
}

function sourceFolders() {
  if (!fs.existsSync(PROPS_DIR)) return [];
  return fs.readdirSync(PROPS_DIR, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && !entry.name.startsWith("_"))
    .map(entry => {
      if (!ID_PATTERN.test(entry.name)) {
        throw new Error(`Nama folder properti tidak valid: assets/props/${entry.name}`);
      }
      return entry.name;
    })
    .sort();
}

function loadSourceCatalog() {
  const meta = readJSON(SITE_FILE);
  validateMeta(meta);

  const properties = sourceFolders().map(id => {
    const file = path.join(PROPS_DIR, id, "property.json");
    if (!fs.existsSync(file)) {
      throw new Error(`File wajib tidak ditemukan: ${path.relative(ROOT, file)}`);
    }
    const property = readJSON(file);
    validateProperty(property, id);
    return property;
  });

  validateUniqueProperties(properties);
  return { meta, properties };
}

function validateUniqueProperties(properties) {
  const ids = new Set();
  const codes = new Set();
  for (const property of properties) {
    if (ids.has(property.id)) throw new Error(`ID properti duplikat: ${property.id}`);
    if (codes.has(property.code)) throw new Error(`Kode properti duplikat: ${property.code}`);
    ids.add(property.id);
    codes.add(property.code);
  }
  if (properties.filter(property => property.published && property.featured).length > 1) {
    throw new Error("Hanya satu properti tayang yang boleh memiliki featured:true.");
  }
}

function publicCatalog(source) {
  const properties = source.properties
    .map(property => {
      const copy = JSON.parse(JSON.stringify(property));
      delete copy.notes;
      return copy;
    })
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  return { meta: source.meta, properties };
}

function build() {
  const catalog = publicCatalog(loadSourceCatalog());
  writeJSON(CATALOG_FILE, catalog);
  console.log(`Katalog dibuat: data/properties.json (${catalog.properties.length} properti).`);
}

function check() {
  const expected = publicCatalog(loadSourceCatalog());
  if (!fs.existsSync(CATALOG_FILE)) {
    throw new Error("data/properties.json belum ada. Jalankan node tools/build_catalog.js.");
  }
  const actual = readJSON(CATALOG_FILE);
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error("data/properties.json sudah kedaluwarsa. Jalankan node tools/build_catalog.js.");
  }
  console.log(`Katalog valid dan terbaru (${expected.properties.length} properti).`);
}

function migrateFromCatalog() {
  if (fs.existsSync(SITE_FILE) || sourceFolders().length) {
    throw new Error("Migrasi dibatalkan: data/site.json atau folder properti sudah ada.");
  }
  const oldCatalog = readJSON(CATALOG_FILE);
  validateMeta(oldCatalog.meta);
  if (!Array.isArray(oldCatalog.properties)) {
    throw new Error("Katalog lama tidak memiliki array properties.");
  }
  oldCatalog.properties.forEach(property => validateProperty(property, property && property.id, true));
  validateUniqueProperties(oldCatalog.properties);

  writeJSON(SITE_FILE, oldCatalog.meta);
  for (const property of oldCatalog.properties) {
    const publicProperty = JSON.parse(JSON.stringify(property));
    delete publicProperty.notes;
    writeJSON(path.join(PROPS_DIR, property.id, "property.json"), publicProperty);
  }
  console.log("Migrasi selesai. Catatan internal tidak disalin ke folder publik.");
  build();
}

function archiveFolder(id) {
  const source = path.join(PROPS_DIR, id);
  if (!fs.existsSync(source)) return;
  const archiveDir = path.join(PROPS_DIR, "_archive");
  fs.mkdirSync(archiveDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  let destination = path.join(archiveDir, `${id}-${stamp}`);
  let suffix = 1;
  while (fs.existsSync(destination)) {
    destination = path.join(archiveDir, `${id}-${stamp}-${suffix++}`);
  }
  fs.renameSync(source, destination);
}

function syncFromCatalog() {
  const imported = readJSON(CATALOG_FILE);
  validateMeta(imported.meta);
  if (!Array.isArray(imported.properties)) {
    throw new Error("data/properties.json harus memiliki array properties.");
  }
  imported.properties.forEach(property => validateProperty(property, property && property.id, true));
  validateUniqueProperties(imported.properties);

  const existingIds = sourceFolders();
  const importedIds = new Set(imported.properties.map(property => property.id));
  writeJSON(SITE_FILE, imported.meta);

  for (const property of imported.properties) {
    const publicProperty = JSON.parse(JSON.stringify(property));
    delete publicProperty.notes;
    writeJSON(path.join(PROPS_DIR, property.id, "property.json"), publicProperty);
  }
  for (const id of existingIds) {
    if (!importedIds.has(id)) archiveFolder(id);
  }
  console.log("Folder properti disinkronkan; properti yang dihapus dipindahkan ke _archive.");
  build();
}

const command = process.argv[2] || "build";
try {
  if (command === "build") build();
  else if (command === "--check") check();
  else if (command === "--migrate-from-catalog") migrateFromCatalog();
  else if (command === "--sync-from-catalog") syncFromCatalog();
  else if (command === "--help") {
    console.log([
      "Pemakaian:",
      "  node tools/build_catalog.js                    Buat katalog publik dari folder properti.",
      "  node tools/build_catalog.js --check             Pastikan katalog publik sudah terbaru.",
      "  node tools/build_catalog.js --migrate-from-catalog  Pecah katalog lama ke folder properti.",
      "  node tools/build_catalog.js --sync-from-catalog     Terapkan export admin ke folder properti."
    ].join("\n"));
  } else {
    throw new Error(`Perintah tidak dikenal: ${command}. Jalankan dengan --help.`);
  }
} catch (error) {
  console.error(`Gagal membangun katalog: ${error.message}`);
  process.exitCode = 1;
}
