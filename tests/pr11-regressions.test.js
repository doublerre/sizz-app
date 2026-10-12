import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {jsx,jsxs} from 'react/jsx-runtime';
import {Route,Routes,createRoutesFromElements,matchRoutes} from 'react-router-dom';

function load(path, api = {}) {
 let cursor=0, effectCursor=0;
 const states=[], effects=[], timers=new Map();
 let timerId=0;
 const react={
  useState(initial) {const i=cursor++; if(!(i in states)) states[i]=initial; return [states[i],v=>{states[i]=typeof v==='function'?v(states[i]):v;}];},
  useEffect(fn,deps) {
   const i=effectCursor++, old=effects[i];
   if(!old || deps.some((v,j)=>!Object.is(v,old.deps[j]))) {
    old?.cleanup?.(); effects[i]={fn,deps,run:false};
   }
  }
 };
 const module={exports:{}};
 const stub=()=>null;
 const require=id=>{
  if(id==='react') return react;
  if(id==='react/jsx-runtime') return {jsx,jsxs};
  if(id==='react-router-dom') return {Route,Routes,Link:'link',NavLink:'navlink',Outlet:'outlet'};
  if(id==='@/services/eventsApi') return api;
  if(id==='lucide-react') return new Proxy({}, {get:()=>stub});
  return {__esModule:true,default:stub};
 };
 const source=readFileSync(new URL('../'+path,import.meta.url),'utf8');
 const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
 new Function('require','module','exports','setTimeout','clearTimeout',compiled)(require,module,module.exports,fn=>{timers.set(++timerId,fn);return timerId;},id=>timers.delete(id));
 return {
  exports:module.exports,
  render(){cursor=0;effectCursor=0;return module.exports.default();},
  flushEffects(){for(const e of effects) if(!e.run){e.run=true;e.cleanup=e.fn();}},
  flushTimers(){const pending=[...timers.values()];timers.clear();for(const fn of pending)fn();},
  unmount(){for(const e of effects)e.cleanup?.();}
 };
}
function all(n){if(Array.isArray(n))return n.flatMap(all);if(!n||typeof n!=='object')return [];return [n,...all(n.props?.children)];}
function text(n){if(Array.isArray(n))return n.map(text).join('');if(n&&typeof n==='object')return text(n.props?.children);return n==null?'':String(n);}
const event=(overrides={})=>({id:'e1',title:'Taller de robótica',description:null,category:'Tecnología',audience:null,venue:null,startDate:null,endDate:null,capacity:null,cost:0,status:'PUBLISHED',...overrides});
const settle=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
async function pageWith(data){const p=load('src/pages/public/EventsPage.tsx',{getEvents:()=>Promise.resolve(data)});p.render();p.flushEffects();await settle();return p;}

test('todos los destinos habilitados de Navbar tienen ruta',()=>{
 const p=load('src/components/Navbar.tsx');
 const routes=createRoutesFromElements(load('src/router/AppRouter.tsx').render().props.children);
 const missing=all(p.render()).filter(n=>n.type==='link'||n.type==='navlink').filter(n=>matchRoutes(routes,n.props.to)?.at(-1).route.path==='*').map(n=>n.props.to);
 assert.deepEqual(missing,[]);
});
test('el menú abre y cierra al elegir un destino',()=>{
 const p=load('src/components/Navbar.tsx');
 const nodes=()=>all(p.render());
 const toggle=()=>nodes().find(n=>n.props.className==='navbar-toggle');
 assert.equal(toggle().props['aria-expanded'],false);
 toggle().props.onClick();
 assert.equal(toggle().props['aria-expanded'],true);
 nodes().find(n=>n.type==='navlink'&&n.props.to==='/eventos').props.onClick();
 assert.equal(toggle().props['aria-expanded'],false);
});
test('el CTA del footer tiene acción o está deshabilitado',()=>{
 const p=load('src/components/Footer.tsx');
 const button=all(p.render()).find(n=>n.props.className==='footer-cta');
 assert.ok(button.props.disabled || typeof button.props.onClick==='function');
});
test('el costo conserva centavos, incluidos importes menores a un peso',async()=>{
 const values=[99.5,0.25,100];
 const p=await pageWith(values.map((cost,i)=>event({id:String(i),cost})));
 const actual=all(p.render()).filter(n=>n.props.className==='event-cost').map(text);
 const expected=values.map(v=>v.toLocaleString('es-MX',{style:'currency',currency:'MXN'}));
 assert.deepEqual(actual,expected);
});
test('vacío, gratis, fecha nula y categoría nula',async()=>{
 let p=await pageWith([]);
 assert.match(text(p.render()),/Por ahora no hay eventos publicados/);
 p=await pageWith([event({category:null})]);
 assert.match(text(p.render()),/Gratis/);
 assert.match(text(p.render()),/General/);
 assert.match(text(p.render()),/Fecha por definir/);
});
test('búsqueda por palabras normaliza acentos y espera el debounce',async()=>{
 const p=await pageWith([event(),event({id:'e2',title:'Noche de estrellas',category:'Astronomía'})]);
 const cards=()=>all(p.render()).filter(n=>n.props.className==='event-card');
 assert.equal(cards().length,2);
 all(p.render()).find(n=>n.props.className==='events-search').props.onChange({target:{value:' ROBOTICA tecnologia '}});
 p.render();p.flushEffects();
 assert.equal(cards().length,2);
 p.flushTimers();
 assert.equal(cards().length,1);
 assert.match(text(cards()[0]),/Taller de robótica/);
});
test('rechazo de API muestra error y desmontaje ignora respuesta tardía',async()=>{
 let p=load('src/pages/public/EventsPage.tsx',{getEvents:()=>Promise.reject(new Error('mock'))});
 assert.match(text(p.render()),/Cargando eventos/);
 p.flushEffects();await settle();
 assert.match(text(p.render()),/No pudimos cargar los eventos/);
 let resolve;
 p=load('src/pages/public/EventsPage.tsx',{getEvents:()=>new Promise(r=>{resolve=r;})});
 p.render();p.flushEffects();p.unmount();
 resolve([event()]);await settle();
 assert.match(text(p.render()),/Cargando eventos/);
});
test('getEvents solicita endpoint relativo y propaga errores HTTP y JSON',async()=>{
 const {getEvents}=load('src/services/eventsApi.ts').exports;
 const original=globalThis.fetch;
 const data=[event()];
 try {
  globalThis.fetch=async url=>{assert.equal(url,'/api/events');return {ok:true,json:async()=>data};};
  assert.deepEqual(await getEvents(),data);
  globalThis.fetch=async()=>({ok:false,json:async()=>{throw new Error('no debe leer');}});
  await assert.rejects(getEvents(),/No se pudieron cargar los eventos/);
  globalThis.fetch=async()=>({ok:true,json:async()=>{throw new SyntaxError('json inválido');}});
  await assert.rejects(getEvents(),SyntaxError);
 } finally {globalThis.fetch=original;}
});
