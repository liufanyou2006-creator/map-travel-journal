const clone=x=>structuredClone(x);
const norm=x=>String(x||'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const filled=x=>x!==undefined&&x!==null&&x!=='';
export async function digestText(text){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');}
function designValue(d,hashes){if(!d?.pages?.some(p=>p.elements?.length))return null;return{palette:d.palette,excluded:(d.excluded||[]).map(id=>hashes[id]||id).sort(),pages:d.pages.map(p=>p.elements.map(e=>({kind:e.kind,typeface:e.kind==='text'?(e.typeface||'longcang'):null,border:e.border||'none',text:e.kind==='text'?e.text:null,media:e.mediaId?(hashes[e.mediaId]||e.mediaId):null,sticker:e.kind==='sticker'?e.sticker:null,x:e.x,y:e.y,w:e.w,h:e.h,z:e.z??10,font:e.font??2,rotation:e.rotation||0,fit:e.fit||'cover'})))};}
function stopValue(s,hashes){return{name:s.name,en:s.en,day:s.day||1,pending:!!s.dayPending,note:s.note||'',coord:s.coord,media:s.media.map(m=>hashes[m.id]||m.id),design:designValue(s.design,hashes)};}
function remapTrip(t,map){if(t.music?.audioId)t.music.audioId=map.get(t.music.audioId)||t.music.audioId;for(const s of t.stops){s.media.forEach(m=>m.id=map.get(m.id)||m.id);if(s.design){s.design.excluded=(s.design.excluded||[]).map(id=>map.get(id)||id);for(const p of s.design.pages)for(const e of p.elements)if(e.mediaId)e.mediaId=map.get(e.mediaId)||e.mediaId;}}}
// Pure metadata merge. File writes and the commit happen only after user review.
export async function mergeDiaryStates(local,incoming,mediaMap,{newId,hashes={}}){
 const out=clone(local),stats={trips:0,stops:0,media:0,versions:0};out.settings.mergeVariants={...out.settings.mergeVariants};const variants=out.settings.mergeVariants;
 const ids=new Set(out.trips.flatMap(t=>[t.id,...t.stops.map(s=>s.id)]));const allocate=()=>{let id;do{id=newId();}while(ids.has(id));ids.add(id);return id;};
 const versionStop=s=>{s.id=allocate();s.name+='（导入版本）';s.en=(s.en||s.name)+' · Imported version';};
 for(const raw of incoming.trips){const t=clone(raw);remapTrip(t,mediaMap);let current=out.trips.find(x=>x.id===t.id);if(!current){const candidates=out.trips.filter(x=>(x.cityKey===t.cityKey&&t.cityKey!=='custom'||norm(x.name)===norm(t.name))&&(x.date||'')===(t.date||''));if(candidates.length===1)current=candidates[0];}
  const tripConflict=current&&(['date','endDate','note'].some(k=>filled(current[k])&&filled(t[k])&&current[k]!==t[k])||(current.music?.audioId&&t.music?.audioId&&current.music.audioId!==t.music.audioId));
  if(!current||tripConflict){const signature=await digestText(JSON.stringify({trip:[t.cityKey,t.date,t.endDate,t.note,t.music?.audioId?(hashes[t.music.audioId]||t.music.audioId):null],stops:t.stops.map(s=>stopValue(s,hashes))}));if(variants[signature]&&out.trips.some(x=>x.id===variants[signature]))continue;t.id=allocate();t.stops.forEach(s=>s.id=allocate());if(tripConflict){t.cn=(t.cn||t.name)+'（导入版本）';t.name+=' · Imported version';stats.versions++;}out.trips.push(t);variants[signature]=t.id;stats.trips++;stats.stops+=t.stops.length;stats.media+=t.stops.reduce((n,s)=>n+s.media.length,0);continue;}
  for(const k of ['date','startDate','endDate','note'])if(!filled(current[k])&&filled(t[k]))current[k]=t[k];current.totalDays=Math.max(current.totalDays||1,t.totalDays||1);if(!current.music?.audioId&&t.music?.audioId)current.music=clone(t.music);
  for(const s of t.stops){let existing=current.stops.find(x=>x.id===s.id);if(!existing){const matches=current.stops.filter(x=>(norm(x.name)===norm(s.name)||norm(x.en)&&norm(x.en)===norm(s.en))&&(x.day||1)===(s.day||1)&&!!x.dayPending===!!s.dayPending);if(matches.length===1)existing=matches[0];}
   const signature=await digestText(JSON.stringify({trip:current.id,stop:stopValue(s,hashes)}));if(variants[signature]&&current.stops.some(x=>x.id===variants[signature]))continue;
   const a=designValue(existing?.design,hashes),b=designValue(s.design,hashes);const conflict=existing&&((existing.note&&s.note&&existing.note!==s.note)||(a&&b&&!equal(a,b))||(existing.coord&&s.coord&&existing.coord.some((n,i)=>Math.abs(n-s.coord[i])>.0001)));
   if(!existing||conflict){if(conflict){versionStop(s);stats.versions++;}else{s.id=allocate();}current.stops.push(s);variants[signature]=s.id;stats.stops++;stats.media+=s.media.length;continue;}
   const known=new Set(existing.media.map(m=>hashes[m.id]||m.id));for(const m of s.media){const key=hashes[m.id]||m.id;if(!known.has(key)){existing.media.push(m);known.add(key);stats.media++;}}
   if(!existing.note&&s.note)existing.note=s.note;if(!existing.coord&&s.coord)existing.coord=s.coord;if(!a&&b)existing.design=clone(s.design);
  }
 }
 return{state:out,stats};
}

