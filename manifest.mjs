export const SCHEMA = "searchtrace.ucc_evidence_manifest.v1";

export const REQUIRED_FIELDS = Object.freeze([
  ["debtorName", "Debtor name exactly as searched"],
  ["debtorType", "Debtor type"],
  ["jurisdiction", "Jurisdiction"],
  ["filingOffice", "Filing office"],
  ["officialSourceUrl", "Official source URL"],
  ["reportDate", "Report date"],
  ["throughDate", "Official through date"],
  ["searchIdentifier", "Search or certificate identifier"],
  ["receiptIdentifier", "Receipt or fee identifier"],
  ["scopeNotes", "Search scope and exclusions"],
]);

export function normalizeText(value) {
  return String(value ?? "").trim();
}

export function isOfficialHttpsUrl(value) {
  try {
    const url = new URL(normalizeText(value));
    return url.protocol === "https:" && Boolean(url.hostname);
  } catch {
    return false;
  }
}

export function assessMetadata(values, files = []) {
  const missing = REQUIRED_FIELDS
    .filter(([key]) => !normalizeText(values[key]))
    .map(([, label]) => label);

  if (normalizeText(values.officialSourceUrl) && !isOfficialHttpsUrl(values.officialSourceUrl)) {
    missing.push("Valid HTTPS official source URL");
  }
  if (!files.some((file) => file.role === "official_search_report")) {
    missing.push("Official search report file");
  }
  if (!files.some((file) => file.role === "filing_office_receipt")) {
    missing.push("Filing-office receipt file");
  }

  const cautions = [];
  if (normalizeText(values.searchLogic) === "unknown") {
    cautions.push("Search logic is unknown; the pack cannot describe how name matching was performed.");
  }
  if (!normalizeText(values.nameVariants)) {
    cautions.push("No name-variant handling is documented.");
  }
  if (!normalizeText(values.resultCount)) {
    cautions.push("Returned-record count is not documented.");
  }

  return {
    status: missing.length ? "needs_input" : "manifest_ready",
    missing,
    cautions,
  };
}

export function buildManifest(values, files, assessment, generatedAt = new Date().toISOString()) {
  return {
    schema: SCHEMA,
    generated_at: generatedAt,
    product: "SearchTrace UCC Search Evidence Pack Builder",
    purpose: "Evidence organization only; not a lien-clearance conclusion.",
    search_scope: {
      debtor_name_exactly_as_submitted: normalizeText(values.debtorName),
      debtor_type: normalizeText(values.debtorType),
      jurisdiction: normalizeText(values.jurisdiction),
      filing_office: normalizeText(values.filingOffice),
      official_source_url: normalizeText(values.officialSourceUrl),
      report_date: normalizeText(values.reportDate),
      official_through_date: normalizeText(values.throughDate),
      search_identifier: normalizeText(values.searchIdentifier),
      receipt_identifier: normalizeText(values.receiptIdentifier),
      fee_as_shown: normalizeText(values.feePaid),
      search_logic_as_shown: normalizeText(values.searchLogic),
      name_variants_as_shown: normalizeText(values.nameVariants),
      returned_record_count_as_shown: normalizeText(values.resultCount),
      scope_and_exclusions: normalizeText(values.scopeNotes),
    },
    file_inventory: files.map((file) => ({
      role: file.role,
      filename: file.name,
      media_type: file.type || "application/octet-stream",
      bytes: file.size,
      sha256: file.sha256,
    })),
    assessment,
    limitations: [
      "This manifest does not validate debtor-name search logic or name variants.",
      "This manifest does not establish filing-office completeness or lien priority.",
      "This manifest does not cover fixtures, real-property records, tax or judgment liens, or bankruptcy.",
      "This manifest says nothing about filings after the official through date.",
      "This manifest is not a legal opinion, title report, certified government search, or guarantee that no filing exists.",
    ],
  };
}

export function safeDownloadName(debtorName) {
  const slug = normalizeText(debtorName)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return `searchtrace-${slug || "ucc-search"}-manifest.json`;
}
