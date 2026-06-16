const XLSX = require('xlsx');
const fs = require('fs');

// 1. GANTI DI SINI: Ubah dari 'Dataset_Donasi.xlsx' menjadi 'Dataset_Donasi.csv'
// Pastikan huruf besar-kecilnya sama persis dengan nama file kamu ya!
const workbook = XLSX.readFile('Dataset Donasi.csv');

// 2. Ambil nama sheet pertama (untuk CSV, otomatis dibaca sebagai satu sheet)
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// 3. Ubah data sheet menjadi format JSON
const jsonResult = XLSX.utils.sheet_to_json(sheet);

// 4. Simpan hasilnya menjadi file .json
fs.writeFileSync('donasi.json', JSON.stringify(jsonResult, null, 2));

console.log('Konversi selesai! 700 data CSV berhasil diubah ke donasi.json');