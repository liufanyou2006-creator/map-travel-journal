'use strict';
const cityIntroStops=openStops;
openStops=function(tid,...args){cityIntroStops(tid,...args);const t=tripById(tid);if(!t||!$('#daily-dates')||$('#edit-city-intro'))return;const button=document.createElement('button');button.id='edit-city-intro';button.className='outline-btn';button.textContent='城市开场文字';button.title='进入城市后先展示；留空则不显示文字框';button.onclick=()=>openNote(t.id);$('#daily-dates').after(button);};

