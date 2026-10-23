// Netlify Function: menyimpan & membagikan data dashboard.
//  GET  /api/data  -> data terakhir (gzip), terbuka untuk semua pengunjung
//  POST /api/data  -> simpan data baru, HANYA jika header x-admin-token = ADMIN_PASSWORD
import { getStore } from "@netlify/blobs";

export const config = { path: "/api/data" };

const MAX_BODY = 5.5 * 1024 * 1024;      // batas request Netlify Functions ~6 MB
const MAX_JSON = 40 * 1024 * 1024;       // batas setelah dekompresi
const json = (status, obj) => new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function safeEqual(a, b) {
  const ea = new TextEncoder().encode(String(a)), eb = new TextEncoder().encode(String(b));
  let d = ea.length ^ eb.length;
  for (let i = 0; i < Math.max(ea.length, eb.length); i++) d |= (ea[i] || 0) ^ (eb[i] || 0);
  return d === 0;
}
function adminPassword() {
  try { if (typeof Netlify !== "undefined" && Netlify.env) { const v = Netlify.env.get("ADMIN_PASSWORD"); if (v) return v; } } catch (_) {}
  return process.env.ADMIN_PASSWORD || "";
}
async function gunzipText(buf) {
  const stream = new Blob([buf]).stream().pipeThrough(new DecompressionStream("gzip"));
  const reader = stream.getReader(); const chunks = []; let total = 0;
  for (;;) { const { done, value } = await reader.read(); if (done) break; total += value.length; if (total > MAX_JSON) throw new Error("terlalu besar"); chunks.push(value); }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

export default async (req) => {
  const store = getStore({ name: "shortage-dashboard", consistency: "strong" });

  if (req.method === "GET") {
    const buf = await store.get("data.gz", { type: "arrayBuffer" });
    if (!buf) return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
    const meta = (await store.get("meta", { type: "json" })) || {};
    return new Response(buf, { headers: { "content-type": "application/octet-stream", "cache-control": "no-store", "x-updated": meta.updated || "", "x-count": String(meta.count || 0) } });
  }

  if (req.method === "POST") {
    const pw = adminPassword();
    if (!pw) return json(500, { error: "ADMIN_PASSWORD belum diatur di Netlify (Site settings > Environment variables)." });
    if (!safeEqual(req.headers.get("x-admin-token") || "", pw)) { await sleep(1000); return json(401, { error: "Password salah" }); }
    if (req.headers.get("x-action") === "verify") return json(200, { ok: true });

    const raw = await req.arrayBuffer();
    if (raw.byteLength > MAX_BODY) return json(413, { error: "Data terlalu besar" });
    let d;
    try { d = JSON.parse(await gunzipText(raw)); } catch (e) { return json(400, { error: "Format data tidak valid" }); }
    const rows = d && d.rows;
    if (!Array.isArray(rows) || rows.length === 0 || rows.length > 300000) return json(400, { error: "Data kosong atau terlalu banyak baris" });
    const ok = rows.slice(0, 50).every((r) => r && typeof r.cabang === "string" && Number.isFinite(r.shortage) && typeof r.tgl === "string");
    if (!ok) return json(400, { error: "Struktur data tidak sesuai" });

    const updated = new Date().toISOString();
    await store.set("data.gz", raw);
    await store.setJSON("meta", { updated, count: rows.length, source: String(d.source || "").slice(0, 200) });
    return json(200, { ok: true, updated, count: rows.length });
  }

  return json(405, { error: "Method not allowed" });
};
