import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,mkdir,rm,readdir,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {prepareJournal,buildJournal} from '../skills/travel-journal/scripts/build-journal.mjs';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const example=join(root,'skills/travel-journal/examples/coastal-weekend.json');
function minimal(){return {id:'test-journal',title:'一段旅行',trips:[{id:'visit',name:'Davis',coord:[-121.7405,38.5449],date:'2026-05-01',stops:[{id:'stop',name:'校园',day:1}]}]};}
async function fixture(t,input=minimal()) {
  const dir=await mkdtemp(join(tmpdir(),'travel-journal-test-'));
  t.after(()=>rm(dir,{recursive:true,force:true}));
  const path=join(dir,'trip.json');await writeFile(path,JSON.stringify(input));return {dir,path};
}
test('example creates only the supplied cities and keeps day/date structure',async()=>{
  const {config}=await prepareJournal(example);
  assert.deepEqual(config.state.trips.map(t=>t.name),['San Francisco','Seattle']);
  assert.equal(config.state.trips[0].stops[1].day,2);
  assert.equal(config.state.trips[0].totalDays,2);
  assert.equal(config.state.settings.globalExamplesRevision,1);
  assert.equal(Object.keys(config.files).length,6);
});
test('identical inputs produce stable IDs, revisions and private packaged paths',async(t)=>{
  const input=minimal();input.trips[0].stops[0].media=[{src:'photo.jpg'}];
  const {dir,path}=await fixture(t,input);await writeFile(join(dir,'photo.jpg'),Buffer.from([255,216,255,217]));
  const a=await prepareJournal(path),b=await prepareJournal(path);
  assert.equal(a.config.revision,b.config.revision);
  assert.equal(a.config.state.trips[0].stops[0].media[0].id,b.config.state.trips[0].stops[0].media[0].id);
  assert.match(a.source.trips[0].stops[0].media[0].src,/^assets\/journal\/[0-9a-f]+\.jpg$/);
  assert.ok(!JSON.stringify(a.config).includes(dir));
  assert.ok(!JSON.stringify(a.source).includes(dir));
});
test('different journal IDs isolate browser namespaces and content revisions',async(t)=>{
  const {path}=await fixture(t);const a=await prepareJournal(path);const next=minimal();next.id='another-journal';await writeFile(path,JSON.stringify(next));const b=await prepareJournal(path);
  assert.notEqual(a.config.id,b.config.id);assert.notEqual(a.config.revision,b.config.revision);
});
test('reject duplicate and prototype-like identifiers before building',async(t)=>{
  const input=minimal();input.trips[0].stops[0].id='visit';const {path}=await fixture(t,input);
  await assert.rejects(prepareJournal(path),/duplicate/);
  input.trips[0].stops[0].id='__proto__';await writeFile(path,JSON.stringify(input));await assert.rejects(prepareJournal(path),/lowercase/);
});
test('reject invalid dates, coordinate order and days outside the visit',async(t)=>{
  const input=minimal(),{path}=await fixture(t,input);
  input.trips[0].date='2026-02-30';await writeFile(path,JSON.stringify(input));await assert.rejects(prepareJournal(path),/real YYYY/);
  input.trips[0].date='2026-05-01';input.trips[0].coord=[38,-121];await writeFile(path,JSON.stringify(input));await assert.rejects(prepareJournal(path),/longitude/);
  input.trips[0].coord=[-121,38];input.trips[0].endDate='2026-05-01';input.trips[0].stops[0].day=2;await writeFile(path,JSON.stringify(input));await assert.rejects(prepareJournal(path),/cover every stop/);
});
test('missing coordinates stay unknown instead of being invented',async(t)=>{
  const {path}=await fixture(t);const a=await prepareJournal(path);
  assert.equal(a.config.state.trips[0].stops[0].coord,null);assert.equal(a.warnings.length,1);
});
test('reject URL inputs and local files outside the declared media root',async(t)=>{
  const input=minimal();input.trips[0].stops[0].media=[{src:'https://example.com/private.jpg'}];const {dir,path}=await fixture(t,input);
  await assert.rejects(prepareJournal(path),/local file/);
  await mkdir(join(dir,'allowed'));await writeFile(join(dir,'outside.jpg'),'a');input.trips[0].stops[0].media[0].src='outside.jpg';await writeFile(path,JSON.stringify(input));
  await assert.rejects(prepareJournal(path,{mediaRoot:join(dir,'allowed')}),/outside --media-root/);
});
test('reject symlink escapes when the operating system allows symlinks',async(t)=>{
  const {dir,path}=await fixture(t);const allowed=join(dir,'allowed');await mkdir(allowed);await writeFile(join(dir,'outside.jpg'),'a');
  try {await symlink(join(dir,'outside.jpg'),join(allowed,'link.jpg'));}catch(error){if(['EPERM','EACCES'].includes(error.code)){t.skip('OS does not permit creating symlinks');return;}throw error;}
  const input=minimal();input.trips[0].stops[0].media=[{src:'allowed/link.jpg'}];await writeFile(path,JSON.stringify(input));
  await assert.rejects(prepareJournal(path,{mediaRoot:allowed}),/outside --media-root/);
});
test('existing output is preserved byte-for-byte',async(t)=>{
  const {dir,path}=await fixture(t);const output=join(dir,'output');await mkdir(output);await writeFile(join(output,'keep.txt'),'keep');
  await assert.rejects(buildJournal(path,output),/never overwritten/);
  assert.equal(await readFile(join(output,'keep.txt'),'utf8'),'keep');
});
test('failed asset retrieval cleans staging and does not leave partial output',async(t)=>{
  const {dir,path}=await fixture(t);const saved=globalThis.fetch;globalThis.fetch=async()=>{throw Error('network unavailable');};
  try {await assert.rejects(buildJournal(path,join(dir,'output')),/network unavailable/);}finally{globalThis.fetch=saved;}
  assert.deepEqual(await readdir(dir),['trip.json']);
});
test('asset hash mismatch fails instead of accepting changed runtime code',async(t)=>{
  const {dir,path}=await fixture(t);const saved=globalThis.fetch;globalThis.fetch=async()=>new Response('changed');
  try {await assert.rejects(buildJournal(path,join(dir,'output')),/checksum mismatch/);}finally{globalThis.fetch=saved;}
  assert.deepEqual(await readdir(dir),['trip.json']);
});
test('complete build round-trips packaged sources and escapes script content', {skip:!process.env.TRAVEL_JOURNAL_ASSET_CACHE},async(t)=>{
  const input=minimal();input.title='旅行 </script><script>window.pwned=1</script>';input.trips[0].stops[0].media=[{src:'photo.jpg'}];
  const {dir,path}=await fixture(t,input);await writeFile(join(dir,'photo.jpg'),Buffer.from([255,216,255,217]));const output=join(dir,'output');
  const built=await buildJournal(path,output,{assetCache:process.env.TRAVEL_JOURNAL_ASSET_CACHE});
  const js=await readFile(join(output,'journal-data.js'),'utf8');assert.ok(!js.includes('</script>'));
  const context={window:{}};vm.runInNewContext(js,context);assert.equal(context.window.TRAVEL_JOURNAL.title,input.title);assert.equal(context.window.pwned,undefined);
  const roundTrip=await prepareJournal(join(output,'journal.source.json'));
  assert.equal(roundTrip.config.revision,built.config.revision);
  const packaged=Object.values(built.config.files)[0];assert.deepEqual(await readFile(join(output,packaged)),Buffer.from([255,216,255,217]));
});
