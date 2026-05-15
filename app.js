/* ============================================================
   Kreator Instrukcji Oświetlenia — app.js
   ============================================================ */

const COLS=[
  {id:'blue',  bg:'#eff6ff',border:'#3b82f6',text:'#1e40af',dot:'#3b82f6'},
  {id:'purple',bg:'#f5f3ff',border:'#8b5cf6',text:'#5b21b6',dot:'#8b5cf6'},
  {id:'green', bg:'#ecfdf5',border:'#10b981',text:'#065f46',dot:'#10b981'},
  {id:'amber', bg:'#fffbeb',border:'#f59e0b',text:'#78350f',dot:'#f59e0b'},
  {id:'red',   bg:'#fef2f2',border:'#ef4444',text:'#7f1d1d',dot:'#ef4444'},
  {id:'gray',  bg:'#f9fafb',border:'#6b7280',text:'#1f2937',dot:'#6b7280'},
];
const COL=id=>COLS.find(c=>c.id===id)||COLS[0];
const CTRL={button:'tylko przycisk',sensor:'tylko sensor',both:'przycisk + sensor'};

let curStep=0;
let btnImgB64=null;
let secCnt=2, zoneCnt=10;

let sections=[
  mkSection(1,'ENGINEERING'),
];
function mkSection(id,name){
  return {id,name,image:null,zones:[mkZone(zoneCnt++,'S1','blue'),mkZone(zoneCnt++,'S2','purple'),mkZone(zoneCnt++,'S3','green')]};
}
function mkZone(id,name,colorId){
  return {id,name,description:'',colorId,controlType:'button',buttonKeys:[],logicRules:[]};
}

// ── STEPS ────────────────────────────────────────────────────────────────
const SNAMES=['Ustawienia','Przycisk','Sekcje','Logika','Podgląd'];
function renderSteps(){
  const bar=document.getElementById('steps-bar');bar.innerHTML='';
  SNAMES.forEach((s,i)=>{
    if(i>0){const d=document.createElement('div');d.className='step-sep';bar.appendChild(d);}
    const b=document.createElement('button');
    b.className='step-btn '+(i===curStep?'active':i<curStep?'done':'todo');
    b.innerHTML=`<span class="step-num">${i<curStep?'✓':i+1}</span>${s}`;
    b.onclick=()=>goTo(i);
    bar.appendChild(b);
  });
}
function goTo(n){
  document.getElementById('page-'+curStep).classList.add('hidden');
  curStep=n;
  document.getElementById('page-'+curStep).classList.remove('hidden');
  renderSteps();
  if(n===3)renderLogic();
  if(n===4)renderPreview();
  window.scrollTo({top:0,behavior:'smooth'});
}

// ── BUTTON IMAGE ─────────────────────────────────────────────────────────
function handleBtnFile(f){
  if(!f)return;
  const r=new FileReader();
  r.onload=ev=>{
    btnImgB64=ev.target.result;
    document.getElementById('btn-prev').src=btnImgB64;
    document.getElementById('btn-prev').classList.remove('hidden');
    document.getElementById('btn-ph').classList.add('hidden');
    document.getElementById('btn-rm').classList.remove('hidden');
  };
  r.readAsDataURL(f);
}
function handleBtnDrop(ev){ev.preventDefault();handleBtnFile(ev.dataTransfer.files[0]);}
function removeBtnImg(){
  btnImgB64=null;
  document.getElementById('btn-prev').classList.add('hidden');
  document.getElementById('btn-ph').classList.remove('hidden');
  document.getElementById('btn-rm').classList.add('hidden');
}

// ── SECTIONS ─────────────────────────────────────────────────────────────
function addSection(){sections.push(mkSection(secCnt++,'Sekcja '+secCnt));renderSections();}
function delSection(sid){sections=sections.filter(s=>s.id!==sid);renderSections();}
function toggleSection(sid){document.getElementById('sbody-'+sid).classList.toggle('hidden');}
function setSec(sid,k,v){sections=sections.map(s=>s.id===sid?{...s,[k]:v}:s);}

function handleSecImgFile(sid,file){
  if(!file)return;
  const r=new FileReader();
  r.onload=ev=>{
    const b64=ev.target.result;
    sections=sections.map(s=>s.id===sid?{...s,image:b64}:s);
    const pr=document.getElementById('simg-prev-'+sid);
    const ph=document.getElementById('simg-ph-'+sid);
    const rm=document.getElementById('simg-rm-'+sid);
    if(pr){pr.src=b64;pr.classList.remove('hidden');}
    if(ph)ph.classList.add('hidden');
    if(rm)rm.classList.remove('hidden');
  };
  r.readAsDataURL(file);
}
function removeSecImg(sid){
  sections=sections.map(s=>s.id===sid?{...s,image:null}:s);
  const pr=document.getElementById('simg-prev-'+sid);
  const ph=document.getElementById('simg-ph-'+sid);
  const rm=document.getElementById('simg-rm-'+sid);
  if(pr){pr.src='';pr.classList.add('hidden');}
  if(ph)ph.classList.remove('hidden');
  if(rm)rm.classList.add('hidden');
}

// ── ZONES ─────────────────────────────────────────────────────────────────
function addZone(sid){
  sections=sections.map(s=>s.id===sid?{...s,zones:[...s.zones,mkZone(zoneCnt++,'S'+(s.zones.length+1),COLS[s.zones.length%COLS.length].id)]}:s);
  renderSections();
}
function delZone(sid,zid){
  sections=sections.map(s=>s.id===sid?{...s,zones:s.zones.filter(z=>z.id!==zid)}:s);
  renderSections();
}
function toggleZone(zid){document.getElementById('zbody-'+zid).classList.toggle('hidden');}
function setZ(sid,zid,k,v){sections=sections.map(s=>s.id===sid?{...s,zones:s.zones.map(z=>z.id===zid?{...z,[k]:v}:z)}:s);}
function setZColor(sid,zid,cid){setZ(sid,zid,'colorId',cid);renderSections();}
function setZCtrl(sid,zid,v){setZ(sid,zid,'controlType',v);renderSections();}

function addKey(sid,zid){sections=sections.map(s=>s.id===sid?{...s,zones:s.zones.map(z=>z.id===zid?{...z,buttonKeys:[...z.buttonKeys,{id:Date.now(),label:'',pos:'left',actions:[{id:Date.now()+1,type:'short1',func:''}]}]}:z)}:s);renderSections();}
function addAction(sid,zid,kid){
  sections=sections.map(s=>s.id===sid?{...s,zones:s.zones.map(z=>z.id===zid?{...z,buttonKeys:z.buttonKeys.map(k=>{
    if(k.id!==kid)return k;
    const used=k.actions.map(a=>a.type);
    const all=['short1','long1','long2','short2'];
    const next=all.find(t=>!used.includes(t));
    if(!next)return k;
    return {...k,actions:[...k.actions,{id:Date.now(),type:next,func:''}]};
  })}:z)}:s);renderSections();
}
function setAction(sid,zid,kid,aid,v){sections=sections.map(s=>s.id===sid?{...s,zones:s.zones.map(z=>z.id===zid?{...z,buttonKeys:z.buttonKeys.map(k=>k.id===kid?{...k,actions:k.actions.map(a=>a.id===aid?{...a,func:v}:a)}:k)}:z)}:s);}
function delAction(sid,zid,kid,aid){sections=sections.map(s=>s.id===sid?{...s,zones:s.zones.map(z=>z.id===zid?{...z,buttonKeys:z.buttonKeys.map(k=>k.id===kid?{...k,actions:k.actions.filter(a=>a.id!==aid)}:k)}:z)}:s);renderSections();}
function setKey(sid,zid,kid,f,v){sections=sections.map(s=>s.id===sid?{...s,zones:s.zones.map(z=>z.id===zid?{...z,buttonKeys:z.buttonKeys.map(k=>k.id===kid?{...k,[f]:v}:k)}:z)}:s);}
function delKey(sid,zid,kid){sections=sections.map(s=>s.id===sid?{...s,zones:s.zones.map(z=>z.id===zid?{...z,buttonKeys:z.buttonKeys.filter(k=>k.id!==kid)}:z)}:s);renderSections();}

function addRule(sid,zid){sections=sections.map(s=>s.id===sid?{...s,zones:s.zones.map(z=>z.id===zid?{...z,logicRules:[...z.logicRules,{id:Date.now(),trigger:'',action:'',note:''}]}:z)}:s);renderSections();}
function setRule(sid,zid,rid,f,v){sections=sections.map(s=>s.id===sid?{...s,zones:s.zones.map(z=>z.id===zid?{...z,logicRules:z.logicRules.map(r=>r.id===rid?{...r,[f]:v}:r)}:z)}:s);}
function delRule(sid,zid,rid){sections=sections.map(s=>s.id===sid?{...s,zones:s.zones.map(z=>z.id===zid?{...z,logicRules:z.logicRules.filter(r=>r.id!==rid)}:z)}:s);renderSections();}

function e(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

// ── RENDER SECTIONS ───────────────────────────────────────────────────────
function renderSections(){
  const list=document.getElementById('sections-list');
  const emp=document.getElementById('sections-empty');
  list.innerHTML='';
  emp.classList.toggle('hidden',sections.length>0);

  sections.forEach(sec=>{
    const totalZones=sec.zones.length;
    const div=document.createElement('div');
    div.className='sec-wrap';

    let zonesHTML=sec.zones.map(z=>{
      const c=COL(z.colorId);
      const ACTION_LABELS={'short1':'1. krótkie','long1':'1. długie','long2':'2. długie','short2':'2. krótkie'};
      const ACTION_CSS={'short1':'at-short1','long1':'at-long1','long2':'at-long2','short2':'at-short2'};
      const keysH=(z.buttonKeys||[]).map(k=>{
        const acts=k.actions||[];
        const used=acts.map(a=>a.type);
        const allTypes=['short1','long1','long2','short2'];
        const canAdd=used.length<4;
        const actionsH=acts.map(a=>`
          <div class="action-row">
            <span class="action-type ${ACTION_CSS[a.type]}">${ACTION_LABELS[a.type]}</span>
            <input class="inp" style="font-size:12px" placeholder="np. ON/OFF, DIMM UP..." value="${e(a.func)}" oninput="setAction(${sec.id},${z.id},${k.id},${a.id},this.value)">
            <button class="xbtn" onclick="delAction(${sec.id},${z.id},${k.id},${a.id})">×</button>
          </div>`).join('');
        return `<div class="key-row">
          <div class="key-row-top">
            <input class="inp" style="font-size:12px" placeholder="Nazwa klawisza np. K1" value="${e(k.label)}" oninput="setKey(${sec.id},${z.id},${k.id},'label',this.value)">
            <div style="font-size:10px;color:#9ca3af;padding-top:6px">Pozycja na panelu</div>
            <select class="inp" style="font-size:11px;padding:8px 5px" onchange="setKey(${sec.id},${z.id},${k.id},'pos',this.value)">
              <option value="left"${k.pos==='left'?' selected':''}>lewa</option>
              <option value="right"${k.pos==='right'?' selected':''}>prawa</option>
              <option value="center"${k.pos==='center'?' selected':''}>środek</option>
            </select>
            <button class="xbtn" onclick="delKey(${sec.id},${z.id},${k.id})">×</button>
          </div>
          <div class="key-actions">
            ${actionsH}
            ${canAdd?`<button class="add-action-link" onclick="addAction(${sec.id},${z.id},${k.id})">+ dodaj akcję (${4-used.length} pozostałe)</button>`:'<span style="font-size:10px;color:#d1d5db;font-style:italic">Maksymalna liczba akcji osiągnięta</span>'}
          </div>
        </div>`;
      }).join('');
      const rulesH=z.logicRules.map((r,ri)=>`
        <div class="rule-box">
          <div class="rule-hdr"><span class="rule-lbl">Reguła ${ri+1}</span><button class="xbtn" onclick="delRule(${sec.id},${z.id},${r.id})">×</button></div>
          <div class="grid2" style="margin-bottom:7px">
            <div><label class="lbl" style="font-size:9px">Wyzwalacz</label><input class="inp" style="font-size:12px" placeholder="np. Naciśnięcie przycisku" value="${e(r.trigger)}" oninput="setRule(${sec.id},${z.id},${r.id},'trigger',this.value)"></div>
            <div><label class="lbl" style="font-size:9px">Akcja</label><input class="inp" style="font-size:12px" placeholder="np. Sensor zablokowany" value="${e(r.action)}" oninput="setRule(${sec.id},${z.id},${r.id},'action',this.value)"></div>
          </div>
          <div><label class="lbl" style="font-size:9px">Uwaga</label><input class="inp" style="font-size:12px" placeholder="np. Po 20 min braku ruchu — powrót do sensora" value="${e(r.note)}" oninput="setRule(${sec.id},${z.id},${r.id},'note',this.value)"></div>
        </div>`).join('');
      const cDotsH=COLS.map(cl=>`<div class="cdot${z.colorId===cl.id?' sel':''}" style="background:${cl.dot}" onclick="setZColor(${sec.id},${z.id},'${cl.id}')"></div>`).join('');
      const ctrlH=['button','sensor','both'].map(v=>`<button class="ctrl-btn${z.controlType===v?' active':''}" onclick="setZCtrl(${sec.id},${z.id},'${v}')">${CTRL[v]}</button>`).join('');
      return `<div class="zone-wrap" style="border-color:${c.border}">
        <div class="zone-hdr" style="background:${c.bg}" onclick="toggleZone(${z.id})">
          <div class="zone-hdr-l">
            <div class="zdot" style="background:${c.dot}"></div>
            <span class="zname" id="zname-${z.id}" style="color:${c.text}">${e(z.name)||'Strefa'}</span>
            <span class="zpill" style="background:${c.dot}22;color:${c.text}">${CTRL[z.controlType]}</span>
          </div>
          <div style="display:flex;gap:6px;align-items:center">
            <button onclick="event.stopPropagation();delZone(${sec.id},${z.id})" class="btn btn-danger btn-sm" style="font-size:11px;padding:3px 9px">usuń</button>
            <span style="color:#9ca3af;font-size:11px">▼</span>
          </div>
        </div>
        <div class="zbody hidden" id="zbody-${z.id}">
          <div class="grid2 field">
            <div><label class="lbl">Nazwa strefy</label><input class="inp" value="${e(z.name)}" oninput="setZ(${sec.id},${z.id},'name',this.value);document.getElementById('zname-${z.id}').textContent=this.value||'Strefa'"></div>
            <div><label class="lbl">Kolor</label><div class="color-row">${cDotsH}</div></div>
          </div>
          <div class="field"><label class="lbl">Opis strefy</label><textarea class="inp" rows="2" placeholder="np. Oświetlenie biurek przy oknie" oninput="setZ(${sec.id},${z.id},'description',this.value)">${e(z.description)}</textarea></div>
          <div class="field"><label class="lbl">Typ sterowania</label><div class="ctrl-btns">${ctrlH}</div></div>
          <div class="field">
            <div class="sub-hdr"><label class="lbl">Przyciski na panelu</label><button class="add-link" onclick="addKey(${sec.id},${z.id})">+ dodaj</button></div>
            ${keysH||'<p class="empty-msg">Brak przypisanych klawiszy</p>'}
          </div>
          <div class="field" style="margin-bottom:0">
            <div class="sub-hdr"><label class="lbl">Logika działania</label><button class="add-link" onclick="addRule(${sec.id},${z.id})">+ dodaj regułę</button></div>
            ${rulesH||'<p class="empty-msg">Brak zdefiniowanej logiki</p>'}
          </div>
        </div>
      </div>`;
    }).join('');

    div.innerHTML=`
      <div class="sec-hdr" onclick="toggleSection(${sec.id})">
        <div class="sec-hdr-l">
          <div class="sec-icon">${e(sec.name).charAt(0)}</div>
          <span class="sec-name-txt" id="secname-${sec.id}">${e(sec.name)||'Sekcja'}</span>
          <span class="sec-count">${totalZones} stref${totalZones===1?'a':totalZones<5?'y':''}
          </span>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <button onclick="event.stopPropagation();delSection(${sec.id})" class="btn btn-danger btn-sm" style="font-size:11px">usuń sekcję</button>
          <span style="color:#9ca3af;font-size:12px">▼</span>
        </div>
      </div>
      <div class="sec-body" id="sbody-${sec.id}">
        <div class="field">
          <label class="lbl">Nazwa sekcji / pomieszczenia</label>
          <input class="inp" value="${e(sec.name)}" oninput="setSec(${sec.id},'name',this.value);document.getElementById('secname-${sec.id}').textContent=this.value||'Sekcja';document.querySelector('#sec-card-${sec.id} .sec-icon').textContent=this.value.charAt(0)||'?'">
        </div>
        <div class="field">
          <label class="lbl">Grafika rzutu / schematu sekcji (opcjonalna)</label>
          <div class="img-drop" style="min-height:90px" onclick="document.getElementById('simg-inp-${sec.id}').click()" ondragover="event.preventDefault()" ondrop="(function(ev){ev.preventDefault();handleSecImgFile(${sec.id},ev.dataTransfer.files[0])})(event)">
            <div class="img-ph" id="simg-ph-${sec.id}" ${sec.image?'style="display:none"':''}>
              <div class="ic">🖼</div><p style="font-size:12px">Kliknij lub przeciągnij rzut / schemat</p>
            </div>
            <img id="simg-prev-${sec.id}" src="${sec.image||''}" ${sec.image?'':'class="hidden"'} style="width:100%;max-height:180px;object-fit:contain;background:#f9fafb;border-radius:8px">
          </div>
          <input type="file" id="simg-inp-${sec.id}" accept="image/*" class="hidden" onchange="handleSecImgFile(${sec.id},this.files[0])">
          <button id="simg-rm-${sec.id}" class="btn btn-danger btn-sm ${sec.image?'':'hidden'}" onclick="removeSecImg(${sec.id})" style="margin-top:6px;font-size:11px">Usuń grafikę</button>
        </div>
        <div style="margin-bottom:8px">
          <div class="sub-hdr" style="margin-bottom:8px">
            <label class="lbl" style="margin:0">Strefy w sekcji</label>
            <button class="add-link" onclick="addZone(${sec.id})">+ dodaj strefę</button>
          </div>
          ${zonesHTML||'<p class="empty-msg" style="padding:8px 0">Brak stref — kliknij "+ dodaj strefę"</p>'}
        </div>
      </div>`;

    // fix sec-icon selector
    div.id='sec-card-'+sec.id;
    list.appendChild(div);
  });
}

// ── LOGIC PREVIEW ─────────────────────────────────────────────────────────
function renderLogic(){
  const c=document.getElementById('logic-prev');c.innerHTML='';
  sections.forEach(sec=>{
    const sh=document.createElement('div');
    sh.style.cssText='font-weight:700;font-size:13px;color:#111827;margin:10px 0 6px;padding-left:2px';
    sh.textContent=sec.name;
    c.appendChild(sh);
    sec.zones.forEach(z=>{
      const col=COL(z.colorId);
      const rulesH=z.logicRules.length===0
        ?'<p style="padding:6px 10px;font-size:11px;color:#d1d5db;font-style:italic">Brak reguł logiki</p>'
        :z.logicRules.map((r,i)=>`
          <div class="lp-rule">
            <span class="lp-num">${i+1}.</span>
            <div class="chips">
              ${r.trigger?`<span class="chip">${e(r.trigger)}</span>`:''}
              ${r.trigger&&r.action?`<span class="chip-arr">→</span>`:''}
              ${r.action?`<span class="chip-res" style="background:${col.bg};color:${col.text}">${e(r.action)}</span>`:''}
              ${r.note?`<span class="chip-note">${e(r.note)}</span>`:''}
            </div>
          </div>`).join('');
      const div=document.createElement('div');
      div.className='lp-zone';div.style.borderColor=col.border+'44';
      div.innerHTML=`
        <div class="lp-hdr" style="background:${col.bg}">
          <div class="zdot" style="background:${col.dot}"></div>
          <span style="font-weight:700;font-size:12px;color:${col.text}">${e(z.name)}</span>
          <span style="font-size:11px;color:#6b7280;margin-left:4px">— ${e(z.description)||'brak opisu'}</span>
        </div>
        <div class="lp-body">${rulesH}</div>`;
      c.appendChild(div);
    });
  });
}

// ── MINI PREVIEW ───────────────────────────────────────────────────────────
function renderPreview(){
  const title=document.getElementById('f-title').value;
  const subtitle=document.getElementById('f-subtitle').value;
  const tags=document.getElementById('f-tags').value;
  const note=document.getElementById('f-note').value;
  const tagsH=tags.split(',').filter(Boolean).map(t=>`<span class="pv-tag">${e(t.trim())}</span>`).join('');

  let sectionsH='';
  sections.forEach((sec,si)=>{
    const imgH=sec.image?`<div style="text-align:center;margin:8px 0 12px"><img src="${sec.image}" style="max-width:100%;max-height:160px;object-fit:contain;border-radius:8px;border:1px solid #f3f4f6"></div>`:'';
    const btnH=btnImgB64?`<div style="text-align:center;margin:8px 0 12px"><img src="${btnImgB64}" style="max-height:100px;object-fit:contain;border-radius:6px;border:1px solid #f3f4f6"></div>`:'';
    sectionsH+=`
      <div style="margin-bottom:14px">
        <div style="font-weight:700;font-size:12px;color:#111827;margin-bottom:8px;display:flex;align-items:center;gap:6px">
          <span style="background:#111827;color:#fff;border-radius:5px;padding:1px 7px;font-size:10px">${e(sec.name)}</span>
        </div>
        ${imgH}
        ${btnH}
      </div>`;
  });

  document.getElementById('preview-out').innerHTML=`
    <div class="pv-hdr">
      <div class="pv-title">${e(title)}</div>
      <div class="pv-sub">${e(subtitle)}</div>
      <div class="pv-tags">${tagsH}</div>
    </div>
    <div class="card" style="padding:14px">
      ${sectionsH}
      ${note?`<div class="note-box">${e(note)}</div>`:''}
    </div>`;
}

// ── EXPORT HTML ────────────────────────────────────────────────────────────
function buildHTMLContent(){
  const title=document.getElementById('f-title').value||'Instrukcja';
  const subtitle=document.getElementById('f-subtitle').value;
  const tags=document.getElementById('f-tags').value;
  const note=document.getElementById('f-note').value;

  const tagsH=tags.split(',').filter(Boolean)
    .map(t=>`<span style="font-size:10px;font-family:monospace;background:rgba(255,255,255,.12);color:#6ee7b7;padding:2px 9px;border-radius:4px">${e(t.trim())}</span>`).join('');

  function flowChip(txt,bg,color){return`<span style="display:inline-block;font-size:11px;padding:4px 10px;border-radius:6px;background:${bg};color:${color};font-weight:500">${e(txt)}</span>`;}
  function arrow(){return`<span style="font-size:13px;color:#9ca3af;margin:0 3px">→</span>`;}

  let sectionsDetailH='';
  sections.forEach(sec=>{
    // zona grid usunięty — wyświetlamy tylko logikę stref

    const imgH=sec.image?`<div style="text-align:center;margin:14px 0">
      <img src="${sec.image}" style="max-height:200px;object-fit:contain;border-radius:10px;border:1px solid #e5e7eb">
    </div>`:'';

    let zonesLogicH='';
    sec.zones.forEach(z=>{
      const c=COL(z.colorId);
      let inner='';
      const ACTION_LABELS_E={'short1':'1. krótkie naciśnięcie','long1':'1. długie przytrzymanie','long2':'2. długie przytrzymanie','short2':'2. krótkie naciśnięcie'};
      const ACTION_COLORS={'short1':'#dbeafe','long1':'#e0e7ff','long2':'#ede9fe','short2':'#fce7f3'};
      const ACTION_TEXT={'short1':'#1e40af','long1':'#3730a3','long2':'#5b21b6','short2':'#9d174d'};
      if(z.buttonKeys&&z.buttonKeys.length){
        z.buttonKeys.forEach(k=>{
          const acts=k.actions||[];
          if(!acts.length)return;
          inner+=`<div style="border:1px solid #f3f4f6;border-radius:8px;overflow:hidden;margin-bottom:10px">
            <div style="display:flex;align-items:center;justify-content:space-between;padding:7px 12px;background:#f9fafb;border-bottom:1px solid #f3f4f6">
              <code style="background:#e5e7eb;padding:2px 8px;border-radius:4px;font-size:11px;color:#374151;font-weight:600">${e(k.label)||'Klawisz'}</code>
              <span style="font-size:10px;color:#9ca3af">pozycja: ${e(k.pos)}</span>
            </div>
            <table style="width:100%;border-collapse:collapse;font-size:12px">
              <thead><tr>
                <th style="text-align:left;padding:5px 8px;background:#fff;font-size:9px;font-weight:600;text-transform:uppercase;color:#9ca3af;width:180px">Typ naciśnięcia</th>
                <th style="text-align:left;padding:5px 8px;background:#fff;font-size:9px;font-weight:600;text-transform:uppercase;color:#9ca3af">Akcja</th>
              </tr></thead><tbody>
              ${acts.map(a=>`<tr>
                <td style="padding:5px 8px;border-bottom:1px solid #f9fafb">
                  <span style="display:inline-block;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;padding:2px 8px;border-radius:4px;background:${ACTION_COLORS[a.type]};color:${ACTION_TEXT[a.type]}">${ACTION_LABELS_E[a.type]||a.type}</span>
                </td>
                <td style="padding:5px 8px;border-bottom:1px solid #f9fafb;color:#374151;font-weight:500">${e(a.func)}</td>
              </tr>`).join('')}
              </tbody>
            </table>
          </div>`;
        });
      }
      if(z.logicRules.length){
        z.logicRules.forEach((r,i)=>{
          const parts=[];
          if(r.trigger)parts.push(flowChip(r.trigger,'#f3f4f6','#374151'));
          if(r.trigger&&r.action)parts.push(arrow());
          if(r.action)parts.push(flowChip(r.action,c.bg,c.text));
          if(r.note)parts.push(`<span style="font-size:10px;color:#9ca3af;font-style:italic;margin-left:3px">${e(r.note)}</span>`);
          inner+=`<div style="display:flex;flex-wrap:wrap;align-items:center;gap:3px;padding:6px 0;border-bottom:1px solid #f9fafb">
            <span style="font-size:11px;color:#d1d5db;min-width:18px;font-family:monospace">${i+1}.</span>${parts.join('')}</div>`;
        });
      }
      if(!inner)return;
      zonesLogicH+=`<div style="border-radius:9px;border:1px solid ${c.border}44;overflow:hidden;margin-bottom:10px">
        <div style="display:flex;align-items:center;gap:8px;padding:9px 12px;background:${c.bg}">
          <div style="width:9px;height:9px;border-radius:50%;background:${c.dot};flex-shrink:0"></div>
          <span style="font-weight:700;font-size:12px;color:${c.text}">${e(z.name)}</span>
          <span style="font-size:11px;color:#6b7280">— ${e(z.description)||'brak opisu'}</span>
        </div>
        <div style="padding:10px 12px;background:#fff">${inner}</div>
      </div>`;
    });

    const btnInSecH=btnImgB64?`<div style="text-align:center;margin:0 0 16px">
      <img src="${btnImgB64}" style="max-height:180px;object-fit:contain;border-radius:8px;border:1px solid #e5e7eb">
    </div>`:'';

    sectionsDetailH+=`
      <div style="margin-bottom:24px">
        <div style="display:inline-flex;align-items:center;gap:8px;margin-bottom:12px">
          <span style="background:#111827;color:#fff;border-radius:6px;padding:3px 10px;font-size:11px;font-weight:700">${e(sec.name)}</span>
        </div>
        ${imgH}
        ${btnInSecH}
        ${zonesLogicH?`<div style="margin-top:12px">${zonesLogicH}</div>`:''}
      </div>`;
  });

  const btnImgH='';

  const noteH=note?`<div style="background:#fffbeb;border:1px solid #f59e0b;border-radius:10px;padding:12px 16px;font-size:12px;color:#78350f;line-height:1.6;margin-top:8px">
    <strong style="display:block;margin-bottom:3px">ℹ Uwaga</strong>${e(note)}</div>`:'';

  return {title, subtitle, tagsH, sectionsDetailH, btnImgH, noteH};
}

function exportHTML(){
  const {title,subtitle,tagsH,sectionsDetailH,btnImgH,noteH}=buildHTMLContent();
  const html=`<!DOCTYPE html>
<html lang="pl"><head><meta charset="UTF-8">
<title>${e(title)}</title>
<meta name="description" content="Kreator instrukcji sterowania oświetleniem — Vertex, Node-RED, BMS">
<meta name="author" content="lech604">
<meta property="og:title" content="Kreator Instrukcji Oświetlenia">
<meta property="og:description" content="Twórz profesjonalne instrukcje sterowania oświetleniem i eksportuj do PDF">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'DM Sans',sans-serif;background:#f3f4f6;color:#111827}.page{max-width:800px;margin:0 auto;padding:32px 24px}@media print{body{background:#fff}.page{padding:0}@page{margin:14mm;size:A4}}</style>
</head><body><div class="page">
<div style="background:#111827;color:#fff;border-radius:12px;padding:22px 26px;margin-bottom:22px">
  <div style="font-size:20px;font-weight:700">${e(title)}</div>
  ${subtitle?`<div style="font-size:12px;color:#9ca3af;margin-top:4px">${e(subtitle)}</div>`:''}
  <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap">${tagsH}</div>
</div>
${sectionsDetailH}
${btnImgH}
${noteH}
</div></body></html>`;
  const blob=new Blob([html],{type:'text/html;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='instrukcja.html';a.click();
  closeExport();
}

// ── EXPORT PDF ─────────────────────────────────────────────────────────────
async function exportPDF(){
  const btn=document.getElementById('btn-exp-pdf');
  const statusEl=document.getElementById('exp-status');

  function setStatus(type,msg){
    statusEl.className='status-bar status-'+type;
    statusEl.classList.remove('hidden');
    statusEl.innerHTML=msg;
  }

  btn.disabled=true;
  setStatus('info','<span class="spin">⟳</span> Generuję PDF…');

  try {
    // Build a hidden render div
    const {title,subtitle,tagsH,sectionsDetailH,btnImgH,noteH}=buildHTMLContent();
    const wrap=document.createElement('div');
    wrap.style.cssText='position:fixed;left:-9999px;top:0;width:794px;background:#fff;font-family:DM Sans,system-ui,sans-serif;color:#111827;padding:32px;';
    wrap.innerHTML=`
      <div style="background:#111827;color:#fff;border-radius:12px;padding:22px 26px;margin-bottom:22px">
        <div style="font-size:20px;font-weight:700">${e(title)}</div>
        ${subtitle?`<div style="font-size:12px;color:rgba(255,255,255,.5);margin-top:4px">${e(subtitle)}</div>`:''}
        <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap">${tagsH.replace(/rgba\(255,255,255,\.12\)/g,'#2d3748')}</div>
      </div>
      ${sectionsDetailH}
      ${btnImgH}
      ${noteH}`;
    document.body.appendChild(wrap);

    // Wait for images to load
    await Promise.all([...wrap.querySelectorAll('img')].map(img=>
      img.complete ? Promise.resolve() :
      new Promise(res=>{img.onload=res;img.onerror=res;})
    ));
    await new Promise(r=>setTimeout(r,300));

    const canvas=await html2canvas(wrap,{
      scale:2,useCORS:true,allowTaint:true,
      width:794,backgroundColor:'#fff',
      logging:false
    });
    document.body.removeChild(wrap);

    const {jsPDF}=window.jspdf;
    const pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
    const pageW=pdf.internal.pageSize.getWidth();
    const pageH=pdf.internal.pageSize.getHeight();
    const imgData=canvas.toDataURL('image/jpeg',0.92);
    const imgW=pageW;
    const imgH=(canvas.height*pageW)/canvas.width;

    let y=0;
    while(y<imgH){
      if(y>0)pdf.addPage();
      pdf.addImage(imgData,'JPEG',0,y>0?-(y):0,imgW,imgH,undefined,'FAST');
      y+=pageH;
    }

    pdf.save('instrukcja.pdf');
    setStatus('ok','✓ PDF zapisany!');
    setTimeout(()=>{statusEl.classList.add('hidden');closeExport();},1500);
  } catch(err){
    setStatus('err','Błąd: '+err.message);
    console.error(err);
  }
  btn.disabled=false;
}

function openExport(){document.getElementById('export-modal').classList.remove('hidden');}
function closeExport(){document.getElementById('export-modal').classList.add('hidden');}

// ── INIT ───────────────────────────────────────────────────────────────────
renderSteps();
renderSections();