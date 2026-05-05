/**
 * Konversi angka ke kata-kata terbilang Bahasa Indonesia (Rupiah)
 */

const SATUAN = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan'];
const BELASAN = ['sepuluh', 'sebelas', 'dua belas', 'tiga belas', 'empat belas', 'lima belas', 'enam belas', 'tujuh belas', 'delapan belas', 'sembilan belas'];
const PULUHAN = ['', '', 'dua puluh', 'tiga puluh', 'empat puluh', 'lima puluh', 'enam puluh', 'tujuh puluh', 'delapan puluh', 'sembilan puluh'];

function terbilangRatus(n: number): string {
  if (n === 0) return '';
  if (n < 10) return SATUAN[n];
  if (n < 20) return BELASAN[n - 10];
  const p = Math.floor(n / 10);
  const s = n % 10;
  return PULUHAN[p] + (s > 0 ? ' ' + SATUAN[s] : '');
}

function terbilangRibuan(n: number): string {
  if (n === 0) return 'nol';
  
  const hasil: string[] = [];
  
  if (n >= 1_000_000_000_000) {
    const t = Math.floor(n / 1_000_000_000_000);
    hasil.push((t === 1 ? 'satu' : terbilangRatus(t)) + ' triliun');
    n %= 1_000_000_000_000;
  }
  
  if (n >= 1_000_000_000) {
    const m = Math.floor(n / 1_000_000_000);
    hasil.push((m === 1 ? 'satu' : terbilangRatus(m)) + ' miliar');
    n %= 1_000_000_000;
  }
  
  if (n >= 1_000_000) {
    const jt = Math.floor(n / 1_000_000);
    hasil.push(terbilangRatus(jt) + ' juta');
    n %= 1_000_000;
  }
  
  if (n >= 1_000) {
    const rb = Math.floor(n / 1_000);
    if (rb === 1) {
      hasil.push('seribu');
    } else {
      hasil.push(terbilangRatus(rb) + ' ribu');
    }
    n %= 1_000;
  }
  
  if (n >= 100) {
    const r = Math.floor(n / 100);
    if (r === 1) {
      hasil.push('seratus');
    } else {
      hasil.push(SATUAN[r] + ' ratus');
    }
    n %= 100;
  }
  
  if (n > 0) {
    hasil.push(terbilangRatus(n));
  }
  
  return hasil.join(' ');
}

/**
 * Mengkonversi angka ke format terbilang rupiah lengkap
 * @example terbilang(6887000) → "Enam Juta Delapan Ratus Delapan Puluh Tujuh Ribu Rupiah"
 */
export function terbilang(angka: number): string {
  const n = Math.floor(Math.abs(angka));
  const kata = terbilangRibuan(n);
  // Capitalize each word
  const hasil = kata
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return `${hasil} Rupiah`;
}

export default terbilang;
