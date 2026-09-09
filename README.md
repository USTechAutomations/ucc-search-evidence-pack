# SearchTrace — UCC Search Evidence Pack Builder

SearchTrace is a browser-only tool for organizing an official UCC search report and filing-office receipt into a scoped JSON manifest. It computes SHA-256 locally for every selected file; no file or field is uploaded.

The tool preserves the debtor name exactly as submitted, filing office, jurisdiction, official through date, identifiers, scope notes, and byte inventory. It does not interpret search results or claim lien clearance.

## Run locally

```bash
python3 -m http.server 8080
```

Open `http://127.0.0.1:8080`. Run the dependency-free checks with:

```bash
node tests/check.mjs
```

## Offer boundary

The site tests a fixed-scope $249 evidence-pack service for one debtor in one U.S. jurisdiction. The buyer supplies the official search report and receipt. The deliverable is a PDF evidence summary, JSON manifest, SHA-256 inventory, and the original files unaltered, within two business days after complete intake.

SearchTrace is not a legal opinion, title report, certified government search, lien-clearance conclusion, or guarantee that no filing exists.

## Official references

- [California UCC regulations](https://www.sos.ca.gov/administration/regulations/current-regulations/business/uniform-commercial-code)
- [Texas UCC fees](https://www.sos.texas.gov/ucc/formfees.shtml)
- [New York UCC fees](https://dos.ny.gov/ucc-fee-schedule)

## License

MIT. See [LICENSE](LICENSE).

## Brand and publication

This existing GitHub Pages site publishes from `main:/`. A push to main republishes it. The maintained brand standard is `usta-paid-surfaces/BRAND.md`, bound to the USTA Website UI/UX rules v1.3. `BRAND_SOURCE.json` records the exact shared shell/token/font snapshot; refresh that snapshot from the canonical standard when brand rules change. Keep this tool's behavior and offer boundaries intact.

Before publishing, run the existing product checks plus:

```bash
python3 scripts/check_brand.py --dist . --css styles.css
```

Also inspect both themes at 320, 375, 768, 1024, 1280 and 1440px, keyboard focus and each input/export path. These static checks do not establish rendered accessibility or public availability.
