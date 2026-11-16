'use strict';
// Public sample only. Never import browser-local journals into the portfolio.
const DEMO_FILES={'seattle-view':'assets/demo/seattle.jpg','bridge-wide':'assets/demo/golden-gate.jpg','bridge-detail':'assets/demo/bridge-detail.jpg','bridge-motion':'assets/demo/bridge-motion.mp4'};
const sampleMedia=(id,type,name)=>({id,type,name,ratio:1.78,duration:12,volume:0});
state=fresh();state.demo=false;state.settings={...state.settings,stickers:false,typeSpeed:9,readHold:1,photoSeconds:12,coverSeconds:3,musicVolume:28};
state.trips=[{id:'sf-demo',cityKey:'san-francisco',name:'San Francisco',cn:'旧金山',coord:[-122.4194,37.7749],date:'',endDate:'',totalDays:1,transport:'train',note:'演示路线：沿城市街道前往海湾，让地图、影像和文字一起讲述旅程。\n本页内容为公开素材演示，不代表个人实地游记。',design:{palette:'sf'},music:{builtinKey:'san-francisco',confirmed:true},stops:[
 {id:'california-demo',name:'California Street',en:'加利福尼亚街',coord:[-122.4128,37.7913],day:1,note:'从城市街道开始。路线会按顺序连接站点，也可以点击地图标记自由探索。',media:[]},
 {id:'bridge-demo',name:'Golden Gate Bridge',en:'金门大桥',coord:[-122.4783,37.8199],day:1,note:'Golden Gate Bridge\n海湾与悬索桥。接下来可以点击照片放大，移动鼠标感受照片互动，或跳过片段。',media:[sampleMedia('bridge-wide','image/jpeg','Golden Gate Bridge · Masur / CC BY-SA 3.0'),sampleMedia('bridge-detail','image/jpeg','Bridge detail · cropped from Masur'),sampleMedia('bridge-motion','video/mp4','照片动态演示 / Photo motion study')]}]}];
state.trips.push({id:'seattle-demo',cityKey:'seattle',name:'Seattle',cn:'西雅图',coord:[-122.3321,47.6062],date:'',totalDays:1,transport:'flight',note:'Seattle / 西雅图\n薄荷绿的街道地图，配上一段安静的钢琴。沿海湾前往 Kerry Park。',design:{palette:'mint-demo'},music:{builtinKey:'seattle',confirmed:true},stops:[{id:'pike-demo',name:'Pike Place Market',en:'派克市场',coord:[-122.3422,47.6097],day:1,note:'从市场出发，沿城市街道寻找下一个视角。公开演示路线。',media:[]},{id:'kerry-demo',name:'Kerry Park',en:'凯瑞公园',coord:[-122.3601,47.6295],day:1,note:'站在高处看城市天际线。\n这张公开照片展示了另一座城市的影像与配色。',media:[sampleMedia('seattle-view','image/jpeg','Seattle Kerry Park Skyline · CommunistSquared / CC0')]}]});
PALETTES['mint-demo']={name:'Seattle · 薄荷海湾',bg:'#e5f5ef',land:'#eef8ee',water:'#b0ddd6',road:'#4f937e',minor:'#a8cbbb',text:'#224d43',halo:'#eef8ee',paper:'#78b6a1',ink:'#224d43',accent:'#4c9984'};
state.trips[0].design.palette='sky';
const publicSample=structuredClone(state);
try{const saved=JSON.parse(localStorage.getItem('travel-portfolio-edit-v2'));if(saved?.trips?.length)state=saved;}catch{}
save=()=>{try{localStorage.setItem('travel-portfolio-edit-v2',JSON.stringify(state));}catch{toast('当前浏览器无法保存，请先完成预览。');}};
const fileURLBeforePublic=fileURL;
fileURL=async function(id){return DEMO_FILES[id]||await fileURLBeforePublic(id);};
document.addEventListener('contextmenu',e=>e.preventDefault(),true);
const blocked=new Set([]);
document.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b&&blocked.has(b.dataset.action)){e.preventDefault();e.stopImmediatePropagation();}},true);
const header=document.querySelector('.film-header-actions');
header.querySelectorAll('[data-action]').forEach(e=>e.remove());
const edit=document.createElement('button');edit.textContent='照片 / 视频编辑';header.prepend(edit);
edit.onclick=()=>{if(playback.running)endPlayback();showDialog('选择要编辑的景点',state.trips.map(t=>'<h3>'+esc(t.name)+' / '+esc(t.cn)+'</h3>'+t.stops.map(s=>'<button class="outline-btn" data-demo-studio="'+esc(s.id)+'" data-demo-trip="'+esc(t.id)+'">'+esc(s.name)+' · 上传 / 排版</button>').join('')).join('')+'<p>上传与修改仅保存在当前浏览器，不影响其他访客。</p><button class="text-btn" id="reset-public-demo">恢复演示样例</button>');$$('[data-demo-studio]').forEach(b=>b.onclick=()=>openMediaSettings(b.dataset.demoTrip,b.dataset.demoStudio));$('#reset-public-demo').onclick=()=>{state=structuredClone(publicSample);save();closeDialog();render();};};
const ai=document.createElement('button');ai.textContent='AI 版面设计';header.prepend(ai);ai.onclick=()=>showAIConnection();
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

PALETTES.sky.name='San Francisco · 海盐天蓝';
const mapPaletteBeforeDemo=applyMapPalette;applyMapPalette=function(key){mapPaletteBeforeDemo(key);if(key==='mint-demo')$('#film-stage').classList.add('light-city');};
