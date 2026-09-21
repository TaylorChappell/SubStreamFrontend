import { test } from 'node:test';
import assert from 'node:assert/strict';
globalThis.document = { baseURI: 'https://taylorchappell.github.io/SubStreamFrontend/' };
globalThis.window = new EventTarget();
let counter = 0;
async function client() { return import('../lib/api.ts?test=' + counter++); }
const config = 'https://taylorchappell.github.io/SubStreamFrontend/config.json';
test('loads public config from the repository subpath and caches it', async () => {
 const original=globalThis.fetch, calls=[];
 globalThis.fetch=async(url,init)=>{calls.push({url,init});return Response.json(url===config?{apiUrl:'https://api.test/'}:{ok:true});};
 try {const {apiFetch}=await client();await apiFetch('/api/action',{method:'POST'},'session');await apiFetch('/api/action',{method:'DELETE'},'session');
 assert.equal(calls.filter(c=>c.url===config).length,1);
 for(const call of calls.slice(1)){assert.equal(call.url,'https://api.test/api/action');assert.equal(call.init.headers.has('content-type'),false);assert.equal(call.init.headers.get('authorization'),'Bearer session');}
 } finally {globalThis.fetch=original;}
});
test('JSON mutations include content type and surface server errors',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async(url,init)=>{if(url===config)return Response.json({apiUrl:'https://api.test'});assert.equal(init.headers.get('content-type'),'application/json');return Response.json({error:'Only the creator can edit this stream.'},{status:403});};
 try{const {apiFetch}=await client();await assert.rejects(()=>apiFetch('/api/action',{method:'PATCH',body:'{}'}),/Only the creator/);}finally{globalThis.fetch=original;}
});
test('missing backend config never falls back to demo data, and permits retry',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async()=>Response.json({apiUrl:''});
 try{const {apiFetch}=await client();await assert.rejects(()=>apiFetch('/api/explore'),/not been connected/);
 globalThis.fetch=async(url)=>Response.json(url===config?{apiUrl:'https://api.test'}:{streams:[]});
 assert.deepEqual(await apiFetch('/api/explore'),{streams:[]});
 }finally{globalThis.fetch=original;}
});
test('invalid or missing config fails explicitly',async()=>{
 const original=globalThis.fetch;
 try{globalThis.fetch=async()=>new Response('missing',{status:404});await assert.rejects(() => client().then(c=>c.apiBase()),/configuration/);
 globalThis.fetch=async()=>Response.json({apiUrl:'https://user:secret@api.test'});await assert.rejects(() => client().then(c=>c.apiBase()),/credentials/);
 }finally{globalThis.fetch=original;}
});
test('WebSockets use the backend origin, never the Pages hostname',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async()=>Response.json({apiUrl:'https://api.test'});
 try{const {wsUrl}=await client();assert.equal(await wsUrl('/ws/chat/channel?ticket=example'),'wss://api.test/ws/chat/channel?ticket=example');}finally{globalThis.fetch=original;}
});
test('unauthorized responses invalidate the wallet session',async()=>{
 const original=globalThis.fetch;let invalidated=false;const onExpired=()=>{invalidated=true;};window.addEventListener('substream:session-expired',onExpired);
 globalThis.fetch=async url=>url===config?Response.json({apiUrl:'https://api.test'}):Response.json({error:'Expired'},{status:401});
 try{const {apiFetch}=await client();await assert.rejects(()=>apiFetch('/api/creator/streams'),/Expired/);assert.equal(invalidated,true);}finally{globalThis.fetch=original;window.removeEventListener('substream:session-expired',onExpired);}
});
test('network failures are actionable and API paths cannot change the host',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async url=>{if(url===config)return Response.json({apiUrl:'https://api.test'});throw new Error('offline');};
 try{const {apiFetch}=await client();await assert.rejects(()=>apiFetch('/api/explore'),/Cannot reach/);await assert.rejects(()=>apiFetch('https://other.test'),/Invalid API path/);}finally{globalThis.fetch=original;}
});
