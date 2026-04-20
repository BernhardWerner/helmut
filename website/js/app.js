import { Context, NAMING_SCHEMES } from "../../src/helmut.js";
import { renderContextSection } from "./context-view.js";

const createSection  = document.getElementById("create-section");
const contextSection = document.getElementById("context-section");

let currentContext = null;
let savedContext   = null;
let currentNotice  = null;
let locked         = false;

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
  `;

  document.getElementById("create-form").addEventListener("submit", e => {
    e.preventDefault();
    const numObjects      = Math.max(1, parseInt(document.getElementById("num-objects").value,    10));
    const numAttributes   = Math.max(1, parseInt(document.getElementById("num-attributes").value, 10));
    const objectScheme    = document.getElementById("object-scheme").value;
    const attributeScheme = document.getElementById("attribute-scheme").value;
    showContext(Context.create(numObjects, numAttributes, objectScheme, attributeScheme));
  });
}

// ── Context view ──────────────────────────────────────────────────────────────

function showContext(ctx) {
  currentContext = ctx;
  savedContext   = null;
  currentNotice  = null;
  locked         = false;
  createSection.hidden  = true;
  contextSection.hidden = false;
  renderCurrent();
}

function renderCurrent() {
  renderContextSection(contextSection, currentContext, {
    onNewContext:     showCreateForm,
    onClarify:        () => applyOp("clarify"),
    onReduce:         () => applyOp("reduce"),
    onRestore:        savedContext ? restoreContext : null,
    onToggleLock:     () => { locked = !locked; renderCurrent(); },
    onDeleteObject:   i => deleteItem("object",    i),
    onDeleteAttribute: j => deleteItem("attribute", j),
    locked,
    notice:           currentNotice,
  });
}

function deleteItem(kind, index) {
  const name = kind === "object"
    ? currentContext.objects[index]
    : currentContext.attributes[index];
  savedContext  = currentContext.clone();
  currentNotice = `Removed ${kind} "${name}".`;
  if (kind === "object") currentContext.deleteObject(index);
  else                   currentContext.deleteAttribute(index);
  renderCurrent();
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

  savedContext   = before;
  currentContext = after;
  currentNotice  = buildNotice(op, dObj, dAttr);
  renderCurrent();
}

function restoreContext() {
  currentContext = savedContext;
  savedContext   = null;
  currentNotice  = "Context restored.";
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
