/**
 * Helmut — Formal Concept Analysis library
 */

export const VERSION = "0.1.0";

// ── Naming ────────────────────────────────────────────────────────────────────

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

// ── Context ───────────────────────────────────────────────────────────────────

export class Context {
  constructor(objects, attributes, incidence) {
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
