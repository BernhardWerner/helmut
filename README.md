# Helmut

A JavaScript library for [Formal Concept Analysis](https://en.wikipedia.org/wiki/Formal_concept_analysis), paired with a browser-based tool for interactive use.

## What it is

- **A library** — import `src/helmut.js` as an ES module in your own project.
- **A website** — open `website/index.html` via a local server to use the tool directly in the browser.

No build step, no dependencies.

The library is set up to be compatible with [CindyJS](https://cindyjs.org/), which is how I want to use it mostly. In particular, the website portion will use CindyJS for some visualisations. But the library can (should...) be usable independantly from any form of frontend.

## Usage

```js
import { VERSION } from "./src/helmut.js";
```

The website requires a local HTTP server (not `file://`) because it uses ES modules:

```sh
python -m http.server 8000   # then open http://localhost:8000/website/
```

## Data structures

See [SPEC.md](SPEC.md) for the canonical representation of contexts, concepts, lattices, layouts, and implications — including the array encoding required for CindyJS interop.

## Status

Work in progress.
