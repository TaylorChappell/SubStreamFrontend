import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
const html=readFileSync('dist/index.html','utf8');
const base=process.env.PAGES_BASE_PATH||'/SubStreamFrontend/';
test('build is deployable static HTML, not a Worker bundle',()=>{
 assert.ok(html.includes('<div id="root">'));assert.ok(html.includes('<base href="'+base+'"/>'));
 assert.ok(!html.includes('/src/main.tsx'));assert.ok(existsSync('dist/.nojekyll'));
 assert.equal(readFileSync('dist/404.html','utf8'),html);
});
test('every generated script, stylesheet, and icon resolves under the correct base',()=>{
 const matches=[...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m=>m[1]).filter(p=>p!==base);
 assert.ok(matches.some(p=>p.endsWith('.js')));
 for(const asset of matches){assert.ok(asset.startsWith(base),asset);assert.ok(existsSync(resolve('dist',asset.slice(base.length))),asset);}
 assert.ok(existsSync('dist/sub-stream-mark.png'));
});
test('runtime config contains only the public API URL',()=>{
 const config=JSON.parse(readFileSync('dist/config.json','utf8'));assert.deepEqual(Object.keys(config),['apiUrl']);
 const requested=process.env.API_BASE_URL;if(requested)assert.equal(config.apiUrl,new URL(requested).origin);
});
test('browser bundle does not call a frontend server route',()=>{
 const js=readdirSync('dist/assets').filter(f=>f.endsWith('.js')).map(f=>readFileSync('dist/assets/'+f,'utf8')).join('\n');
 assert.ok(!js.includes('"/api/config"'));assert.ok(!js.includes('cloudflare:workers'));
});
