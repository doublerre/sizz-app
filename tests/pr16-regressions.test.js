import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const React = require('react');
const router = require('react-router-dom');
function load(path, mocks = {}, globals = {}) {
  const code = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2023 }
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (/\.(css|png|svg)$/.test(name)) return { __esModule: true, default: 'asset' };
    if (name.startsWith('@/') || name === '../components/SideBarBox') return { __esModule: true, default: () => null, Sidebar: () => null };
    return require(name);
  }, ...globals }, { filename: path });
  return exports;
}
function nodes(node) {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (!React.isValidElement(node)) return [];
  return [node, ...nodes(node.props.children)];
}
function hooks(values = []) {
  let index = 0;
  return { useState: initial => [index < values.length ? values[index++] : (typeof initial === 'function' ? initial() : initial), () => {}], useEffect: () => {} };
}
function routes() {
  const tree = load('src/router/AppRouter.tsx').default();
  return router.createRoutesFromChildren(tree.props.children);
}
test('existing event list and authenticated account routes resolve', () => {
  for (const path of ['/eventos', '/cuenta/reservaciones', '/taquilla/dashboard']) {
    assert.notEqual(router.matchRoutes(routes(), path).at(-1).route.path, '*');
  }
});
test('event detail action resolves to a concrete route', () => {
  const event = { id: 'event-fixture', title: 'Evento', category: null, cost: 0, startDate: null };
  const page = load('src/pages/public/EventsPage.tsx', { react: hooks([[event], false, '', '', '']) }).default();
  const links = nodes(page).filter(n => n.props.className === 'event-link' && n.props.to);
  const broken = links.filter(n => router.matchRoutes(routes(), n.props.to).at(-1).route.path === '*');
  assert.deepEqual(broken.map(n => n.props.to), []);
});
for (const destination of ['/reservaciones', '/ayuda']) {
  test('home active links resolve: ' + destination, () => {
    const page = load('src/pages/public/HomePage.tsx', { react: hooks([false]) }).default();
    const links = nodes(page).filter(n => n.type === 'a' && n.props.href === destination);
    const broken = links.filter(n => router.matchRoutes(routes(), n.props.href).at(-1).route.path === '*');
    assert.deepEqual(broken.map(n => n.props.href), []);
  });
}
test('reservation charge requires a payment method', () => {
  const navigations = [];
  const page = load('src/pages/ReservationFee.tsx', {
    react: hooks([undefined, '0', true]),
    'react-router-dom': { useNavigate: () => path => navigations.push(path) }
  }).default();
  const button = nodes(page).find(n => n.props.className === 'charge-button');
  if (!button.props.disabled) button.props.onClick();
  assert.equal(navigations.length, 0, 'must not claim a completed sale without a method');
  assert.equal(button.props.disabled, true);
});
function apiHarness() {
  const data = new Map([['sizz_access_token', 'old-access'], ['sizz_refresh_token', 'old-refresh']]);
  const storage = { getItem: k => data.get(k) ?? null, setItem: (k,v) => data.set(k,v), removeItem: k => data.delete(k) };
  let rejectRefresh, resolveRefresh, onError;
  const pending = new Promise((resolve, reject) => { resolveRefresh = resolve; rejectRefresh = reject; });
  const retries = [];
  const api = config => { retries.push(config); return Promise.resolve({ data: 'ok' }); };
  api.interceptors = { request: { use() {} }, response: { use(_ok, error) { onError = error; } } };
  const axios = { create: () => api, post: () => pending };
  const window = { location: { href: '/register' } };
  load('src/services/api.ts', { axios }, { localStorage: storage, window });
  return { storage, window, rejectRefresh, resolveRefresh, retries,
    request: () => onError({ config: { url: '/catalog/tariffs', headers: {} }, response: { status: 401 } }) };
}
test('failed old refresh preserves replacement session', async () => {
  const h = apiHarness();
  const result = h.request().catch(error => error);
  h.storage.setItem('sizz_access_token', 'new-access');
  h.storage.setItem('sizz_refresh_token', 'new-refresh');
  h.rejectRefresh(new Error('old refresh rejected'));
  await result;
  assert.equal(h.storage.getItem('sizz_refresh_token'), 'new-refresh');
  assert.equal(h.storage.getItem('sizz_access_token'), 'new-access');
  assert.equal(h.window.location.href, '/register');
});
test('successful old refresh preserves replacement session', async () => {
  const h = apiHarness();
  const result = h.request().catch(error => error);
  h.storage.setItem('sizz_access_token', 'new-access');
  h.storage.setItem('sizz_refresh_token', 'new-refresh');
  h.resolveRefresh({ data: { accessToken: 'rotated-old-access', refreshToken: 'rotated-old-refresh' } });
  await result;
  assert.equal(h.storage.getItem('sizz_refresh_token'), 'new-refresh');
  assert.equal(h.retries.length, 0);
});
test('failed current refresh rejects every queued request and clears session', async () => {
  const h = apiHarness();
  const results = [h.request().catch(error => error), h.request().catch(error => error)];
  h.rejectRefresh(new Error('invalid refresh'));
  await Promise.all(results);
  assert.equal(h.storage.getItem('sizz_refresh_token'), null);
  assert.equal(h.window.location.href, '/login');
});
