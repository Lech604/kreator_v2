/* ==========================================
KREATOR INSTRUKCJI STEROWANIA OŚWIETLENIEM
Wersja 2.1 – zdjęcia, bez daty
========================================== */

/* ---------- TYPY AKCJI ---------- */
const ACTION_TYPES = [
  { value: '',         label: '— wybierz —',        cls: '' },
  { value: 'onoff',    label: 'Włącz / Wyłącz',        cls: 'action-onoff' },
  { value: 'on',       label: 'Włącz',                cls: 'action-on' },
  { value: 'off',      label: 'Wyłącz',               cls: 'action-off' },
  { value: 'up',       label: 'Rozjaśnia ▲ (UP)',      cls: 'action-up' },
  { value: 'down',     label: 'Ściemnia ▼ (DOWN)',   cls: 'action-down' },
  { value: 'updown',   label: 'UP / DOWN ▲▼',            cls: 'action-updown'  },
  { value: 'scene',    label: 'Scena / Preset',        cls: 'action-scene' },
  { value: 'hold_up',  label: 'Przytrzymaj ▲',        cls: 'action-up' },
  { value: 'hold_dn',  label: 'Przytrzymaj ▼',        cls: 'action-down' },
  { value: 'group',    label: 'Wywołanie grupy',       cls: 'action-other' },
  { value: 'other',    label: 'Inne',                  cls: 'action-other' },
];

const PRESS_MODES = [
  { value: 'short',   label: 'Krótkie' },
  { value: 'long',    label: 'Długie (przytrzymanie)' },
  { value: 'double',  label: 'Podwójne' },
  { value: 'single',  label: 'Jedno naciśnięcie' },
];

const SENSOR_TYPES = [
  { value: 'motion',    label: '🏃 Czujnik ruchu (PIR)' },
  { value: 'daylight',  label: '☀️ Czujnik jasności (DALI)' },
  { value: 'timer',     label: '⏱ Timer / harmonogram' },
  { value: 'bms',       label: '🏢 BMS / system nadrzędny' },
  { value: 'other',     label: '⚙️ Inny' },
];

/* ---------- STAN APLIKACJI ---------- */
let state = {
  floorPlan: null,   // base64 rzut pomieszczenia
  panels: [],
  sensors: [],
  notes: [],
};

let panelCounter  = 0;
let keyCounter    = 0;
let sensorCounter = 0;
let noteCounter   = 0;

/* ---------- INICJALIZACJA ---------- */
document.addEventListener('DOMContentLoaded', () => {
  loadState();

  ['docTitle','docLocation','docPanel','docNote'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
      saveState();
      renderPreview();
    });
  });

  document.getElementById('btnAddPanel').addEventListener('click', addPanel);
  document.getElementById('btnAddSensor').addEventListener('click', addSensor);
  document.getElementById('btnAddNote').addEventListener('click', addNote);
  document.getElementById('btnPDF').addEventListener('click', exportPDF);
  document.getElementById('btnDOCX').addEventListener('click', exportDOCX);
  document.getElementById('btnClear').addEventListener('click', clearAll);

  // Upload rzutu pomieszczenia
  const fpInput = document.getElementById('floorPlanInput');
  if (fpInput) {
    fpInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        state.floorPlan = ev.target.result;
        saveState();
        renderPreview();
        // Pokaż podgląd rzutu
        const preview = document.getElementById('floorPlanPreview');
        if (preview) {
          preview.src = state.floorPlan;
          preview.style.display = 'block';
        }
        const removeBtn = document.getElementById('btnRemoveFloorPlan');
        if (removeBtn) removeBtn.style.display = 'inline-block';
      };
      reader.readAsDataURL(file);
    });
  }

  const removeFpBtn = document.getElementById('btnRemoveFloorPlan');
  if (removeFpBtn) {
    removeFpBtn.addEventListener('click', () => {
      state.floorPlan = null;
      saveState();
      renderPreview();
      const preview = document.getElementById('floorPlanPreview');
      if (preview) { preview.src = ''; preview.style.display = 'none'; }
      if (fpInput) fpInput.value = '';
      removeFpBtn.style.display = 'none';
    });
  }

  renderPreview();
});

/* ==========================================
PANELE
========================================== */
function addPanel(data) {
  panelCounter++;
  const id = data?.id || panelCounter;
  const panel = {
    id,
    name:  data?.name  || ('Panel ' + id),
    image: data?.image || null,  // zdjęcie panelu/przycisku
    keys:  data?.keys  || [],
  };
  state.panels.push(panel);

  const el = createPanelEl(panel);
  document.getElementById('panelsContainer').appendChild(el);

  if (!data?.keys?.length) {
    for (let i = 1; i <= 4; i++) addKey(panel.id, { label: 'K' + i });
  } else {
    data.keys.forEach(k => addKey(panel.id, k));
  }

  // Przywróć zdjęcie panelu jeśli było zapisane
  if (panel.image) {
    const img = document.getElementById('panel-img-' + panel.id);
    const prev = document.getElementById('panel-img-preview-' + panel.id);
    if (img) img.style.display = 'block';
    if (prev) { prev.src = panel.image; prev.style.display = 'block'; }
    const removeBtn = document.getElementById('panel-img-remove-' + panel.id);
    if (removeBtn) removeBtn.style.display = 'inline-block';
  }

  saveState();
  renderPreview();
}

function createPanelEl(panel) {
  const el = document.createElement('div');
  el.className = 'panel-block';
  el.id = 'panel-' + panel.id;

  el.innerHTML = `
    <div class="panel-header">
      <div class="panel-header-left">
        <div class="panel-num">${panel.id}</div>
        <input type="text" class="panel-name-input" value="${esc(panel.name)}" placeholder="Nazwa panelu / lokalizacja">
      </div>
      <div class="panel-header-right">
        <label class="btn-upload" title="Dodaj zdjęcie przycisku">
          📷 Zdjęcie przycisku
          <input type="file" accept="image/*" id="panel-file-${panel.id}" style="display:none">
        </label>
        <button class="btn-img-remove" id="panel-img-remove-${panel.id}" style="display:none" title="Usuń zdjęcie">✕ Zdjęcie</button>
        <button class="btn-danger" onclick="removePanel(${panel.id})">✕ Usuń panel</button>
      </div>
    </div>
    <div class="panel-img-row" id="panel-img-${panel.id}" style="display:none">
      <img id="panel-img-preview-${panel.id}" src="" alt="zdjęcie przycisku" class="panel-img-preview">
    </div>
    <div class="panel-body">
      <table class="keys-table">
        <thead>
          <tr>
            <th style="width:60px">Klawisz</th>
            <th>Co steruje / nazwa strefy</th>
            <th style="width:160px">Typ akcji</th>
            <th style="width:140px">Tryb naciśnięcia</th>
            <th style="width:36px"></th>
          </tr>
        </thead>
        <tbody id="keys-${panel.id}"></tbody>
      </table>
      <div class="panel-footer">
        <button class="btn-add" onclick="addKey(${panel.id})">+ Klawisz</button>
      </div>
    </div>
  `;

  // Zdarzenia: zmiana nazwy
  el.querySelector('.panel-name-input').addEventListener('input', e => {
    const p = state.panels.find(p => p.id === panel.id);
    if (p) p.name = e.target.value;
    saveState(); renderPreview();
  });

  // Upload zdjęcia przycisku
  const fileInput = el.querySelector('#panel-file-' + panel.id);
  fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const p = state.panels.find(p => p.id === panel.id);
      if (p) p.image = ev.target.result;
      const imgRow = document.getElementById('panel-img-' + panel.id);
      const imgEl  = document.getElementById('panel-img-preview-' + panel.id);
      if (imgRow) imgRow.style.display = 'block';
      if (imgEl)  { imgEl.src = ev.target.result; imgEl.style.display = 'block'; }
      const removeBtn = document.getElementById('panel-img-remove-' + panel.id);
      if (removeBtn) removeBtn.style.display = 'inline-block';
      saveState(); renderPreview();
    };
    reader.readAsDataURL(file);
  });

  // Usuń zdjęcie przycisku
  el.querySelector('#panel-img-remove-' + panel.id).addEventListener('click', () => {
    const p = state.panels.find(p => p.id === panel.id);
    if (p) p.image = null;
    const imgRow = document.getElementById('panel-img-' + panel.id);
    const imgEl  = document.getElementById('panel-img-preview-' + panel.id);
    if (imgRow) imgRow.style.display = 'none';
    if (imgEl)  imgEl.src = '';
    fileInput.value = '';
    const removeBtn = document.getElementById('panel-img-remove-' + panel.id);
    if (removeBtn) removeBtn.style.display = 'none';
    saveState(); renderPreview();
  });

  return el;
}

function removePanel(id) {
  state.panels = state.panels.filter(p => p.id !== id);
  const el = document.getElementById('panel-' + id);
  if (el) el.remove();
  saveState();
  renderPreview();
}

/* ==========================================
KLAWISZE
========================================== */
function addKey(panelId, data) {
  keyCounter++;
  const id  = data?.id     || keyCounter;
  const key = {
    id,
    label:  data?.label  || '',
    name:   data?.name   || '',
    action: data?.action || '',
    mode:   data?.mode   || 'short',
  };

  const panel = state.panels.find(p => p.id === panelId);
  if (panel && !panel.keys.find(k => k.id === id)) panel.keys.push(key);

  const tbody = document.getElementById('keys-' + panelId);
  if (!tbody) return;

  const row = document.createElement('tr');
  row.id = 'key-' + panelId + '-' + id;
  row.innerHTML = `
    <td>
      <input type="text" class="key-label-input" value="${esc(key.label)}" placeholder="K1" maxlength="6"
        style="width:50px;text-align:center;font-weight:700;font-size:13px">
    </td>
    <td>
      <input type="text" class="key-name-input" value="${esc(key.name)}" placeholder="np. Oświetlenie ogólne">
    </td>
    <td>
      <select class="key-action-select">
        ${ACTION_TYPES.map(a => `<option value="${a.value}" ${key.action===a.value?'selected':''}>${a.label}</option>`).join('')}
      </select>
    </td>
    <td>
      <select class="key-mode-select">
        ${PRESS_MODES.map(m => `<option value="${m.value}" ${key.mode===m.value?'selected':''}>${m.label}</option>`).join('')}
      </select>
    </td>
    <td>
      <button class="btn-row-del" title="Usuń klawisz" onclick="removeKey(${panelId},${id})">✕</button>
    </td>
  `;

  function update() {
    const k = panel?.keys.find(k => k.id === id);
    if (!k) return;
    k.label  = row.querySelector('.key-label-input').value;
    k.name   = row.querySelector('.key-name-input').value;
    k.action = row.querySelector('.key-action-select').value;
    k.mode   = row.querySelector('.key-mode-select').value;
    saveState(); renderPreview();
  }

  row.querySelectorAll('input,select').forEach(el => el.addEventListener('change', update));
  row.querySelectorAll('input').forEach(el => el.addEventListener('input', update));
  tbody.appendChild(row);
  saveState(); renderPreview();
}

function removeKey(panelId, keyId) {
  const panel = state.panels.find(p => p.id === panelId);
  if (panel) panel.keys = panel.keys.filter(k => k.id !== keyId);
  const row = document.getElementById('key-' + panelId + '-' + keyId);
  if (row) row.remove();
  saveState(); renderPreview();
}

/* ==========================================
SENSORY
========================================== */
function addSensor(data) {
  sensorCounter++;
  const id = data?.id || sensorCounter;
  const sensor = {
    id,
    type:   data?.type   || 'motion',
    name:   data?.name   || '',
    action: data?.action || '',
  };
  state.sensors.push(sensor);

  const el = document.createElement('div');
  el.className = 'sensor-block';
  el.id = 'sensor-' + id;
  el.innerHTML = `
    <div class="sensor-row">
      <select class="sensor-type-select">
        ${SENSOR_TYPES.map(t => `<option value="${t.value}" ${sensor.type===t.value?'selected':''}>${t.label}</option>`).join('')}
      </select>
      <input type="text" class="sensor-name-input" value="${esc(sensor.name)}" placeholder="Lokalizacja / opis czujnika">
      <input type="text" class="sensor-action-input" value="${esc(sensor.action)}" placeholder="Co robi? np. wyłącza po 15 min">
      <button class="btn-row-del" onclick="removeSensor(${id})">✕</button>
    </div>
  `;

  function update() {
    const s = state.sensors.find(s => s.id === id);
    if (!s) return;
    s.type   = el.querySelector('.sensor-type-select').value;
    s.name   = el.querySelector('.sensor-name-input').value;
    s.action = el.querySelector('.sensor-action-input').value;
    saveState(); renderPreview();
  }

  el.querySelectorAll('input,select').forEach(e => {
    e.addEventListener('change', update);
    e.addEventListener('input',  update);
  });

  document.getElementById('sensorsContainer').appendChild(el);
  saveState(); renderPreview();
}

function removeSensor(id) {
  state.sensors = state.sensors.filter(s => s.id !== id);
  const el = document.getElementById('sensor-' + id);
  if (el) el.remove();
  saveState(); renderPreview();
}

/* ==========================================
UWAGI
========================================== */
function addNote(data) {
  noteCounter++;
  const id = data?.id || noteCounter;
  const note = { id, text: data?.text || '' };
  state.notes.push(note);

  const el = document.createElement('div');
  el.className = 'note-block';
  el.id = 'note-' + id;
  el.innerHTML = `
    <div class="note-row">
      <textarea class="note-textarea" rows="2" placeholder="np. Przy wejściu do sali priorytet ma zawsze scena 1">${esc(note.text)}</textarea>
      <button class="btn-row-del" onclick="removeNote(${id})">✕</button>
    </div>
  `;

  el.querySelector('.note-textarea').addEventListener('input', e => {
    const n = state.notes.find(n => n.id === id);
    if (n) n.text = e.target.value;
    saveState(); renderPreview();
  });

  document.getElementById('notesContainer').appendChild(el);
  saveState(); renderPreview();
}

function removeNote(id) {
  state.notes = state.notes.filter(n => n.id !== id);
  const el = document.getElementById('note-' + id);
  if (el) el.remove();
  saveState(); renderPreview();
}

/* ==========================================
PODGLĄD NA ŻYWO
========================================== */
function renderPreview() {
  const title      = val('docTitle') || 'Instrukcja sterowania oświetleniem';
  const location   = val('docLocation');
  const panel      = val('docPanel');
  const globalNote = val('docNote');

  let html = '';

  // Nagłówek
  html += `<div class="preview-header">
    <div class="preview-title">${esc(title)}</div>
    <div class="preview-meta">
      ${location ? `<span>📍 ${esc(location)}</span>` : ''}
      ${panel    ? `<span>🔲 ${esc(panel)}</span>`    : ''}
    </div>
  </div>`;

  // Rzut pomieszczenia
  if (state.floorPlan) {
    html += `<div class="preview-floor-plan">
      <div class="preview-subsection-title">Rzut pomieszczenia</div>
      <img src="${state.floorPlan}" alt="Rzut pomieszczenia" style="max-width:100%;border-radius:4px;margin-top:6px">
    </div>`;
  }

  // Uwaga globalna
  if (globalNote.trim()) {
    html += `<div class="preview-global-note">ℹ️ ${esc(globalNote)}</div>`;
  }

  // Panele z klawiszami
  if (state.panels.length > 0) {
    state.panels.forEach(panel => {
      html += `<div class="preview-section">
        <div class="preview-section-title">🎛 ${esc(panel.name)}</div>`;

      // Zdjęcie przycisku
      if (panel.image) {
        html += `<div class="preview-panel-img">
          <img src="${panel.image}" alt="Zdjęcie przycisku" style="max-height:120px;border-radius:6px;border:1px solid #ddd;margin-bottom:8px">
        </div>`;
      }

      const filledKeys = panel.keys.filter(k => k.name || k.action);

      if (filledKeys.length === 0) {
        html += `<p style="color:#9ca3af;font-size:12px;font-style:italic">Brak skonfigurowanych klawiszy</p>`;
      } else {
        html += `<table class="preview-keys-table">
          <thead>
            <tr>
              <th>Klawisz</th>
              <th>Co steruje</th>
              <th>Akcja</th>
              <th>Tryb</th>
            </tr>
          </thead>
          <tbody>`;

        filledKeys.forEach(k => {
          const actionInfo = ACTION_TYPES.find(a => a.value === k.action) || { label: k.action, cls: '' };
          const modeInfo   = PRESS_MODES.find(m => m.value === k.mode)   || { label: k.mode };
          html += `<tr>
            <td><span class="key-badge">${esc(k.label || '—')}</span></td>
            <td>${esc(k.name)}</td>
            <td><span class="action-badge ${actionInfo.cls}">${actionInfo.label}</span></td>
            <td class="mode-cell">${modeInfo.label}</td>
          </tr>`;
        });

        html += `</tbody></table>`;
      }

      html += `</div>`;
    });
  }

  // Sensory
  const filledSensors = state.sensors.filter(s => s.name || s.action);
  if (filledSensors.length > 0) {
    html += `<div class="preview-section">
      <div class="preview-section-title">🌡 Sensory / czujniki</div>
      <table class="preview-keys-table">
        <thead><tr><th>Typ</th><th>Lokalizacja</th><th>Działanie</th></tr></thead>
        <tbody>`;
    filledSensors.forEach(s => {
      const typeInfo = SENSOR_TYPES.find(t => t.value === s.type) || { label: s.type };
      html += `<tr>
        <td>${typeInfo.label}</td>
        <td>${esc(s.name)}</td>
        <td>${esc(s.action)}</td>
      </tr>`;
    });
    html += `</tbody></table></div>`;
  }

  // Uwagi
  const filledNotes = state.notes.filter(n => n.text.trim());
  if (filledNotes.length > 0) {
    html += `<div class="preview-section">
      <div class="preview-section-title">⚠️ Uwagi / scenariusze</div>
      <ul class="preview-notes">`;
    filledNotes.forEach(n => {
      html += `<li>${esc(n.text)}</li>`;
    });
    html += `</ul></div>`;
  }

  document.getElementById('preview-content').innerHTML = html;
}

/* ==========================================
EKSPORT PDF
========================================== */
async function exportPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  const PW  = 210;
  const PH  = 297;
  const ML  = 18;
  const MR  = 18;
  const MT  = 20;
  const MB  = 18;
  const CW  = PW - ML - MR;
  let y = MT;

  const title      = val('docTitle')    || 'Instrukcja sterowania oswietleniem';
  const location   = val('docLocation');
  const panelModel = val('docPanel');
  const globalNote = val('docNote');

  const ACCENT = [30, 58, 95];
  const WHITE  = [255, 255, 255];
  const LIGHT  = [248, 250, 252];
  const BORDER = [229, 231, 235];
  const DARK   = [17, 24, 39];
  const MUTED  = [107, 114, 128];
  const YELLOW = [255, 251, 230];
  const AMBER  = [245, 158, 11];

  function checkPage(needed) {
    if (y + needed > PH - MB) { doc.addPage(); y = MT; }
  }

  function safeText(str) {
    if (!str) return '';
    return String(str)
      .replace(/ä/g,'a').replace(/ö/g,'o').replace(/ü/g,'u')
      .replace(/Ą/g,'A').replace(/ą/g,'a')
      .replace(/Ć/g,'C').replace(/ć/g,'c')
      .replace(/Ę/g,'E').replace(/ę/g,'e')
      .replace(/Ł/g,'L').replace(/ł/g,'l')
      .replace(/Ń/g,'N').replace(/ń/g,'n')
      .replace(/Ó/g,'O').replace(/ó/g,'o')
      .replace(/Ś/g,'S').replace(/ś/g,'s')
      .replace(/Ź/g,'Z').replace(/ź/g,'z')
      .replace(/Ż/g,'Z').replace(/ż/g,'z')
      .replace(/[^ -]/g,'?');
  }

  function wrap(text, maxW, fs) {
    doc.setFontSize(fs);
    return doc.splitTextToSize(safeText(text), maxW);
  }

  // === NAGLOWEK ===
  doc.setFillColor(...ACCENT);
  doc.rect(ML, y, CW, 18, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...WHITE);
  const titleLines = wrap(title, CW - 8, 13);
  doc.text(titleLines[0], ML + 4, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  let meta = [];
  if (location)   meta.push('Lokalizacja: ' + safeText(location));
  if (panelModel) meta.push('Model: ' + safeText(panelModel));
  if (meta.length) doc.text(meta.join('   |   '), ML + 4, y + 14);
  y += 22;

  // === UWAGA GLOBALNA ===
  if (globalNote.trim()) {
    const gLines = wrap('Uwaga: ' + globalNote, CW - 8, 9);
    const gH = gLines.length * 5 + 6;
    checkPage(gH);
    doc.setFillColor(...YELLOW);
    doc.setDrawColor(...AMBER);
    doc.setLineWidth(0.8);
    doc.line(ML, y, ML, y + gH);
    doc.setFillColor(...YELLOW);
    doc.rect(ML + 0.8, y, CW - 0.8, gH, 'F');
    doc.setTextColor(120, 53, 15);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(gLines, ML + 4, y + 4.5);
    y += gH + 4;
  }

  // === RZUT POMIESZCZENIA ===
  if (state.floorPlan) {
    checkPage(50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...ACCENT);
    doc.text('Rzut pomieszczenia', ML, y + 5);
    y += 8;
    try {
      const imgProps = doc.getImageProperties(state.floorPlan);
      const imgW = Math.min(CW, 120);
      const imgH = imgW * imgProps.height / imgProps.width;
      checkPage(imgH + 6);
      doc.addImage(state.floorPlan, imgProps.fileType || 'JPEG', ML, y, imgW, imgH);
      y += imgH + 8;
    } catch(e) {}
  }

  // === PANELE ===
  state.panels.forEach(panel => {
    checkPage(18);
    doc.setFillColor(240, 245, 255);
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.3);
    doc.rect(ML, y, CW, 9, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...ACCENT);
    doc.text(safeText('Panel: ' + panel.name), ML + 3, y + 6);
    y += 12;

    if (panel.image) {
      try {
        const ip = doc.getImageProperties(panel.image);
        const iw = Math.min(45, CW / 3);
        const ih = iw * ip.height / ip.width;
        checkPage(ih + 6);
        doc.addImage(panel.image, ip.fileType || 'JPEG', ML, y, iw, ih);
        y += ih + 4;
      } catch(e) {}
    }

    const filledKeys = panel.keys.filter(k => k.name || k.action);
    if (filledKeys.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(...MUTED);
      doc.text('Brak skonfigurowanych klawiszy', ML + 3, y + 4);
      y += 8;
    } else {
      const C = [
        { x: ML,       w: 22  },
        { x: ML+22,    w: 64  },
        { x: ML+86,    w: 55  },
        { x: ML+141,   w: CW-141 },
      ];
      const HEADS = ['Klawisz','Co steruje','Akcja','Tryb'];
      checkPage(8);
      doc.setFillColor(...ACCENT);
      doc.rect(ML, y, CW, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...WHITE);
      C.forEach((c, i) => doc.text(HEADS[i], c.x + 2, y + 5));
      y += 7;

      filledKeys.forEach((k, i) => {
        const ai = ACTION_TYPES.find(a => a.value === k.action) || { label: k.action || '' };
        const mi = PRESS_MODES.find(m => m.value === k.mode)   || { label: k.mode   || '' };
        const rH = 7;
        checkPage(rH);
        if (i % 2 === 1) { doc.setFillColor(...LIGHT); doc.rect(ML, y, CW, rH, 'F'); }
        doc.setDrawColor(...BORDER); doc.setLineWidth(0.2);
        doc.line(ML, y + rH, ML + CW, y + rH);
        doc.setTextColor(...DARK);
        doc.setFont('helvetica', 'bold');   doc.setFontSize(8);
        doc.text(safeText(k.label || '-'), C[0].x + 2, y + 5);
        doc.setFont('helvetica', 'normal');
        doc.text(safeText(doc.splitTextToSize(k.name || '', C[1].w - 4)[0] || '-'), C[1].x + 2, y + 5);
        doc.text(safeText(doc.splitTextToSize(ai.label, C[2].w - 4)[0] || '-'), C[2].x + 2, y + 5);
        doc.text(safeText(mi.label), C[3].x + 2, y + 5);
        y += rH;
      });
      y += 5;
    }
    y += 3;
  });

  // === SENSORY ===
  const fs2 = state.sensors.filter(s => s.name || s.action);
  if (fs2.length) {
    checkPage(20);
    doc.setFillColor(240, 245, 255);
    doc.setDrawColor(...BORDER);
    doc.rect(ML, y, CW, 9, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...ACCENT);
    doc.text('Sensory / czujniki', ML + 3, y + 6);
    y += 12;

    const SC = [{ x: ML, w: 55 }, { x: ML+55, w: 65 }, { x: ML+120, w: CW-120 }];
    const SH = ['Typ','Lokalizacja','Dzialanie'];
    doc.setFillColor(...ACCENT);
    doc.rect(ML, y, CW, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...WHITE);
    SC.forEach((c, i) => doc.text(SH[i], c.x + 2, y + 5));
    y += 7;

    fs2.forEach((s, i) => {
      const ti = SENSOR_TYPES.find(t => t.value === s.type) || { label: s.type };
      const rH = 7;
      checkPage(rH);
      if (i % 2 === 1) { doc.setFillColor(...LIGHT); doc.rect(ML, y, CW, rH, 'F'); }
      doc.setDrawColor(...BORDER); doc.setLineWidth(0.2);
      doc.line(ML, y + rH, ML + CW, y + rH);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...DARK);
      doc.text(safeText(doc.splitTextToSize(ti.label, SC[0].w - 4)[0] || '-'), SC[0].x + 2, y + 5);
      doc.text(safeText(doc.splitTextToSize(s.name || '-', SC[1].w - 4)[0]), SC[1].x + 2, y + 5);
      doc.text(safeText(doc.splitTextToSize(s.action || '-', SC[2].w - 4)[0]), SC[2].x + 2, y + 5);
      y += rH;
    });
    y += 5;
  }

  // === UWAGI ===
  const fn2 = state.notes.filter(n => n.text.trim());
  if (fn2.length) {
    checkPage(14);
    doc.setFillColor(240, 245, 255);
    doc.setDrawColor(...BORDER);
    doc.rect(ML, y, CW, 9, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...ACCENT);
    doc.text('Uwagi / scenariusze', ML + 3, y + 6);
    y += 12;

    fn2.forEach((n, i) => {
      const lines = wrap((i + 1) + '. ' + n.text, CW - 6, 9);
      checkPage(lines.length * 5 + 4);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...DARK);
      doc.text(lines, ML + 3, y + 4);
      y += lines.length * 5 + 3;
    });
  }

  // === STOPKA ===
  const np = doc.internal.getNumberOfPages();
  for (let i = 1; i <= np; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text('Strona ' + i + ' / ' + np, PW / 2, PH - 10, { align: 'center' });
    if (location) doc.text(safeText(location), ML, PH - 10);
  }

  doc.save((val('docTitle') || 'instrukcja').replace(/[^a-zA-Z0-9_\-]/g, '_') + '.pdf');
}


function exportDOCX() {
  const title      = val('docTitle') || 'Instrukcja sterowania oświetleniem';
  const location   = val('docLocation');
  const panelModel = val('docPanel');
  const globalNote = val('docNote');

  let html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <style>
    body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; margin: 2cm; }
    h1   { font-size: 16pt; color: #1e3a5f; margin-bottom: 4px; }
    .meta { font-size: 10pt; color: #555; margin-bottom: 16px; }
    .meta span { margin-right: 16px; }
    .note { background: #fffbe6; border-left: 4px solid #f59e0b; padding: 8px 12px; margin-bottom: 16px; font-size: 10pt; }
    h2   { font-size: 13pt; color: #1e3a5f; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-top: 20px; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 12px; font-size: 10pt; }
    th   { background: #1e3a5f; color: white; padding: 6px 8px; text-align: left; font-weight: 600; }
    td   { border: 1px solid #ddd; padding: 5px 8px; }
    tr:nth-child(even) td { background: #f8fafc; }
    .key-badge { background: #1e3a5f; color: white; padding: 2px 6px; border-radius: 3px; font-size: 9pt; font-weight: bold; }
    ul   { margin: 4px 0; padding-left: 20px; }
    li   { margin-bottom: 4px; }
    img  { max-width: 200px; }
    .floor-plan-img { max-width: 100%; margin-bottom: 12px; }
  </style>
  </head><body>
  <h1>${esc(title)}</h1>
  <div class="meta">
    ${location   ? `<span>📍 ${esc(location)}</span>`   : ''}
    ${panelModel ? `<span>🔲 ${esc(panelModel)}</span>` : ''}
  </div>`;

  // Rzut pomieszczenia
  if (state.floorPlan) {
    html += `<div><p><strong>Rzut pomieszczenia:</strong></p><img class="floor-plan-img" src="${state.floorPlan}" alt="Rzut pomieszczenia"></div>`;
  }

  if (globalNote.trim()) {
    html += `<div class="note">ℹ️ ${esc(globalNote)}</div>`;
  }

  // Panele
  state.panels.forEach(panel => {
    html += `<h2>🎛 ${esc(panel.name)}</h2>`;

    if (panel.image) {
      html += `<div><img src="${panel.image}" alt="Zdjęcie przycisku" style="max-height:150px"></div>`;
    }

    const filledKeys = panel.keys.filter(k => k.name || k.action);
    if (filledKeys.length > 0) {
      html += `<table><thead><tr>
        <th>Klawisz</th><th>Co steruje</th><th>Akcja</th><th>Tryb</th>
      </tr></thead><tbody>`;
      filledKeys.forEach(k => {
        const actionInfo = ACTION_TYPES.find(a => a.value === k.action) || { label: k.action };
        const modeInfo   = PRESS_MODES.find(m => m.value === k.mode)   || { label: k.mode };
        html += `<tr>
          <td><span class="key-badge">${esc(k.label || '—')}</span></td>
          <td>${esc(k.name)}</td>
          <td>${actionInfo.label}</td>
          <td>${modeInfo.label}</td>
        </tr>`;
      });
      html += `</tbody></table>`;
    }
  });

  // Sensory
  const filledSensors = state.sensors.filter(s => s.name || s.action);
  if (filledSensors.length > 0) {
    html += `<h2>🌡 Sensory / czujniki</h2>
    <table><thead><tr><th>Typ</th><th>Lokalizacja</th><th>Działanie</th></tr></thead><tbody>`;
    filledSensors.forEach(s => {
      const typeInfo = SENSOR_TYPES.find(t => t.value === s.type) || { label: s.type };
      html += `<tr><td>${typeInfo.label}</td><td>${esc(s.name)}</td><td>${esc(s.action)}</td></tr>`;
    });
    html += `</tbody></table>`;
  }

  // Uwagi
  const filledNotes = state.notes.filter(n => n.text.trim());
  if (filledNotes.length > 0) {
    html += `<h2>⚠️ Uwagi / scenariusze</h2><ul>`;
    filledNotes.forEach(n => { html += `<li>${esc(n.text)}</li>`; });
    html += `</ul>`;
  }

  html += '</body></html>';

  try {
    const blob = htmlDocx.asBlob(html);
    const filename = (val('docTitle') || 'instrukcja').replace(/[^a-zA-Z0-9_-]/g, '_') + '.docx';
    saveAs(blob, filename);
  } catch (err) {
    alert('Błąd eksportu DOCX: ' + err.message);
  }
}

/* ==========================================
ZAPIS / ODCZYT STANU
========================================== */
function saveState() {
  const data = {
    title:      val('docTitle'),
    location:   val('docLocation'),
    panelModel: val('docPanel'),
    note:       val('docNote'),
    floorPlan:  state.floorPlan,
    panels:     state.panels,
    sensors:    state.sensors,
    notes:      state.notes,
  };
  try {
    localStorage.setItem('kreator_v2_state', JSON.stringify(data));
  } catch (e) { /* localStorage pełne (base64 zdjęcia) */ }
}

function loadState() {
  try {
    const raw = localStorage.getItem('kreator_v2_state');
    if (!raw) return;
    const data = JSON.parse(raw);

    if (data.title)      document.getElementById('docTitle').value    = data.title;
    if (data.location)   document.getElementById('docLocation').value = data.location;
    if (data.panelModel) document.getElementById('docPanel').value    = data.panelModel;
    if (data.note)       document.getElementById('docNote').value     = data.note;

    // Przywróć rzut pomieszczenia
    if (data.floorPlan) {
      state.floorPlan = data.floorPlan;
      const preview = document.getElementById('floorPlanPreview');
      if (preview) { preview.src = data.floorPlan; preview.style.display = 'block'; }
      const removeBtn = document.getElementById('btnRemoveFloorPlan');
      if (removeBtn) removeBtn.style.display = 'inline-block';
    }

    panelCounter  = 0;
    keyCounter    = 0;
    sensorCounter = 0;
    noteCounter   = 0;

    (data.panels  || []).forEach(p => addPanel(p));
    (data.sensors || []).forEach(s => addSensor(s));
    (data.notes   || []).forEach(n => addNote(n));

  } catch (e) { console.error('loadState error', e); }
}

function clearAll() {
  if (!confirm('Wyczyścić wszystkie dane formularza?')) return;
  localStorage.removeItem('kreator_v2_state');

  ['docTitle','docLocation','docNote'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('docPanel').value = '';

  state = { floorPlan: null, panels: [], sensors: [], notes: [] };
  panelCounter = keyCounter = sensorCounter = noteCounter = 0;

  ['panelsContainer','sensorsContainer','notesContainer'].forEach(id => {
    document.getElementById(id).innerHTML = '';
  });

  const preview = document.getElementById('floorPlanPreview');
  if (preview) { preview.src = ''; preview.style.display = 'none'; }
  const removeBtn = document.getElementById('btnRemoveFloorPlan');
  if (removeBtn) removeBtn.style.display = 'none';
  const fpInput = document.getElementById('floorPlanInput');
  if (fpInput) fpInput.value = '';

  renderPreview();
}

/* ---------- HELPERS ---------- */
function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
