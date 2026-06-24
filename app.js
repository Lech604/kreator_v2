/* ==========================================
   KREATOR INSTRUKCJI STEROWANIA OŚWIETLENIEM
   Wersja 2.0 – przepisany od zera
========================================== */

/* ---------- TYPY AKCJI ---------- */
const ACTION_TYPES = [
  { value: '',        label: '— wybierz —',      cls: '' },
  { value: 'onoff',   label: 'Włącz / Wyłącz',   cls: 'action-onoff' },
  { value: 'on',      label: 'Włącz',             cls: 'action-on' },
  { value: 'off',     label: 'Wyłącz',            cls: 'action-off' },
  { value: 'up',      label: 'Ściemnia ▲ (UP)',   cls: 'action-up' },
  { value: 'down',    label: 'Rozjaśnia ▼ (DOWN)',cls: 'action-down' },
  { value: 'scene',   label: 'Scena / Preset',    cls: 'action-scene' },
  { value: 'hold_up', label: 'Przytrzymaj ▲',     cls: 'action-up' },
  { value: 'hold_dn', label: 'Przytrzymaj ▼',     cls: 'action-down' },
  { value: 'group',   label: 'Wywołanie grupy',   cls: 'action-other' },
  { value: 'other',   label: 'Inne',              cls: 'action-other' },
];

const PRESS_MODES = [
  { value: 'short',   label: 'Krótkie' },
  { value: 'long',    label: 'Długie (przytrzymanie)' },
  { value: 'double',  label: 'Podwójne' },
  { value: 'single',  label: 'Jedno naciśnięcie' },
];

const SENSOR_TYPES = [
  { value: 'motion',  label: '🏃 Czujnik ruchu (PIR)' },
  { value: 'daylight',label: '☀️ Czujnik jasności (DALI)' },
  { value: 'timer',   label: '⏱ Timer / harmonogram' },
  { value: 'bms',     label: '🏢 BMS / system nadrzędny' },
  { value: 'other',   label: '⚙️ Inny' },
];

/* ---------- STAN APLIKACJI ---------- */
let state = {
  panels: [],
  sensors: [],
  notes: [],
};

let panelCounter = 0;
let keyCounter = 0;
let sensorCounter = 0;
let noteCounter = 0;

/* ---------- INICJALIZACJA ---------- */
document.addEventListener('DOMContentLoaded', () => {
  loadState();

  // Podgląd na zmiany formularza
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
    name: data?.name || ('Panel ' + id),
    keys: data?.keys || [],
  };
  state.panels.push(panel);

  const el = createPanelEl(panel);
  document.getElementById('panelsContainer').appendChild(el);

  // Jeśli brak kluczy przy nowym panelu, dodaj 4 domyślne
  if (!data?.keys?.length) {
    for (let i = 1; i <= 4; i++) addKey(panel.id, { label: 'K' + i });
  } else {
    data.keys.forEach(k => addKey(panel.id, k));
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
      <button class="btn-danger" onclick="removePanel(${panel.id})">✕ Usuń panel</button>
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
      <div class="keys-table-footer">
        <button class="btn-add" onclick="addKey(${panel.id})">+ Dodaj klawisz</button>
      </div>
    </div>
  `;

  el.querySelector('.panel-name-input').addEventListener('input', (e) => {
    const p = state.panels.find(p => p.id === panel.id);
    if (p) p.name = e.target.value;
    saveState();
    renderPreview();
  });

  return el;
}

function removePanel(id) {
  if (!confirm('Usunąć ten panel wraz ze wszystkimi klawiszami?')) return;
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
  const id = data?.id || keyCounter;
  const key = {
    id,
    label: data?.label || '',
    name: data?.name || '',
    action: data?.action || '',
    mode: data?.mode || 'short',
  };

  const panel = state.panels.find(p => p.id === panelId);
  if (panel && !panel.keys.find(k => k.id === id)) panel.keys.push(key);

  const tbody = document.getElementById('keys-' + panelId);
  if (!tbody) return;

  const row = document.createElement('tr');
  row.id = 'key-' + panelId + '-' + id;
  row.innerHTML = `
    <td>
      <input type="text" class="key-label-input" value="${esc(key.label)}" placeholder="K1" maxlength="6">
    </td>
    <td>
      <input type="text" class="key-name-input" value="${esc(key.name)}" placeholder="np. Oświetlenie biurka, Taśma LED...">
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
      <button class="btn-icon" onclick="removeKey(${panelId},${id})" title="Usuń klawisz">✕</button>
    </td>
  `;

  // Zdarzenia
  const [labelIn, nameIn, actionSel, modeSel] = [
    row.querySelector('.key-label-input'),
    row.querySelector('.key-name-input'),
    row.querySelector('.key-action-select'),
    row.querySelector('.key-mode-select'),
  ];

  const update = () => {
    key.label = labelIn.value;
    key.name = nameIn.value;
    key.action = actionSel.value;
    key.mode = modeSel.value;
    saveState();
    renderPreview();
  };

  labelIn.addEventListener('input', update);
  nameIn.addEventListener('input', update);
  actionSel.addEventListener('change', update);
  modeSel.addEventListener('change', update);

  tbody.appendChild(row);
}

function removeKey(panelId, keyId) {
  const panel = state.panels.find(p => p.id === panelId);
  if (panel) panel.keys = panel.keys.filter(k => k.id !== keyId);
  const row = document.getElementById('key-' + panelId + '-' + keyId);
  if (row) row.remove();
  saveState();
  renderPreview();
}

/* ==========================================
   SENSORY
========================================== */
function addSensor(data) {
  sensorCounter++;
  const id = data?.id || sensorCounter;
  const sensor = {
    id,
    type: data?.type || 'motion',
    name: data?.name || '',
    desc: data?.desc || '',
  };
  state.sensors.push(sensor);

  const el = document.createElement('div');
  el.className = 'sensor-block';
  el.id = 'sensor-' + id;
  el.innerHTML = `
    <div class="field" style="flex:0 0 180px; margin:0">
      <select class="sensor-type-sel">
        ${SENSOR_TYPES.map(s => `<option value="${s.value}" ${sensor.type===s.value?'selected':''}>${s.label}</option>`).join('')}
      </select>
    </div>
    <div class="field" style="flex:1; margin:0">
      <input type="text" class="sensor-name-in" value="${esc(sensor.name)}" placeholder="Opis działania, np. Brak ruchu 20 min → wyłączenie">
    </div>
    <button class="btn-icon" onclick="removeSensor(${id})" title="Usuń">✕</button>
  `;

  el.querySelector('.sensor-type-sel').addEventListener('change', (e) => {
    sensor.type = e.target.value;
    saveState(); renderPreview();
  });
  el.querySelector('.sensor-name-in').addEventListener('input', (e) => {
    sensor.name = e.target.value;
    saveState(); renderPreview();
  });

  document.getElementById('sensorsContainer').appendChild(el);
  saveState();
  renderPreview();
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
    <textarea placeholder="np. Tryb NOPRESENS – brak ruchu przez 20 min powoduje wyłączenie opraw i przywrócenie czujnika.">${esc(note.text)}</textarea>
    <button class="btn-icon" onclick="removeNote(${id})" title="Usuń">✕</button>
  `;
  el.querySelector('textarea').addEventListener('input', (e) => {
    note.text = e.target.value;
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
  const title = val('docTitle') || 'Instrukcja sterowania oświetleniem';
  const location = val('docLocation');
  const panel = val('docPanel');
  const globalNote = val('docNote');

  let html = '';

  // Nagłówek
  html += `<div class="preview-header">
    <div class="preview-title">${esc(title)}</div>
    <div class="preview-meta">
      ${location ? `<span>📍 ${esc(location)}</span>` : ''}
      ${panel ? `<span>🎛 ${esc(panel)}</span>` : ''}
      <span>📅 ${new Date().toLocaleDateString('pl-PL')}</span>
    </div>
  </div>`;

  // Uwaga globalna
  if (globalNote.trim()) {
    html += `<div class="preview-global-note">ℹ️ ${esc(globalNote)}</div>`;
  }

  // Panele z klawiszami
  if (state.panels.length > 0) {
    state.panels.forEach(panel => {
      html += `<div class="preview-section">
        <div class="preview-section-title">🎛 ${esc(panel.name)}</div>`;

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
          const actionInfo = ACTION_TYPES.find(a => a.value === k.action) || { label: k.action, cls: 'action-other' };
          const modeInfo = PRESS_MODES.find(m => m.value === k.mode) || { label: k.mode };
          html += `<tr>
            <td><span class="key-badge">${esc(k.label || '?')}</span></td>
            <td>${esc(k.name)}</td>
            <td>${k.action ? `<span class="action-badge ${actionInfo.cls}">${actionInfo.label}</span>` : '<span style="color:#9ca3af">—</span>'}</td>
            <td style="font-size:11px;color:#6b7280">${modeInfo.label}</td>
          </tr>`;
        });

        html += `</tbody></table>`;
      }

      html += `</div>`;
    });
  } else {
    html += `<div class="preview-empty">Dodaj pierwszy panel używając przycisku "+ Dodaj panel"</div>`;
  }

  // Sensory
  if (state.sensors.length > 0) {
    html += `<div class="preview-section">
      <div class="preview-section-title">🌡 Sensory / automatyka</div>`;
    state.sensors.forEach(s => {
      const st = SENSOR_TYPES.find(t => t.value === s.type) || { label: s.type };
      html += `<div class="preview-sensor-row">
        <span class="sensor-icon">${st.label.split(' ')[0]}</span>
        <div>
          <strong>${st.label.substring(st.label.indexOf(' ')+1)}</strong>
          ${s.name ? ': ' + esc(s.name) : ''}
        </div>
      </div>`;
    });
    html += `</div>`;
  }

  // Uwagi
  if (state.notes.some(n => n.text.trim())) {
    html += `<div class="preview-section">
      <div class="preview-section-title">⚠️ Uwagi</div>`;
    state.notes.filter(n => n.text.trim()).forEach(n => {
      html += `<div class="preview-note">${esc(n.text)}</div>`;
    });
    html += `</div>`;
  }

  document.getElementById('preview-content').innerHTML = html;
}

/* ==========================================
   EKSPORT PDF
========================================== */
async function exportPDF() {
  const btn = document.getElementById('btnPDF');
  btn.textContent = '⏳ Generuję PDF...';
  btn.disabled = true;

  try {
    const { jsPDF } = window.jspdf;
    const content = document.getElementById('preview-content');
    const canvas = await html2canvas(content, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      width: content.scrollWidth,
      height: content.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.97);
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const imgW = pageW - margin * 2;
    const imgH = (canvas.height * imgW) / canvas.width;

    let yPos = margin;
    let heightLeft = imgH;
    pdf.addImage(imgData, 'JPEG', margin, yPos, imgW, imgH);
    heightLeft -= (pageH - margin * 2);

    while (heightLeft > 0) {
      yPos = heightLeft - imgH + margin;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', margin, yPos, imgW, imgH);
      heightLeft -= (pageH - margin * 2);
    }

    // Numeracja stron
    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(9);
      pdf.setTextColor(150);
      pdf.text(i + ' / ' + totalPages, pageW / 2, pageH - 5, { align: 'center' });
    }

    const filename = (val('docTitle') || 'instrukcja').replace(/[^a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ _-]/g, '') + '.pdf';
    pdf.save(filename);
  } catch(e) {
    alert('Błąd eksportu PDF: ' + e.message);
  } finally {
    btn.textContent = '⬇ Eksportuj PDF';
    btn.disabled = false;
  }
}

/* ==========================================
   EKSPORT DOCX
========================================== */
function exportDOCX() {
  const btn = document.getElementById('btnDOCX');
  btn.textContent = '⏳ Generuję DOCX...';
  btn.disabled = true;

  try {
    if (typeof htmlDocx === 'undefined') throw new Error('Biblioteka html-docx-js nie załadowała się.');

    const title = val('docTitle') || 'Instrukcja sterowania oświetleniem';
    const location = val('docLocation');
    const panelModel = val('docPanel');
    const globalNote = val('docNote');

    let body = `<h1>${title}</h1>`;
    if (location) body += `<p><b>Lokalizacja:</b> ${location}</p>`;
    if (panelModel) body += `<p><b>Model panelu:</b> ${panelModel}</p>`;
    if (globalNote) body += `<p><b>Uwaga:</b> ${globalNote}</p>`;

    state.panels.forEach(panel => {
      body += `<h2>${panel.name}</h2>`;
      const filled = panel.keys.filter(k => k.name || k.action);
      if (filled.length > 0) {
        body += `<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%">
          <tr><th>Klawisz</th><th>Co steruje</th><th>Typ akcji</th><th>Tryb naciśnięcia</th></tr>`;
        filled.forEach(k => {
          const at = ACTION_TYPES.find(a => a.value === k.action);
          const mt = PRESS_MODES.find(m => m.value === k.mode);
          body += `<tr>
            <td><b>${k.label || '?'}</b></td>
            <td>${k.name || ''}</td>
            <td>${at ? at.label : k.action}</td>
            <td>${mt ? mt.label : k.mode}</td>
          </tr>`;
        });
        body += `</table>`;
      }
    });

    if (state.sensors.length > 0) {
      body += `<h2>Sensory / automatyka</h2><ul>`;
      state.sensors.forEach(s => {
        const st = SENSOR_TYPES.find(t => t.value === s.type);
        body += `<li>${st ? st.label : s.type}${s.name ? ': ' + s.name : ''}</li>`;
      });
      body += `</ul>`;
    }

    const notes = state.notes.filter(n => n.text.trim());
    if (notes.length > 0) {
      body += `<h2>Uwagi</h2><ul>`;
      notes.forEach(n => body += `<li>${n.text}</li>`);
      body += `</ul>`;
    }

    const html = `<html><head><meta charset="UTF-8"><style>
      body{font-family:Calibri,Arial;font-size:11pt;}
      h1{font-size:16pt;color:#1a56db;}
      h2{font-size:13pt;color:#1a56db;border-bottom:1px solid #ccc;padding-bottom:4px;}
      table{border-collapse:collapse;width:100%;margin-bottom:12px;}
      th{background:#e8f0fe;font-weight:bold;}
      td,th{border:1px solid #ccc;padding:5px 8px;font-size:10pt;}
    </style></head><body>${body}</body></html>`;

    const blob = htmlDocx.asBlob(html);
    const filename = title.replace(/[^a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ _-]/g, '') + '.docx';
    saveAs(blob, filename);
  } catch(e) {
    alert('Błąd eksportu DOCX: ' + e.message);
  } finally {
    btn.textContent = '📄 Eksportuj DOCX';
    btn.disabled = false;
  }
}

/* ==========================================
   ZAPIS / ODCZYT STANU (localStorage)
========================================== */
function saveState() {
  try {
    const data = {
      title: val('docTitle'),
      location: val('docLocation'),
      panel: val('docPanel'),
      note: val('docNote'),
      panels: state.panels,
      sensors: state.sensors,
      notes: state.notes,
      counters: { panel: panelCounter, key: keyCounter, sensor: sensorCounter, note: noteCounter },
    };
    localStorage.setItem('kreator_v2_state', JSON.stringify(data));
  } catch(e) { console.warn('saveState:', e); }
}

function loadState() {
  try {
    const raw = localStorage.getItem('kreator_v2_state');
    if (!raw) return;
    const data = JSON.parse(raw);

    if (data.title)    document.getElementById('docTitle').value = data.title;
    if (data.location) document.getElementById('docLocation').value = data.location;
    if (data.panel)    document.getElementById('docPanel').value = data.panel;
    if (data.note)     document.getElementById('docNote').value = data.note;

    if (data.counters) {
      panelCounter = data.counters.panel || 0;
      keyCounter = data.counters.key || 0;
      sensorCounter = data.counters.sensor || 0;
      noteCounter = data.counters.note || 0;
    }

    (data.panels || []).forEach(p => {
      state.panels.push({ id: p.id, name: p.name, keys: [] });
      const el = createPanelEl({ id: p.id, name: p.name });
      document.getElementById('panelsContainer').appendChild(el);
      (p.keys || []).forEach(k => addKey(p.id, k));
    });

    (data.sensors || []).forEach(s => addSensor(s));
    (data.notes || []).forEach(n => addNote(n));
  } catch(e) { console.warn('loadState:', e); }
}

/* ==========================================
   WYCZYŚĆ WSZYSTKO
========================================== */
function clearAll() {
  if (!confirm('Wyczyścić całą instrukcję? Tej operacji nie można cofnąć.')) return;
  localStorage.removeItem('kreator_v2_state');
  location.reload();
}

/* ==========================================
   HELPERS
========================================== */
function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}
