// Run against a production build: node --experimental-strip-types scripts/check-seo.mjs http://localhost:3100
import assert from 'node:assert/strict';
import { coreCategories, priorityProducts } from '../lib/catalog-seo.ts';

const base = process.argv[2] || 'http://localhost:3100';
const origin = (process.env.NEXT_PUBLIC_SITE_URL || 'https://biochemsyn.com').replace(/\/$/, '');
async function read(path, options) {
  const response = await fetch(`${base}${path}`, options);
  return { response, html: await response.text() };
}
function metadata(html, path) {
  assert.match(html, /<html lang="en"/);
  assert.ok(html.includes(`rel="canonical" href="${origin}${path}"`), `canonical: ${path}`);
  assert.ok(html.includes('hrefLang="en"') || html.includes('hreflang="en"'));
  assert.ok(html.includes('hrefLang="zh-CN"') || html.includes('hreflang="zh-CN"'));
  assert.doesNotMatch(html, /<title>Product details<\/title>/);
}
function schemas(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
}

assert.equal(Object.keys(priorityProducts).length, 20);
assert.equal(coreCategories.length, 5);
const { response: robotResponse, html: robots } = await read('/robots.txt');
assert.equal(robotResponse.status, 200);
assert.match(robots, /Disallow: \/admin/);
assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`));
const { response: sitemapResponse, html: sitemap } = await read('/sitemap.xml');
assert.equal(sitemapResponse.status, 200);
assert.match(sitemapResponse.headers.get('content-type'), /xml/);
assert.doesNotMatch(sitemap, /<loc>[^<]*(?:\/admin|\/cart|\/search|\?)/);
const results = [];
for (const category of coreCategories) {
  const path = `/en/products/category/${category.slug}`;
  const { response, html } = await read(path);
  assert.equal(response.status, 200, path);
  metadata(html, path);
  assert.ok(html.includes(category.overview), path);
  const collection = schemas(html).find((value) => value['@type'] === 'CollectionPage');
  assert.ok(collection?.mainEntity.numberOfItems > 0, `nonempty category: ${path}`);
  assert.ok(sitemap.includes(`<loc>${origin}${path}</loc>`));
  results.push({ path, products: collection.mainEntity.numberOfItems });
}
const ids = Object.keys(priorityProducts);
for (let offset = 0; offset < ids.length; offset += 4) {
  await Promise.all(ids.slice(offset, offset + 4).map(async (id) => {
    const path = `/en/products/${id}`;
    const { response, html } = await read(path);
    assert.equal(response.status, 200, path);
    metadata(html, path);
    assert.ok(html.includes(priorityProducts[id].summary), path);
    assert.ok(html.includes('mailto:inquiry@biochemsyn.com'));
    const pageSchemas = schemas(html);
    assert.ok(!pageSchemas.some((value) => value['@type'] === 'Product'), `quote-only product has no Product snippet: ${path}`);
    const crumbs = pageSchemas.find((value) => value['@type'] === 'BreadcrumbList')?.itemListElement;
    assert.deepEqual(crumbs?.map(({ item }) => item), [
      `${origin}/en`, `${origin}/en/products`, `${origin}/en/products/category/${priorityProducts[id].category}`, `${origin}${path}`
    ], `product breadcrumbs: ${path}`);
    assert.ok(crumbs.every((crumb, index) => crumb['@type'] === 'ListItem' && crumb.position === index + 1 && crumb.name.trim()), `breadcrumb items: ${path}`);
    assert.ok(html.includes(`/en/products/category/${priorityProducts[id].category}`));
    assert.ok(sitemap.includes(`<loc>${origin}${path}</loc>`));
    results.push({ path, name: crumbs.at(-1).name });
  }));
}
const home = await read('/en');
assert.equal(home.response.status, 200);
assert.ok(home.html.includes('href="/en"'));
for (const category of coreCategories) assert.ok(home.html.includes(`/en/products/category/${category.slug}`));
const chineseHome = await read('/', { headers: { Cookie: 'kasons-language=en' }, redirect: 'manual' });
assert.equal(chineseHome.response.status, 200, 'Explicit root URL must not change language based on a cookie');
const search = await read('/en/products?q=glucose');
assert.match(search.html, /name="robots" content="noindex, follow"/);
const legacy = await read(`/en/products?category=${encodeURIComponent('UDP-糖')}`);
assert.ok(legacy.html.includes(`rel="canonical" href="${origin}/en/products/category/udp-sugars"`));
const missing = await read('/en/products/seo-nonexistent-product');
assert.equal(missing.response.status, 404);
const untranslatedPath = '/en/products/p-1786797241826';
const untranslated = await read(untranslatedPath);
assert.match(untranslated.html, /name="robots" content="noindex, follow"/);
assert.ok(!sitemap.includes(`<loc>${origin}${untranslatedPath}</loc>`));
console.log(JSON.stringify({ passed: true, productPages: ids.length, categoryPages: coreCategories.length, sitemapUrls: (sitemap.match(/<loc>/g) || []).length, results }, null, 2));
