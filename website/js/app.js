import { Context, NAMING_SCHEMES } from "../../src/helmut.js";
import { renderContextSection } from "./context-view.js";

const createSection  = document.getElementById("create-section");
const contextSection = document.getElementById("context-section");

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
    const numObjects     = Math.max(1, parseInt(document.getElementById("num-objects").value,     10));
    const numAttributes  = Math.max(1, parseInt(document.getElementById("num-attributes").value,  10));
    const objectScheme   = document.getElementById("object-scheme").value;
    const attributeScheme = document.getElementById("attribute-scheme").value;
    showContext(Context.create(numObjects, numAttributes, objectScheme, attributeScheme));
  });
}

function showContext(ctx) {
  createSection.hidden  = true;
  contextSection.hidden = false;
  renderContextSection(contextSection, ctx, showCreateForm);
}

showCreateForm();
