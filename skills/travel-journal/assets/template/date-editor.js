'use strict';
function normalizeTypedDate(text){
 const m=String(text).trim().match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
 if(!m)return null;const y=+m[1],month=+m[2],day=+m[3];
 if(y<1000||y>9999||month<1||month>12||day<1||day>31)return null;
 const d=new Date(Date.UTC(y,month-1,day));if(d.getUTCFullYear()!==y||d.getUTCMonth()!==month-1||d.getUTCDate()!==day)return null;
 return `${y}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}
const editTripBeforeStableDates=editTrip;
editTrip=function(t){
 editTripBeforeStableDates(t);
 const start=$('#range-start'),end=$('#range-end'),hint=$('#range-day-count'),saveButton=$('#range-save'),saveBefore=saveButton.onclick;
 const refresh=()=>{const a=normalizeTypedDate(start.value),b=normalizeTypedDate(end.value);hint.textContent=a&&b?(b<a?'结束日期不能早于开始日期。':`共 ${Math.round((dateNumber(b)-dateNumber(a))/DAY_MS)+1} 天，每一天单独安排站点。`):'可直接输入，例如 2026-09-12，也可点击日历选择。';};
 for(const input of [start,end]){
  input.type='text';input.removeAttribute('min');input.placeholder='YYYY-MM-DD';input.maxLength=10;input.autocomplete='off';input.spellcheck=false;
  input.oninput=()=>{input.removeAttribute('aria-invalid');refresh();};
  input.onblur=()=>{const value=normalizeTypedDate(input.value);if(value)input.value=value;refresh();};
  const group=document.createElement('div');group.className='stable-date-control';input.before(group);group.append(input);
  const picker=document.createElement('input');picker.type='date';picker.className='date-calendar-native';picker.tabIndex=-1;picker.setAttribute('aria-label',input===start?'日历选择开始日期':'日历选择结束日期');
  const button=document.createElement('button');button.type='button';button.className='outline-btn';button.textContent='日历';button.setAttribute('aria-label',input===start?'选择开始日期':'选择结束日期');group.append(button,picker);
  button.onclick=()=>{picker.value=normalizeTypedDate(input.value)||'';if(input===end)picker.min=normalizeTypedDate(start.value)||'';try{if(picker.showPicker)picker.showPicker();else{picker.focus();picker.click();}}catch{picker.focus();picker.click();}};
  picker.onchange=()=>{if(picker.value){input.value=picker.value;input.removeAttribute('aria-invalid');refresh();}};
 }
 saveButton.onclick=()=>{for(const input of [start,end]){if(input.value.trim()){const value=normalizeTypedDate(input.value);if(!value){input.setAttribute('aria-invalid','true');hint.textContent='请填写完整有效的日期，例如 2026-09-12。';input.focus();return;}input.value=value;}}saveBefore();};refresh();
};

