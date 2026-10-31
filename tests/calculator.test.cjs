const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('index.html', 'utf8');
const script = fs.readFileSync('script.js', 'utf8');
function setup(storage = {}, clipboardFails = false, fallback = true) {
  const nodes = {};
  class Element {
    constructor() { this.value = ''; this.checked = false; this.textContent = ''; this.dataset = {}; this.style = {}; this.handlers = {}; this.attributes = {}; this.classes = new Set(); this.classList = { toggle: (c, on) => on ? this.classes.add(c) : this.classes.delete(c), add: c => this.classes.add(c) }; }
    addEventListener(event, fn) { (this.handlers[event] ||= []).push(fn); }
    async fire(event) { for (const fn of this.handlers[event] || []) await fn({ preventDefault() {} }); }
    setAttribute(k,v) { this.attributes[k]=v; }
    focus() {} select() {} remove() {} scrollIntoView() {}
  }
  for (const match of html.matchAll(/<[^>]+\bid="([^"]+)"[^>]*>/g)) {
    const e = nodes[match[1]] = new Element();
    e.value = match[0].match(/value="([^"]*)"/)?.[1] || '';
    e.checked = /\bchecked\b/.test(match[0]);
  }
  const document = {
    documentElement: { dataset: { theme: 'dark' } }, body: new Element(), activeElement: null,
    getElementById: id => { assert.ok(nodes[id], `Missing DOM reference: ${id}`); return nodes[id]; },
    querySelector: selector => selector === '.mobile-tabs' ? new Element() : nodes.pphDescription,
    querySelectorAll: selector => [...html.matchAll(/<input\s[^>]*>/g)].filter(m => m[0].includes(selector.slice(1))).map(m => nodes[m[0].match(/id="([^"]+)"/)[1]]),
    createElement: () => new Element(), execCommand: () => fallback,
  };
  document.body.appendChild = () => {};
  let copied = '';
  const context = vm.createContext({ document, Intl, console,
    localStorage: { getItem: k => storage[k], setItem: (k,v) => storage[k]=v },
    navigator: { clipboard: { writeText: async text => { if (clipboardFails) throw Error(); copied = text; } } },
    window: { setTimeout() {}, matchMedia: () => ({matches:true}) }, requestAnimationFrame: fn => fn(),
  });
  vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], context);
  vm.runInContext(script, context);
  return { nodes, context, storage, copied: () => copied, data: () => { vm.runInContext('calculate()',context); return JSON.parse(vm.runInContext('JSON.stringify({pph: elements.summaryPph.textContent, summary: elements.copyButton.dataset.summary})',context)); } };
}
function number(text) { return Number(text.replace(/[^\d,-]/g,'').replace(',','.')); }
test('all PPN/PPh combinations preserve every fee and margin', () => {
  const s=setup(), n=s.nodes;
  n.sellingPrice.value='111.000'; n.capitalCost.value='50.000'; n.adminPercent.value='7,5';
  for (const key of ['freeShipping','promoXtra','promoXtraPlus']) { n[key+'Toggle'].checked=true; n[key+'Percent'].value='2'; }
  for (const vat of [false,true]) for (const pph of [false,true]) {
    n.vatToggle.checked=vat; n.pphToggle.checked=pph; s.data();
    const expectedPph=pph?(vat?100000:111000)*.005:0;
    const total=50000+8325+1250+6660+(vat?11000:0)+expectedPph;
    assert.equal(number(n.summaryPph.textContent),expectedPph ? -expectedPph : 0);
    assert.equal(number(n.summaryTotalCost.textContent),total);
    assert.equal(number(n.netProfit.textContent),111000-total);
    assert.ok(n.profitMargin.textContent.includes(new Intl.NumberFormat('id-ID',{maximumFractionDigits:2}).format((111000-total)/111000*100)));
    assert.equal(n.pphDescription.textContent,vat?'Harga jual ÷ 1,11 × 0,5%':'Harga jual × 0,5%');
  }
});
test('profit, loss, break-even and reset defaults', async () => {
  const s=setup(), n=s.nodes;
  assert.equal(n.pphToggle.checked,true); assert.equal(n.profitStatus.textContent,'IMPAS');
  n.sellingPrice.value='100000'; n.vatToggle.checked=false; n.pphToggle.checked=false;
  for (const [capital,status] of [['50000','UNTUNG'],['110000','RUGI'],['98750','IMPAS']]) { n.capitalCost.value=capital; s.data(); assert.equal(n.profitStatus.textContent,status); }
  await n.resetButton.fire('click'); assert.equal(n.vatToggle.checked,true); assert.equal(n.pphToggle.checked,true); assert.equal(n.profitStatus.textContent,'IMPAS');
});
test('program switches, automatic input, percentage parsing and currency format', async () => {
  const s=setup(), n=s.nodes;
  n.sellingPrice.value='111000'; await n.sellingPrice.fire('input'); assert.equal(n.sellingPrice.value,'111.000');
  for (const key of ['freeShipping','promoXtra','promoXtraPlus']) {
    n[key+'Percent'].value='2,5'; n[key+'Toggle'].checked=true; await n[key+'Toggle'].fire('change');
    assert.equal(n[key+'Field'].classes.has('is-hidden'),false);
    n[key+'Toggle'].checked=false; await n[key+'Toggle'].fire('change'); assert.equal(n[key+'Field'].classes.has('is-hidden'),true);
  }
  assert.equal(vm.runInContext('parsePercent("7,5")',s.context),7.5);
});
test('theme persistence after reload and mobile navigation', async () => {
  const s=setup(), n=s.nodes;
  await n.themeToggle.fire('click'); assert.equal(s.storage['shopee-theme'],'light');
  assert.equal(setup(s.storage).context.document.documentElement.dataset.theme,'light');
  await n.themeToggle.fire('click'); assert.equal(s.storage['shopee-theme'],'dark');
  await n.viewResultsButton.fire('click'); assert.equal(n.resultTab.attributes['aria-pressed'],'true');
  await n.inputTab.fire('click'); assert.equal(n.inputTab.attributes['aria-pressed'],'true');
  await n.resultTab.fire('click'); assert.equal(n.resultTab.attributes['aria-pressed'],'true');
});
test('copy success, fallback and honest failure feedback', async () => {
  for (const [fails,fallback,success] of [[false,true,true],[true,true,true],[true,false,false]]) {
    const s=setup({},fails,fallback); await s.nodes.copyButton.fire('click');
    assert.equal(s.nodes.copyFeedback.textContent.includes('berhasil'),success);
    if (!fails) assert.ok(s.copied().includes('Keuntungan Bersih:'));
  }
});


test('percentage inputs filter non-numeric text and keep one decimal separator', async () => {
  const { nodes } = setup();
  for (const id of ['adminPercent', 'freeShippingPercent', 'promoXtraPercent', 'promoXtraPlusPercent']) {
    const input = nodes[id];
    for (const [raw, expected] of [['abc7,5%', '7,5'], [' 12.3,4! ', '12.34'], ['-2e3', '23'], ['abc', ''], ['0,5', '0,5'], ['', '']]) {
      input.value = raw;
      await input.fire('input');
      assert.equal(input.value, expected, id);
    }
    input.value = '1000,5';
    await input.fire('blur');
    assert.equal(input.value, '1000,5');
    await input.fire('input');
    assert.equal(input.value, '1000,5');
  }
});
