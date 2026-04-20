import { computeLattice, computeArrows } from "../../src/helmut.js";

// ── Public entry ─────────────────────────────────────────────────────────────

export function renderContextSection(container, ctx, {
  onNewContext, onClarify, onReduce, onUndo, canUndo = false, onToggleLock,
  onDeleteObject, onDeleteAttribute, onBeforeMutate,
  locked = false, notice = null, showArrows = false, onToggleArrows,
} = {}) {
  container.innerHTML = "";

  // ── Toolbar ──
  const toolbar = el("div", "toolbar");
  const addBtn  = (label, handler, cls = "btn-secondary") => {
    const b = el("button", cls);
    b.textContent = label;
    b.addEventListener("click", handler);
    toolbar.appendChild(b);
    return b;
  };
  addBtn("New Context", onNewContext);
  toolbar.appendChild(el("span", "toolbar-sep"));
  addBtn("Clarify", onClarify);
  addBtn("Reduce",  onReduce);

  const undoBtn = el("button", "btn-undo");
  undoBtn.textContent = "Undo";
  undoBtn.disabled = !canUndo;
  undoBtn.addEventListener("click", onUndo);
  toolbar.appendChild(undoBtn);

  const arrowsBtn = el("button", showArrows ? "btn-arrows active" : "btn-arrows");
  arrowsBtn.textContent = "Show Arrows";
  arrowsBtn.addEventListener("click", onToggleArrows);
  toolbar.appendChild(arrowsBtn);

  // ── Concept count button ──
  let conceptCount = null;
  const calcBtn = el("button", "btn-secondary");
  const updateCalcBtn = () => {
    calcBtn.textContent = conceptCount !== null ? `${conceptCount} concepts` : "Calculate Concepts";
  };
  updateCalcBtn();
  calcBtn.addEventListener("click", () => {
    conceptCount = computeLattice(ctx).concepts.length;
    updateCalcBtn();
  });

  function beforeMutate() {
    onBeforeMutate();
    undoBtn.disabled = false;
    conceptCount = null;
    updateCalcBtn();
  }

  toolbar.appendChild(el("span", "toolbar-sep"));
  toolbar.appendChild(calcBtn);
  addBtn(locked ? "\uD83D\uDD13 Unlock Context" : "\uD83D\uDD12 Lock Context", onToggleLock, locked ? "btn-unlock" : "btn-secondary");
  container.appendChild(toolbar);

  // ── Notices ──
  if (notice) {
    const n = el("div", "notice");
    n.textContent = notice;
    container.appendChild(n);
  }

  const warningDiv = el("div", "notice notice-warning");
  warningDiv.hidden = true;
  container.appendChild(warningDiv);

  const tableWrap  = el("div", "table-wrap");
  const exportWrap = el("div", "export-section");
  container.appendChild(tableWrap);
  container.appendChild(exportWrap);

  function rerender() {
    const arrows = showArrows ? computeArrows(ctx) : null;

    if (showArrows && !ctx.isReduced()) {
      warningDiv.textContent = "Context is not reduced — arrows may be misleading.";
      warningDiv.hidden = false;
    } else {
      warningDiv.hidden = true;
    }

    renderTable(tableWrap, ctx, locked, { onDeleteObject, onDeleteAttribute, onBeforeMutate: beforeMutate }, rerender, arrows);
    renderExport(exportWrap, ctx);
  }

  rerender();
}

// ── Table ─────────────────────────────────────────────────────────────────────

function renderTable(container, ctx, locked, { onDeleteObject, onDeleteAttribute, onBeforeMutate }, rerender, arrows) {
  container.innerHTML = "";

  const table = document.createElement("table");
  table.className = locked ? "context-table locked" : "context-table";

  // ── Header row ──
  const thead     = table.createTHead();
  const headerRow = thead.insertRow();

  headerRow.appendChild(el("th", "corner"));

  for (let j = 0; j < ctx.attributes.length; j++) {
    const th = el("th", "attr-header");
    if (locked) {
      const span = document.createElement("span");
      span.textContent = ctx.attributes[j];
      th.appendChild(span);
    } else {
      makeEditable(th, ctx.attributes[j], name => ctx.renameAttribute(j, name), onBeforeMutate);
      addDeleteBtn(th, () => onDeleteAttribute(j));
    }
    headerRow.appendChild(th);
  }

  if (!locked) {
    const addAttrTh  = el("th", "add-btn-cell");
    const addAttrBtn = el("button");
    addAttrBtn.textContent = "+";
    addAttrBtn.setAttribute("tabindex", "-1");
    addAttrTh.title = "Add attribute";
    addAttrTh.appendChild(addAttrBtn);
    addAttrTh.addEventListener("click", () => { onBeforeMutate(); ctx.addAttribute(""); rerender(); });
    headerRow.appendChild(addAttrTh);
  }

  // ── Body rows ──
  const tbody = table.createTBody();

  for (let i = 0; i < ctx.objects.length; i++) {
    const row = tbody.insertRow();

    const th = el("th", "obj-header");
    if (locked) {
      const span = document.createElement("span");
      span.textContent = ctx.objects[i];
      th.appendChild(span);
    } else {
      makeEditable(th, ctx.objects[i], name => ctx.renameObject(i, name), onBeforeMutate);
      addDeleteBtn(th, () => onDeleteObject(i));
    }
    row.appendChild(th);

    for (let j = 0; j < ctx.attributes.length; j++) {
      const td = row.insertCell();
      td.className = "incidence-cell";
      if (ctx.incidence[i][j]) {
        td.classList.add("marked");
        td.textContent = "×";
      } else if (arrows) {
        const a = arrows[i][j];
        if (a > 0) {
          td.classList.add("has-arrow");
          td.textContent = a === 1 ? "↑" : a === 2 ? "↓" : "↕";
        }
      }
      if (!locked) {
        td.addEventListener("click", () => {
          onBeforeMutate();
          ctx.toggle(i, j);
          if (arrows !== null) {
            rerender();
          } else {
            td.classList.toggle("marked", !!ctx.incidence[i][j]);
            td.textContent = ctx.incidence[i][j] ? "×" : "";
          }
        });
      }
    }

    if (!locked) row.insertCell().className = "add-col-spacer";
  }

  if (!locked) {
    const addObjRow = tbody.insertRow();
    addObjRow.className = "add-obj-row";
    const addObjTh  = el("th", "add-btn-cell");
    const addObjBtn = el("button");
    addObjBtn.textContent = "+";
    addObjBtn.setAttribute("tabindex", "-1");
    addObjTh.title = "Add object";
    addObjTh.appendChild(addObjBtn);
    addObjTh.addEventListener("click", () => { onBeforeMutate(); ctx.addObject(""); rerender(); });
    addObjRow.appendChild(addObjTh);
    for (let j = 0; j <= ctx.attributes.length; j++) {
      addObjRow.insertCell().className = "add-row-spacer";
    }
  }

  const center = el("div", "table-center");
  center.appendChild(table);
  container.appendChild(center);
}

// ── Editable header cell ──────────────────────────────────────────────────────

function makeEditable(th, initialValue, onChange, onBeforeMutate) {
  const wrap = el("div", "header-label");
  const span = document.createElement("span");
  span.textContent = initialValue;
  wrap.appendChild(span);
  th.appendChild(wrap);
  th.title = "Click to rename";

  th.addEventListener("click", e => {
    if (e.target.tagName === "INPUT") return;
    if (e.target.classList.contains("delete-btn")) return;

    const input = document.createElement("input");
    input.type      = "text";
    input.value     = span.textContent;
    input.className = "header-input";
    wrap.replaceChildren(input);
    input.focus();
    input.select();

    const commit = () => {
      if (input.value !== span.textContent) {
        onBeforeMutate();
        onChange(input.value);
        span.textContent = input.value;
      }
      wrap.replaceChildren(span);
    };

    input.addEventListener("blur", commit);
    input.addEventListener("keydown", e => {
      if (e.key === "Enter")  { e.preventDefault(); input.blur(); }
      if (e.key === "Escape") { wrap.replaceChildren(span); }
    });
  });
}

function addDeleteBtn(th, onDelete) {
  const btn = el("button", "delete-btn");
  btn.textContent = "✕";
  btn.title = "Delete";
  btn.addEventListener("click", e => { e.stopPropagation(); onDelete(); });
  th.appendChild(btn);
}

// ── CSV export ────────────────────────────────────────────────────────────────

function renderExport(container, ctx) {
  container.innerHTML = `
    <h3>Export as CSV</h3>
    <div class="export-options">
      <div class="option-group">
        <span>Cell format:</span>
        <label><input type="radio" name="csv-format" value="X" checked /> X / blank</label>
        <label><input type="radio" name="csv-format" value="1" /> 1 / 0</label>
      </div>
      <label class="option-group">
        <input type="checkbox" id="csv-headers" checked /> Include headers
      </label>
    </div>
    <button class="btn-primary" id="btn-export">Download CSV</button>
  `;

  container.querySelector("#btn-export").addEventListener("click", () => {
    const binary  = container.querySelector("input[name='csv-format']:checked").value === "1";
    const headers = container.querySelector("#csv-headers").checked;
    downloadText(ctx.toCSV({ marked: binary ? "1" : "X", empty: binary ? "0" : "", headers }), "context.csv", "text/csv");
  });
}

function downloadText(content, filename, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a   = Object.assign(document.createElement("a"), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function el(tag, className) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  return e;
}
