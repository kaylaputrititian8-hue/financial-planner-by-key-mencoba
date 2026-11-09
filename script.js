'use strict';
/* ===== Konstanta ===== */
const KEY = 'financePlannerData';
const IN_CATS = ['Gaji', 'Bonus', 'Freelance', 'Investasi', 'Lainnya'];
const OUT_CATS = ['Makan', 'Transportasi', 'Belanja', 'Hiburan', 'Kesehatan', 'Pendidikan', 'Tagihan', 'Lainnya'];
const NEEDS = ['Makan', 'Transportasi', 'Kesehatan', 'Pendidikan', 'Tagihan'];
const WTYPES = ['Tunai', 'Bank', 'E-Wallet', 'Investasi'];
const COLORS = ['#0f5c4d', '#1f6fb5', '#7a4fb5', '#c2571a', '#b5305f', '#2a8a8a'];
const TITLES = { dashboard: 'Dashboard', planner: 'Planner', wallet: 'Wallet', income: 'Pendapatan', expense: 'Pengeluaran', debt: 'Hutang', bill: 'Tagihan' };

/* ===== Helper ===== */
const $ = s => document.querySelector(s);
const rp = n => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const today = () => new Date().toLocaleDateString('sv-SE');
const fd = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
const mk = d => String(d).slice(0, 7);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sum = (a, f = x => x.amount) => a.reduce((s, x) => s + (Number(f(x)) || 0), 0);
const addDays = (d, n) => { const x = new Date(d + 'T00:00:00'); x.setDate(x.getDate() + n); return x.toLocaleDateString('sv-SE'); };
const addMonths = (d, n) => { const x = new Date(d + 'T00:00:00'); x.setMonth(x.getMonth() + n); return x.toLocaleDateString('sv-SE'); };
const daysTo = d => Math.round((new Date(d + 'T00:00:00') - new Date(today() + 'T00:00:00')) / 864e5);
const mstr = i => { const x = new Date(); x.setDate(1); x.setMonth(x.getMonth() - i); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0'); };
const mlabel = m => new Date(m + '-01T00:00:00').toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
const bar = p => `<div class="bar"><i class="${p > 100 ? 'r' : p > 80 ? 'y' : 'g'}" style="width:${Math.min(p, 100)}%"></i></div>`;
const empty = t => `<div class="empty">${t}</div>`;

/* ===== State ===== */
function seed() {
  const tx = [];
  for (let i = 0; i < 6; i++) {
    const m = mstr(i), t = (type, d, amount, cat, wallet, note) => tx.push({ id: uid(), type, date: `${m}-0${d}`, amount, cat, wallet, note });
    t('in', 1, 8000000, 'Gaji', 'w2', 'Gaji bulanan');
    if (i % 2 === 0) t('in', 3, 1500000 + i * 100000, 'Freelance', 'w2', 'Proyek desain');
    t('out', 2, 1100000 + i * 60000, 'Makan', 'w3', 'Makan & jajan');
    t('out', 4, 380000 + i * 20000, 'Transportasi', 'w1', 'Bensin & ojek');
    t('out', 5, 650000 + i * 50000, 'Belanja', 'w2', 'Belanja bulanan');
    t('out', 6, 250000 + i * 30000, 'Hiburan', 'w3', 'Nonton & streaming');
    t('out', 7, 500000, 'Tagihan', 'w2', 'Listrik & internet');
  }
  return {
    theme: 'light', hasSeed: true,
    wallets: [
      { id: 'w1', name: 'Dompet Tunai', type: 'Tunai', initial: 500000, color: COLORS[3] },
      { id: 'w2', name: 'Bank BCA', type: 'Bank', initial: 5000000, color: COLORS[1] },
      { id: 'w3', name: 'GoPay', type: 'E-Wallet', initial: 300000, color: COLORS[2] }],
    tx, budgets: [{ id: uid(), cat: 'Makan', limit: 1500000 }, { id: uid(), cat: 'Transportasi', limit: 500000 }, { id: uid(), cat: 'Belanja', limit: 800000 }, { id: uid(), cat: 'Hiburan', limit: 300000 }],
    goals: [{ id: uid(), name: 'Dana Darurat', target: 20000000, saved: 3000000, due: addMonths(today(), 12) }],
    debts: [
      { id: uid(), kind: 'hutang', name: 'Budi (pinjaman motor)', total: 3000000, remain: 2000000, start: addMonths(today(), -3), due: addDays(today(), 20), rate: 0, note: '', pays: [] },
      { id: uid(), kind: 'piutang', name: 'Sari', total: 500000, remain: 500000, start: addDays(today(), -10), due: addDays(today(), -2), rate: 0, note: 'Pinjam makan', pays: [] }],
    bills: [
      { id: uid(), name: 'Listrik PLN', amount: 450000, cat: 'Tagihan', due: addDays(today(), 2), repeat: 'Bulanan', remind: 3, paid: false },
      { id: uid(), name: 'Internet', amount: 350000, cat: 'Tagihan', due: addDays(today(), 6), repeat: 'Bulanan', remind: 3, paid: false },
      { id: uid(), name: 'Asuransi', amount: 1200000, cat: 'Kesehatan', due: addDays(today(), -2), repeat: 'Tahunan', remind: 7, paid: false }]
  };
}
function load() {
  try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && Array.isArray(d.wallets) && Array.isArray(d.tx)) return d; } catch (e) { /* data rusak */ }
  return seed();
}
let S = load(), page = 'dashboard', month = today().slice(0, 7), charts = [];
let ui = { q: '', cat: '', sort: 'date', dir: -1 };
const save = () => { localStorage.setItem(KEY, JSON.stringify(S)); render(); };

/* ===== Perhitungan ===== */
const bal = w => S.tx.reduce((a, t) => a + (t.wallet === w.id ? (t.type === 'in' ? t.amount : -t.amount) : 0) + (t.type === 'tf' && t.to === w.id ? t.amount : 0), Number(w.initial) || 0);
const wname = id => (S.wallets.find(w => w.id === id) || { name: '(dihapus)' }).name;
const monthTx = (m, type) => S.tx.filter(t => mk(t.date) === m && t.type === type);
const spent = (cat, m) => sum(monthTx(m, 'out').filter(t => t.cat === cat));
const debtStatus = d => d.remain <= 0 ? 'Lunas' : (d.due && daysTo(d.due) < 0 ? 'Terlambat' : 'Aktif');
const billStatus = b => b.paid ? ['Lunas', 'g'] : daysTo(b.due) < 0 ? ['Terlambat', 'r'] : daysTo(b.due) === 0 ? ['Jatuh tempo hari ini', 'y'] : daysTo(b.due) <= 3 ? ['Akan datang', 'y'] : ['Akan datang', 'g'];

/* ===== UI: toast, modal, form ===== */
function toast(msg, k = '') { const t = document.createElement('div'); t.className = 'toast ' + k; t.textContent = msg; $('#toasts').append(t); setTimeout(() => t.remove(), 3200); }
function ask(msg, fn) {
  $('#modal').innerHTML = `<p>${msg}</p><div class="row" style="justify-content:flex-end"><button class="btn" data-a="close">Batal</button><button class="btn p" id="yes">Ya, lanjutkan</button></div>`;
  $('#modal').showModal(); $('#yes').onclick = () => { $('#modal').close(); fn(); };
}
function form(title, F, V, onSave) {
  const opt = (o, v) => { o = [].concat(o); return `<option value="${esc(o[0])}"${String(v) === String(o[0]) ? ' selected' : ''}>${esc(o[o.length - 1])}</option>`; };
  $('#modal').innerHTML = `<form class="fm" novalidate><h2>${title}</h2>${F.map(f => `<label>${f.l}${f.t === 'select'
    ? `<select name="${f.k}">${f.o.map(o => opt(o, V[f.k])).join('')}</select>`
    : `<input name="${f.k}" type="${f.t || 'text'}" step="any" value="${esc(V[f.k] ?? '')}">`}</label>`).join('')}
    <p class="err" role="alert"></p><div class="row"><button type="button" class="btn" data-a="close">Batal</button><button class="btn p">Simpan</button></div></form>`;
  const fm = $('#modal form');
  fm.onsubmit = e => {
    e.preventDefault(); const v = {};
    for (const f of F) {
      let x = fm.elements[f.k].value.trim();
      if (f.r && !x) return fm.querySelector('.err').textContent = `${f.l} wajib diisi.`;
      if (f.t === 'number') { x = x === '' ? 0 : Number(x); if (isNaN(x) || (f.n && x <= 0)) return fm.querySelector('.err').textContent = `${f.l} harus berupa angka lebih dari 0.`; if (f.min0 && x < 0) return fm.querySelector('.err').textContent = `${f.l} tidak boleh negatif.`; }
      if (f.t === 'date' && x && isNaN(Date.parse(x))) return fm.querySelector('.err').textContent = `${f.l} tidak valid.`;
      v[f.k] = x;
    }
    const err = onSave(v);
    if (err) return fm.querySelector('.err').textContent = err;
    $('#modal').close(); save();
  };
  $('#modal').showModal();
}
const walletOpts = () => S.wallets.map(w => [w.id, `${w.name} (${rp(bal(w))})`]);

/* ===== Modul: Transaksi (Pendapatan & Pengeluaran) ===== */
function txForm(type, id) {
  if (!S.wallets.length) return toast('Buat wallet terlebih dahulu.', 'e');
  const t = S.tx.find(x => x.id === id) || { date: today(), wallet: S.wallets[0].id };
  form((id ? 'Edit ' : 'Tambah ') + (type === 'in' ? 'pemasukan' : 'pengeluaran'), [
    { k: 'date', l: 'Tanggal', t: 'date', r: 1 }, { k: 'amount', l: 'Nominal (Rp)', t: 'number', n: 1, r: 1 },
    { k: 'cat', l: 'Kategori', t: 'select', o: type === 'in' ? IN_CATS : OUT_CATS },
    { k: 'wallet', l: type === 'in' ? 'Wallet tujuan' : 'Wallet sumber', t: 'select', o: walletOpts() }, { k: 'note', l: 'Catatan' }], t, v => {
      if (type === 'out') {
        const w = S.wallets.find(x => x.id === v.wallet), cur = bal(w) + (t.id && t.wallet === v.wallet ? t.amount : 0);
        if (v.amount > cur) toast('Peringatan: saldo wallet tidak cukup.', 'w');
        const b = S.budgets.find(x => x.cat === v.cat);
        if (b && spent(v.cat, mk(v.date)) - (t.id && t.cat === v.cat && mk(t.date) === mk(v.date) ? t.amount : 0) + v.amount > b.limit) toast(`Peringatan: anggaran ${v.cat} terlampaui.`, 'w');
      }
      if (id) Object.assign(t, v); else S.tx.push({ id: uid(), type, ...v });
      toast('Transaksi disimpan.');
    });
}
function txPage(type) {
  const cats = type === 'in' ? IN_CATS : OUT_CATS, q = ui.q.toLowerCase();
  let rows = monthTx(month, type).filter(t => (!ui.cat || t.cat === ui.cat) && (!q || (t.note + t.cat + wname(t.wallet)).toLowerCase().includes(q)));
  rows.sort((a, b) => (a[ui.sort] > b[ui.sort] ? 1 : -1) * ui.dir);
  const per = cats.map(c => [c, sum(rows.filter(t => t.cat === c))]).filter(x => x[1]);
  const th = (k, l) => `<th data-a="sort" data-id="${k}">${l}${ui.sort === k ? (ui.dir > 0 ? ' ▲' : ' ▼') : ''}</th>`;
  return `<div class="grid g3"><div class="card stat"><small>Total ${type === 'in' ? 'pemasukan' : 'pengeluaran'} (filter)</small><b class="${type}">${rp(sum(rows))}</b></div>
  <div class="card" style="grid-column:span 2"><small>Ringkasan per kategori</small><div>${per.map(p => `<span class="tag">${p[0]}: ${rp(p[1])}</span> `).join('') || '-'}</div></div></div>
  <div class="card"><div class="bar-tools"><input placeholder="Cari catatan/kategori/wallet" value="${esc(ui.q)}" data-a="search" aria-label="Cari">
  <select data-a="catf" aria-label="Filter kategori"><option value="">Semua kategori</option>${cats.map(c => `<option${ui.cat === c ? ' selected' : ''}>${c}</option>`).join('')}</select>
  <button class="btn p" data-a="${type === 'in' ? 'addIn' : 'addOut'}">+ Tambah</button></div>
  ${rows.length ? `<div class="tw"><table><thead><tr>${th('date', 'Tanggal')}${th('cat', 'Kategori')}<th>Wallet</th><th>Catatan</th>${th('amount', 'Nominal')}<th></th></tr></thead><tbody>${rows.map(t => `<tr><td>${fd(t.date)}</td><td>${t.cat}</td><td>${esc(wname(t.wallet))}</td><td>${esc(t.note)}</td><td class="${type}">${rp(t.amount)}</td>
  <td>${t.ref ? '' : `<button class="btn sm" data-a="editTx" data-id="${t.id}" aria-label="Edit">✎</button> `}<button class="btn sm" data-a="delTx" data-id="${t.id}" aria-label="Hapus">🗑</button></td></tr>`).join('')}</tbody></table></div>` : empty('Belum ada transaksi pada filter ini. Klik “Tambah” untuk mencatat.')}</div>`;
}

/* ===== Modul: Wallet ===== */
function walletForm(id) {
  const w = S.wallets.find(x => x.id === id) || { type: 'Bank', color: COLORS[0] };
  form(id ? 'Edit wallet' : 'Tambah wallet', [{ k: 'name', l: 'Nama', r: 1 }, { k: 'type', l: 'Tipe', t: 'select', o: WTYPES }, { k: 'initial', l: 'Saldo awal (Rp)', t: 'number', min0: 1 }, { k: 'color', l: 'Warna', t: 'select', o: COLORS.map((c, i) => [c, 'Warna ' + (i + 1)]) }], w, v => {
    if (id) Object.assign(w, v); else S.wallets.push({ id: uid(), ...v }); toast('Wallet disimpan.');
  });
}
function transferForm() {
  if (S.wallets.length < 2) return toast('Butuh minimal 2 wallet untuk transfer.', 'e');
  form('Transfer antar wallet', [{ k: 'wallet', l: 'Dari', t: 'select', o: walletOpts() }, { k: 'to', l: 'Ke', t: 'select', o: walletOpts() }, { k: 'amount', l: 'Nominal (Rp)', t: 'number', n: 1, r: 1 }, { k: 'date', l: 'Tanggal', t: 'date', r: 1 }, { k: 'note', l: 'Catatan' }], { date: today(), to: S.wallets[1].id }, v => {
    if (v.wallet === v.to) return 'Wallet asal dan tujuan harus berbeda.';
    if (v.amount > bal(S.wallets.find(w => w.id === v.wallet))) return 'Saldo wallet asal tidak cukup.';
    S.tx.push({ id: uid(), type: 'tf', cat: 'Transfer', ...v }); toast('Transfer berhasil.');
  });
}
function walletPage() {
  const tf = S.tx.filter(t => t.type === 'tf').sort((a, b) => b.date.localeCompare(a.date));
  return `<div class="row" style="margin-bottom:14px"><div><small>Total saldo gabungan</small><h1>${rp(sum(S.wallets, bal))}</h1></div><div><button class="btn" data-a="transfer">⇄ Transfer</button> <button class="btn p" data-a="addW">+ Wallet</button></div></div>
  ${S.wallets.length ? `<div class="grid g3">${S.wallets.map(w => `<div class="card wcard" style="background:${w.color}"><small>${w.type}</small><div><strong>${esc(w.name)}</strong></div><b>${rp(bal(w))}</b>
  <button class="btn sm" data-a="mutasi" data-id="${w.id}">Mutasi</button> <button class="btn sm" data-a="editW" data-id="${w.id}">Edit</button> <button class="btn sm" data-a="delW" data-id="${w.id}">Hapus</button></div>`).join('')}</div>` : empty('Belum ada wallet. Tambahkan wallet pertama Anda.')}
  <div class="card"><h2>Riwayat transfer</h2>${tf.length ? `<div class="list">${tf.map(t => `<div><span>${fd(t.date)} · ${esc(wname(t.wallet))} → ${esc(wname(t.to))} ${esc(t.note)}</span><b>${rp(t.amount)}</b></div>`).join('')}</div>` : empty('Belum ada transfer.')}</div>`;
}
function mutasi(id) {
  const l = S.tx.filter(t => t.wallet === id || t.to === id).sort((a, b) => b.date.localeCompare(a.date));
  $('#modal').innerHTML = `<h2>Mutasi ${esc(wname(id))}</h2><div class="list tw">${l.map(t => { const plus = t.type === 'in' || t.to === id; return `<div><span>${fd(t.date)} · ${t.cat} ${esc(t.note)}</span><b class="${plus ? 'in' : 'out'}">${plus ? '+' : '-'}${rp(t.amount)}</b></div>`; }).join('') || empty('Belum ada mutasi.')}</div><div class="row" style="justify-content:flex-end"><button class="btn" data-a="close">Tutup</button></div>`;
  $('#modal').showModal();
}

/* ===== Modul: Planner ===== */
function budgetForm(id) {
  const b = S.budgets.find(x => x.id === id) || {};
  form(id ? 'Edit anggaran' : 'Tambah anggaran', [{ k: 'cat', l: 'Kategori', t: 'select', o: OUT_CATS }, { k: 'limit', l: 'Batas bulanan (Rp)', t: 'number', n: 1, r: 1 }], b, v => {
    if (S.budgets.some(x => x.cat === v.cat && x.id !== id)) return 'Anggaran untuk kategori ini sudah ada.';
    if (id) Object.assign(b, v); else S.budgets.push({ id: uid(), ...v }); toast('Anggaran disimpan.');
  });
}
function goalForm(id) {
  const g = S.goals.find(x => x.id === id) || { due: addMonths(today(), 6) };
  form(id ? 'Edit target' : 'Tambah target', [{ k: 'name', l: 'Nama target', r: 1 }, { k: 'target', l: 'Nominal target (Rp)', t: 'number', n: 1, r: 1 }, { k: 'saved', l: 'Sudah terkumpul (Rp)', t: 'number', min0: 1 }, { k: 'due', l: 'Tenggat', t: 'date', r: 1 }], g, v => {
    if (id) Object.assign(g, v); else S.goals.push({ id: uid(), ...v }); toast('Target disimpan.');
  });
}
function goalFund(id) {
  const g = S.goals.find(x => x.id === id);
  form('Tambah dana: ' + esc(g.name), [{ k: 'amount', l: 'Nominal (Rp)', t: 'number', n: 1, r: 1 }, { k: 'wallet', l: 'Wallet sumber', t: 'select', o: walletOpts() }], { wallet: (S.wallets[0] || {}).id }, v => {
    if (v.amount > bal(S.wallets.find(w => w.id === v.wallet))) return 'Saldo wallet tidak cukup.';
    g.saved += v.amount; S.tx.push({ id: uid(), type: 'goal', date: today(), amount: v.amount, cat: 'Tabungan', wallet: v.wallet, note: g.name, ref: g.id }); toast('Dana ditambahkan.');
  });
}
function plannerPage() {
  const inc = sum(monthTx(month, 'in')), out = monthTx(month, 'out');
  const needs = sum(out.filter(t => NEEDS.includes(t.cat))), wants = sum(out) - needs, sav = sum(monthTx(month, 'goal'));
  const r = (n, rec, v) => `<div><div class="row"><span>${n}</span><span>${rp(v)} / ${rp(rec)}</span></div>${bar(rec ? v / rec * 100 : 0)}</div>`;
  return `<div class="grid g2"><div class="card"><div class="row"><h2>Anggaran bulanan</h2><button class="btn p sm" data-a="addB">+ Anggaran</button></div>
  ${S.budgets.map(b => { const u = spent(b.cat, month), p = u / b.limit * 100; return `<div><div class="row"><b>${b.cat}</b><span>${rp(u)} / ${rp(b.limit)} (${Math.round(p)}%) <button class="btn sm" data-a="editB" data-id="${b.id}">✎</button> <button class="btn sm" data-a="delB" data-id="${b.id}">🗑</button></span></div>${bar(p)}</div>`; }).join('') || empty('Belum ada anggaran kategori.')}</div>
  <div class="card"><h2>Aturan 50/30/20</h2><p style="color:var(--mu)">Berdasarkan pemasukan bulan ini: ${rp(inc)}</p>${r('Kebutuhan (50%)', inc * .5, needs)}${r('Keinginan (30%)', inc * .3, wants)}${r('Tabungan (20%)', inc * .2, sav)}</div></div>
  <div class="card"><div class="row"><h2>Target tabungan</h2><button class="btn p sm" data-a="addG">+ Target</button></div><div class="grid g3">
  ${S.goals.map(g => { const p = g.saved / g.target * 100, m = Math.max(1, Math.ceil(daysTo(g.due) / 30)), need = Math.max(0, g.target - g.saved) / m; return `<div class="card"><b>${esc(g.name)}</b><div>${rp(g.saved)} / ${rp(g.target)} (${Math.round(p)}%)</div>${bar(p)}<small>Tenggat ${fd(g.due)} · setoran ±${rp(need)}/bulan</small><div style="margin-top:8px"><button class="btn sm p" data-a="fundG" data-id="${g.id}">Tambah dana</button> <button class="btn sm" data-a="editG" data-id="${g.id}">Edit</button> <button class="btn sm" data-a="delG" data-id="${g.id}">Hapus</button></div></div>`; }).join('') || empty('Belum ada target tabungan.')}</div></div>`;
}

/* ===== Modul: Hutang ===== */
function debtForm(id) {
  const d = S.debts.find(x => x.id === id) || { kind: 'hutang', start: today() };
  form(id ? 'Edit catatan' : 'Catat hutang/piutang', [{ k: 'kind', l: 'Jenis', t: 'select', o: [['hutang', 'Saya berhutang'], ['piutang', 'Orang berhutang ke saya']] }, { k: 'name', l: 'Nama pihak', r: 1 }, { k: 'total', l: 'Total (Rp)', t: 'number', n: 1, r: 1 }, { k: 'start', l: 'Tanggal mulai', t: 'date', r: 1 }, { k: 'due', l: 'Jatuh tempo', t: 'date', r: 1 }, { k: 'rate', l: 'Bunga % (opsional)', t: 'number', min0: 1 }, { k: 'note', l: 'Catatan' }], d, v => {
    if (id) { const paid = sum(d.pays || []); Object.assign(d, v); d.remain = Math.max(0, v.total - paid); } else S.debts.push({ id: uid(), ...v, remain: v.total, pays: [] });
    toast('Catatan disimpan.');
  });
}
function debtPay(id) {
  const d = S.debts.find(x => x.id === id);
  form('Bayar/cicil: ' + esc(d.name), [{ k: 'amount', l: `Nominal (sisa ${rp(d.remain)})`, t: 'number', n: 1, r: 1 }, { k: 'wallet', l: 'Wallet', t: 'select', o: walletOpts() }], { wallet: (S.wallets[0] || {}).id }, v => {
    if (v.amount > d.remain) return 'Nominal melebihi sisa hutang.';
    const type = d.kind === 'hutang' ? 'out' : 'in';
    if (type === 'out' && v.amount > bal(S.wallets.find(w => w.id === v.wallet))) return 'Saldo wallet tidak cukup.';
    d.remain -= v.amount; d.pays.push({ date: today(), amount: v.amount, wallet: v.wallet });
    S.tx.push({ id: uid(), type, date: today(), amount: v.amount, cat: type === 'out' ? 'Tagihan' : 'Lainnya', wallet: v.wallet, note: (type === 'out' ? 'Cicilan: ' : 'Terima piutang: ') + d.name, ref: d.id });
    toast(d.remain <= 0 ? 'Lunas! 🎉' : 'Pembayaran dicatat.');
  });
}
function debtPage() {
  const f = ui.cat, act = S.debts.filter(d => debtStatus(d) !== 'Lunas');
  const list = S.debts.filter(d => !f || debtStatus(d) === f);
  return `<div class="grid g3"><div class="card stat"><small>Total hutang aktif</small><b class="out">${rp(sum(act.filter(d => d.kind === 'hutang'), d => d.remain))}</b></div><div class="card stat"><small>Total piutang aktif</small><b class="in">${rp(sum(act.filter(d => d.kind === 'piutang'), d => d.remain))}</b></div>
  <div class="card"><div class="bar-tools"><select data-a="catf" aria-label="Filter status"><option value="">Semua status</option>${['Aktif', 'Lunas', 'Terlambat'].map(s => `<option${f === s ? ' selected' : ''}>${s}</option>`).join('')}</select><button class="btn p" data-a="addD">+ Catat</button></div></div></div>
  <div class="grid g2">${list.map(d => { const st = debtStatus(d), p = (d.total - d.remain) / d.total * 100; return `<div class="card"><div class="row"><b>${esc(d.name)}</b><span class="tag ${st === 'Lunas' ? 'g' : st === 'Terlambat' ? 'r' : 'y'}">${st}</span></div>
  <small>${d.kind === 'hutang' ? 'Saya berhutang' : 'Piutang'} · mulai ${fd(d.start)} · tempo ${fd(d.due)}${d.rate ? ' · bunga ' + d.rate + '%' : ''}</small><div>Sisa <b>${rp(d.remain)}</b> dari ${rp(d.total)}</div>${bar(p)}
  <small>${esc(d.note)}</small>${d.pays.length ? `<div class="list">${d.pays.map(x => `<div><span>${fd(x.date)} · ${esc(wname(x.wallet))}</span><span>${rp(x.amount)}</span></div>`).join('')}</div>` : ''}
  <div style="margin-top:8px">${d.remain > 0 ? `<button class="btn sm p" data-a="payD" data-id="${d.id}">Bayar/Cicil</button> ` : ''}<button class="btn sm" data-a="editD" data-id="${d.id}">Edit</button> <button class="btn sm" data-a="delD" data-id="${d.id}">Hapus</button></div></div>`; }).join('') || `<div class="card" style="grid-column:1/-1">${empty('Tidak ada catatan hutang/piutang.')}</div>`}</div>`;
}

/* ===== Modul: Tagihan ===== */
function billForm(id) {
  const b = S.bills.find(x => x.id === id) || { due: today(), repeat: 'Bulanan', remind: 3 };
  form(id ? 'Edit tagihan' : 'Tambah tagihan', [{ k: 'name', l: 'Nama', r: 1 }, { k: 'amount', l: 'Nominal (Rp)', t: 'number', n: 1, r: 1 }, { k: 'cat', l: 'Kategori', t: 'select', o: OUT_CATS }, { k: 'due', l: 'Jatuh tempo', t: 'date', r: 1 }, { k: 'repeat', l: 'Pengulangan', t: 'select', o: ['Sekali', 'Bulanan', 'Tahunan'] }, { k: 'remind', l: 'Pengingat', t: 'select', o: [[1, 'H-1'], [3, 'H-3'], [7, 'H-7']] }], b, v => {
    v.remind = Number(v.remind); if (id) Object.assign(b, v); else S.bills.push({ id: uid(), ...v, paid: false }); toast('Tagihan disimpan.');
  });
}
function billPay(id) {
  const b = S.bills.find(x => x.id === id);
  form('Bayar: ' + esc(b.name), [{ k: 'wallet', l: `Wallet (nominal ${rp(b.amount)})`, t: 'select', o: walletOpts() }], {}, v => {
    if (b.amount > bal(S.wallets.find(w => w.id === v.wallet))) return 'Saldo wallet tidak cukup.';
    S.tx.push({ id: uid(), type: 'out', date: today(), amount: b.amount, cat: b.cat, wallet: v.wallet, note: 'Tagihan: ' + b.name, ref: b.id });
    if (b.repeat === 'Sekali') b.paid = true; else b.due = addMonths(b.due, b.repeat === 'Bulanan' ? 1 : 12);
    toast('Tagihan dibayar.');
  });
}
function billPage() {
  const bs = [...S.bills].sort((a, b) => a.due.localeCompare(b.due)), inMonth = bs.filter(b => mk(b.due) === month && !b.paid);
  const [y, m] = month.split('-').map(Number), first = new Date(y, m - 1, 1).getDay(), n = new Date(y, m, 0).getDate();
  let cal = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(h => `<div class="h">${h}</div>`).join('') + '<div style="border:0"></div>'.repeat(first);
  for (let i = 1; i <= n; i++) cal += `<div>${i}${bs.filter(b => b.due === `${month}-${String(i).padStart(2, '0')}`).map(b => `<em title="${esc(b.name)}">${esc(b.name)}</em>`).join('')}</div>`;
  return `<div class="grid g3"><div class="card stat"><small>Total tagihan bulan ini (belum dibayar)</small><b class="warn">${rp(sum(inMonth))}</b></div><div class="card"><button class="btn p" data-a="addBill">+ Tagihan</button></div></div>
  <div class="grid g2"><div class="card"><h2>Daftar tagihan</h2>${bs.length ? `<table><thead><tr><th>Nama</th><th>Tempo</th><th>Nominal</th><th>Status</th><th></th></tr></thead><tbody>${bs.map(b => { const s = billStatus(b); return `<tr><td>${esc(b.name)}<br><small>${b.repeat} · ingatkan H-${b.remind}</small></td><td>${fd(b.due)}</td><td>${rp(b.amount)}</td><td><span class="tag ${s[1]}">${s[0]}</span></td>
  <td>${b.paid ? '' : `<button class="btn sm p" data-a="payBill" data-id="${b.id}">Bayar</button> `}<button class="btn sm" data-a="editBill" data-id="${b.id}">✎</button> <button class="btn sm" data-a="delBill" data-id="${b.id}">🗑</button></td></tr>`; }).join('')}</tbody></table>` : empty('Belum ada tagihan.')}</div>
  <div class="card"><h2>Kalender ${mlabel(month)}</h2><div class="cal">${cal}</div></div></div>`;
}

/* ===== Modul: Dashboard ===== */
function dashPage() {
  const inc = sum(monthTx(month, 'in')), out = sum(monthTx(month, 'out'));
  const due = S.bills.filter(b => !b.paid && daysTo(b.due) <= 7).sort((a, b) => a.due.localeCompare(b.due));
  const recent = S.tx.filter(t => ['in', 'out'].includes(t.type)).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const c = (l, v, k = '') => `<div class="card stat"><small>${l}</small><b class="${k}">${v}</b></div>`;
  return `<div class="grid g5">${c('Total saldo', rp(sum(S.wallets, bal)))}${c('Pemasukan bulan ini', rp(inc), 'in')}${c('Pengeluaran bulan ini', rp(out), 'out')}${c('Hutang belum lunas', rp(sum(S.debts.filter(d => d.kind === 'hutang'), d => d.remain)), 'out')}${c('Tagihan ≤ 7 hari', due.length + ' tagihan', 'warn')}</div>
  <div class="grid g2"><div class="card"><h2>Pemasukan vs pengeluaran (6 bulan)</h2><canvas id="c1" height="130"></canvas></div><div class="card"><h2>Pengeluaran per kategori</h2><canvas id="c2" height="130"></canvas></div></div>
  <div class="grid g3"><div class="card"><h2>Transaksi terbaru</h2><div class="list">${recent.map(t => `<div><span>${fd(t.date)} · ${t.cat}<br><small>${esc(t.note)}</small></span><b class="${t.type}">${t.type === 'in' ? '+' : '-'}${rp(t.amount)}</b></div>`).join('') || empty('Belum ada transaksi.')}</div></div>
  <div class="card"><h2>Tagihan segera jatuh tempo</h2><div class="list">${due.map(b => { const s = billStatus(b); return `<div><span>${esc(b.name)}<br><small>${fd(b.due)}</small></span><span class="tag ${s[1]}">${s[0]}</span></div>`; }).join('') || empty('Tidak ada tagihan dalam 7 hari.')}</div></div>
  <div class="card"><h2>Progres anggaran</h2>${S.budgets.map(b => { const p = spent(b.cat, month) / b.limit * 100; return `<div class="row"><span>${b.cat}</span><small>${Math.round(p)}%</small></div>${bar(p)}`; }).join('') || empty('Atur anggaran di menu Planner.')}</div></div>`;
}
function drawCharts() {
  charts.forEach(c => c.destroy()); charts = [];
  if (typeof Chart === 'undefined' || !$('#c1')) return;
  const ms = [5, 4, 3, 2, 1, 0].map(mstr), cats = OUT_CATS.map(c => [c, spent(c, month)]).filter(x => x[1]);
  charts.push(new Chart($('#c1'), { type: 'bar', data: { labels: ms.map(mlabel), datasets: [{ label: 'Pemasukan', data: ms.map(m => sum(monthTx(m, 'in'))), backgroundColor: '#1f9d63' }, { label: 'Pengeluaran', data: ms.map(m => sum(monthTx(m, 'out'))), backgroundColor: '#d6453d' }] } }));
  charts.push(new Chart($('#c2'), { type: 'doughnut', data: { labels: cats.map(x => x[0]), datasets: [{ data: cats.map(x => x[1]), backgroundColor: ['#0f5c4d', '#1f6fb5', '#7a4fb5', '#c2571a', '#b5305f', '#2a8a8a', '#e0a800', '#7d8b87'] }] } }));
}

/* ===== Render terpusat ===== */
function render() {
  document.documentElement.dataset.theme = S.theme || 'light';
  $('#title').textContent = TITLES[page]; $('#month').value = month;
  document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.id === page));
  const views = { dashboard: dashPage, planner: plannerPage, wallet: walletPage, income: () => txPage('in'), expense: () => txPage('out'), debt: debtPage, bill: billPage };
  const keep = document.activeElement && document.activeElement.dataset.a === 'search' ? document.activeElement.selectionStart : null;
  $('#view').innerHTML = views[page]();
  if (keep !== null) { const i = $('[data-a=search]'); i.focus(); i.setSelectionRange(keep, keep); }
  drawCharts();
}

/* ===== Aksi (event delegation) ===== */
const del = (arr, id, msg, extra) => ask(msg, () => { S[arr] = S[arr].filter(x => x.id !== id); if (extra) extra(); save(); toast('Data dihapus.'); });
const A = {
  nav: id => { page = id; ui = { q: '', cat: '', sort: 'date', dir: -1 }; render(); },
  close: () => $('#modal').close(),
  theme: () => { S.theme = S.theme === 'dark' ? 'light' : 'dark'; save(); },
  quick: id => txForm(id), addIn: () => txForm('in'), addOut: () => txForm('out'),
  editTx: id => txForm(S.tx.find(t => t.id === id).type, id),
  delTx: id => del('tx', id, 'Hapus transaksi ini? Saldo wallet akan menyesuaikan.'),
  sort: id => { ui.dir = ui.sort === id ? -ui.dir : -1; ui.sort = id; render(); },
  addW: () => walletForm(), editW: id => walletForm(id), transfer: transferForm, mutasi,
  delW: id => { const n = S.tx.filter(t => t.wallet === id || t.to === id).length; del('wallets', id, n ? `Wallet ini punya ${n} transaksi terkait yang ikut terhapus. Lanjutkan?` : 'Hapus wallet ini?', () => { S.tx = S.tx.filter(t => t.wallet !== id && t.to !== id); }); },
  addB: () => budgetForm(), editB: budgetForm, delB: id => del('budgets', id, 'Hapus anggaran ini?'),
  addG: () => goalForm(), editG: goalForm, fundG: goalFund, delG: id => del('goals', id, 'Hapus target ini?'),
  addD: () => debtForm(), editD: debtForm, payD: debtPay, delD: id => del('debts', id, 'Hapus catatan ini beserta riwayatnya?'),
  addBill: () => billForm(), editBill: billForm, payBill: billPay, delBill: id => del('bills', id, 'Hapus tagihan ini?'),
  export: () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' })); a.download = `financial-planner-${today()}.json`; a.click(); toast('Data diekspor.'); },
  reset: () => ask('Reset SEMUA data menjadi kosong? Tindakan ini tidak bisa dibatalkan.', () => { S = { theme: S.theme, wallets: [], tx: [], budgets: [], goals: [], debts: [], bills: [] }; save(); toast('Data direset.'); }),
  clearSeed: () => ask('Hapus semua data contoh? Seluruh data akan dikosongkan.', () => { S = { theme: S.theme, wallets: [], tx: [], budgets: [], goals: [], debts: [], bills: [] }; save(); toast('Data contoh dihapus.'); })
};
document.addEventListener('click', e => { const el = e.target.closest('[data-a]'); if (el && A[el.dataset.a] && !['search', 'catf'].includes(el.dataset.a)) A[el.dataset.a](el.dataset.id, el); });
document.addEventListener('input', e => { if (e.target.dataset.a === 'search') { ui.q = e.target.value; render(); } });
document.addEventListener('change', e => { if (e.target.dataset.a === 'catf') { ui.cat = e.target.value; render(); } });
$('#month').addEventListener('change', e => { if (e.target.value) { month = e.target.value; render(); } });
$('#imp').addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return; const r = new FileReader();
  r.onload = () => { try { const d = JSON.parse(r.result); if (!Array.isArray(d.wallets) || !Array.isArray(d.tx)) throw 0; S = d; save(); toast('Data berhasil diimpor.'); } catch (x) { toast('File JSON tidak valid.', 'e'); } e.target.value = ''; };
  r.readAsText(f);
});
save();