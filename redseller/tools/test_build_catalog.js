"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "redseller-catalog-test-"));
const script = path.join(temp, "tools", "build_catalog.js");
const dataDir = path.join(temp, "data");
const propsDir = path.join(temp, "assets", "props");
const catalogFile = path.join(dataDir, "properties.json");

function writeJSON(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
}

function run(command, expectedStatus = 0) {
  const result = spawnSync(process.execPath, [script, command], { encoding: "utf8" });
  assert.strictEqual(result.status, expectedStatus, result.stderr || result.stdout);
  return result.stdout + result.stderr;
}

function property(id, code, name, order) {
  return {
    id, code, name, brand: "RedDoorz", city: "Yogyakarta", landmark: "",
    area: "", walkMin: 0, price: 100000, priceCheckedAt: "", mapsUrl: "",
    reddoorzUrl: "", photo: "", longStay: false, groupOk: false, invoice: false,
    lateCheckin: false, deposit: 0, good: [], catch: "", verdict: "",
    verifiedAt: "", verifiedBy: "", published: false, featured: false, order
  };
}

try {
  fs.mkdirSync(path.dirname(script), { recursive: true });
  fs.copyFileSync(path.join(__dirname, "build_catalog.js"), script);
  writeJSON(path.join(dataDir, "site.json"), {
    brand: "Test", tagline: "Test", wa: "6281234567890", adminName: "Test",
    city: "Test", hours: "07.00–22.00 WIB", promise: "Test", disclaimer: "Test",
    updatedAt: "2026-11-13", seed: true
  });
  let first = property("kp-01", "KP-01", "Properti satu", 1);
  writeJSON(path.join(propsDir, first.id, "property.json"), first);

  run("build");
  let catalog = JSON.parse(fs.readFileSync(catalogFile, "utf8"));
  assert.strictEqual(catalog.properties.length, 1);
  catalog.properties[0].notes = "catatan internal";
  writeJSON(catalogFile, catalog);
  run("--sync-from-catalog");
  first = JSON.parse(fs.readFileSync(path.join(propsDir, "kp-01", "property.json"), "utf8"));
  catalog = JSON.parse(fs.readFileSync(catalogFile, "utf8"));
  assert.ok(!JSON.stringify(catalog).includes("catatan internal"));
  run("--check");
  console.log("PASS build/check and public notes removal");

  first.photo = "assets/props/kp-01/missing.webp";
  delete first.notes;
  writeJSON(path.join(propsDir, first.id, "property.json"), first);
  assert.match(run("build", 1), /photo harus menunjuk file yang ada/);
  first.photo = "";
  writeJSON(path.join(propsDir, first.id, "property.json"), first);

  const second = property("kp-02", "KP-02", "Properti dua", 2);
  catalog.properties.push(second);
  writeJSON(catalogFile, catalog);
  run("--sync-from-catalog");
  assert.ok(fs.existsSync(path.join(propsDir, second.id, "property.json")));
  catalog = JSON.parse(fs.readFileSync(catalogFile, "utf8"));
  assert.strictEqual(catalog.properties.length, 2);
  console.log("PASS admin catalog sync creates a property folder");

  catalog.properties = catalog.properties.filter(item => item.id !== second.id);
  writeJSON(catalogFile, catalog);
  run("--sync-from-catalog");
  catalog = JSON.parse(fs.readFileSync(catalogFile, "utf8"));
  assert.strictEqual(catalog.properties.length, 1);
  assert.ok(fs.readdirSync(path.join(propsDir, "_archive")).some(name => name.startsWith("kp-02-")));
  console.log("PASS admin catalog sync archives a removed property");

  first.notes = "private";
  writeJSON(path.join(propsDir, first.id, "property.json"), first);
  assert.match(run("build", 1), /tidak boleh berisi notes internal/);
  console.log("PASS public source rejects internal notes");
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
