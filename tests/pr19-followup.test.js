import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as React from 'react';
import * as router from 'react-router-dom';
import * as jsx from 'react/jsx-runtime';

function load(path, imports, globals = {}) {
  const source = readFileSync(new URL('../' + path, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022
  }}).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => {
    if (name in imports) return { __esModule: true, ...imports[name] };
    if (name === 'react/jsx-runtime') return jsx;
    if (name.endsWith('.css')) return {};
    throw new Error('Unexpected import: ' + name);
  }, ...globals }, { filename: path });
  return exports;
}
test('reenviar OTP conserva el endpoint del backend fijado', async () => {
  let url;
  const api = { post: async (path) => { url = path; return {data:{}}; } };
  const {authService} = load('src/services/auth.service.ts', {'./api': {default: api}});
  await authService.resendCode({email:'otp@example.test',firstName:'Test'});
  assert.equal(url, '/auth/send-verification-code');
});
test('lista de usuarios acepta el array y consulta/rol usan los mappings actuales', async () => {
  const rows = [{id:'user-id',firstName:'Test',lastName:'User',email:'user@example.test',role:'USER'}];
  const calls=[];
  const api={get:async url=>{calls.push(url);return {data:rows};},put:async(url,data)=>{calls.push([url,data.role]);return {data:rows[0]};}};
  const {adminUsersService:s}=load('src/services/admin.users.service.ts',{'./api':{default:api}});
  assert.equal(await s.listUsers(),rows);
  await s.getUserById('user-id'); await s.updateRole('user-id','GUIDE');
  assert.equal(calls[1],'/users/user-id');
  assert.equal(calls[2][0],'/admin/users/user-id/role');
});
test('DTO de actividad sin etiqueta se puede serializar', () => {
  const s=load('src/services/experiences.service.ts',{'@/services/api.ts':{default:{}}});
  const dto={id:'activity-id',name:'Actividad',description:'Descripción',duration:30,active:true};
  const request=s.toActivityRequest(s.toFormValues(dto));
  assert.equal(request.tag,null);
  assert.equal(request.name,dto.name);
});
function routes() {
  const source=readFileSync(new URL('../src/router/AppRouter.tsx',import.meta.url),'utf8');
  const ast=ts.createSourceFile('router.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const imports={'react-router-dom':router};
  for(const node of ast.statements) if(ts.isImportDeclaration(node)) {
    const name=node.moduleSpecifier.text;
    if(name!=='react-router-dom') imports[name]=new Proxy({default:function Page(){}},{get:(obj,key)=>key in obj?obj[key]:function Stub(){}});
  }
  const {default:AppRouter}=load('src/router/AppRouter.tsx',imports);
  return router.createRoutesFromElements(AppRouter().props.children);
}
function permits(matches,role) {
  return matches.every(({route})=>{
    const p=route.element?.props || {};
    return (!p.requiredRole || p.requiredRole===role) && (!p.allowedRoles || p.allowedRoles.includes(role));
  });
}
test('gestor de becas conserva acceso a becas y queda fuera de usuarios/experiencias', () => {
  const tree=routes();
  assert.equal(permits(router.matchRoutes(tree,'/app/becas'),'SCHOLARSHIP_MANAGER'),true);
  for(const path of ['/app/users','/app/experiences/new']) {
    const matches=router.matchRoutes(tree,path);
    assert.ok(matches);
    assert.equal(permits(matches,'ADMIN'),true);
    assert.equal(permits(matches,'SCHOLARSHIP_MANAGER'),false,path);
  }
});
test('las rutas restauradas resuelven páginas y corte conserva guarda ADMIN', () => {
  const tree=routes();
  for(const path of ['/becas','/cuenta/becas','/cuenta/becas/horas','/app/becas','/taquilla/corte']) {
    const m=router.matchRoutes(tree,path);
    assert.ok(m && m.at(-1).route.path!=='*',path);
  }
  assert.equal(permits(router.matchRoutes(tree,'/taquilla/corte'),'SCHOLARSHIP_MANAGER'),false);
});
test('edición sin soporte backend no permite cambiar datos personales que descartará', () => {
  const hooks={...React,useState:value=>[typeof value==='function'?value():value,()=>{}],useEffect:()=>{}};
  const imports={'react':hooks,'react-router-dom':{useNavigate:()=>()=>{},useParams:()=>({id:'user-id'})},
    '@/services/admin.users.service.ts':{adminUsersService:{}},
    'lucide-react':new Proxy({},{get:()=>function Icon(){}})};
  const {default:Form}=load('src/forms/users/UserForm.tsx',imports);
  const tree=Form({mode:'edit',initialValues:{firstName:'Test',lastName:'User',email:'user@example.test',role:'USER'}});
  const inputs=[];
  function visit(n){if(!n || typeof n!=='object')return;if(n.type==='input')inputs.push(n);React.Children.forEach(n.props?.children,visit);}
  visit(tree);
  for(const id of ['usr-firstname','usr-lastname','usr-email']) {
    const input=inputs.find(n=>n.props.id===id);
    assert.ok(!input || input.props.disabled || input.props.readOnly,id);
  }
});
