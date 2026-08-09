import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { SCHEMA, REQUIRED_FIELDS, assessMetadata, buildManifest, isOfficialHttpsUrl, safeDownloadName } from "../manifest.mjs";

assert.equal(SCHEMA, "searchtrace.ucc_evidence_manifest.v1");
assert.equal(REQUIRED_FIELDS.length, 10);
assert.equal(new Set(REQUIRED_FIELDS.map(([key]) => key)).size, REQUIRED_FIELDS.length);
assert.equal(isOfficialHttpsUrl("https://www.sos.ca.gov/ucc"), true);
assert.equal(isOfficialHttpsUrl("http://example.com"), false);
assert.equal(isOfficialHttpsUrl("not a url"), false);

const values = {
  debtorName: "Example Holdings LLC",
  debtorType: "organization",
  jurisdiction: "California",
  filingOffice: "Secretary of State",
  officialSourceUrl: "https://www.sos.ca.gov/business-programs/ucc",
  reportDate: "2026-08-08",
  throughDate: "2026-08-07",
  searchIdentifier: "SEARCH-123",
  receiptIdentifier: "RECEIPT-123",
  feePaid: "$5.00",
  searchLogic: "standard_exact",
  nameVariants: "None shown on report",
  resultCount: "0",
  scopeNotes: "Official state UCC index only; no clearance conclusion.",
};
const files = [
  { role: "official_search_report", name: "search.pdf", type: "application/pdf", size: 100, sha256: "a".repeat(64) },
  { role: "filing_office_receipt", name: "receipt.pdf", type: "application/pdf", size: 50, sha256: "b".repeat(64) },
];

const complete = assessMetadata(values, files);
assert.equal(complete.status, "manifest_ready");
assert.deepEqual(complete.missing, []);

const incomplete = assessMetadata({ ...values, throughDate: "", officialSourceUrl: "http://invalid.example" }, files.slice(0, 1));
assert.equal(incomplete.status, "needs_input");
assert.ok(incomplete.missing.includes("Official through date"));
assert.ok(incomplete.missing.includes("Valid HTTPS official source URL"));
assert.ok(incomplete.missing.includes("Filing-office receipt file"));

const manifest = buildManifest(values, files, complete, "2026-08-09T00:00:00Z");
assert.equal(manifest.schema, SCHEMA);
assert.equal(manifest.search_scope.debtor_name_exactly_as_submitted, values.debtorName);
assert.equal(manifest.file_inventory.length, 2);
assert.equal(manifest.file_inventory[0].sha256.length, 64);
assert.ok(manifest.limitations.some((item) => item.includes("not a legal opinion")));
assert.equal(safeDownloadName("Example Holdings, LLC"), "searchtrace-example-holdings-llc-manifest.json");

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const request = await readFile(new URL("../offers/ucc-search-evidence-pack/index.html", import.meta.url), "utf8");
const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
const app = await readFile(new URL("../app.mjs", import.meta.url), "utf8");
const robots = await readFile(new URL("../robots.txt", import.meta.url), "utf8");
const sitemap = await readFile(new URL("../sitemap.xml", import.meta.url), "utf8");

for (const required of [
  "SearchTrace organizes and seals evidence you already hold; it is not a legal opinion, a certified government search, or proof that no filing exists.",
  "Scoped Evidence Pack — $249",
  "within two business days after complete intake",
  "ucc-search-evidence-pack",
  "Nothing is uploaded",
  "No checkout is exposed while this offer is being tested.",
]) assert.ok(html.includes(required), `missing required page text: ${required}`);

assert.ok(html.includes('href="styles.css"'));
assert.ok(html.includes('src="app.mjs"'));
assert.ok(!html.match(/<script[^>]+src=["']https?:/), "unexpected third-party script");
assert.ok(app.includes('crypto.subtle.digest("SHA-256"'));
assert.ok(app.includes("URL.createObjectURL"));
assert.ok(css.length > 10000, "stylesheet unexpectedly thin");
assert.ok(request.includes("Offer ID: ucc-search-evidence-pack"));
assert.ok(request.includes("$249 once"));
assert.ok(request.includes("Nothing sends automatically"));
assert.ok(request.includes("Nothing is transmitted until you press send"));
assert.ok(request.includes("mailto:operations@ustechautomations.com"));
assert.ok(robots.includes("Sitemap: https://ustechautomations.github.io/ucc-search-evidence-pack/sitemap.xml"));
assert.ok(sitemap.includes("https://ustechautomations.github.io/ucc-search-evidence-pack/"));
assert.ok(sitemap.includes("https://ustechautomations.github.io/ucc-search-evidence-pack/offers/ucc-search-evidence-pack/"));

console.log("searchtrace checks: PASS");
