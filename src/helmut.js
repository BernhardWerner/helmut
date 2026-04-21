/**
 * Helmut — Formal Concept Analysis library
 */

export const VERSION = "0.1.0";

// ── Naming ────────────────────────────────────────────────────────────────────

// We want to 1-index elements. Makes the association(A=1, Z=26, AA=27) clearer. The n-- before the modulo implements that shift.
function alphaLabel(i) {
  let label = "";
  let n = i + 1;
  while (n > 0) {
    n--;
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26);
  }
  return label;
}

export const NAMING_SCHEMES = [
  { id: "numeric",      label: "1, 2, 3, …",         forObjects: true,  forAttributes: true  },
  { id: "alpha",        label: "A, B, C, …",         forObjects: true,  forAttributes: true  },
  { id: "obj_numeric",  label: "obj_1, obj_2, …",    forObjects: true,  forAttributes: false },
  { id: "obj_alpha",    label: "obj_A, obj_B, …",    forObjects: true,  forAttributes: false },
  { id: "attr_numeric", label: "attr_1, attr_2, …",  forObjects: false, forAttributes: true  },
  { id: "attr_alpha",   label: "attr_A, attr_B, …",  forObjects: false, forAttributes: true  },
  { id: "empty",        label: "(empty)",             forObjects: true,  forAttributes: true  },
];

export function generateNames(count, scheme) {
  return Array.from({ length: count }, (_, i) => {
    switch (scheme) {
      case "numeric":      return String(i + 1);
      case "alpha":        return alphaLabel(i);
      case "obj_numeric":  return `obj_${i + 1}`;
      case "obj_alpha":    return `obj_${alphaLabel(i)}`;
      case "attr_numeric": return `attr_${i + 1}`;
      case "attr_alpha":   return `attr_${alphaLabel(i)}`;
      case "empty":        return "";
      default:             return String(i + 1);
    }
  });
}

// ── Concept ───────────────────────────────────────────────────────────────────

export class Concept {
  constructor(extent, intent) {
    this.extent  = extent.slice(); // sorted object indices
    this.intent  = intent.slice(); // sorted attribute indices
    this.support = null;           // set by enumerateConcepts; null if constructed manually
  }
}

// ── Internal helpers ─────────────────────────────────────────────────────────

function parseCSVRows(text) {
  const rows = [];
  let row = [], cell = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"')  inQuotes = false;
      else                  cell += ch;
    } else {
      if      (ch === '"')  inQuotes = true;
      else if (ch === ',')  { row.push(cell); cell = ''; }
      else if (ch === '\r') { /* skip bare CR in CRLF line endings */ }
      else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
      else                   cell += ch;
    }
  }
  if (cell !== '' || row.length > 0) { row.push(cell); rows.push(row); }
  // Drop any trailing blank rows introduced by a final newline
  while (rows.length > 0 && rows[rows.length - 1].every(c => c === '')) rows.pop();
  return rows;
}

// Does rowA have all the 1s of rowB, plus at least one more?
function rowStrictlyContains(rowA, rowB) {
  let extra = false;
  for (let j = 0; j < rowA.length; j++) {
    if (rowB[j] && !rowA[j]) return false;
    if (rowA[j] && !rowB[j]) extra = true;
  }
  return extra;
}

function rowIntersect(rows) {
  return rows[0].map((_, j) => rows.every(r => r[j]) ? 1 : 0);
}

function rowEqual(a, b) {
  return a.every((v, j) => v === b[j]);
}

// ── Context ───────────────────────────────────────────────────────────────────

export class Context {
  constructor(objects, attributes, incidence) {
    // Defensive copies so the caller can't silently corrupt the context by mutating the arrays they passed in.
    this.objects    = objects.slice();
    this.attributes = attributes.slice();
    this.incidence  = incidence.map(row => row.slice());
  }

  static create(numObjects, numAttributes, objectScheme = "numeric", attributeScheme = "numeric") {
    return new Context(
      generateNames(numObjects, objectScheme),
      generateNames(numAttributes, attributeScheme),
      Array.from({ length: numObjects }, () => new Array(numAttributes).fill(0)),
    );
  }

  toggle(i, j) {
    this.incidence[i][j] = this.incidence[i][j] ? 0 : 1;
    return this;
  }

  clone() {
    return new Context(this.objects, this.attributes, this.incidence);
  }

  deleteObject(i) {
    this.objects.splice(i, 1);
    this.incidence.splice(i, 1);
    return this;
  }

  deleteAttribute(j) {
    this.attributes.splice(j, 1);
    for (const row of this.incidence) row.splice(j, 1);
    return this;
  }

  addObject(name = "") {
    this.objects.push(name);
    this.incidence.push(new Array(this.attributes.length).fill(0));
    return this;
  }

  addAttribute(name = "") {
    this.attributes.push(name);
    for (const row of this.incidence) row.push(0);
    return this;
  }

  renameObject(i, name) {
    this.objects[i] = name;
    return this;
  }

  renameAttribute(j, name) {
    this.attributes[j] = name;
    return this;
  }

  clarify() {
    const seenRows = new Set();
    const keptObj = [];
    for (let i = 0; i < this.objects.length; i++) {
      const key = this.incidence[i].join(",");
      if (!seenRows.has(key)) { seenRows.add(key); keptObj.push(i); }
    }

    const seenCols = new Set();
    const keptAttr = [];
    for (let j = 0; j < this.attributes.length; j++) {
      const key = this.incidence.map(row => row[j]).join(",");
      if (!seenCols.has(key)) { seenCols.add(key); keptAttr.push(j); }
    }

    return new Context(
      keptObj.map(i => this.objects[i]),
      keptAttr.map(j => this.attributes[j]),
      keptObj.map(i => keptAttr.map(j => this.incidence[i][j])),
    );
  }

  reduce() {
    const c   = this.clarify();
    const inc = c.incidence;
    const n   = c.objects.length;
    const m   = c.attributes.length;

    const dropObj = new Set();
    for (let i = 0; i < n; i++) {
      const above = [];
      for (let h = 0; h < n; h++) {
        if (h !== i && rowStrictlyContains(inc[h], inc[i])) above.push(inc[h]);
      }
      if (above.length > 0 && rowEqual(rowIntersect(above), inc[i])) dropObj.add(i);
    }

    const cols = Array.from({ length: m }, (_, j) => inc.map(row => row[j]));
    const dropAttr = new Set();
    for (let j = 0; j < m; j++) {
      const above = [];
      for (let k = 0; k < m; k++) {
        if (k !== j && rowStrictlyContains(cols[k], cols[j])) above.push(cols[k]);
      }
      if (above.length > 0 && rowEqual(rowIntersect(above), cols[j])) dropAttr.add(j);
    }

    const keptObj  = Array.from({ length: n }, (_, i) => i).filter(i => !dropObj.has(i));
    const keptAttr = Array.from({ length: m }, (_, j) => j).filter(j => !dropAttr.has(j));

    return new Context(
      keptObj.map(i => c.objects[i]),
      keptAttr.map(j => c.attributes[j]),
      keptObj.map(i => keptAttr.map(j => inc[i][j])),
    );
  }

  toArray() {
    return [
      this.objects.slice(),
      this.attributes.slice(),
      this.incidence.map(row => row.slice()),
    ];
  }

  // ── Derivation & closure ──────────────────────────────────────────────────

  // Empty A must return all attribute indices (vacuously true).
  objectDerivation(A) {
    return Array.from({ length: this.attributes.length }, (_, j) => j)
      .filter(j => A.every(i => this.incidence[i][j]));
  }

  // Empty B also returns all object indices.
  attributeDerivation(B) {
    return Array.from({ length: this.objects.length }, (_, i) => i)
      .filter(i => B.every(j => this.incidence[i][j]));
  }

  attributeClosure(B) {
    return this.objectDerivation(this.attributeDerivation(B));
  }

  objectClosure(A) {
    return this.attributeDerivation(this.objectDerivation(A));
  }

  // Relative support of a concept: |extent| / |G|, in [0, 1].
  supportOf(concept) {
    return this.objects.length === 0 ? 0 : concept.extent.length / this.objects.length;
  }

  // ── Concept enumeration ───────────────────────────────────────────────────

  // Returns all concepts in lectic order of their intents.
  // Uses Ganter's Next Closure algorithm in O(|G|·|M|) steps per concept.
  // minSupport (0–1): omit concepts whose relative support falls below this threshold.
  enumerateConcepts({ minSupport = 0 } = {}) {
    const m = this.attributes.length;
    const g = this.objects.length;
    const concepts = [];
    // ∅'' is the lectically smallest closed set and always the top concept's intent. Starting from empty set directly would skip it when empty set is not itself closed.
    let intent = this.attributeClosure([]);

    while (true) {
      const extent  = this.attributeDerivation(intent);
      const concept = new Concept(extent, intent);
      concept.support = g === 0 ? 0 : extent.length / g;
      if (concept.support >= minSupport) concepts.push(concept);

      // Lectic order is determined by the highest-indexed position where two sets differ, so we scan right-to-left to find the first position where we can "increment".
      const B = new Array(m).fill(false);
      for (const j of intent) B[j] = true;

      let next = null;
      for (let j = m - 1; j >= 0; j--) {
        if (B[j]) {
          // Discard elements above j: the candidate we're building is (intent ∩ {0,…,j-1}) ∪ {j}, so high elements of the intent must not carry over.
          B[j] = false;
        } else {
          // Candidate: (intent ∩ {0,…,j-1}) ∪ {j}
          B[j] = true;
          const candidate = [];
          for (let k = 0; k <= j; k++) if (B[k]) candidate.push(k);
          const closed = this.attributeClosure(candidate);

          const closedFlags = new Array(m).fill(false);
          for (const k of closed) closedFlags[k] = true;
          if (closedFlags[j]) {
            // j survived the closure — now check that nothing new appeared below j, which would mean a lectically smaller set was skipped.
            let agrees = true;
            for (let k = 0; k < j; k++) {
              if (B[k] !== closedFlags[k]) { agrees = false; break; }
            }
            if (agrees) { next = closed; break; }
          }
          // j was forced out by the closure (the context entails j from lower attributes), or new lower elements appeared: not a valid increment point. Undo and keep scanning downward.
          B[j] = false;
        }
      }

      if (next === null) break;
      intent = next;
    }

    return concepts;
  }

  isReduced() {
    const r = this.reduce();
    return r.objects.length === this.objects.length && r.attributes.length === this.attributes.length;
  }

  // ── Serialisation ─────────────────────────────────────────────────────────

  // Parses a CSV string produced by toCSV() back into a Context.
  // hasHeaders: whether the CSV has a name row/column.
  // isBinary: true for 1/0 format, false for X/blank.
  static fromCSV(text, { hasHeaders = true, isBinary = false } = {}) {
    const rows = parseCSVRows(text);
    if (rows.length === 0) return Context.create(0, 0);

    const parseCell = v => isBinary ? (v.trim() === '1' ? 1 : 0)
                                    : (v.trim().toUpperCase() === 'X' ? 1 : 0);
    let objects, attributes, incidence;

    if (hasHeaders) {
      attributes = rows[0].slice(1);
      objects    = rows.slice(1).map(r => r[0] ?? '');
      incidence  = rows.slice(1).map(r =>
        Array.from({ length: attributes.length }, (_, j) => parseCell(r[j + 1] ?? ''))
      );
    } else {
      const numAttr = Math.max(...rows.map(r => r.length));
      objects    = generateNames(rows.length, 'numeric');
      attributes = generateNames(numAttr, 'numeric');
      incidence  = rows.map(r =>
        Array.from({ length: numAttr }, (_, j) => parseCell(r[j] ?? ''))
      );
    }

    return new Context(objects, attributes, incidence);
  }

  toCSV({ marked = "X", empty = "", headers = true } = {}) {
    const esc = s => /[,"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    const rows = [];
    if (headers) {
      rows.push(["", ...this.attributes.map(esc)].join(","));
    }
    for (let i = 0; i < this.objects.length; i++) {
      const cells = this.incidence[i].map(v => (v ? marked : empty));
      rows.push(headers ? [esc(this.objects[i]), ...cells].join(",") : cells.join(","));
    }
    return rows.join("\n");
  }
}

// ── Concept Lattice ───────────────────────────────────────────────────────────

export function computeLattice(context) {
  const concepts = context.enumerateConcepts();
  const n = concepts.length;
  const extentSets = concepts.map(c => new Set(c.extent));

  function isStrictSubset(a, b) {
    if (a.size >= b.size) return false;
    for (const x of a) if (!b.has(x)) return false;
    return true;
  }

  const covers = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (!isStrictSubset(extentSets[i], extentSets[j])) continue;
      let direct = true;
      for (let k = 0; k < n && direct; k++) {
        if (k !== i && k !== j && isStrictSubset(extentSets[i], extentSets[k]) && isStrictSubset(extentSets[k], extentSets[j]))
          direct = false;
      }
      if (direct) covers.push([i, j]);
    }
  }

  return { context, concepts, covers };
}

// ── Arrow Relations ───────────────────────────────────────────────────────────

// Returns a G×M matrix: 0=none, 1=↑(up-arrow), 2=↓(down-arrow), 3=↕(both)
// Only defined for non-incident pairs; incident pairs always get 0.
export function computeArrows(context) {
  const { objects, attributes, incidence } = context;
  const n = objects.length;
  const m = attributes.length;
  const cols = Array.from({ length: m }, (_, j) => incidence.map(row => row[j]));

  const arrows = Array.from({ length: n }, () => new Array(m).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      if (incidence[i][j]) continue;

      let up = true;
      for (let h = 0; h < n && up; h++) {
        if (rowStrictlyContains(incidence[h], incidence[i]) && !incidence[h][j]) up = false;
      }

      let down = true;
      for (let k = 0; k < m && down; k++) {
        if (rowStrictlyContains(cols[k], cols[j]) && !incidence[i][k]) down = false;
      }

      arrows[i][j] = (up ? 1 : 0) | (down ? 2 : 0);
    }
  }

  return arrows;
}

// ── CSV format detection ───────────────────────────────────────────────────────

// Sniffs a CSV string and returns best-guess format options for fromCSV().
// hasHeaders: top-left cell is empty, which is the signature of the toCSV() header format.
// isBinary:   data cells contain "1"/"0" but no "X" — distinguishes 1/0 from X/blank export.
export function detectCSVFormat(text) {
  const rows = parseCSVRows(text);
  if (rows.length === 0) return { hasHeaders: false, isBinary: false };

  const hasHeaders = rows[0][0].trim() === '';

  let hasX = false, has1 = false;
  const startRow = hasHeaders ? 1 : 0;
  const startCol = hasHeaders ? 1 : 0;
  for (let i = startRow; i < rows.length; i++)
    for (let j = startCol; j < rows[i].length; j++) {
      const v = rows[i][j].trim().toUpperCase();
      if (v === 'X') hasX = true;
      if (v === '1') has1 = true;
    }

  return { hasHeaders, isBinary: !hasX && has1 };
}
