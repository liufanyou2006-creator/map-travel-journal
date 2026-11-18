'use strict';
const DEMO_EN={
 '金门大桥':'Golden Gate Bridge','渔人码头':"Fisherman’s Wharf",'九曲花街':'Lombard Street',
 '格里菲斯天文台':'Griffith Observatory','好莱坞大道':'Hollywood Boulevard','圣莫尼卡海滩':'Santa Monica Beach',
 '太空针塔':'Space Needle','派克市场':'Pike Place Market','西雅图海滨':'Seattle Waterfront',
 '林肯纪念堂':'Lincoln Memorial','华盛顿纪念碑':'Washington Monument','美国国会大厦':'U.S. Capitol',
 '费城艺术博物馆':'Philadelphia Museum of Art','市政厅':'Philadelphia City Hall','独立宫':'Independence Hall',
 '中央公园':'Central Park','时代广场':'Times Square','布鲁克林大桥':'Brooklyn Bridge',
 '哈佛广场':'Harvard Square','波士顿公园':'Boston Common','昆西市场':'Quincy Market'
};
function hydratePlaceNames(){for(const t of state.trips)for(const s of t.stops){if(!s.day)s.day=1;if(state.demo&&!s.en)s.en=DEMO_EN[s.name]||'';}}
hydratePlaceNames();
const captionBase=setCaption;
setCaption=function(t,s){captionBase(t,s);if(!t)return;$('#scene-title').textContent=s?s.name:(t.cn||t.name);$('#scene-subtitle').textContent=s?(s.en||''):(t.cn?t.name:'');$('#scene-kicker').textContent=s?`Day ${s.day||1} · ${String(t.stops.indexOf(s)+1).padStart(2,'0')}`:String(state.trips.indexOf(t)+1).padStart(2,'0');};
const baseBuildDayScenes=buildScenes;
buildScenes=function(){hydratePlaceNames();for(const t of state.trips)t.stops.sort((a,b)=>(a.day||1)-(b.day||1));const base=baseBuildDayScenes(),scenes=[];let trip=null,day=null;for(const scene of base){if(scene.type==='city'){trip=scene.tid;day=null;}if(scene.type==='stop'){const n=stopById(tripById(scene.tid),scene.sid)?.day||1;if(scene.tid!==trip||n!==day){scenes.push({type:'city',tid:scene.tid,seconds:2.2,camera:0,isDay:true,day:n});day=n;trip=scene.tid;}}scenes.push(scene);}return scenes;};
const dayCard=document.createElement('div');dayCard.id='day-card';dayCard.className='day-card';dayCard.hidden=true;$('#film-stage').append(dayCard);
const dayRestoreBase=restoreVisuals;
restoreVisuals=function(){dayCard.hidden=true;dayRestoreBase();};
const dayLoadBase=loadScene;
loadScene=async function(){await dayLoadBase();const scene=playback.scenes[playback.index];if(playback.running&&scene?.isDay){const t=tripById(scene.tid);dayCard.innerHTML=`<span>Day ${scene.day}</span><small>${esc(t.cn||t.name)}${t.cn?' / '+esc(t.name):''}</small>`;dayCard.hidden=false;}};
const dayRenderBase=render;
render=function(){hydratePlaceNames();for(const t of state.trips)t.stops.sort((a,b)=>(a.day||1)-(b.day||1));dayRenderBase();};

