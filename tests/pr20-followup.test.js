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
function routerSource() { return ts.createSourceFile('AppRouter.tsx',readFileSync(new URL('../src/router/AppRouter.tsx',import.meta.url),'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX); }
test('ruta pública de detalle se conserva en las declaraciones', () => {
 const paths=[];
 function visit(n) {
  if(ts.isJsxAttribute(n)&&n.name.getText()==='path'&&n.initializer&&ts.isStringLiteral(n.initializer))paths.push(n.initializer.text);
  ts.forEachChild(n,visit);
 }
 visit(routerSource());
 assert.ok(paths.includes('/eventos/:id'),'Se eliminó /eventos/:id que la base declaraba');
});
test('las ramas completas declaradas de becas no priorizan la guarda ADMIN', () => {
 const source=routerSource();
 let routesNode;
 function visit(n) {
  if(!routesNode&&ts.isJsxElement(n)&&n.openingElement.tagName.getText()==='Routes')routesNode=n;
  ts.forEachChild(n,visit);
 }
 visit(source);
 assert.ok(routesNode);
 // Examina solo los hijos JSX completos del primer Routes; el error sintáctico global se prueba por separado.
 const children=routesNode.children.filter(n=>ts.isJsxElement(n)||ts.isJsxSelfClosingElement(n)).map(n=>n.getText(source)).join('\n');
 const code=ts.transpileModule('module.exports = <Routes>'+children+'</Routes>',{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
 const names=new Set([...children.matchAll(/<([A-Z][A-Za-z0-9]*)/g)].map(m=>m[1]));
 const stubs=Object.fromEntries([...names].filter(n=>n!=='Route'&&n!=='Routes').map(n=>[n,()=>null]));
 const Router=require('react-router-dom');
 const module={exports:{}};
 new Function('require','module','exports','Route','Routes',...Object.keys(stubs),code)(require,module,module.exports,Router.Route,Router.Routes,...Object.values(stubs));
 const routes=createRoutesFromElements(module.exports.props.children);
 const matches=matchRoutes(routes,'/app/becas');
 assert.ok(matches);
 assert.ok(!matches.some(m=>m.route.element?.props?.requiredRole==='ADMIN'),'La primera rama equivalente exige ADMIN');
});

test('ExperiencesPage puede renderizarse sin identificadores ausentes', () => {
 const h=harness();
 h.mocks.react.useMemo=fn=>fn();
 const Page=load('src/pages/public/ExperiencesPage.tsx',h.mocks).default;
 assert.doesNotThrow(()=>Page());
});
for(const role of ['USER','GUIDE','ADMIN','SCHOLARSHIP_MANAGER']) {
 test('Mi cuenta tiene contenido para '+role,()=>{
  const h=harness({'@/context/useAuth':{useAuth:()=>({user:{role},logout(){}})}});
  const tree=load('src/components/Navbar.tsx',h.mocks).default();
  const walk=v=>!v||typeof v!=='object'?[]:[v,...React.Children.toArray(v.props?.children).flatMap(walk)];
  const account=walk(tree).find(v=>v.props?.children==='Mi cuenta');
  assert.ok(account);
  assert.equal(account.props.to,['ADMIN','SCHOLARSHIP_MANAGER'].includes(role)?'/app/becas':'/cuenta/becas');
 });
}
test('Navbar de visitante conserva becas, experiencias y login',()=>{
 const h=harness({'@/context/useAuth':{useAuth:()=>({user:null,logout(){}})}});
 const walk=v=>!v||typeof v!=='object'?[]:[v,...React.Children.toArray(v.props?.children).flatMap(walk)];
 const links=walk(load('src/components/Navbar.tsx',h.mocks).default()).map(v=>v.props?.to);
 for(const path of ['/becas','/experiencias','/login','/cuenta/reservaciones'])assert.ok(links.includes(path),path);
});
test('Cerrar sesión invoca el contexto existente',()=>{
 let calls=0;
 const h=harness({'@/context/useAuth':{useAuth:()=>({user:{role:'USER'},logout(){calls++;}})}});
 const walk=v=>!v||typeof v!=='object'?[]:[v,...React.Children.toArray(v.props?.children).flatMap(walk)];
 walk(load('src/components/Navbar.tsx',h.mocks).default()).find(v=>v.props?.children==='Cerrar sesión').props.onClick();
 assert.equal(calls,1);
});
for(const returnTo of [undefined,null,42,'//externo.invalid','https://externo.invalid','/cuenta/reservaciones?pagina=2']){
 test('Login valida returnTo '+String(returnTo),async()=>{
  let dest;
  const h=harness({
   'react-router-dom':{useNavigate:()=>to=>dest=to,useLocation:()=>({state:{returnTo}}),Link:()=>null},
   '../context/useAuth':{useAuth:()=>({login:async()=>({role:'USER'})})},
   '../services/auth.service':{authService:{}}
  });
  load('src/pages/Login.tsx',h.mocks).Login();
  await h.submit({email:'unit@example.invalid',password:'test-password'});
  assert.equal(dest,returnTo==='/cuenta/reservaciones?pagina=2'?returnTo:'/');
 });
}

test('AppRouter tiene JSX sintácticamente válido',()=>{
 const source=routerSource();
 assert.deepEqual(source.parseDiagnostics.map(d=>({line:source.getLineAndCharacterOfPosition(d.start).line+1,message:ts.flattenDiagnosticMessageText(d.messageText,' ')})),[]);
});
test('Login tolera state ausente y conserva alternativa ADMIN',async()=>{
 let dest;
 const h=harness({
  'react-router-dom':{useNavigate:()=>to=>dest=to,useLocation:()=>({}),Link:()=>null},
  '../context/useAuth':{useAuth:()=>({login:async()=>({role:'ADMIN'})})},
  '../services/auth.service':{authService:{}}
 });
 load('src/pages/Login.tsx',h.mocks).Login();
 await h.submit({email:'unit@example.invalid',password:'test-password'});
 assert.equal(dest,'/app');
});
