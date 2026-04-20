// ── Public entry ─────────────────────────────────────────────────────────────

export function renderContextSection(container, ctx, onNewContext) {
  container.innerHTML = "";

  const toolbar = el("div", "toolbar");
  const newBtn  = el("button", "btn-secondary");
  newBtn.textContent = "New Context";
  newBtn.addEventListener("click", onNewContext);
  toolbar.appendChild(newBtn);
  container.appendChild(toolbar);

  const tableWrap = el("div", "table-wrap");
  container.appendChild(tableWrap);

  const exportWrap = el("div", "export-section");
  container.appendChild(exportWrap);

  function rerender() {
    renderTable(tableWrap, ctx, rerender);
    renderExport(exportWrap, ctx);
  }

  rerender();
}

// ── Table ─────────────────────────────────────────────────────────────────────

function renderTable(container, ctx, rerender) {
  container.innerHTML = "";

  const table = document.createElement("table");
  table.className = "context-table";

  // ── Header row ──
  const thead     = table.createTHead();
  const headerRow = thead.insertRow();

  // top-left corner
  headerRow.appendChild(el("th", "corner"));

  // attribute headers
  for (let j = 0; j < ctx.attributes.length; j++) {
    const th = el("th", "attr-header");
    makeEditable(th, ctx.attributes[j], name => ctx.renameAttribute(j, name));
    headerRow.appendChild(th);
  }

  // "add attribute" column header
  const addAttrTh  = el("th", "add-btn-cell");
  const addAttrBtn = el("button");
  addAttrBtn.textContent = "+";
  addAttrBtn.setAttribute("tabindex", "-1");
  addAttrTh.title = "Add attribute";
  addAttrTh.appendChild(addAttrBtn);
  addAttrTh.addEventListener("click", () => { ctx.addAttribute(""); rerender(); });
  headerRow.appendChild(addAttrTh);

  // ── Body rows ──
  const tbody = table.createTBody();

  for (let i = 0; i < ctx.objects.length; i++) {
    const row = tbody.insertRow();

    // object header
    const th = el("th", "obj-header");
    makeEditable(th, ctx.objects[i], name => ctx.renameObject(i, name));
    row.appendChild(th);

    // incidence cells
    for (let j = 0; j < ctx.attributes.length; j++) {
      const td = row.insertCell();
      td.className = "incidence-cell";
      if (ctx.incidence[i][j]) td.classList.add("marked");
      td.textContent = ctx.incidence[i][j] ? "×" : "";
      td.addEventListener("click", () => {
        ctx.toggle(i, j);
        td.classList.toggle("marked", !!ctx.incidence[i][j]);
        td.textContent = ctx.incidence[i][j] ? "×" : "";
      });
    }

    // spacer under add-attribute column
    row.insertCell().className = "add-col-spacer";
  }

  // ── Add-object row ──
  const addObjRow = tbody.insertRow();
  addObjRow.className = "add-obj-row";

  const addObjTh  = el("th", "add-btn-cell");
  const addObjBtn = el("button");
  addObjBtn.textContent = "+";
  addObjBtn.setAttribute("tabindex", "-1");
  addObjTh.title = "Add object";
  addObjTh.appendChild(addObjBtn);
  addObjTh.addEventListener("click", () => { ctx.addObject(""); rerender(); });
  addObjRow.appendChild(addObjTh);

  // spacers across
  for (let j = 0; j <= ctx.attributes.length; j++) {
    addObjRow.insertCell().className = "add-row-spacer";
  }

  container.appendChild(table);
}

// ── Editable header cell ──────────────────────────────────────────────────────

function makeEditable(th, initialValue, onChange) {
  const span = document.createElement("span");
  span.textContent = initialValue;
  th.appendChild(span);
  th.title = "Click to rename";

  th.addEventListener("click", e => {
    if (e.target.tagName === "INPUT") return;

    const input = document.createElement("input");
    input.type      = "text";
    input.value     = span.textContent;
    input.className = "header-input";
    th.replaceChildren(input);
    input.focus();
    input.select();

    const commit = () => {
      onChange(input.value);
      span.textContent = input.value;
      th.replaceChildren(span);
    };

    input.addEventListener("blur", commit);
    input.addEventListener("keydown", e => {
      if (e.key === "Enter")  { e.preventDefault(); input.blur(); }
      if (e.key === "Escape") { th.replaceChildren(span); }
    });
  });
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
