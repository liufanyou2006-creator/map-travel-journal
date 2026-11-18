import './merge-import.js';
// Build the download in individual pieces rather than stringifying all media at once.
async function exportPortable(data,button,name){
 button.disabled=true;
 try{
  const ids=referencedIds(data),parts=[new Blob(['{"format":"along-the-way-backup","version":1,"state":',JSON.stringify(data),',"files":['])];
  for(const [i,id]of ids.entries()){
   const status=$('#backup-status');if(status)status.textContent=`正在打包 ${i+1} / ${ids.length}，请保持页面打开…`;
   const blob=await getFile(id);if(!blob)throw Error('部分素材在当前浏览器中缺失，未生成不完整备份。');
   const encoded=await blobData(blob);
   parts.push(new Blob([i?',':'','{"id":',JSON.stringify(id),',"data":',JSON.stringify(encoded),'}']));
  }
  parts.push(']}');
  downloadBlob(new Blob(parts,{type:'application/json'}),name+'.json');
  if($('#backup-status'))$('#backup-status').textContent='已发起下载，请检查手机“文件 / 下载”中是否保存成功。';
 }catch(e){notifyError(e);}finally{button.disabled=false;}
}
exportBackup=function(){return exportPortable(structuredClone(state),$('#export-backup'),'沿途日记备份');};
const previousBackup=openBackup;
openBackup=function(){
 previousBackup();
 const section=document.createElement('section');section.style.marginTop='20px';
 section.innerHTML=`<label>手机素材较多？按旅行单独导出<select id="export-trip">${state.trips.map(t=>`<option value="${esc(t.id)}">${esc(t.name)} · ${esc(t.date||'日期待定')}</option>`).join('')}</select></label><button class="outline-btn" id="export-trip-button">导出这段旅行</button><p class="hint">每次只打包一段旅行的照片、视频和音乐。传到电脑后使用“合并导入手机日记”。如果单段仍太大，可以再选择一个站点导出。</p><label>站点<select id="export-stop"></select></label><button class="outline-btn" id="export-stop-button">仅导出这个站点</button>`;
 $('#backup-status').before(section);
 function populate(){const t=tripById($('#export-trip').value);$('#export-stop').innerHTML=(t?.stops||[]).map(s=>`<option value="${esc(s.id)}">${esc(s.en||s.name)}</option>`).join('');}
 $('#export-trip').onchange=populate;populate();
 async function run(onlyStop){const data=structuredClone(state),t=data.trips.find(t=>t.id===$('#export-trip').value);if(!t)return;data.trips=[t];if(onlyStop){t.stops=t.stops.filter(s=>s.id===$('#export-stop').value);if(!t.stops.length)return;}await exportPortable(data,$(onlyStop?'#export-stop-button':'#export-trip-button'),'旅行备份-'+t.name.replace(/[^\p{L}\p{N}-]/gu,'_')+(onlyStop?'-站点':''));}
 $('#export-trip-button').onclick=()=>run(false);$('#export-stop-button').onclick=()=>run(true);
};

