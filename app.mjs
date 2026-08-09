import { assessMetadata, buildManifest, safeDownloadName } from "./manifest.mjs";

const form = document.querySelector("#manifest-form");
const fileInput = document.querySelector("#evidence-files");
const fileTable = document.querySelector("#file-table");
const hashStatus = document.querySelector("#hash-status");
const results = document.querySelector("#results");
const resultLabel = document.querySelector("#result-label");
const missingList = document.querySelector("#missing-list");
const cautionList = document.querySelector("#caution-list");
const manifestPreview = document.querySelector("#manifest-preview");
const downloadButton = document.querySelector("#download-manifest");

let fileInventory = [];
let currentManifest = null;

function hex(buffer) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hashFile(file) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return hex(digest);
}

function roleFor(file, index) {
  const lower = file.name.toLowerCase();
  if (lower.includes("receipt") || lower.includes("payment") || lower.includes("fee")) {
    return "filing_office_receipt";
  }
  if (lower.includes("search") || lower.includes("ucc11") || lower.includes("certificate")) {
    return "official_search_report";
  }
  return index === 0 ? "official_search_report" : index === 1 ? "filing_office_receipt" : "supporting_file";
}

function renderFiles() {
  fileTable.innerHTML = "";
  for (const file of fileInventory) {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${escapeHtml(file.name)}</td><td><select aria-label="Role for ${escapeHtml(file.name)}">
      <option value="official_search_report">Official search report</option>
      <option value="filing_office_receipt">Filing-office receipt</option>
      <option value="supporting_file">Supporting file</option>
    </select></td><td>${file.size.toLocaleString()} bytes</td><td><code>${file.sha256.slice(0, 14)}…</code></td>`;
    const select = row.querySelector("select");
    select.value = file.role;
    select.addEventListener("change", () => { file.role = select.value; });
    fileTable.append(row);
  }
  document.querySelector("#files-panel").hidden = fileInventory.length === 0;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[character]);
}

fileInput.addEventListener("change", async () => {
  const files = [...fileInput.files];
  fileInventory = [];
  hashStatus.textContent = files.length ? `Hashing ${files.length} file${files.length === 1 ? "" : "s"} locally…` : "";
  for (const [index, file] of files.entries()) {
    fileInventory.push({
      role: roleFor(file, index),
      name: file.name,
      type: file.type,
      size: file.size,
      sha256: await hashFile(file),
    });
  }
  hashStatus.textContent = files.length ? `${files.length} local SHA-256 hash${files.length === 1 ? "" : "es"} calculated. No files were uploaded.` : "";
  renderFiles();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(form).entries());
  const assessment = assessMetadata(values, fileInventory);
  currentManifest = buildManifest(values, fileInventory, assessment);

  resultLabel.textContent = assessment.status === "manifest_ready" ? "Manifest inputs complete" : "Manifest needs more input";
  missingList.replaceChildren(...(assessment.missing.length ? assessment.missing : ["No required metadata gaps found."]).map(listItem));
  cautionList.replaceChildren(...(assessment.cautions.length ? assessment.cautions : ["No optional cautions found."]).map(listItem));
  manifestPreview.textContent = JSON.stringify(currentManifest, null, 2);
  results.hidden = false;
  results.scrollIntoView({ behavior: "smooth", block: "start" });
});

form.addEventListener("reset", () => {
  fileInventory = [];
  currentManifest = null;
  fileTable.innerHTML = "";
  hashStatus.textContent = "";
  results.hidden = true;
  document.querySelector("#files-panel").hidden = true;
});

downloadButton.addEventListener("click", () => {
  if (!currentManifest) return;
  const blob = new Blob([`${JSON.stringify(currentManifest, null, 2)}\n`], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = safeDownloadName(currentManifest.search_scope.debtor_name_exactly_as_submitted);
  link.click();
  URL.revokeObjectURL(link.href);
});

function listItem(text) {
  const item = document.createElement("li");
  item.textContent = text;
  return item;
}
