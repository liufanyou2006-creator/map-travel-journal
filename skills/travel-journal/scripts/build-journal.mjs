#!/usr/bin/env node
// Node 20+; uses only built-in modules. No AI service or credentials.
import { readFile, writeFile, mkdir, readdir, cp, realpath, stat, mkdtemp, rename, rm, rmdir } from 'node:fs/promises';
import { dirname, resolve, relative, isAbsolute, extname, join, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const skillRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const hash = value => createHash('sha256').update(value).digest('hex');
const palettes = new Set(['sky','citrus','lilac','peach','autumn','sf','seattle','boston','la','dc','philadelphia','ny','pink']);
const mimeTypes = {'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.gif':'image/gif','.avif':'image/avif','.mp4':'video/mp4','.m4v':'video/mp4','.webm':'video/webm','.mov':'video/quicktime','.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg','.m4a':'audio/mp4','.opus':'audio/ogg'};
const idPattern = /^[a-z0-9][a-z0-9-]{0,79}$/;
const exists = async path => { try { await stat(path); return true; } catch (error) { if (error.code === 'ENOENT') return false; throw error; } };
const inside = (root, path) => { const rel = relative(root, path); return !isAbsolute(rel) && rel !== '..' && !rel.startsWith('..'+sep); };
function fail(message) { throw new Error(message); }
function text(value, label, fallback = '', max = 10000) {
  const result = value ?? fallback;
  if (typeof result !== 'string' || result.length > max) fail(`${label}: expected text of at most ${max} characters`);
  return result;
}
function identifier(value, label) {
  if (typeof value !== 'string' || !idPattern.test(value)) fail(`${label}: use lowercase letters, digits and hyphens (max 80 characters)`);
  return value;
}
function coord(value, label, required = false) {
  if (value == null && !required) return null;
  if (!Array.isArray(value) || value.length !== 2 || !value.every(Number.isFinite) || Math.abs(value[0]) > 180 || Math.abs(value[1]) > 90) fail(`${label}: expected [longitude, latitude] in WGS84`);
  return [...value];
}
function date(value, label) {
  if (!value) return '';
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0,10) !== value) fail(`${label}: expected a real YYYY-MM-DD date`);
  return value;
}
function number(value, label, fallback, min, max, integer = false) {
  const result = value ?? fallback;
  if (!Number.isFinite(result) || result < min || result > max || integer && !Number.isInteger(result)) fail(`${label}: expected ${integer ? 'an integer' : 'a number'} between ${min} and ${max}`);
  return result;
}
function palette(value, fallback = 'sky') {
  const key = value ?? fallback;
  if (!palettes.has(key)) fail(`Unknown palette: ${key}`);
  return key;
}
const safeJSON = value => JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, char => '\\u'+char.charCodeAt(0).toString(16).padStart(4,'0'));
const escapeHTML = value => value.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export async function prepareJournal(inputPath, options = {}) {
  inputPath = resolve(inputPath);
  const input = JSON.parse((await readFile(inputPath,'utf8')).replace(/^\uFEFF/,''));
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail('Input must be a journal object');
  const id = identifier(input.id, 'id');
  if (id.length > 64) fail('Journal id must be at most 64 characters');
  const title = text(input.title, 'title', '', 200).trim();
  if (!title) fail('title must not be empty');
  if (!Array.isArray(input.trips) || !input.trips.length || input.trips.length > 100) fail('trips: expected 1–100 city visits');
  const mediaRoot = await realpath(resolve(options.mediaRoot || dirname(inputPath)));
  const lock = JSON.parse(await readFile(join(skillRoot,'assets/asset-lock.json'),'utf8'));
  const knownAssets = new Map(lock.files.map(item => [item.path,item]));
  const usedIds = new Set();
  const unique = (value, label) => { identifier(value,label); if (usedIds.has(value)) fail(`${label}: duplicate id ${value}`); usedIds.add(value); return value; };
  const files = Object.create(null), copies = new Map(), warnings = [];
  const source = {id, title, subtitle:text(input.subtitle,'subtitle','',500), palette:palette(input.palette), settings:{}, trips:[]};
  const settings = {theme:'cream',font:'longcang',transition:'fade',stickers:false,originalSound:true,globalExamplesRevision:1,readingRevision:1,segmentTempoRevision:1};
  for (const [key, fallback, min, max] of [['photoSeconds',12,2,20],['coverSeconds',3,3,15],['typeSpeed',9,1,60],['readHold',1,0,60],['musicVolume',28,0,100]]) {
    settings[key] = number(input.settings?.[key],`settings.${key}`,fallback,min,max);
    source.settings[key] = settings[key];
  }
  async function media(raw, label, audio = false) {
    if (!raw || typeof raw !== 'object' || typeof raw.src !== 'string' || !raw.src) fail(`${label}: expected an object with src`);
    const builtin = raw.src.startsWith('asset:');
    let bytes, assetPath, extension;
    if (builtin) {
      assetPath = 'assets/'+raw.src.slice(6);
      if (!knownAssets.has(assetPath)) fail(`${label}: unknown bundled public asset ${raw.src}`);
      extension = extname(assetPath).toLowerCase();
    } else {
      if (/^[a-z][a-z0-9+.-]*:\/\//i.test(raw.src) || /^(data|javascript|file):/i.test(raw.src)) fail(`${label}: use a local file, not a URL`);
      const path = await realpath(resolve(dirname(inputPath),raw.src));
      if (!inside(mediaRoot,path)) fail(`${label}: media is outside --media-root`);
      if (!(await stat(path)).isFile()) fail(`${label}: media must be a file`);
      extension = extname(path).toLowerCase();
      bytes = await readFile(path);
      if (!bytes.length) fail(`${label}: media file is empty`);
    }
    const type = mimeTypes[extension];
    if (!type || (audio ? !type.startsWith('audio/') : !/^(image|video)\//.test(type))) fail(`${label}: unsupported ${audio?'audio':'photo/video'} format ${extension}; convert HEIC to JPEG first`);
    const digest = bytes ? hash(bytes) : knownAssets.get(assetPath).sha256;
    const mediaId = 'media-'+digest;
    const target = builtin ? assetPath : 'assets/journal/'+digest+extension;
    files[mediaId] = target;
    if (bytes) copies.set(target,bytes);
    const result = {id:mediaId,type,name:text(raw.name,`${label}.name`,builtin?raw.src.slice(6):raw.src.split(/[\\/]/).pop(),300),volume:number(raw.volume,`${label}.volume`,audio?1:0,0,1)};
    if (raw.ratio != null) result.ratio = number(raw.ratio,`${label}.ratio`,1,0.01,100);
    if (raw.duration != null) result.duration = number(raw.duration,`${label}.duration`,12,0.01,86400);
    return {runtime:result, source:{...result,src:builtin?raw.src:target,id:undefined,type:undefined}};
  }
  const trips = [];
  for (const [i, raw] of input.trips.entries()) {
    if (!raw || typeof raw !== 'object') fail(`trips[${i}] must be an object`);
    const tripId = unique(raw.id || 'trip-'+(i+1),`trips[${i}].id`);
    const name = text(raw.name,'trip.name','',100).trim();
    if (!name) fail(`${tripId}: name is required`);
    if (!Array.isArray(raw.stops) || !raw.stops.length || raw.stops.length > 300) fail(`${tripId}: expected 1–300 stops`);
    const trip = {id:tripId,cityKey:'custom',name,cn:text(raw.cn,'trip.cn','',100),coord:coord(raw.coord,`${tripId}.coord`,true),date:date(raw.date,`${tripId}.date`),transport:raw.transport||'train',note:text(raw.note,'trip.note'),design:{palette:palette(raw.palette,source.palette)},music:{},stops:[]};
    if (!['flight','train','car','walk'].includes(trip.transport)) fail(`${tripId}: transport must be flight, train, car or walk`);
    const sourceTrip = {id:tripId,name,cn:trip.cn,coord:trip.coord,date:trip.date,transport:trip.transport,note:trip.note,palette:trip.design.palette,stops:[]};
    for (const [j,s] of raw.stops.entries()) {
      if (!s || typeof s !== 'object') fail(`${tripId}.stops[${j}] must be an object`);
      const stopId = unique(s.id || tripId+'-stop-'+(j+1),`${tripId}.stops[${j}].id`);
      const stopName = text(s.name,`${stopId}.name`,'',100).trim();
      if (!stopName) fail(`${stopId}: name is required`);
      const stop = {id:stopId,name:stopName,en:text(s.en,`${stopId}.en`,'',150),coord:coord(s.coord,`${stopId}.coord`),day:number(s.day,`${stopId}.day`,1,1,365,true),note:text(s.note,`${stopId}.note`),media:[]};
      if (!stop.coord) warnings.push(`${stopId}: no coordinates; this stop has no precise map marker`);
      const sourceStop = {...stop,media:[]};
      if (s.media != null && (!Array.isArray(s.media) || s.media.length > 1000)) fail(`${stopId}.media: expected an array of at most 1000 files`);
      for (const [k,rawMedia] of (s.media||[]).entries()) {
        const item = await media(rawMedia,`${stopId}.media[${k}]`);
        if (stop.media.some(m=>m.id===item.runtime.id)) fail(`${stopId}: the same media file is listed twice`);
        stop.media.push(item.runtime); sourceStop.media.push(item.source);
      }
      trip.stops.push(stop); sourceTrip.stops.push(sourceStop);
    }
    const usedDays = Math.max(...trip.stops.map(s=>s.day));
    const totalDays = number(raw.days,`${tripId}.days`,usedDays,usedDays,365,true);
    trip.endDate = date(raw.endDate,`${tripId}.endDate`) || (trip.date ? new Date(Date.parse(trip.date)+(totalDays-1)*86400000).toISOString().slice(0,10) : '');
    if (trip.endDate && !trip.date) fail(`${tripId}: endDate requires date`);
    if (trip.date && trip.endDate < trip.date) fail(`${tripId}: endDate is before date`);
    trip.totalDays = trip.date ? (Date.parse(trip.endDate)-Date.parse(trip.date))/86400000+1 : totalDays;
    if (trip.totalDays < usedDays || trip.totalDays > 365) fail(`${tripId}: date range must cover every stop day and be at most 365 days`);
    sourceTrip.endDate = trip.endDate; sourceTrip.days = trip.totalDays;
    if (raw.music) {
      const item = await media(raw.music,`${tripId}.music`,true);
      trip.music = {audioId:item.runtime.id,title:item.runtime.name,confirmed:true};
      sourceTrip.music = item.source;
    }
    trips.push(trip); source.trips.push(sourceTrip);
  }
  const state = {version:1,demo:false,source:'travel-journal skill',settings,trips};
  const config = {id,title,subtitle:source.subtitle,state,files};
  config.revision = hash(JSON.stringify(config)).slice(0,20);
  state.settings.journalSeedRevision = config.revision;
  return {config,source,copies,lock,warnings};
}

export async function buildJournal(inputPath, outputPath, options = {}) {
  const prepared = await prepareJournal(inputPath,options);
  outputPath = resolve(outputPath);
  if (await exists(outputPath) && (!(await stat(outputPath)).isDirectory() || (await readdir(outputPath)).length)) fail('Output exists and is not empty. Use a new folder; existing journals are never overwritten.');
  const parent = dirname(outputPath);
  await mkdir(parent,{recursive:true});
  const staging = await mkdtemp(join(parent,'.travel-journal-'));
  try {
    await cp(join(skillRoot,'assets/template'),staging,{recursive:true});
    let next = 0;
    const cacheRoot = options.assetCache ? await realpath(resolve(options.assetCache)) : null;
    async function assetWorker() {
      while (next < prepared.lock.files.length) {
        const entry = prepared.lock.files[next++];
        if (!/^assets\/[a-zA-Z0-9_./-]+$/.test(entry.path) || entry.path.split('/').includes('..')) fail('Unsafe asset-lock path');
        let bytes;
        if (cacheRoot) {
          const sourcePath = await realpath(resolve(cacheRoot,entry.path));
          if (!inside(cacheRoot,sourcePath)) fail('Asset cache path escapes its root');
          bytes = await readFile(sourcePath);
        } else {
          const response = await fetch(new URL(entry.path,prepared.lock.origin),{signal:AbortSignal.timeout(45000)});
          if (!response.ok) fail(`Public asset unavailable: ${entry.path} (HTTP ${response.status}). Use --asset-cache with a complete verified cache.`);
          bytes = Buffer.from(await response.arrayBuffer());
        }
        if (bytes.length !== entry.bytes || hash(bytes) !== entry.sha256) fail(`Asset checksum mismatch: ${entry.path}. No journal was published.`);
        const target = join(staging,entry.path);
        await mkdir(dirname(target),{recursive:true}); await writeFile(target,bytes);
      }
    }
    // Wait for every worker before cleaning up a failed staging directory.
    const settled = await Promise.allSettled(Array.from({length:4},assetWorker));
    const failure = settled.find(item=>item.status==='rejected');
    if (failure) throw failure.reason;
    for (const [path,bytes] of prepared.copies) { const target=join(staging,path); await mkdir(dirname(target),{recursive:true}); await writeFile(target,bytes); }
    await writeFile(join(staging,'journal-data.js'),'window.TRAVEL_JOURNAL = '+safeJSON(prepared.config)+';\n');
    await writeFile(join(staging,'journal.source.json'),JSON.stringify(prepared.source,null,2)+'\n');
    let html = await readFile(join(staging,'index.html'),'utf8');
    html = html.replace(/<title>[^<]*<\/title>/,'<title>'+escapeHTML(prepared.config.title)+'</title>');
    html = html.replace(/<meta name="description" content="[^"]*">/,'<meta name="description" content="'+escapeHTML(prepared.config.subtitle || prepared.config.title)+'">');
    await writeFile(join(staging,'index.html'),html);
    await writeFile(join(staging,'START-HERE.txt'),`旅行手账：${prepared.config.title}\n\n请通过本地 HTTP 服务打开，不能直接双击 HTML。\n例如：python -m http.server 8000 --bind 127.0.0.1 --directory "此文件夹的路径"\n然后访问 http://127.0.0.1:8000\n\n这是可编辑的静态网站，不是 MP4。照片、视频及 journal.source.json 都在此文件夹内。\n浏览器编辑保存在当前设备；转移前在网页“备份”中导出完整 JSON。\n更新时让 AI 修改 journal.source.json，保留 id，并生成到一个新目录。\n城市街道地图与全球城市搜索需要网络；播放音乐需要先点击页面。\n公开上传此目录会公开其中的照片和文字。\n`);
    if (await exists(outputPath)) await rmdir(outputPath); // only the already-checked empty directory
    await rename(staging,outputPath);
    return {...prepared,outputPath};
  } catch (error) { await rm(staging,{recursive:true,force:true}); throw error; }
}

function parseArgs(args) {
  const options = {};
  for (let i=0;i<args.length;i++) {
    const key = args[i];
    if (['--help','--check'].includes(key)) { options[key.slice(2)]=true; continue; }
    if (!['--input','--output','--asset-cache','--media-root'].includes(key) || !args[i+1] || args[i+1].startsWith('--')) fail(`Unknown or incomplete argument: ${key}`);
    options[key.slice(2).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())] = args[++i];
  }
  return options;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) console.log('Node 20+\nnode build-journal.mjs --input trip.json --output my-journal [--media-root photos-folder] [--asset-cache cached-site-folder]\nnode build-journal.mjs --input trip.json --check\nOutput must be new or empty. No API key. Public runtime assets download once per build unless a verified cache is supplied.');
    else {
      if (!options.input || !options.check && !options.output) fail('Provide --input and --output (or --input and --check)');
      const result = options.check ? await prepareJournal(options.input,options) : await buildJournal(options.input,options.output,options);
      for (const warning of result.warnings) console.warn('Note: '+warning);
      console.log(JSON.stringify({ok:true,id:result.config.id,trips:result.config.state.trips.length,media:Object.keys(result.config.files).length,revision:result.config.revision,...(result.outputPath?{output:result.outputPath}:{checked:true})}));
    }
  } catch (error) { console.error('Travel journal: '+error.message); process.exitCode=1; }
}
