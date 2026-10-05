import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { jsx, jsxs } from 'react/jsx-runtime';
import postcss from 'postcss';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createRoutesFromElements, matchRoutes, Route, Routes } from 'react-router-dom';

function mount(path, props = {}) {
  let cursor = 0;
  const states = [];
  const navigations = [];
  let formOptions;
  const react = {
    useState(initial) {
      const i = cursor++;
      if (!(i in states)) states[i] = typeof initial === 'function' ? initial() : initial;
      return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }];
    },
    useMemo: fn => fn(),
    useEffect: () => {},
    useRef: () => ({ current: null }),
  };
  const source = readFileSync(new URL('../' + path, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
    target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText;
  const module = { exports: {} };
  const stub = () => null;
  function require(id) {
    if (id === 'zod') return z;
    if (id === '@hookform/resolvers/zod') return { zodResolver };
    if (id === 'react-hook-form') return { useForm(options) { formOptions = options; return { register: () => ({}), handleSubmit: fn => fn, formState: { errors: {} } }; } };
    if (id === 'react') return react;
    if (id === 'react/jsx-runtime') return { jsx, jsxs };
    if (id === 'react-router-dom') return { Route, Routes, Link: 'link', NavLink: 'navlink', useNavigate: () => target => navigations.push(target) };
    if (id === 'lucide-react') return new Proxy({}, { get: () => stub });
    if (id.endsWith('.css')) return {};
    return { __esModule: true, default: stub, Sidebar: stub };
  }
  new Function('require', 'module', 'exports', code)(require, module, module.exports);
  return { render() { cursor = 0; return module.exports.default(props); }, navigations, get formOptions() { return formOptions; } };
}
function all(node) {
  if (Array.isArray(node)) return node.flatMap(all);
  if (!node || typeof node !== 'object') return [];
  return [node, ...all(node.props?.children)];
}
function text(node) {
  if (Array.isArray(node)) return node.map(text).join('');
  if (node && typeof node === 'object') return text(node.props?.children);
  return node == null ? '' : String(node);
}

test('cada enlace de detalle tiene una ruta concreta', () => {
  const page = mount('src/pages/account/MyReservationsPage.tsx');
  const router = mount('src/router/AppRouter.tsx');
  const routes = createRoutesFromElements(router.render().props.children);
  const links = all(page.render()).filter(n => n.props.className === 'reservation-detail-link');
  assert.equal(links.length, 3);
  for (const link of links) {
    const matches = matchRoutes(routes, link.props.to);
    assert.ok(matches && matches.at(-1).route.path !== '*', link.props.to + ' cae en NotFound');
  }
});

test('el cobro en efectivo insuficiente no completa la venta', () => {
  const page = mount('src/pages/Checkout.tsx', { totalToCharge: '$100.00' });
  let nodes = all(page.render());
  nodes.find(n => n.props.className?.trim() === 'payment-option').props.onClick();
  nodes = all(page.render());
  nodes.find(n => n.type === 'input' && n.props.type === 'number').props.onChange({ target: { value: '10' } });
  nodes = all(page.render());
  const charge = nodes.find(n => n.type === 'button' && text(n).includes('Cobrar e imprimir'));
  if (!charge.props.disabled) charge.props.onClick();
  assert.deepEqual(page.navigations, [], 'no debe confirmar una venta con saldo pendiente');
});

test('un conteo mal formado conserva el texto para corregirlo', () => {
  const page = mount('src/pages/CashClosing.tsx');
  let input = all(page.render()).find(n => n.type === 'input' && n.props.inputMode === 'decimal');
  input.props.onChange({ target: { value: '4.120.50' } });
  input = all(page.render()).find(n => n.type === 'input' && n.props.inputMode === 'decimal');
  input.props.onBlur();
  input = all(page.render()).find(n => n.type === 'input' && n.props.inputMode === 'decimal');
  assert.equal(input.props['aria-invalid'], true);
  assert.equal(input.props.value, '4.120.50', 'un importe inválido no debe convertirse silenciosamente a cero');
});

test('el campo visitantes permanece visible en escritorio', () => {
  const page = mount('src/pages/account/MyReservationsPage.tsx');
  const row = all(page.render()).find(n => n.props.className === 'reservation-row');
  const divs = row.props.children.filter(n => n.type === 'div');
  assert.equal(text(divs[2]).startsWith('VISITANTES'), true);
  const css = postcss.parse(readFileSync(new URL('../src/pages/account/MyReservationsPage.css', import.meta.url), 'utf8'));
  let display;
  css.walkRules('.reservation-field:nth-of-type(3)', rule => {
    let active = true;
    for (let parent = rule.parent; parent; parent = parent.parent) {
      if (parent.type === 'atrule' && parent.name === 'media') {
        const max = /max-width:\s*(\d+)px/.exec(parent.params);
        if (max && 1280 > Number(max[1])) active = false;
      }
    }
    if (active) rule.walkDecls('display', decl => { display = decl.value; });
  });
  assert.notEqual(display, 'none', 'VISITANTES está oculto a 1280px');
});

test('los días del calendario móvil ocupan una sola celda', () => {
  const calendar = mount('src/components/ReservationCalendar.tsx', {
    value: '2026-09-18', markedDates: new Set(), variant: 'reservations', onChange: () => {},
  });
  all(calendar.render()).find(n => n.props.className === 'calendar-trigger').props.onClick();
  const days = all(calendar.render()).filter(n => n.props.className?.split(' ').includes('calendar-day'));
  assert.equal(days.length, 30);
  const css = postcss.parse(readFileSync(new URL('../src/pages/account/MyReservationsPage.css', import.meta.url), 'utf8'));
  let column;
  css.walkRules('.reservation-filters button', rule => {
    rule.walkDecls('grid-column', decl => { column = decl.value; });
  });
  assert.notEqual(column, '1 / -1', 'el selector también alcanza cada botón calendar-day dentro de los filtros');
});

test('conteos válidos conservan su importe tras dos blur', () => {
 for (const value of ['0', '4120', '4120.50', '4,120.50']) {
  const page = mount('src/pages/CashClosing.tsx');
  const input = () => all(page.render()).find(n => n.type === 'input' && n.props.inputMode === 'decimal');
  input().props.onChange({target:{value}});
  input().props.onBlur();
  const formatted = input().props.value;
  input().props.onBlur();
  assert.equal(input().props.value, formatted);
  assert.equal(input().props['aria-invalid'], false);
 }
});
test('conteo vacío señala error sin reemplazar el texto', () => {
 const page = mount('src/pages/CashClosing.tsx');
 const input = () => all(page.render()).find(n => n.type === 'input' && n.props.inputMode === 'decimal');
 input().props.onChange({target:{value:''}});
 input().props.onBlur();
 assert.equal(input().props.value, '');
 assert.equal(input().props['aria-invalid'], true);
});
test('cobro respeta selección, importe suficiente y métodos alternativos', () => {
 for (const [method, value, expected] of [['Efectivo','',false],['Efectivo','99.99',false],['Efectivo','100',true],['Efectivo','120.50',true],['Tarjeta','',true],['Pago mixto','',true]]) {
  const page=mount('src/pages/Checkout.tsx',{totalToCharge:'$100.00'});
  let nodes=all(page.render());
  const charge=()=>all(page.render()).find(n=>n.type==='button' && text(n)==='Cobrar e imprimir');
  assert.equal(charge().props.disabled,true);
  nodes.find(n=>n.type==='button' && n.props.className?.trim()==='payment-option' && text(n).startsWith(method)).props.onClick();
  all(page.render()).find(n=>n.type==='input' && n.props.type==='number').props.onChange({target:{value}});
  assert.equal(charge().props.disabled,!expected);
  charge().props.onClick();
  assert.deepEqual(page.navigations,expected?['/taquilla/saleComplete']:[]);
 }
});

test('los seis enlaces de evento resuelven a un detalle', () => {
 const page=mount('src/pages/public/EventsPage.tsx');
 const routes=createRoutesFromElements(mount('src/router/AppRouter.tsx').render().props.children);
 const links=all(page.render()).filter(n=>n.props.className==='event-link');
 assert.equal(links.length,6);
 const missing=links.filter(n=>matchRoutes(routes,n.props.to)?.at(-1).route.path==='*').map(n=>n.props.to);
 assert.deepEqual(missing,[], 'destinos de eventos en 404');
});
test('los destinos públicos anunciados por Inicio existen', () => {
 const page=mount('src/pages/public/HomePage.tsx');
 const routes=createRoutesFromElements(mount('src/router/AppRouter.tsx').render().props.children);
 const links=all(page.render()).filter(n=>n.type==='a' && n.props.href?.startsWith('/'));
 const missing=[...new Set(links.filter(n=>matchRoutes(routes,n.props.href)?.at(-1).route.path==='*').map(n=>n.props.href))];
 assert.deepEqual(missing,[], 'destinos públicos en 404');
});
test('reservación no completa un cobro sin método de pago', () => {
 const page=mount('src/pages/ReservationFee.tsx');
 const button=all(page.render()).find(n=>n.props.className==='charge-button');
 if(!button.props.disabled) button.props.onClick();
 assert.deepEqual(page.navigations,[], 'se confirmó sin elegir un método');
});
test('confirmar contraseña exige igualdad', async () => {
 const page=mount('src/pages/auth/Register.tsx'); page.render();
 const validate=page.formOptions.resolver;
 const data={name:'Maria',lastName:'Perez',email:'maria@example.test',password:'abcdefgh',repeatPassword:'ijklmnop',terms:true};
 const result=await validate(data,{}, {criteriaMode:'firstError',shouldUseNativeValidation:false});
 assert.ok(result.errors.repeatPassword,'dos contraseñas distintas fueron aceptadas');
});
test('registro conserva validación de correo y términos', async () => {
 const page=mount('src/pages/auth/Register.tsx'); page.render();
 const result=await page.formOptions.resolver({name:'Maria',lastName:'Perez',email:'incorrecto',password:'abcdefgh',repeatPassword:'abcdefgh',terms:false},{},{criteriaMode:'firstError',shouldUseNativeValidation:false});
 assert.ok(result.errors.email); assert.ok(result.errors.terms);
});
test('el botón de registro no navega por un Link antes de validar', () => {
 const page=mount('src/pages/auth/Register.tsx');
 const links=all(page.render()).filter(n=>n.type==='link' && n.props.to==='/verify-account');
 assert.equal(links.filter(n=>all(n).some(child=>child.type==='button' && child.props.type==='submit')).length,0,'Link envuelve el submit y navega independientemente de handleSubmit');
});
test('el menú administrativo no queda fuera de pantalla sin forma de abrirlo', () => {
 const layout=all(mount('src/layouts/AppLayout.tsx').render());
 const nav=layout.find(n=>n.type==='nav' && n.props.className==='sidebar');
 assert.ok(nav);
 const toggle=layout.some(n=>n.type==='button' && typeof n.props.onClick==='function');
 let transform;
 for(const path of ['src/layouts/AppLayout.css','src/components/SideBarBox.css']) {
  const css=postcss.parse(readFileSync(new URL('../'+path,import.meta.url),'utf8'));
  css.walkRules('.sidebar',rule=>{
   let active=true;
   for(let parent=rule.parent;parent;parent=parent.parent) {
    if(parent.type==='atrule' && parent.name==='media') {
     const max=/max-width:\s*(\d+)px/.exec(parent.params);
     if(max && 768>Number(max[1])) active=false;
    }
   }
   if(active) rule.walkDecls('transform',decl=>{transform=decl.value;});
  });
 }
 assert.ok(toggle || transform!=='translateX(-100%)','a 768px la sidebar administrativa está oculta sin toggle');
});
test('historial filtra fecha y restaura todas las ventas', () => {
 const sales=[
 {folio:'A',time:'10:00',tickets:1,payment:'Efectivo',total:10,status:'Activo',date:'2026-09-18'},
 {folio:'B',time:'11:00',tickets:2,payment:'Tarjeta',total:20,status:'Activo',date:'2026-09-19'}];
 const page=mount('src/pages/SalesHistory.tsx',{sales});
 const calendar=()=>all(page.render()).find(n=>n.props.variant==='sales');
 calendar().props.onChange('2026-09-18');
 assert.equal(all(page.render()).filter(n=>n.props.className==='sale-folio').length,1);
 calendar().props.onChange(null);
 assert.equal(all(page.render()).filter(n=>n.props.className==='sale-folio').length,2);
});
