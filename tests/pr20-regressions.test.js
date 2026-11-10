import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import * as React from 'react';
import { createRoutesFromElements, matchRoutes } from 'react-router-dom';
const require = createRequire(import.meta.url);
function load(path, mocks = {}) {
 const code = ts.transpileModule(readFileSync(new URL('../' + path, import.meta.url), 'utf8'), {
  fileName: path, compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2022 }
 }).outputText;
 const module = { exports: {} };
 const resolve = name => {
  if (Object.hasOwn(mocks, name)) return mocks[name];
  if (/\.(css|png|svg)$/.test(name)) return 'test-asset';
  if (name.startsWith('@/') || name.startsWith('.')) return new Proxy({ __esModule: true, default: () => null }, { get: (o,k) => k in o ? o[k] : () => null });
  return require(name);
 };
 new Function('require','module','exports',code)(resolve,module,module.exports);
 return module.exports;
}
function harness(extra = {}) {
 let submit;
 const state = [];
 return {
  state, get submit() { return submit; },
  mocks: { react: { ...React, useState: v => [typeof v === 'function' ? v() : v, v => state.push(v)], useEffect: () => {} },
   'react-hook-form': { useForm: () => ({ register: () => ({}), handleSubmit: fn => { submit = fn; return fn; }, formState: { errors: {} } }) },
   ...extra }
 };
}
test('SCHOLARSHIP_MANAGER conserva acceso a todas las rutas de gestión de becas', () => {
 const Router = load('src/router/AppRouter.tsx').default;
 const routes = createRoutesFromElements(Router().props.children);
 for (const path of ['/app/becas','/app/becas/nueva','/app/becas/catalogos','/app/becas/formularios','/app/becas/test/editar','/app/becas/test/postulaciones']) {
  const matches = matchRoutes(routes, path);
  assert.ok(matches, path);
  for (const {route} of matches) {
   const p = route.element?.props;
   assert.notEqual(p?.requiredRole, 'ADMIN', path + ' queda bajo guarda ADMIN');
  }
 }
});
test('login conserva returnTo de la guarda privada', async () => {
 let destination;
 const h = harness({
  'react-router-dom': { useNavigate: () => to => destination = to, useLocation: () => ({state: {returnTo: '/cuenta/becas/solicitud/examenes?intento=1'}}), Link: () => null },
  '../context/useAuth': {useAuth: () => ({login: async () => ({role:'USER'})})},
  '../services/auth.service': {authService: {}}
 });
 load('src/pages/Login.tsx',h.mocks).Login();
 await h.submit({email:'unit@example.invalid',password:'test-password'});
 assert.equal(destination,'/cuenta/becas/solicitud/examenes?intento=1');
});
test('registro solicita OTP antes de registrar contra el contrato actual', async () => {
 const calls = [];
 const h = harness({
  'react-router-dom': {useNavigate: () => () => {}, Link: () => null},
  '../../services/auth.service': {authService: {
   register: async p => calls.push(['register',p]),
   sendVerificationCode: async email => calls.push(['sendVerificationCode',email]),
   resendCode: async p => calls.push(['sendVerificationCode',p.email])
  }}
 });
 load('src/pages/auth/Register.tsx',h.mocks).default();
 await h.submit({name:'Prueba',lastName:'Unitaria',email:'unit@example.invalid',password:'test-password',repeatPassword:'test-password',terms:true});
 assert.equal(calls[0]?.[0],'sendVerificationCode','RegisterRequest requiere code; todavía no debe registrarse');
});
test('DTO real de usuario no debe contabilizarse como pendiente de verificar', () => {
 const user = {id:'unit-id',email:'unit@example.invalid',firstName:'Prueba',lastName:'Unitaria',role:'USER',createdAt:'2026-11-01T00:00:00Z'};
 let index = 0;
 const h = harness({
  react: {...React,useEffect:()=>{},useState:v=>[index++ === 0 ? [user] : index === 2 ? false : v,()=>{}]},
  'react-router-dom': {useNavigate:()=>()=>{},useLocation:()=>({key:'test'})},
  '@/context/useAuth': {useAuth:()=>({user:{uid:'admin'}})}
 });
 const tree = load('src/pages/app/UserAdminPage.tsx',h.mocks).default();
 function nodes(v) { if (!v || typeof v !== 'object') return []; return [v,...React.Children.toArray(v.props?.children).flatMap(nodes)]; }
 const all = nodes(tree);
 const pending = all.find(v=>v.type==='article' && nodes(v).some(n=>n.props?.children==='Por verificar'));
 assert.ok(pending);
 const value = nodes(pending).find(n=>n.props?.className==='user-admin__card-value');
 assert.equal(value.props.children,'0');
});
test('publicar actividad produce un estado persistente según ActivityResponse real', async () => {
 const dto = {id:'unit-activity',name:'Actividad',description:'Descripción',duration:45,active:true,createdAt:'2026-11-01T00:00:00Z',updatedAt:'2026-11-01T00:00:00Z'};
 const writes = [];
 const api = {get:async()=>({data:dto}),put:async(url,p)=>{writes.push(p);return {data:{...dto,name:p.name,description:p.description,duration:p.duration}}}};
 const service = load('src/services/experiences.service.ts',{'@/services/api.ts':{__esModule:true,default:api}}).experiencesService;
 const published = await service.updateActivityStatus(dto.id,'publicada');
 assert.equal(writes.length,1);
 assert.equal(published.status,'publicada','la API descarta status y la conversión vuelve a borrador');
});
test('Navbar mantiene acceso a becas disponible en la navegación anterior', () => {
 const h = harness();
 const tree = load('src/components/Navbar.tsx',h.mocks).default();
 function links(v) {if (!v || typeof v !== 'object') return []; return [v.props?.to,...React.Children.toArray(v.props?.children).flatMap(links)];}
 assert.ok(links(tree).includes('/becas'));
});
