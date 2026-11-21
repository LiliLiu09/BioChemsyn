import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import { createRequire } from 'node:module';
import { testLoader } from './ts-test-loader.mjs';

const load = testLoader();
const { contentTimestamp, sameContent, stampContent } = load('lib/content-updates.ts');
const { sitemapEntries } = load('lib/sitemap-entries.ts');
const { pageMetadata, canonicalOrigin } = load('lib/seo.ts');
const { legacyDestination } = load('lib/legacy-links.ts');
const { mentionedProducts, relatedProducts, productSearchDescription } = load('lib/product-discovery.ts');
const { localizeProduct } = load('lib/content-locale.ts');

function product(overrides = {}) {
  return {
    id: 'test-product', status: 'published', deletedAt: '', sku: 'TEST', catalogNo: 'TEST',
    cas: '58-86-6', nameCn: 'D-木糖', nameEn: 'D-Xylose', synonyms: '', category: '单糖', brand: '',
    formula: 'C5H10O5', molecularWeight: '150.13', purity: '', stock: 0, packageSize: '', price: 0,
    leadTime: '', image: '', details: '', references: '', certificate: '', scaleNote: '', tags: [],
    updatedAt: '2025-01-02T03:04:05Z', translations: { en: { nameEn: 'D-Xylose', published: true } }, ...overrides
  };
}
function article(overrides = {}) {
  return {
    id: 'test-article', slug: 'test-resource', title: '资料', category: '', author: '', source: '',
    publishedAt: '2025-01-01', summary: '', content: '正文', coverImage: '', views: 0, published: true,
    updatedAt: '2025-02-01T00:00:00Z', translations: { en: { published: true, title: 'Resource', content: 'Research article.' } }, ...overrides
  };
}

test('sitemap dates are stored revisions, reciprocal language alternates exclude unpublished content', () => {
  const entries = sitemapEntries([
    product(), product({ id: 'draft', status: 'draft' }), product({ id: 'deleted', deletedAt: '2025-01-01' }),
    product({ id: 'untranslated', translations: { en: { published: false } } })
  ], [article(), article({ id: 'hidden', slug: 'hidden', published: false })], []);
  const urls = entries.map((entry) => entry.url);
  assert.equal(urls.length, new Set(urls).size);
  assert.ok(!urls.some((url) => /draft|deleted|hidden/.test(url)));
  assert.ok(urls.includes('https://biochemsyn.com/products/untranslated'));
  assert.ok(!urls.includes('https://biochemsyn.com/en/products/untranslated'));
  assert.ok(!urls.some((url) => /api\/locale|\?|\/admin|\/cart|\/search/.test(url)));
  const zh = entries.find((entry) => entry.url.endsWith('/products/test-product') && !entry.url.includes('/en/'));
  const en = entries.find((entry) => entry.url.endsWith('/en/products/test-product'));
  assert.deepEqual(en.alternates, zh.alternates);
  assert.equal(en.lastModified, '2025-01-02T03:04:05.000Z');
  assert.equal(entries.find((entry) => entry.url.endsWith('/news/test-resource')).lastModified, '2025-02-01T00:00:00.000Z');
  assert.equal(entries[0].lastModified, undefined, 'static page has no fabricated date');
  assert.equal(contentTimestamp('invalid'), undefined);
  assert.equal(contentTimestamp('2999-01-01'), undefined);
  assert.equal(contentTimestamp(''), undefined);
});

test('no-op saves retain timestamps; actual translation edits receive a new revision', () => {
  const previous = product();
  const reordered = Object.fromEntries(Object.entries(previous).reverse());
  assert.ok(sameContent(previous, reordered));
  const unchanged = stampContent([{ ...reordered, updatedAt: '2999-01-01' }], [previous])[0];
  assert.equal(unchanged.updatedAt, previous.updatedAt);
  const edited = stampContent([{ ...previous, translations: { en: { ...previous.translations.en, details: 'New English copy' } } }], [previous])[0];
  assert.notEqual(edited.updatedAt, previous.updatedAt);
  assert.ok(contentTimestamp(edited.updatedAt));
});

test('canonical host and metadata consistently identify each language', () => {
  assert.equal(canonicalOrigin('http://www.biochemsyn.com/path?q=1'), 'https://biochemsyn.com');
  assert.equal(canonicalOrigin('not a URL'), 'https://biochemsyn.com');
  const en = pageMetadata('/products/test-product', 'en', 'Name', 'Description');
  assert.equal(en.alternates.canonical, 'https://biochemsyn.com/en/products/test-product');
  assert.equal(en.alternates.languages['x-default'], 'https://biochemsyn.com/products/test-product');
  const zhOnly = pageMetadata('/products/untranslated', 'zh', 'Name', 'Description', false);
  assert.equal(zhOnly.alternates.languages.en, undefined);
});

test('CAS and molecular formula are shared between languages, retain annotations and stay blank when absent', () => {
  for (const values of [
    { cas: '58-86-6', formula: 'C5H10O5' },
    { cas: '58-86-6（目录记录）', formula: 'C5H10O5·H2O（水合物）' },
    { cas: '', formula: '' }
  ]) {
    const source = product(values);
    const en = localizeProduct(source, 'en');
    const zh = localizeProduct(source, 'zh');
    assert.equal(en.cas, zh.cas);
    assert.equal(en.formula, zh.formula);
    assert.equal(en.cas, values.cas);
    assert.equal(en.formula, values.formula);
  }
});

test('known legacy navigation preserves language; unknown article and product IDs stay unmapped', () => {
  assert.equal(legacyDestination('/contact-技术支持'), '/contact');
  assert.equal(legacyDestination(encodeURI('/en/info-采购说明')), '/en/info');
  assert.equal(legacyDestination('/products-如何订购'), '/products');
  assert.equal(legacyDestination('/en/Default.aspx'), '/en');
  assert.equal(legacyDestination('/Product.aspx'), '/products');
  assert.equal(legacyDestination('/Product.aspx', '?TypeId=13'), undefined);
  assert.equal(legacyDestination('/ProDetail.aspx', '?ProId=115'), undefined);
  assert.equal(legacyDestination('/%ZZ'), undefined);
});

test('middleware redirects known aliases on the canonical host and keeps unknown IDs out of redirects', () => {
  const { middleware } = load('middleware.ts');
  const { NextRequest } = createRequire(import.meta.url)('next/server');
  const request = new NextRequest('https://www.biochemsyn.com/en/contact-技术支持?q=help', { headers: { host: 'www.biochemsyn.com' } });
  const redirect = middleware(request);
  assert.equal(redirect.status, 301);
  assert.equal(redirect.headers.get('location'), 'https://biochemsyn.com/en/contact?q=help');
  const unknown = middleware(new NextRequest('https://biochemsyn.com/ProDetail.aspx?ProId=115'));
  assert.equal(unknown.headers.get('location'), null);
  const english = middleware(new NextRequest('https://biochemsyn.com/en/products/test-product'));
  assert.equal(english.headers.get('x-middleware-rewrite'), 'https://biochemsyn.com/products/test-product');
  assert.equal(english.headers.get('x-middleware-request-x-site-locale'), 'en');
});

test('legacy language endpoint redirects to a real page and rejects external return URLs', () => {
  const { GET } = load('app/api/locale/route.ts');
  const { NextRequest } = createRequire(import.meta.url)('next/server');
  const response = GET(new NextRequest('https://biochemsyn.com/api/locale?language=en&returnTo=%2Fproducts%2Ftest-product'));
  assert.equal(response.status, 301);
  assert.equal(response.headers.get('location'), '/en/products/test-product');
  const external = GET(new NextRequest('https://biochemsyn.com/api/locale?language=en&returnTo=%2F%2Fevil.example'));
  assert.equal(external.headers.get('location'), '/en');
});

test('related links exclude drafts, duplicate CAS, unrelated categories and unavailable translations', () => {
  const source = product();
  const target = product({ id: 'l-xylose', cas: '609-06-3', nameEn: 'L-Xylose' });
  const candidates = [source, target, product({ id: 'duplicate' }),
    product({ id: 'draft', status: 'draft', cas: '1-11-1' }),
    product({ id: 'hidden-en', cas: '2-22-2', translations: { en: { published: false } } }),
    product({ id: 'unrelated', cas: '3-33-3', category: 'UDP-糖' })];
  assert.deepEqual(relatedProducts(source, candidates, 'en').map((item) => item.id), ['l-xylose']);
  assert.deepEqual(mentionedProducts('Compare L-Xylose (CAS 609-06-3).', candidates, 'en').map((item) => item.id), ['l-xylose']);
  assert.equal(mentionedProducts('No chemical mentioned here.', candidates, 'en').length, 0);
  assert.equal(mentionedProducts('158-86-60', [source], 'en').length, 0, 'CAS substrings must not match');
  const description = productSearchDescription(product({ details: '<p>D-Xylose</p><p>A specific pentose entry for carbohydrate identity and analytical method comparisons.</p>' }), 'en', 'D-Xylose');
  assert.match(description, /specific pentose/);
  assert.match(description, /58-86-6/);
  assert.doesNotMatch(description, /<p>/);
});

test('CMS SQL uses no-op guarded upserts instead of resetting every article revision', async () => {
  const queries = [];
  const cms = testLoader({
    './db': {
      hasDatabaseUrl: () => true, dbQuery: async () => [],
      dbTransaction: async (callback) => callback(async (sql, values) => { queries.push({ sql, values }); return []; })
    },
    'next/cache': { unstable_cache: (fn) => fn, revalidateTag: () => {} }
  })('lib/cms.ts');
  await cms.saveProducts([product()]);
  await cms.saveNewsArticles([article()]);
  await cms.saveInfoArticles([article()]);
  const writes = queries.filter(({ sql }) => /insert into/.test(sql));
  assert.equal(writes.length, 3);
  for (const { sql } of writes) {
    assert.match(sql, /on conflict \(id\) do update/);
    assert.match(sql, /is distinct from/);
  }
  for (const { sql } of queries.filter(({ sql }) => /delete from/.test(sql))) assert.match(sql, /where not \(id = any\(\$1::text\[\]\)\)/);
});

test('JSON CMS saves preserve untouched rows and ignore client-supplied revision dates', async () => {
  const files = new Map([
    ['products.json', JSON.stringify([product(), product({ id: 'untouched', status: 'draft' })])],
    ['news.json', JSON.stringify([article(), article({ id: 'second', slug: 'second' })])]
  ]);
  const cms = testLoader({
    fs: { promises: {
      readFile: async (file) => files.get(path.basename(file)), mkdir: async () => {},
      writeFile: async (file, value) => { files.set(path.basename(file), value); }
    } },
    './db': { hasDatabaseUrl: () => false },
    './supabase': { getSupabaseConfig: () => ({ enabled: false, canWrite: false }) },
    'next/cache': { unstable_cache: (fn) => fn, revalidateTag: () => {} }
  })('lib/cms.ts');
  await cms.saveProducts([product({ updatedAt: '2999-01-01' })], { merge: true });
  let rows = JSON.parse(files.get('products.json'));
  assert.equal(rows.length, 2);
  assert.equal(rows[0].updatedAt, product().updatedAt);
  assert.equal(rows[1].status, 'draft');
  await cms.saveProducts([product({ details: 'Actual edited content.' })], { merge: true });
  rows = JSON.parse(files.get('products.json'));
  assert.notEqual(rows[0].updatedAt, product().updatedAt);
  assert.equal(rows[1].updatedAt, product().updatedAt);
  await cms.saveNewsArticles([article(), article({ id: 'second', slug: 'second', summary: 'Edited summary.' })]);
  rows = JSON.parse(files.get('news.json'));
  assert.equal(rows[0].updatedAt, article().updatedAt);
  assert.notEqual(rows[1].updatedAt, article().updatedAt);
});

test('Supabase REST skips unchanged records and writes only an edited translation', async () => {
  const writes = [];
  const cms = testLoader({
    './db': { hasDatabaseUrl: () => false },
    './supabase': {
      getSupabaseConfig: () => ({ enabled: true, canWrite: true, url: 'https://example.supabase.co' }),
      supabaseRest: async (table, options) => {
        if (options.method) { writes.push({ table, ...options }); return []; }
        if (options.query.includes('limit=0')) return [];
        return table === 'products'
          ? [{ id: 'rest-product', status: 'published', name_en: 'D-Xylose', translations: {}, updated_at: '2025-01-01' }]
          : [{ id: 'rest-article', slug: 'rest-article', title: 'Title', category: '', author: '', source: '', published_at: '2025-01-01', summary: '', content: '', published: true }];
      }
    },
    'next/cache': { unstable_cache: (fn) => fn, revalidateTag: () => {} }
  })('lib/cms.ts');
  const products = await cms.getProducts({ includeInactive: true });
  await cms.saveProducts(products);
  const articles = await cms.getInfoArticles();
  await cms.saveInfoArticles(articles);
  assert.equal(writes.length, 0);
  await cms.saveInfoArticles([{ ...articles[0], translations: { en: { title: 'Edited title', content: 'Translated text', published: true } } }]);
  assert.equal(writes.length, 1);
  assert.equal(writes[0].table, 'info_articles');
  assert.equal(writes[0].body.length, 1);
  assert.equal(writes[0].body[0].translations.en.title, 'Edited title');
  assert.equal(writes[0].body[0].updated_at, undefined);
});
