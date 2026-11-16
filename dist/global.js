'use strict';
// Extend the sample rather than removing any editing or backup tools.
for(const c of [{key:'shanghai',name:'Shanghai',cn:'上海',coord:[121.4737,31.2304],poi:'The Bund',pcn:'外滩',point:[121.4903,31.2401],palette:'ny'},{key:'beijing',name:'Beijing',cn:'北京',coord:[116.4074,39.9042],poi:'Temple of Heaven',pcn:'天坛',point:[116.4066,39.8822],palette:'peach'}]){
 if(!CITIES.some(x=>x.key===c.key))CITIES.push({...c,code:c.key.toUpperCase(),aliases:[c.name,c.cn]});
 if(!state.trips.some(t=>t.cityKey===c.key))state.trips.push({id:c.key+'-demo',cityKey:c.key,name:c.name,cn:c.cn,coord:c.coord,date:'2026-05-01',endDate:'2026-05-02',totalDays:2,transport:'flight',note:'示例行程，可编辑日期、站点、配色和素材。',design:{palette:c.palette},music:{},stops:[{id:c.key+'-poi',name:c.poi,en:c.pcn,coord:c.point,day:1,note:'示例景点，可替换为自己的旅行记录。',media:[]}]});
}
for(const t of state.trips){if(!t.date){t.date=t.cityKey==='seattle'?'2026-10-01':'2026-09-27';t.endDate=t.date;t.totalDays=1;}}
const globalFileBefore=getFile;getFile=async function(id){const local=await globalFileBefore(id);if(local)return local;if(DEMO_FILES[id]){const r=await fetch(DEMO_FILES[id]);if(r.ok)return r.blob();}return null;};
for(const [label,handler] of [['旅行日期 / 城市 / 站点',()=>openRoute()],['导入 / 导出 / 手机合并',()=>openBackup()],['行程导入',()=>openImport()],['地点音乐',()=>openMusic()]]){const button=document.createElement('button');button.textContent=label;button.onclick=handler;header.insertBefore(button,$('#fullscreen-top'));}
document.querySelector('.film-intro h1').innerHTML='环球<br>旅行游记';document.title='环球旅行游记';
drawDirectory=async function(){try{const world=await fetch('assets/world.json').then(r=>r.json());const svg=d3.select('#usa-map');svg.selectAll('*').remove();svg.attr('viewBox','0 0 1600 900');const projection=d3.geoNaturalEarth1().fitExtent([[350,120],[1500,730]],topojson.feature(world,world.objects.countries)),path=d3.geoPath(projection);svg.append('path').datum(topojson.feature(world,world.objects.countries)).attr('d',path).attr('class','directory-land');for(const t of state.trips){const xy=projection(t.coord);if(!xy)continue;const pin=svg.append('g').attr('class','directory-pin').attr('transform',`translate(${xy})`).attr('role','button').attr('tabindex',0).on('click',()=>previewCity(t.id)).on('keydown',e=>{if(e.key==='Enter')previewCity(t.id);});pin.append('circle').attr('r',6);pin.append('text').attr('x',10).attr('y',-10).text(t.name);pin.append('text').attr('class','directory-en').attr('x',10).attr('y',14).text(t.cn);}}catch{if(filmMap){$('#usa-map').setAttribute('hidden','');filmMap.flyTo({center:[15,30],zoom:1.3});}}};
const globalRender=render;render=function(){globalRender();$('#route-summary').textContent='环球旅行游记 · 示例路线';$('#demo-label').textContent='示例日期与路线，可编辑替换';};save();render();

// Compact labels preserve every action; city scenes start with the tools folded.
const toolNames={'关于作品':'关于','AI 版面设计':'AI','照片 / 视频编辑':'编辑','地点配色 / 排版 ✳':'配色','旅行日期 / 城市 / 站点':'行程','导入 / 导出 / 手机合并':'备份','行程导入':'导入','地点音乐':'音乐','⛶':'全屏'};
header.querySelectorAll('button').forEach(button=>{const old=button.textContent.trim(),name=toolNames[old];if(name){button.title=old;button.setAttribute('aria-label',old==='⛶'?'全屏放映':old);button.textContent=name;}});
header.id='global-tools';
const toolsToggle=document.createElement('button');toolsToggle.className='toolbar-toggle';toolsToggle.textContent='☰';toolsToggle.setAttribute('aria-label','展开工具栏');toolsToggle.setAttribute('aria-controls','global-tools');toolsToggle.setAttribute('aria-expanded','false');document.querySelector('.film-header').append(toolsToggle);
function foldTools(city){const stage=$('#film-stage');stage.classList.toggle('tools-folded',city);stage.classList.remove('tools-expanded');toolsToggle.setAttribute('aria-expanded','false');toolsToggle.setAttribute('aria-label','展开工具栏');}
toolsToggle.onclick=()=>{const expanded=$('#film-stage').classList.toggle('tools-expanded');toolsToggle.setAttribute('aria-expanded',String(expanded));toolsToggle.setAttribute('aria-label',expanded?'收起工具栏':'展开工具栏');};
const activeBeforeTools=setActive;setActive=function(t,s){activeBeforeTools(t,s);foldTools(!!t);};
const homeBeforeTools=returnHome;returnHome=function(){homeBeforeTools();foldTools(false);};
$('#usa-map').setAttribute('aria-label','世界旅行地图');$('.film-brand').setAttribute('aria-label','回到世界全景');
drawDirectory();
