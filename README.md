# CHHS Migration — Component Guides and Comparison

Static reference pages comparing the CSU CHHS / RDC WordPress themes with Find Your Energy + Stalwart Blocks.

## Start here

- `migration-comparison.html` — 43 source-component recommendations with visual previews, transfer rules and gaps.
- `migration-new-components.html` — 12 suggested additions, evidence of the need, priorities and proposed structures.
- `migration-acf-crosswalk.html` — ACF and shared-content transfer guidance.
- `migration-decisions.html` — migration decisions and proposed page recipes.
- `migration-comparison.csv` — text-only comparison export.
- `index.html` — links to the original component guides.

## Component guides

- `guide-chhs-theme.html` — current CHHS theme (ACF slabs).
- `guide-rdc-theme.html` — current RDC theme.
- `guide-find-your-energy.html` — destination framework.

Pure static HTML; theme CSS/fonts/images and local preview dependencies are under `assets/`. Keep the folder together. Serve it locally or open the GitHub Pages site at https://fatjester.github.io/component-guides-pages/. GitHub Pages publishes automatically from the root of the `main` branch.

## Review scope and preview repairs

The comparison uses the supplied extracted guides and local theme definitions. Damaged FPO images were replaced with labeled sample images; extracted callout/gallery/header markup, stylesheet order and script dependencies were repaired. Isolated examples in `comparison-demos/` report their height to the comparison pages. Installed WordPress themes were not changed.

Templates are schematics, integrations may be inventory-only, and new-component diagrams are proposals. The tabs/dialog sample is explicitly a guide-only demonstration. These pages do not certify live feeds, form submissions, directory data, WordPress editing or automatic content conversion. Pilot those behaviors before migration.
