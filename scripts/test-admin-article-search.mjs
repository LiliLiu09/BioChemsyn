import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { testLoader } from './ts-test-loader.mjs';

const { articleSearchText, articleSearchTerms, compareArticlePublishedAt, matchesArticleSearch } = testLoader()('lib/admin-article-search.ts');
const articles = [
  { id: 'i-001', slug: 'xylose', title: '木糖资料', category: '行业资讯', summary: '寡糖研究', content: '<p>用于糖<b>化学</b>研究。&#x5206;&#x5b50;量。</p>', author: 'KASONS', source: '公司', publishedAt: '2026-01-01', published: true,
    translations: { en: { title: 'D-Xylose research', content: '<p>A pentose reagent.</p>', published: false } } },
  { id: 'i-002', slug: 'fucose', title: '岩藻糖资料', category: '服务资讯', summary: '另一篇摘要', content: '<a href="/pentose">Fucose</a><script>hiddenScriptWord</script>', author: 'Admin', source: '公司', publishedAt: '2026-01-02', published: false }
];
const matches = (query) => articles.filter((article) => matchesArticleSearch(articleSearchText(article), articleSearchTerms(query)));

function driver(file, exportName, props, locale = 'zh') {
  const states = [];
  let cursor = 0;
  const mockReact = { ...React, useMemo: (fn) => fn(), useRef: (value) => ({ current: value }), useState: (initial) => {
    const index = cursor++;
    if (!(index in states)) states[index] = typeof initial === 'function' ? initial() : initial;
    return [states[index], (value) => { states[index] = typeof value === 'function' ? value(states[index]) : value; }];
  } };
  const Component = testLoader({
    react: mockReact,
    '@/components/LanguageProvider': { useLanguage: () => ({ locale, t: (zh, en) => locale === 'en' ? en : zh }) },
    '@/components/admin-language': { useAdminLanguage: () => ({ locale, t: (text) => text }), contentErrorMessage: async () => 'Save failed' }
  })(file)[exportName];
  return { states, render: () => { cursor = 0; return Component(props); } };
}

function find(tree, predicate) {
  if (!tree || typeof tree !== 'object') return undefined;
  if (Array.isArray(tree)) return tree.map((item) => find(item, predicate)).find(Boolean);
  return predicate(tree) ? tree : find(tree.props?.children, predicate);
}

test('search matches IDs, Chinese and English text, rich-text bodies and multiple keywords', () => {
  for (const query of ['I-001', '木糖', '糖化学', '分子', 'PENTOSE', 'd-xylose', '木糖 reagent', 'ＫＡＳＯＮＳ']) {
    assert.deepEqual(matches(query).map((article) => article.id), ['i-001'], query);
  }
  assert.equal(matches('  ').length, 2);
  assert.equal(matches('木糖 不存在').length, 0);
  assert.equal(matches('hiddenScriptWord').length, 0);
  assert.deepEqual(matches('pentose').map((article) => article.id), ['i-001'], 'link attributes are not article body text');
});

test('list puts real IDs before titles, filters without changing input, clears and preserves selection', () => {
  let selected = '';
  const original = JSON.stringify(articles);
  const list = driver('components/AdminArticleList.tsx', 'AdminArticleList', { articles, activeId: articles[0].id, heading: '资讯', untitledLabel: '未命名', onSelect: (id) => { selected = id; }, onAdd() {} });
  let tree = list.render();
  const search = find(tree, (node) => node.type === 'input' && node.props.type === 'search');
  search.props.onChange({ target: { value: 'fucose' } });
  tree = list.render();
  const html = renderToStaticMarkup(tree);
  assert.doesNotMatch(html, /ID: i-001/);
  assert.ok(html.indexOf('ID: i-002') < html.indexOf('岩藻糖资料'));
  const row = find(tree, (node) => node.type === 'button' && node.props.className?.startsWith('admin-list-item'));
  row.props.onClick();
  assert.equal(selected, 'i-002');
  find(tree, (node) => node.type === 'button' && node.props.children === '清除').props.onClick();
  assert.match(renderToStaticMarkup(list.render()), /ID: i-001/);
  assert.equal(JSON.stringify(articles), original);
  search.props.onChange({ target: { value: 'no matches' } });
  assert.match(renderToStaticMarkup(list.render()), /没有匹配的文章/);
});

test('English admin can find an article by a Chinese keyword and displays its ID and English title', () => {
  const list = driver('components/AdminArticleList.tsx', 'AdminArticleList', { articles, activeId: articles[0].id, heading: 'Resources', untitledLabel: 'Untitled', onSelect() {}, onAdd() {} }, 'en');
  find(list.render(), (node) => node.type === 'input' && node.props.type === 'search').props.onChange({ target: { value: '糖化学' } });
  const html = renderToStaticMarkup(list.render());
  assert.match(html, /ID: i-001/);
  assert.match(html, /D-Xylose research/);
  assert.doesNotMatch(html, /ID: i-002/);
});

test('date sorting uses actual publication dates, keeps ties stable and puts absent dates last in either direction', () => {
  const rows = [
    { id: 'newest-id-but-old-article', publishedAt: '2020-01-01' },
    { id: 'old-id-but-new-article', publishedAt: '2026-11-21' },
    { id: 'same-date', publishedAt: '2026-11-21' },
    { id: 'missing', publishedAt: '' },
    { id: 'invalid', publishedAt: 'invalid' }
  ];
  const original = JSON.stringify(rows);
  assert.deepEqual([...rows].sort((a, b) => compareArticlePublishedAt(a, b, 'newest')).map((item) => item.id),
    ['old-id-but-new-article', 'same-date', 'newest-id-but-old-article', 'missing', 'invalid']);
  assert.deepEqual([...rows].sort((a, b) => compareArticlePublishedAt(a, b, 'oldest')).map((item) => item.id),
    ['newest-id-but-old-article', 'old-id-but-new-article', 'same-date', 'missing', 'invalid']);
  assert.equal(JSON.stringify(rows), original);
});

test('list defaults to newest first and retains date order when searching or clearing the query', () => {
  const list = driver('components/AdminArticleList.tsx', 'AdminArticleList', { articles, activeId: articles[0].id, heading: '资讯', untitledLabel: '未命名', onSelect() {}, onAdd() {} });
  const original = JSON.stringify(articles);
  let html = renderToStaticMarkup(list.render());
  assert.ok(html.indexOf('ID: i-002') < html.indexOf('ID: i-001'));
  find(list.render(), (node) => node.type === 'select').props.onChange({ target: { value: 'oldest' } });
  const search = find(list.render(), (node) => node.type === 'input' && node.props.type === 'search');
  search.props.onChange({ target: { value: '资料' } });
  html = renderToStaticMarkup(list.render());
  assert.ok(html.indexOf('ID: i-001') < html.indexOf('ID: i-002'));
  find(list.render(), (node) => node.type === 'button' && node.props.children === '清除').props.onClick();
  html = renderToStaticMarkup(list.render());
  assert.ok(html.indexOf('ID: i-001') < html.indexOf('ID: i-002'));
  assert.equal(JSON.stringify(articles), original);
});

for (const section of ['info', 'news']) test(`${section} editor still saves every article after searching and selecting a result`, async () => {
  const name = section === 'info' ? 'InfoEditor' : 'NewsEditor';
  const editor = driver(`components/${name}.tsx`, name, section === 'info' ? { initialInfo: articles } : { initialNews: articles });
  const tree = editor.render();
  const sidebar = find(tree, (node) => node.props?.articles && node.props?.onSelect);
  const list = driver('components/AdminArticleList.tsx', 'AdminArticleList', sidebar.props);
  find(list.render(), (node) => node.type === 'input' && node.props.type === 'search').props.onChange({ target: { value: 'fucose' } });
  find(list.render(), (node) => node.type === 'button' && node.props.className?.startsWith('admin-list-item')).props.onClick();
  const updated = editor.render();
  const requestBodies = [];
  const oldFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (_url, options) => { requestBodies.push(JSON.parse(options.body)); return Response.json({ ok: true }); };
    await find(updated, (node) => node.type === 'button' && node.props.children === '保存全部').props.onClick();
    assert.equal(requestBodies.length, 1);
    assert.deepEqual(requestBodies[0][section].map((article) => article.id), ['i-001', 'i-002']);
    assert.equal(requestBodies[0][section][0].content, articles[0].content);
  } finally { globalThis.fetch = oldFetch; }
});
