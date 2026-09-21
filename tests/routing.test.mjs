import {test} from 'node:test';
import assert from 'node:assert/strict';
import {routeHref,readRoute,matchRoute,channelUrl,assetUrl} from '../lib/paths.ts';
import {normalizeApiUrl,configUrl} from '../lib/config.ts';
const base='https://taylorchappell.github.io/SubStreamFrontend/';
test('all public routes survive a copied hash link or refresh',()=>{
 for(const [path,page] of [['/','home'],['/following','following'],['/studio','studio'],['/schedule','schedule'],['/privacy','privacy'],['/terms','terms'],['/stream/aqua-coin','stream']]){
  const url=new URL(routeHref(path),base);assert.equal(url.pathname,'/SubStreamFrontend/');assert.equal(matchRoute(readRoute(url.hash)).page,page);
 }
});
test('unknown and malformed routes are not mistaken for streams',()=>{
 for(const path of ['/missing','/stream/','/stream/%zz','/stream/a/b','/stream/%2F'])assert.equal(matchRoute(path).page,'missing');
 assert.equal(readRoute('#/schedule/'),'/schedule');assert.equal(readRoute('#/studio?tab=keys'),'/studio');
 assert.throws(()=>routeHref('//outside.test'));assert.throws(()=>routeHref('javascript:alert(1)'));
});
test('logo, config and calendar links stay under the Pages prefix',()=>{
 assert.equal(assetUrl('/sub-stream-mark.png',base),base+'sub-stream-mark.png');
 assert.equal(configUrl(base),base+'config.json');
 assert.equal(channelUrl('aqua-coin',base),base+'#/stream/aqua-coin');
});
test('custom domains and localhost work without the repository prefix',()=>{
 assert.equal(assetUrl('favicon.svg','https://stream.example/'),'https://stream.example/favicon.svg');
 assert.equal(channelUrl('aqua','http://localhost:5173/'),'http://localhost:5173/#/stream/aqua');
});
test('public API config never accepts secrets, paths or mixed-content endpoints',()=>{
 assert.equal(normalizeApiUrl('https://api.example/'),'https://api.example');
 assert.equal(normalizeApiUrl('http://localhost:8080'),'http://localhost:8080');assert.equal(normalizeApiUrl(''),'');
 for(const url of ['http://api.example','https://api.example/api','https://api.example/?key=secret','https://user:secret@api.example','javascript:alert(1)','https://api.example/#key'])assert.throws(()=>normalizeApiUrl(url));
});
