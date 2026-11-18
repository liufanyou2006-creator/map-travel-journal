'use strict';
// Public sample only. Never import browser-local journals into the portfolio.
const journalConfig=window.TRAVEL_JOURNAL;
const DEMO_FILES=Object.assign(Object.create(null),journalConfig.files);
const journalStorageKey='travel-journal:'+journalConfig.id;
state=structuredClone(journalConfig.state);
const publicSample=structuredClone(state);
let journalPendingRevision=false;
try{const saved=JSON.parse(localStorage.getItem(journalStorageKey));if(saved&&Array.isArray(saved.trips)&&saved.settings){state=saved;journalPendingRevision=saved.settings.journalSeedRevision!==journalConfig.revision;}}catch{}
save=()=>{try{localStorage.setItem(journalStorageKey,JSON.stringify(state));}catch{toast('浏览器未能保存，请导出完整备份。');}};
const fileURLBeforePublic=fileURL;
fileURL=async function(id){return DEMO_FILES[id]||await fileURLBeforePublic(id);};
document.addEventListener('contextmenu',e=>e.preventDefault(),true);
const blocked=new Set([]);
document.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b&&blocked.has(b.dataset.action)){e.preventDefault();e.stopImmediatePropagation();}},true);
const header=document.querySelector('.film-header-actions');
header.querySelectorAll('[data-action]').forEach(e=>e.remove());
const edit=document.createElement('button');edit.textContent='照片 / 视频编辑';header.prepend(edit);
edit.onclick=()=>{if(playback.running)endPlayback();showDialog('选择要编辑的景点',state.trips.map(t=>'<h3>'+esc(t.name)+' / '+esc(t.cn)+'</h3>'+t.stops.map(s=>'<button class="outline-btn" data-demo-studio="'+esc(s.id)+'" data-demo-trip="'+esc(t.id)+'">'+esc(s.name)+' · 上传 / 排版</button>').join('')).join('')+'<p>上传与修改仅保存在当前浏览器，不影响其他访客。</p><button class="text-btn" id="reset-public-demo">恢复生成时的内容</button>');$$('[data-demo-studio]').forEach(b=>b.onclick=()=>openMediaSettings(b.dataset.demoTrip,b.dataset.demoStudio));$('#reset-public-demo').onclick=()=>{state=structuredClone(publicSample);save();closeDialog();render();};};

const about=document.createElement('button');about.textContent='关于作品';header.prepend(about);
about.onclick=()=>{showDialog('美国交换游记 · Interactive travel film',`<p>一个以地图为目录的横屏旅行叙事作品。点击开始放映，或选择旧金山自由探索。</p><p>体验重点：美国地图 → 城市街道 → 景点定位 → 可互动照片与视频。</p><p>本展示版包含旧金山与西雅图，分别展示海盐蓝与薄荷绿地图、不同音乐，以及可实际操作的影像编辑器。没有载入作者的私人日记。视频为公开照片制作的 8 秒动态演示，并非实拍视频。</p><p>项目由作者提出交互与视觉需求，并借助 AI 协作开发；技术细节见项目说明。</p><p><a href="CREDITS.md" target="_blank">素材与开源署名 ↗</a></p>`);};
document.querySelector('#demo-label').textContent='INTERACTIVE PORTFOLIO · PUBLIC SAMPLE';
document.querySelector('.film-shortcuts').innerHTML='SPACE 暂停 · → 跳过 · 点击照片放大';
const renderSample=render;render=function(){renderSample();document.querySelector('#demo-label').textContent='公开素材演示 · 无私人日记';document.querySelector('#route-summary').textContent='San Francisco · Seattle';};
const clickPreview=previewStop;
previewStop=function(tid,sid){if(playback.running)return clickPreview(tid,sid);startPlayback().then(()=>{const index=playback.scenes.findIndex(s=>s.type==='stop'&&s.sid===sid);if(index>=0){playback.index=index;loadScene();}});};
const captions=setCaption;
setCaption=function(...args){captions(...args);};
render();

let demoDesignEndpoint='';
function showAIConnection(){showDialog('API → AI 一键设计版面','<p>选择地点配色，导入照片、视频和原文后，可连接自己的 AI 后端，让 AI 根据图片比例与文字长度生成排版。返回的版面仍可拖动、修改和撤销。</p><p>当前公开站未配置付费 AI。自动排版按钮使用本地规则；AI 设计需要你自行提供后端接口。密钥应保存在后端，不能粘贴到网页。</p><label>设计后端接口网址<input id="demo-design-endpoint" type="url" placeholder="https://你的后端/api/design" value="'+esc(demoDesignEndpoint)+'"></label><p>接口接收 palette、media（id / ratio）、titleLength、noteLength，返回 {elements:[...]}。只发送尺寸与长度，不发送图片、视频或原文。后端需允许本站跨域请求。</p><button class="primary-btn" id="save-demo-endpoint">保存本次连接</button>');$('#save-demo-endpoint').onclick=()=>{const value=$('#demo-design-endpoint').value.trim();if(value){try{const u=new URL(value);if(!['https:','http:'].includes(u.protocol)||u.username||u.password)throw Error();}catch{return toast('请输入有效的后端网址。');}}demoDesignEndpoint=value;closeDialog();toast(value?'后端地址已保存，尚未验证连接。':'当前使用本地自动排版。');};}
checkDesignConnection=async function(){const e=$('#studio-ai-status');if(e)e.textContent=demoDesignEndpoint?'AI：已填写后端地址，待调用验证':'AI：未连接 · 可查看接入说明';};
designStudioPageAI=async function(t,s){if(!demoDesignEndpoint){showAIConnection();return;}const b=$('#studio-ai-page');b.disabled=true;try{const page=currentPage(),media=page.elements.filter(e=>e.kind==='media').map(e=>s.media.find(m=>m.id===e.mediaId)).filter(Boolean);if(!media.length)throw Error('请先将照片加入本页。');const r=await fetch(demoDesignEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(30000),body:JSON.stringify({palette:s.design.palette,media:media.map(m=>({id:m.id,ratio:m.ratio||1})),titleLength:s.name.length,noteLength:s.note.length})});if(!r.ok)throw Error('后端返回 '+r.status);const data=await r.json();if(!Array.isArray(data.elements)||data.elements.length>50)throw Error('版面数据格式不正确。');const ids=new Set(media.map(m=>m.id));const elements=data.elements.filter(e=>e.kind==='media'&&ids.has(e.mediaId)).map(e=>item('media',clamp(e.x,0,95),clamp(e.y,0,95),clamp(e.w,5,100),clamp(e.h,5,100),{mediaId:e.mediaId,fit:e.fit==='contain'?'contain':'cover'}));if(!elements.length)throw Error('后端没有返回有效图片元素。');snapshot();page.elements=[...elements,...page.elements.filter(e=>e.kind==='text')];studioContext.selected=null;studioChanged();paintArtboard();$('#studio-ai-status').textContent='AI 设计已应用，可继续拖动或撤销。';}catch(e){$('#studio-ai-status').textContent=e.message||'连接失败';}finally{b.disabled=false;}};


const mapPaletteBeforeDemo=applyMapPalette;applyMapPalette=function(key){mapPaletteBeforeDemo(key);if(key==='mint-demo')$('#film-stage').classList.add('light-city');};

// Keep editing actions in the header so they never collide with the intro CTA.
header.insertBefore($('#location-design-button'),$('#fullscreen-top'));

