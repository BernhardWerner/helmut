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
    this.extent = extent.slice(); // sorted object indices
    this.intent = intent.slice(); // sorted attribute indices
  }
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

  toArray() {
    return [
      this.objects.slice(),
      this.attributes.slice(),
      this.incidence.map(row => row.slice()),
    ];
  }

  // ── Derivation & closure ──────────────────────────────────────────────────

  // Empty A must return all attribute indices (vacuously true).
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

  // ── Concept enumeration ───────────────────────────────────────────────────

  // Returns all concepts in lectic order of their intents.
  // Uses Ganter's Next Closure algorithm in O(|G|·|M|) steps per concept.
  enumerateConcepts() {
    const m = this.attributes.length;
    const concepts = [];
    // ∅'' is the lectically smallest closed set and always the top concept's intent. Starting from empty set directly would skip it when empty set is not itself closed.
    let intent = this.attributeClosure([]);

    while (true) {
      concepts.push(new Concept(this.attributeDerivation(intent), intent));

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

  // ── Serialisation ─────────────────────────────────────────────────────────

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
