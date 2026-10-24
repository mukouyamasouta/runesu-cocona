/**
 * Cocona 日報・日計表 Webアプリ（A案：帳票そのまま）
 * 紐づけ先：スプレッドシート「Cocona 日報・日計表」（このスクリプトはそのコンテナバインド）
 *   シート「日報日計表」… 1日1行。列は COLUMNS の順
 *   シート「設定」　　… 釣り銭など
 */

/* スタンドアロンで動かすときだけ使う（コンテナバインドなら getActiveSpreadsheet が優先） */
const SPREADSHEET_ID = '1bqC2-snsEBbszlSrpEG5gFCCBUZgNw9uE05rdN-S3g8';
const SHEET_DAY = '日報日計表';
const SHEET_CONF = '設定';
const DEFAULT_CHANGE = 120000;

const KAMOKU = ['食品(一般)', '本・雑誌', '器', 'シューズ', '宅急便', '雑貨(一般)', '雑貨(社長)', '雑貨(委託)', '衣料(ヒトミ)', '衣料(社長)', '医局', 'PET', 'パルテール', 'カフェ(食事)', 'カフェ(飲料)', '持ち帰り飲食', '注文弁当'];
const MARU = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰';
const KAKE = ['総務課', '医局(掛売)', '医局(現金)', '健診課(PET)', '健診課(健診)', 'PayPay'];
const KINSHU = [10000, 5000, 2000, 1000, 500, 100, 50, 10, 5, 1];
const COUNTS = [['omakase', 'おまかせ'], ['pet', 'PET'], ['morning', 'モーニング'], ['ikyoku', '医局'], ['coupon', 'クーポン'], ['pp8', 'PayPay 8%'], ['pp10', 'PayPay 10%']];
const MOBILE = [['food', '食品'], ['clothBoss', '衣料(社長)'], ['cloth', '衣料'], ['other', 'その他']];
const CHECKS = [['cocona', 'ココナ'], ['keiri', '経理'], ['kanri', '管理部']];
const BENTO_ROWS = 5;
const DEFAULT_BENTO = ['ココナ弁当', '日替わり丼', 'おにぎりセット'];

/* ---------- 列定義（k=データのパス、h=見出し、t=num|text|calc） ---------- */
function columns_() {
  const c = [
    { k: 'date', h: '日付', t: 'text' },
    { k: 'updatedAt', h: '更新日時', t: 'meta' },
    { k: 'updatedBy', h: '更新者', t: 'meta' },
    { k: 'name', h: '氏名', t: 'text' },
    { k: 'buyers', h: '購入者数', t: 'num' },
  ];
  for (let i = 0; i < BENTO_ROWS; i++) {
    c.push({ k: `bento.${i}.name`, h: `弁当${i + 1}_品名`, t: 'text' });
    c.push({ k: `bento.${i}.in`, h: `弁当${i + 1}_入数`, t: 'num' });
    c.push({ k: `bento.${i}.left`, h: `弁当${i + 1}_残数`, t: 'num' });
    c.push({ k: `sold.${i}`, h: `弁当${i + 1}_販売`, t: 'calc' });
  }
  c.push({ k: 'omakaseMenu', h: 'おまかせメニュー', t: 'text' });
  COUNTS.forEach(([k, l]) => {
    c.push({ k: `counts.${k}`, h: `${l}_数量`, t: 'num' });
    c.push({ k: `countNotes.${k}`, h: `${l}_備考`, t: 'text' });
  });
  c.push({ k: 'mobile.date', h: '移動販売_何日分', t: 'text' });
  MOBILE.forEach(([k, l]) => c.push({ k: `mobile.${k}`, h: `移動販売_${l}`, t: 'num' }));
  c.push({ k: 'mobileTotal', h: '移動販売_計', t: 'calc' });
  c.push({ k: 'timeline', h: '時間・内容', t: 'text' });
  c.push({ k: 'renraku', h: '連絡事項・相談事項・提案事項', t: 'text' });
  c.push({ k: 'comment', h: 'コメント', t: 'text' });
  KAMOKU.forEach((l, i) => c.push({ k: `sales.${i}`, h: `入金${MARU[i]}${l}`, t: 'num' }));
  c.push({ k: 'salesTotal', h: '売上計(税込)', t: 'calc' });
  KAKE.forEach((l, i) => c.push({ k: `kake.${i}`, h: `掛売_${l}`, t: 'num' }));
  c.push({ k: 'kakeTotal', h: '掛売計', t: 'calc' });
  c.push({ k: 'ticket', h: '商品券', t: 'num' });
  KINSHU.forEach(d => c.push({ k: `kinshu.${d}`, h: `金種_${d}円(枚)`, t: 'num' }));
  c.push({ k: 'cash', h: '現金在高', t: 'calc' });
  c.push({ k: 'change', h: '釣り銭', t: 'calc' });
  c.push({ k: 'diff', h: '過不足(仮)', t: 'calc' });
  c.push({ k: 'zaidaka', h: '在高計(仮)', t: 'calc' });
  c.push({ k: 'cocona', h: 'Cocona分(売上計−⑬)', t: 'calc' });
  c.push({ k: 'cafe', h: '内Café売上(⑭＋⑮)', t: 'calc' });
  c.push({ k: 'visitors', h: '来客者数', t: 'num' });
  c.push({ k: 'coconaVisitors', h: '来客者数(Cocona)', t: 'num' });
  CHECKS.forEach(([k, l]) => c.push({ k: `checks.nippo.${k}`, h: `日報確認_${l}`, t: 'text' }));
  CHECKS.forEach(([k, l]) => c.push({ k: `checks.nikkei.${k}`, h: `日計表確認_${l}`, t: 'text' }));
  return c;
}

/* ---------- 計算（index.html の calc と同じ式） ---------- */
function calc_(S, change) {
  const n = v => Number(v) || 0;
  const c = {};
  c.salesTotal = S.sales.reduce((a, b) => a + n(b), 0);
  c.kakeTotal = S.kake.reduce((a, b) => a + n(b), 0);
  c.cash = KINSHU.reduce((a, d) => a + d * n(S.kinshu[d]), 0);
  c.change = change;
  const counted = KINSHU.some(d => S.kinshu[d] !== '' && S.kinshu[d] != null);
  c.diff = counted ? c.cash - (change + c.salesTotal - c.kakeTotal - n(S.ticket)) : '';
  c.zaidaka = counted ? c.cash - change : '';
  c.cocona = c.salesTotal - n(S.sales[12]);
  c.cafe = n(S.sales[13]) + n(S.sales[14]);
  c.mobileTotal = MOBILE.reduce((a, [k]) => a + n(S.mobile[k]), 0);
  S.bento.forEach((b, i) => { c[`sold.${i}`] = b.name ? Math.max(0, n(b.in) - n(b.left)) : ''; });
  return c;
}

function blankDay_() {
  const o = obj => Object.fromEntries(obj.map(([k]) => [k, '']));
  return {
    name: '', buyers: '', visitors: '', coconaVisitors: '',
    bento: Array.from({ length: BENTO_ROWS }, (_, i) => ({ name: DEFAULT_BENTO[i] || '', in: '', left: '' })),
    omakaseMenu: '', counts: o(COUNTS), countNotes: o(COUNTS),
    mobile: Object.assign({ date: '' }, o(MOBILE)),
    timeline: '', renraku: '', comment: '',
    sales: KAMOKU.map(() => ''), kake: KAKE.map(() => ''), ticket: '',
    kinshu: Object.fromEntries(KINSHU.map(d => [d, ''])),
    checks: { nippo: o(CHECKS), nikkei: o(CHECKS) },
  };
}

/* ---------- 入口 ---------- */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Cocona 日報・日計表')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** 画面の初期化：釣り銭とシートURL */
function getConfig() {
  const ss = ss_();
  ensureSheets_(ss);
  return { change: change_(ss), sheetUrl: ss.getUrl() };
}

/** 指定日の日報・日計表を読む。未登録なら空の様式（弁当の品名は直近の登録から引き継ぐ） */
function loadDay(date) {
  assertDate_(date);
  const ss = ss_();
  const sh = ensureSheets_(ss);
  const cols = columns_();
  const rows = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, cols.length).getValues() : [];
  const idx = rows.findIndex(r => key_(r[0]) === date);
  if (idx >= 0) {
    const S = blankDay_();
    const r = rows[idx];
    cols.forEach((c, j) => { if (c.t === 'num' || c.t === 'text') setPath_(S, c.k, c.t === 'num' ? numOrBlank_(r[j]) : String(r[j] ?? '')); });
    return { exists: true, data: S, updatedAt: fmtTime_(r[1]), updatedBy: String(r[2] || '') };
  }
  const S = blankDay_();
  const prev = rows.map((r, i) => ({ d: key_(r[0]), i })).filter(x => x.d && x.d < date).sort((a, b) => a.d < b.d ? 1 : -1)[0];
  if (prev) {
    const r = rows[prev.i];
    cols.forEach((c, j) => { if (/^bento\.\d+\.name$/.test(c.k)) setPath_(S, c.k, String(r[j] ?? '')); });
  }
  return { exists: false, data: S, updatedAt: '', updatedBy: '' };
}

/** 指定日の日報・日計表を保存（同じ日付の行があれば上書き、なければ追加して日付順に並べる） */
function saveDay(date, S) {
  assertDate_(date);
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const ss = ss_();
    const sh = ensureSheets_(ss);
    const cols = columns_();
    const c = calc_(S, change_(ss));
    const now = new Date();
    const user = Session.getActiveUser().getEmail() || '';
    const row = cols.map(col => {
      if (col.k === 'date') return date;
      if (col.k === 'updatedAt') return now;
      if (col.k === 'updatedBy') return user;
      if (col.t === 'calc') return c[col.k];
      const v = getPath_(S, col.k);
      return col.t === 'num' ? numOrBlank_(v) : String(v ?? '');
    });
    const last = sh.getLastRow();
    const keys = last > 1 ? sh.getRange(2, 1, last - 1, 1).getValues().map(r => key_(r[0])) : [];
    const at = keys.indexOf(date);
    if (at >= 0) {
      sh.getRange(at + 2, 1, 1, row.length).setValues([row]);
    } else {
      sh.getRange(last + 1, 1, 1, row.length).setValues([row]);
      if (last + 1 > 2) sh.getRange(2, 1, last, cols.length).sort({ column: 1, ascending: true });
    }
    return { updatedAt: fmtTime_(now), updatedBy: user };
  } finally {
    lock.releaseLock();
  }
}

/** 指定月の登録状況（画面の日付ナビ用） */
function listMonth(ym) {
  if (!/^\d{4}-\d{2}$/.test(ym)) throw new Error('月の形式が正しくありません');
  const sh = ensureSheets_(ss_());
  const cols = columns_();
  if (sh.getLastRow() < 2) return [];
  const ci = name => cols.findIndex(c => c.k === name);
  const chk = ['nippo', 'nikkei'].flatMap(f => CHECKS.map(([k]) => ci(`checks.${f}.${k}`)));
  return sh.getRange(2, 1, sh.getLastRow() - 1, cols.length).getValues()
    .filter(r => key_(r[0]).startsWith(ym))
    .map(r => ({ date: key_(r[0]), done: chk.every(j => r[j] === '済') }));
}

/* ---------- シート ---------- */
function ss_() {
  return SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(SPREADSHEET_ID);
}

function ensureSheets_(ss) {
  const cols = columns_();
  /* 更新日時が日本時間で表示されるよう、シートのタイムゾーンをスクリプトに合わせる */
  if (ss.getSpreadsheetTimeZone() !== Session.getScriptTimeZone()) ss.setSpreadsheetTimeZone(Session.getScriptTimeZone());
  let sh = ss.getSheetByName(SHEET_DAY);
  if (!sh) {
    const blank = ss.getSheets().length === 1 && ss.getSheets()[0].getLastRow() === 0 ? ss.getSheets()[0] : null;
    sh = blank ? blank.setName(SHEET_DAY) : ss.insertSheet(SHEET_DAY, 0);
  }
  if (sh.getMaxColumns() < cols.length) sh.insertColumnsAfter(sh.getMaxColumns(), cols.length - sh.getMaxColumns());
  const head = sh.getRange(1, 1, 1, cols.length);
  const want = cols.map(c => c.h);
  if (head.getValues()[0].join('\t') !== want.join('\t')) {
    head.setValues([want]).setFontWeight('bold').setBackground('#DDE5F2').setWrap(true).setVerticalAlignment('middle');
    sh.setFrozenRows(1);
    sh.setFrozenColumns(1);
    sh.getRange('A:A').setNumberFormat('@');
    sh.getRange('B:B').setNumberFormat('yyyy/mm/dd hh:mm');
    cols.forEach((c, j) => { if (c.t === 'calc') sh.getRange(1, j + 1).setBackground('#EEF0F4'); });
  }
  let conf = ss.getSheetByName(SHEET_CONF);
  if (!conf) {
    conf = ss.insertSheet(SHEET_CONF);
    conf.getRange('A1:C2').setValues([['項目', '値', '説明'], ['釣り銭', DEFAULT_CHANGE, '過不足・在高計の計算に使う釣り銭（円）']]);
    conf.getRange('A1:C1').setFontWeight('bold').setBackground('#DDE5F2');
    conf.setColumnWidth(3, 360);
  }
  return sh;
}

function change_(ss) {
  const conf = ss.getSheetByName(SHEET_CONF);
  const v = conf ? Number(conf.getRange('B2').getValue()) : NaN;
  return isFinite(v) && v > 0 ? v : DEFAULT_CHANGE;
}

/* ---------- 小物 ---------- */
function assertDate_(d) { if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) throw new Error('日付の形式が正しくありません'); }
function key_(v) { return v instanceof Date ? Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd') : String(v || ''); }
function fmtTime_(v) { return v instanceof Date ? Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy/MM/dd HH:mm') : String(v || ''); }
function numOrBlank_(v) { return v === '' || v == null || !isFinite(Number(v)) ? '' : Number(v); }
function getPath_(o, p) { return p.split('.').reduce((x, k) => x == null ? undefined : x[k], o); }
function setPath_(o, p, v) { const ks = p.split('.'); const last = ks.pop(); ks.reduce((x, k) => x[k], o)[last] = v; }
