# Helmut — Data Structure Specification

This document defines the canonical data structures used throughout the library.
Every structure has two representations:

- **JS object** — used internally and on the website.
- **Array encoding** — the lossless serialization required for CindyJS interop.
  Every JS object must be convertible to this form (e.g. via a `toArray()` helper).

Array encodings use only nested arrays, numbers, and strings — no objects,
no booleans (use `1`/`0` instead).

---

## 1. Formal Context

A formal context is a triple **K = (G, M, I)**: a set of objects *G*, a set of
attributes *M*, and an incidence relation *I ⊆ G × M*.

### JS object

```js
{
  objects:    ["g1", "g2", "g3"],       // G — array of object labels
  attributes: ["m1", "m2", "m3"],       // M — array of attribute labels
  incidence: [                          // I — boolean matrix, row i = object i
    [1, 0, 1],
    [0, 1, 1],
    [1, 1, 0],
  ]
}
```

`incidence[i][j] === 1` means object `i` has attribute `j`.

### Array encoding

```
[objects, attributes, incidence]
```

```
[
  ["g1", "g2", "g3"],
  ["m1", "m2", "m3"],
  [[1,0,1], [0,1,1], [1,1,0]]
]
```

---

## 2. Formal Concept

A formal concept is a pair **(A, B)** where *A ⊆ G* is the **extent** and
*B ⊆ M* is the **intent**, satisfying *A′ = B* and *B′ = A*.
Indices refer to positions in the parent context's `objects` / `attributes` arrays.

### JS object

```js
{
  extent: [0, 2],    // indices into context.objects
  intent: [0, 2]     // indices into context.attributes
}
```

### Array encoding

```
[extent, intent]
```

```
[[0, 2], [0, 2]]
```

---

## 3. Concept Lattice

The concept lattice collects all formal concepts of a context together with
their partial order and the covering (Hasse) edges used for drawing.

### JS object

```js
{
  context: { /* Formal Context */ },
  concepts: [                          // all formal concepts, index = node id
    { extent: [0,1,2], intent: [] },   // concept 0 — top (if extent is full G)
    { extent: [0,2],   intent: [0] },
    { extent: [1,2],   intent: [1] },
    { extent: [2],     intent: [0,1] },
    { extent: [],      intent: [0,1,2] } // concept n-1 — bottom
  ],
  covers: [            // Hasse edges: [lower_index, upper_index]
    [1, 0],
    [2, 0],
    [3, 1],
    [3, 2],
    [4, 3]
  ]
}
```

`covers[k] = [i, j]` means concept `i` is directly covered by concept `j`
(i.e. concept `i` ≤ concept `j` with no concept in between).

### Array encoding

```
[context_array, concepts_array, covers_array]
```

```
[
  [/* context array encoding */],
  [[[0,1,2],[]], [[0,2],[0]], [[1,2],[1]], [[2],[0,1]], [[],[0,1,2]]],
  [[1,0], [2,0], [3,1], [3,2], [4,3]]
]
```

---

## 4. Diagram Layout

A layout attaches a 2-D position to each concept node. Coordinates are
abstract (not pixels); the renderer is responsible for scaling.
Convention: *y* increases upward, so the top concept has the largest *y*.

### JS object

```js
{
  lattice: { /* Concept Lattice */ },
  positions: [       // one entry per concept, same order as lattice.concepts
    [0.5,  2.0],     // concept 0 (top)
    [0.0,  1.0],
    [1.0,  1.0],
    [0.5,  0.5],
    [0.5, -0.5]      // concept n-1 (bottom)
  ]
}
```

### Array encoding

```
[lattice_array, positions_array]
```

```
[
  [/* lattice array encoding */],
  [[0.5,2.0], [0.0,1.0], [1.0,1.0], [0.5,0.5], [0.5,-0.5]]
]
```

---

## 5. Attribute Implication

An implication **P → C** states that every object possessing all attributes
in premise *P* also possesses all attributes in conclusion *C*.
Indices refer to positions in a context's `attributes` array.
The conclusion conventionally excludes attributes already in the premise.

### JS object

```js
{
  premise:    [0, 1],   // attribute indices
  conclusion: [2]       // attribute indices
}
```

### Array encoding

```
[premise, conclusion]
```

```
[[0, 1], [2]]
```

A **set of implications** (e.g. a Duquenne–Guigues basis) is simply an array
of implication array encodings:

```
[[[0,1],[2]], [[2],[0]], ...]
```

---

## Summary table

| Structure        | Array encoding shape                          |
|------------------|-----------------------------------------------|
| Formal Context   | `[objects[], attributes[], incidence[][]]`    |
| Formal Concept   | `[extent[], intent[]]`                        |
| Concept Lattice  | `[context, concepts[][], covers[][]]`         |
| Diagram Layout   | `[lattice, positions[][]]`                    |
| Implication      | `[premise[], conclusion[]]`                   |
| Implication set  | `[implication[], ...]`                        |
