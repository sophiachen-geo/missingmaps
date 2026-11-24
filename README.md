# missingmaps

## Person-Hours Calculator

Live at **https://sophiachen-geo.github.io/missingmaps/**

Helps project creators estimate how much volunteer time a mapping project needs before they launch it, or how much area a given amount of volunteer time can cover.

| Tab | Status |
|---|---|
| MapSwipe | Live |
| HOT Tasking Manager | Live, first version |

### MapSwipe formula

`PH = (A / (W² / 10⁶)) × R × T / 3600`, where tile width `W = C · cos(φ) / 2^Z`.

Fixed values are `C = 40,075,016.686 m`, `T = 3 s`, `10⁶` and `3600`. Users choose latitude, zoom and reviews per tile, enter the number of volunteers `N`, and enter either the area or the average hours per volunteer `H` (`PH = N × H`).

### HOT Tasking Manager formula

`PH = (A / (W² / 10⁶)) × (Tₘ + Tᵥ) / 60`, with the same tile width `W` used for the square task grid at zoom `Z`.

`Tₘ` and `Tᵥ` are the average minutes to map and to validate one task. They vary a lot between projects, so the defaults (30 and 10) are placeholders that should be replaced with averages from a similar past project. The result also splits the hours into mapping and validation, since validation is usually the bottleneck.

### How it is built

No build step and no dependencies apart from KaTeX (loaded from a CDN) to display the equations.

```
index.html                    page shell, tabs and the shared calculator engine
calculators/mapswipe.js       MapSwipe definition
calculators/tasking-manager.js  HOT Tasking Manager definition
```

Each file in `calculators/` registers one tab with `window.Calculators.register({...})`. The engine draws the inputs, mode switch, result box and the collapsible sections from that definition, so a new calculator needs no changes to the page itself.

### Adding a calculator

Copy `calculators/mapswipe.js` or `calculators/tasking-manager.js` and change these fields. Setting `comingSoon: true` with only `id`, `name` and `intro` shows a placeholder tab.

| Field | What it does |
|---|---|
| `intro` | Short paragraph shown above the inputs |
| `modes` | The things you can solve for. Each has a `label` and the list of inputs shown in that mode (`given`). Inputs not named in any mode are always shown |
| `inputs` | Each field with `id`, `symbol`, `label`, `unit`, `default`, `min`/`max`, `hint`. Use `type: 'select'` with `options` for dropdowns and `fixed: true` for read only constants |
| `equations` | A list of `{ tex }` items (rendered with KaTeX) and `{ text }` captions |
| `validate(values, mode)` | Returns a list of error messages, or an empty list |
| `solve(values, mode, f)` | Returns `{ headline, sub, notes, steps, variables }`. `f.num(x, decimals)` and `f.int(x)` format numbers |

Then add a `<script>` tag for it in `index.html`. Tabs appear in the order of the script tags. Each tab has its own link, for example `#tasking-manager`.
