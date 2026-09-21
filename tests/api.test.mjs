import { test } from 'node:test';
import assert from 'node:assert/strict';
let counter=0;
async function client(){return import('../lib/api.ts?test='+counter++);}
test('empty POST and DELETE do not send a JSON Content-Type',async()=>{
 const original=globalThis.fetch;const calls=[];
 globalThis.fetch=async(url,init)=>{calls.push({url,init});return Response.json(url==='/api/config'?{apiUrl:'https://api.test'}:{ok:true});};
 try{const {apiFetch}=await client();await apiFetch('/action',{method:'POST'},'session');await apiFetch('/action',{method:'DELETE'},'session');for(const call of calls.slice(1)){assert.equal(call.init.headers.has('content-type'),false);assert.equal(call.init.headers.get('authorization'),'Bearer session');}}finally{globalThis.fetch=original;}
});
test('JSON mutations include content type and surface server errors',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async(url,init)=>{if(url==='/api/config')return Response.json({apiUrl:'https://api.test'});assert.equal(init.headers.get('content-type'),'application/json');return Response.json({error:'Only the creator can edit this stream.'},{status:403});};
 try{const {apiFetch}=await client();await assert.rejects(()=>apiFetch('/action',{method:'PATCH',body:'{}'}),/Only the creator/);}finally{globalThis.fetch=original;}
});
test('missing backend config never falls back to demo data',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async()=>Response.json({apiUrl:''});
 try{const {apiFetch}=await client();await assert.rejects(()=>apiFetch('/api/explore'),/not been connected/);}finally{globalThis.fetch=original;}
});
test('runtime config exposes only the public API origin',async()=>{
 const prior=process.env.API_BASE_URL;process.env.API_BASE_URL='https://api.test';
 try{const {GET}=await import('../app/api/config/route.ts');const response=await GET();assert.deepEqual(await response.json(),{apiUrl:'https://api.test'});assert.equal(response.headers.get('cache-control'),'no-store');}finally{if(prior===undefined)delete process.env.API_BASE_URL;else process.env.API_BASE_URL=prior;}
});
