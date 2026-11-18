'use strict';
// Generated journals have their own state and media namespaces.
const generatedJournal = window.TRAVEL_JOURNAL;
$('#live-map').setAttribute('aria-label','可缩放的世界与城市地图');
// Cache generated media so browser edits can still reference an earlier seed.
// Full backups remain necessary: a browser can clear its IndexedDB at any time.
const journalFileBase=getFile;
getFile=async function(id) {
  const blob=await journalFileBase(id);
  if(blob&&DEMO_FILES[id]&&db) {
    try { await putFile(id,blob); } catch { /* surfaced by the initial caching pass */ }
  }
  return blob;
};
window.journalMediaReady=(async()=>{
  for(let attempt=0;!db&&attempt<50;attempt++)await new Promise(resolve=>setTimeout(resolve,100));
  if(!db)return false;
  try {
    for(const id of Object.keys(DEMO_FILES)) {
      const blob=await journalFileBase(id);
      if(!blob)throw Error('生成素材未能读取');
      await putFile(id,blob);
    }
    return true;
  } catch { toast('部分素材未能保存到浏览器，请保留网站文件并导出完整备份。');return false; }
})();
const journalRenderBase = render;
render = function() {
  journalRenderBase();
  document.title = generatedJournal.title;
  $('#film-intro h1').textContent = generatedJournal.title;
  $('.film-ending h2').textContent = generatedJournal.title;
  $('#route-summary').textContent = generatedJournal.subtitle || `${state.trips.length} 段旅行 · 一路的故事`;
  $('#demo-label').textContent = '我的旅行手账 · 本机保存';
};
about.onclick = () => showDialog(esc(generatedJournal.title),'<p>地图、文字和影像组成的旅行手账。点击开始放映，也可以选择地图上的城市。</p><p>编辑内容仅保存在当前设备和浏览器中。转移到其他设备前，请用“备份”导出包含媒体的完整 JSON；网页文件包含生成时的素材。</p><p>街道地图和全球城市搜索需要网络。默认生成与排版不需要 API Key。</p><p><a href="CREDITS.md" target="_blank" rel="noopener">素材与开源署名 ↗</a></p>');
// Explain layout in the editor without offering an unconfigured paid service.
checkDesignConnection = async function() {};
const journalBackup = openBackup;
openBackup = function() {
  journalBackup();
  const hint = document.createElement('p');
  hint.textContent = '网页文件保留生成时的内容；浏览器中的新增和排版请通过完整 JSON 备份带走。';
  $('#dialog-body').prepend(hint);
};
function showJournalRevision() {
  showDialog('发现新生成的手账版本','<p>当前保留了浏览器中的编辑。你可以先导出完整备份，再应用新生成的版本；应用时也会保留一份本机文字与排版快照，素材不会删除。</p><div class="form-actions"><button class="outline-btn" id="journal-backup-current">备份当前手账</button><button class="primary-btn" id="journal-apply-seed">应用新生成版本</button><button class="text-btn" id="journal-keep-local">继续浏览器版本</button></div>');
  $('#journal-backup-current').onclick = () => openBackup();
  $('#journal-keep-local').onclick = () => { closeDialog(); toast('已保留浏览器版本；可从工具栏“版本”切换。'); };
  $('#journal-apply-seed').onclick = () => {
    try { localStorage.setItem(journalStorageKey+':previous',JSON.stringify(state)); }
    catch { toast('无法保存旧版快照，请先导出完整备份。'); return; }
    snapshot(); state = structuredClone(generatedJournal.state); save(); closeDialog(); render();
    journalPendingRevision=false; revisionButton.hidden=true;
    toast('已应用新生成版本，旧版文字与排版可在“关于”中恢复。');
  };
}
const revisionButton = document.createElement('button');
revisionButton.textContent='版本'; revisionButton.title='查看新生成的版本'; revisionButton.hidden=!journalPendingRevision;
revisionButton.onclick=showJournalRevision; header.insertBefore(revisionButton,$('#fullscreen-top'));
const journalAbout = about.onclick;
about.onclick = () => {
  journalAbout();
  let previous;
  try { previous=JSON.parse(localStorage.getItem(journalStorageKey+':previous')); } catch {}
  if(previous&&Array.isArray(previous.trips)) {
    const restore=document.createElement('button'); restore.className='outline-btn';restore.textContent='恢复上次应用版本前的文字与排版';
    restore.onclick=()=>{snapshot();state=previous;save();closeDialog();journalPendingRevision=state.settings.journalSeedRevision!==generatedJournal.revision;revisionButton.hidden=!journalPendingRevision;render();toast('已恢复旧版文字与排版。');};
    $('#dialog-body').append(restore);
  }
};
render();
document.addEventListener('DOMContentLoaded',()=>{if(journalPendingRevision)showJournalRevision();},{once:true});
