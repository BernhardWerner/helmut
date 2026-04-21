import { Context, NAMING_SCHEMES, detectCSVFormat } from "../../src/helmut.js";
import { renderContextSection } from "./context-view.js";

const createSection  = document.getElementById("create-section");
const contextSection = document.getElementById("context-section");

let currentContext = null;
let currentNotice  = null;
let locked         = false;
let showArrows     = false;
const undoStack    = [];
const MAX_UNDO     = 50;

// ── Undo ──────────────────────────────────────────────────────────────────────

function pushUndo() {
  undoStack.push(currentContext.clone());
  if (undoStack.length > MAX_UNDO) undoStack.shift();
}

function undo() {
  if (undoStack.length === 0) return;
  currentContext = undoStack.pop();
  currentNotice  = null;
  renderCurrent();
}

document.addEventListener("keydown", e => {
  if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (undoStack.length > 0) { e.preventDefault(); undo(); }
  }
});

// ── Create form ───────────────────────────────────────────────────────────────

function showCreateForm() {
  contextSection.hidden = true;
  createSection.hidden  = false;

  const schemeOptions = (selected, key) =>
    NAMING_SCHEMES
      .filter(s => s[key])
      .map(s => `<option value="${s.id}"${s.id === selected ? " selected" : ""}>${s.label}</option>`)
      .join("");

  createSection.innerHTML = `
    <h2>New Context</h2>

    <form id="create-form">
      <div class="form-row">
        <label>
          Objects
          <input type="number" id="num-objects" min="1" max="200" value="4" />
        </label>
        <label>
          Attributes
          <input type="number" id="num-attributes" min="1" max="200" value="4" />
        </label>
      </div>
      <div class="form-row">
        <label>
          Object names
          <select id="object-scheme">${schemeOptions("numeric", "forObjects")}</select>
        </label>
        <label>
          Attribute names
          <select id="attribute-scheme">${schemeOptions("numeric", "forAttributes")}</select>
        </label>
      </div>
      <button type="submit" class="btn-primary">Create</button>
    </form>

    <div class="section-divider">or import from CSV</div>

    <div class="import-block">
      <label class="file-pick-label" for="csv-file">
        <span id="csv-filename">Choose a CSV file…</span>
        <input type="file" id="csv-file" accept=".csv" />
      </label>
      <div id="csv-options" hidden>
        <div class="option-group">
          <label><input type="checkbox" id="csv-has-headers" /> Row &amp; column headers</label>
        </div>
        <div class="option-group">
          <span>Cell format:</span>
          <label><input type="radio" name="import-fmt" value="X" checked /> X / blank</label>
          <label><input type="radio" name="import-fmt" value="1" /> 1 / 0</label>
        </div>
        <button type="button" id="btn-import" class="btn-primary">Import</button>
      </div>
    </div>

    <div class="section-divider">or start with an example</div>

    <div id="examples-list" class="examples-list">
      <span class="text-muted">Loading…</span>
    </div>
  `;

  // ── Create form ──
  document.getElementById("create-form").addEventListener("submit", e => {
    e.preventDefault();
    const numObjects      = Math.max(1, parseInt(document.getElementById("num-objects").value,    10));
    const numAttributes   = Math.max(1, parseInt(document.getElementById("num-attributes").value, 10));
    const objectScheme    = document.getElementById("object-scheme").value;
    const attributeScheme = document.getElementById("attribute-scheme").value;
    showContext(Context.create(numObjects, numAttributes, objectScheme, attributeScheme));
  });

  // ── CSV import ──
  let rawCSV = null;

  document.getElementById("csv-file").addEventListener("change", async e => {
    const file = e.target.files[0];
    if (!file) return;
    rawCSV = await file.text();
    const { hasHeaders, isBinary } = detectCSVFormat(rawCSV);

    document.getElementById("csv-filename").textContent = file.name;
    document.getElementById("csv-has-headers").checked = hasHeaders;
    document.querySelector(`input[name="import-fmt"][value="${isBinary ? '1' : 'X'}"]`).checked = true;
    document.getElementById("csv-options").hidden = false;
  });

  document.getElementById("btn-import").addEventListener("click", () => {
    if (!rawCSV) return;
    const hasHeaders = document.getElementById("csv-has-headers").checked;
    const isBinary   = document.querySelector('input[name="import-fmt"]:checked').value === '1';
    showContext(Context.fromCSV(rawCSV, { hasHeaders, isBinary }));
  });

  // ── Examples ──
  fetch('examples/index.json')
    .then(r => r.json())
    .then(examples => {
      const list = document.getElementById("examples-list");
      if (!list) return;
      if (examples.length === 0) {
        list.innerHTML = '<span class="text-muted">No examples available.</span>';
        return;
      }
      list.innerHTML = '';
      for (const ex of examples) {
        const btn = document.createElement("button");
        btn.className   = "btn-secondary";
        btn.textContent = ex.name;
        btn.addEventListener("click", async () => {
          const text = await fetch(`examples/${ex.file}`).then(r => r.text());
          showContext(Context.fromCSV(text, detectCSVFormat(text)));
        });
        list.appendChild(btn);
      }
    })
    .catch(() => {
      const list = document.getElementById("examples-list");
      if (list) list.innerHTML = '<span class="text-muted">Could not load examples.</span>';
    });
}

// ── Context view ──────────────────────────────────────────────────────────────

function showContext(ctx) {
  currentContext   = ctx;
  currentNotice    = null;
  locked           = false;
  showArrows       = false;
  undoStack.length = 0;
  createSection.hidden  = true;
  contextSection.hidden = false;
  renderCurrent();
}

function renderCurrent() {
  renderContextSection(contextSection, currentContext, {
    onNewContext:      showCreateForm,
    onClarify:         () => applyOp("clarify"),
    onReduce:          () => applyOp("reduce"),
    onUndo:            undo,
    canUndo:           undoStack.length > 0,
    onToggleLock:      () => { locked = !locked; renderCurrent(); },
    onDeleteObject:    i => deleteItem("object",    i),
    onDeleteAttribute: j => deleteItem("attribute", j),
    onBeforeMutate:    pushUndo,
    onToggleArrows:    () => { showArrows = !showArrows; renderCurrent(); },
    locked,
    showArrows,
    notice:            currentNotice,
  });
}

function applyOp(op) {
  const before = currentContext;
  const after   = op === "clarify" ? before.clarify() : before.reduce();
  const dObj    = before.objects.length    - after.objects.length;
  const dAttr   = before.attributes.length - after.attributes.length;

  if (dObj === 0 && dAttr === 0) {
    currentNotice = `${op === "clarify" ? "Clarification" : "Reduction"}: nothing to remove.`;
    renderCurrent();
    return;
  }

  pushUndo();
  currentContext = after;
  currentNotice  = buildNotice(op, dObj, dAttr);
  renderCurrent();
}

function deleteItem(kind, index) {
  const name = kind === "object"
    ? currentContext.objects[index]
    : currentContext.attributes[index];
  pushUndo();
  currentNotice = `Removed ${kind} "${name}".`;
  if (kind === "object") currentContext.deleteObject(index);
  else                   currentContext.deleteAttribute(index);
  renderCurrent();
}

function buildNotice(op, dObj, dAttr) {
  const name  = op === "clarify" ? "Clarification" : "Reduction";
  const parts = [];
  if (dObj  > 0) parts.push(`${dObj} object${dObj   > 1 ? "s" : ""}`);
  if (dAttr > 0) parts.push(`${dAttr} attribute${dAttr > 1 ? "s" : ""}`);
  return `${name}: removed ${parts.join(" and ")}.`;
}

showCreateForm();
