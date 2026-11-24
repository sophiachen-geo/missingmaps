# missingmaps

## Person-Hours Calculator

`index.html` — a single-file, no-build calculator that estimates validation effort for a mapping project.

- **Solve for PH:** enter area (km²), latitude, zoom level, reviews per tile → person-hours.
- **Solve for A:** enter available person-hours, latitude, zoom, reviews per tile → coverable area.

Formula: `PH = (A / (W² / 10⁶)) × R × T / 3600`, with tile width `W = C·cos(φ) / 2^Z`.
Fixed: `C = 40,075,016.686 m`, `T = 3 s`, `10⁶`, `3600`.

Open `index.html` in a browser, or enable GitHub Pages (Settings → Pages → deploy from branch, root) to host it.
