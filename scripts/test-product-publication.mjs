import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { testLoader } from './ts-test-loader.mjs';

const load = testLoader();
const { englishTranslationFor, bilingualProductErrors, withBilingualPublication } = load('lib/product-publication.ts');
const fixture = (overrides = {}) => ({
  id: 'bilingual-test', catalogNo: 'TEST001', sku: 'TEST001', status: 'draft', deletedAt: '',
  nameCn: '木糖', nameEn: 'D-Xylose', category: '单糖', cas: '58-86-6', formula: 'C5H10O5',
  molecularWeight: '150.13', image: '/product-default-kasons.png', tags: [], details: '原有中文内容',
  translations: { en: { nameEn: 'D-Xylose', category: 'Monosaccharides', details: 'Original English copy', published: false } },
  ...overrides
});

function editorDriver(product, { mode = 'detail', products = [product], selectedIds = [] } = {}) {
  const states = [];
  let cursor = 0;
  const mockReact = {
    ...React,
    useMemo: (fn) => fn(), useRef: (value) => ({ current: value }),
    useState: (initial) => {
      const index = cursor++;
      if (!(index in states)) states[index] = index === 1 ? (mode === 'detail' ? product.id : '') : index === 2 ? mode : index === 9 ? selectedIds : typeof initial === 'function' ? initial() : initial;
      return [states[index], (value) => { states[index] = typeof value === 'function' ? value(states[index]) : value; }];
    }
  };
  const { ProductEditor } = testLoader({
    react: mockReact,
    '@/components/admin-language': {
      useAdminLanguage: () => ({ locale: 'zh', t: (text) => text }),
      contentErrorMessage: async (response) => (await response.json()).error
    },
    '@/components/LanguageProvider': { useLanguage: () => ({ locale: 'zh', t: (zh) => zh }) }
  })('components/ProductEditor.tsx');
  return { states, render: () => { cursor = 0; return ProductEditor({ initialProducts: products }); } };
}

function findNode(tree, predicate) {
  if (!tree || typeof tree !== 'object') return undefined;
  if (Array.isArray(tree)) return tree.map((node) => findNode(node, predicate)).find(Boolean);
  if (predicate(tree)) return tree;
  return findNode(tree.props?.children, predicate);
}
const button = (tree, text) => findNode(tree, (node) => node.type === 'button' && node.props.children === text);

test('publication changes both flags together without dropping either language or shared identity', () => {
  const published = withBilingualPublication(fixture(), 'published');
  assert.equal(published.status, 'published');
  assert.equal(published.translations.en.published, true);
  assert.equal(published.details, '原有中文内容');
  assert.equal(published.translations.en.details, 'Original English copy');
  assert.equal(published.cas, '58-86-6');
  assert.equal(published.formula, 'C5H10O5');
  assert.equal(published.translations.en.molecularWeight, published.molecularWeight);
  const draft = withBilingualPublication(published, 'draft');
  assert.equal(draft.status, 'draft');
  assert.equal(draft.translations.en.published, false);
  assert.equal(draft.translations.en.details, published.translations.en.details);
});

test('missing English fields block joint publication but allow saving a draft', () => {
  const incomplete = fixture({ translations: { en: { nameEn: '', category: '' } } });
  assert.equal(englishTranslationFor(incomplete).nameEn, '', 'explicitly cleared names must remain empty');
  assert.equal(englishTranslationFor(incomplete).category, '');
  assert.deepEqual(bilingualProductErrors(incomplete), ['englishName', 'englishCategory']);
  assert.throws(() => withBilingualPublication(incomplete, 'published'));
  assert.equal(withBilingualPublication(incomplete, 'draft').translations.en.published, false);
  assert.ok(bilingualProductErrors(fixture({ image: '', catalogNo: '', sku: '' })).includes('image'));
  assert.ok(bilingualProductErrors(fixture({ translations: { en: { nameEn: '中文名称', category: '单糖' } } })).includes('englishName'));
});

test('detail form renders both language columns and one set of shared fields with no language tabs', () => {
  const driver = editorDriver(fixture());
  const html = renderToStaticMarkup(driver.render());
  assert.ok(html.indexOf('product-chinese-heading') < html.indexOf('product-english-heading'));
  assert.match(html, /bilingual-product-columns/);
  assert.equal((html.match(/>CAS 号<\/span>/g) || []).length, 1);
  assert.equal((html.match(/>分子式<\/span>/g) || []).length, 1);
  assert.doesNotMatch(html, /编辑内容语言|中文发布状态独立维护|保存英文内容/);
  assert.match(html, /发布中英文产品/);
});

test('editing both columns submits one merged product update; failure does not change publication state', async () => {
  const driver = editorDriver(fixture());
  let tree = driver.render();
  const chineseInput = findNode(tree, (node) => node.type === 'textarea' && node.props.value === '原有中文内容');
  chineseInput.props.onChange({ target: { value: '更新后的中文内容' } });
  tree = driver.render();
  const englishEditor = findNode(tree, (node) => node.props?.uploadFolder === 'products' && node.props?.fields);
  englishEditor.props.onChange('details', 'Updated English content');
  tree = driver.render();
  const requests = [];
  const oldFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (_url, options) => { requests.push(JSON.parse(options.body)); return Response.json({ error: 'Save failed' }, { status: 500 }); };
    await button(tree, '发布中英文产品').props.onClick();
    assert.equal(requests.length, 1);
    assert.equal(requests[0].merge, true);
    assert.equal(requests[0].products.length, 1);
    const payload = requests[0].products[0];
    assert.equal(payload.status, 'published');
    assert.equal(payload.translations.en.published, true);
    assert.equal(payload.details, '更新后的中文内容');
    assert.equal(payload.translations.en.details, 'Updated English content');
    assert.equal(driver.states[0][0].status, 'draft');
    assert.equal(driver.states[0][0].translations.en.published, false);
    globalThis.fetch = async () => Response.json({ ok: true });
    await button(driver.render(), '发布中英文产品').props.onClick();
    assert.equal(driver.states[0][0].status, 'published');
    assert.equal(driver.states[0][0].translations.en.published, true);
  } finally { globalThis.fetch = oldFetch; }
});

test('incomplete editor publishes neither version and can still save both columns as a draft', async () => {
  const driver = editorDriver(fixture({ translations: { en: { nameEn: '', category: '', details: 'Unfinished English copy' } } }));
  const requests = [];
  const oldFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (_url, options) => { requests.push(JSON.parse(options.body)); return Response.json({ ok: true }); };
    await button(driver.render(), '发布中英文产品').props.onClick();
    assert.equal(requests.length, 0);
    await button(driver.render(), '保存中英文草稿').props.onClick();
    assert.equal(requests.length, 1);
    assert.equal(requests[0].products[0].status, 'draft');
    assert.equal(requests[0].products[0].translations.en.published, false);
    assert.equal(requests[0].products[0].translations.en.details, 'Unfinished English copy');
  } finally { globalThis.fetch = oldFetch; }
});

test('API saves both language fields in one call and rejects an incomplete English publication before writing', async () => {
  const writes = [];
  const { PUT } = testLoader({
    '@/lib/adminAuth': { requireAdmin: async () => {} },
    '@/lib/cms': { saveProducts: async (...args) => { writes.push(args); } },
    'next/cache': { revalidatePath() {} }
  })('app/api/admin/products/route.ts');
  const makeRequest = (value) => new Request('https://biochemsyn.com/api/admin/products', {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ products: [value], merge: true })
  });
  const published = withBilingualPublication(fixture(), 'published');
  assert.equal((await PUT(makeRequest(published))).status, 200);
  assert.equal(writes.length, 1);
  assert.equal(writes[0][1].merge, true);
  assert.equal(writes[0][0][0].details, published.details);
  assert.equal(writes[0][0][0].translations.en.details, published.translations.en.details);
  assert.equal((await PUT(makeRequest({ ...published, translations: { en: { published: true, nameEn: 'D-Xylose', category: '' } } }))).status, 400);
  assert.equal(writes.length, 1);
});

test('batch publication validates every selected record before sending a single bilingual update', async () => {
  const first = fixture();
  const second = fixture({ id: 'second' });
  const untouched = fixture({ id: 'untouched' });
  const requests = [];
  const oldFetch = globalThis.fetch;
  const batchButton = (tree) => findNode(tree, (node) => node.type === 'button' && Array.isArray(node.props.children) && node.props.children[0] === '批量发布中英文');
  try {
    globalThis.fetch = async (_url, options) => { requests.push(JSON.parse(options.body)); return Response.json({ ok: true }); };
    const valid = editorDriver(first, { mode: 'grid', products: [first, second, untouched], selectedIds: [first.id, second.id] });
    await batchButton(valid.render()).props.onClick();
    assert.equal(requests.length, 1);
    assert.equal(requests[0].merge, true);
    assert.equal(requests[0].products.length, 2);
    assert.ok(requests[0].products.every((product) => product.status === 'published' && product.translations.en.published));
    assert.equal(valid.states[0].find((product) => product.id === 'untouched').status, 'draft');
    const incomplete = fixture({ id: 'incomplete', translations: { en: { nameEn: 'D-Xylose', category: '' } } });
    const invalid = editorDriver(first, { mode: 'grid', products: [first, incomplete], selectedIds: [first.id, incomplete.id] });
    await batchButton(invalid.render()).props.onClick();
    assert.equal(requests.length, 1, 'one invalid selected product prevents any batch write');
    assert.equal(invalid.states[1], 'incomplete');
    assert.equal(invalid.states[2], 'detail');
    assert.ok(invalid.states[0].every((product) => product.status === 'draft'));
  } finally { globalThis.fetch = oldFetch; }
});
