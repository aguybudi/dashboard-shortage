DASHBOARD PENYELESAIAN SHORTAGE CABANG - VERSI PENYIMPANAN SERVER (NETLIFY)
============================================================================

ISI FOLDER
  public/index.html                 -> halaman dashboard (tidak berisi data)
  netlify/functions/data.mjs        -> fungsi server: simpan & bagikan data
  netlify.toml, package.json        -> pengaturan Netlify

CARA KERJA
  - Admin klik tombol "Admin", masukkan password, lalu "Update Data (Excel)".
  - File Excel dibaca di browser admin, lalu hasilnya DISIMPAN di Netlify (Netlify Blobs).
  - Semua pengunjung yang membuka link langsung melihat data terakhir yang disimpan.
  - Pengunjung tanpa password TIDAK bisa mengubah data (password diperiksa di server).

LANGKAH DEPLOY (disarankan lewat GitHub)
  1. Buat repository baru di GitHub (boleh Private), lalu unggah seluruh isi folder ini
     (public, netlify, netlify.toml, package.json) lewat "Add file > Upload files".
  2. Di Netlify: Add new site > Import an existing project > pilih repository tadi.
     Biarkan pengaturan build kosong (publish directory sudah diatur di netlify.toml).
  3. Di Netlify: Site configuration > Environment variables > Add a variable:
        Key   : ADMIN_PASSWORD
        Value : (password admin pilihan Anda)
     Lalu Deploys > Trigger deploy > Deploy site agar password terbaca.
  4. Buka link situs, klik "Admin", masukkan password, unggah Excel pertama.

LANGKAH ALTERNATIF (Netlify CLI)
  npm i -g netlify-cli
  netlify login
  netlify deploy --prod      (jalankan di folder ini)
  lalu atur ADMIN_PASSWORD seperti langkah 3.

CATATAN
  - Mengganti password: ubah nilai ADMIN_PASSWORD di Netlify lalu deploy ulang.
  - Data lama otomatis tertimpa setiap kali admin mengunggah file baru.
  - Jangan menaruh password di GitHub; cukup di Environment variables Netlify.
  - Fungsi server ini diuji dengan simulasi lokal, belum diuji langsung di Netlify.
