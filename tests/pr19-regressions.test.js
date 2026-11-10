import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
function load(path,mocks={}) {
 const source=fs.readFileSync(path,'utf8');
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 const module={exports:{}};
 new Function('require','module','exports',code)((id)=>id in mocks?mocks[id]:require(id),module,module.exports);
 return module.exports;
}
test('el módulo de entrada monta React',()=>{
 const source=ts.createSourceFile('main.tsx',fs.readFileSync('src/main.tsx','utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 let mounts=0;
 function visit(n){if(ts.isCallExpression(n)&&ts.isPropertyAccessExpression(n.expression)&&n.expression.name.text==='render') mounts++; ts.forEachChild(n,visit);}
 visit(source); assert.ok(mounts>0,'index.html carga un módulo sin montaje');
});
test('el cliente HTTP compartido exporta una instancia',()=>{
 const api=load('src/services/api.ts').default;
 assert.equal(typeof api?.get,'function');
 assert.equal(typeof api?.post,'function');
});
test('la guarda de rutas mantiene un componente exportado',()=>{
 assert.equal(typeof load('src/components/PrivateRoute.tsx').default,'function');
});
test('AuthProvider satisface el hook usado por AppLayout',()=>{
 globalThis.localStorage={getItem:()=>null};
 const React=require('react');
 const old=load('src/context/useAuth.ts');
 const current=load('src/context/AuthContext.tsx',{'../services/auth.service':{authService:{}}});
 function Consumer(){old.useAuth();return React.createElement('span',null,'ok');}
 const {renderToString}=require('react-dom/server');
 assert.doesNotThrow(()=>renderToString(React.createElement(current.AuthProvider,null,React.createElement(Consumer))));
});
test('una actividad del backend fijado puede volver a guardarse',()=>{
 const s=load('src/services/experiences.service.ts',{'@/services/api.ts':{}});
 const dto={id:'00000000-0000-0000-0000-000000000001',name:'Actividad',description:'Descripción',duration:30,active:true,createdAt:'2026-01-01T00:00:00Z',updatedAt:'2026-01-01T00:00:00Z'};
 assert.doesNotThrow(()=>s.toActivityRequest(s.toFormValues(dto)));
});
