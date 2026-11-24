# missingmaps

## Person-Hours Calculator

Live at **https://sophiachen-geo.github.io/missingmaps/**

Helps project creators estimate how much volunteer time a mapping project needs before they launch it, or how much area a given amount of volunteer time can cover.

| Tab | Status |
|---|---|
| MapSwipe | Live |
| HOT Tasking Manager | Placeholder, ready to be filled in |

### MapSwipe formula

`PH = (A / (W² / 10⁶)) × R × T / 3600`, where tile width `W = C · cos(φ) / 2^Z`.

Fixed values are `C = 40,075,016.686 m`, `T = 3 s`, `10⁶` and `3600`. Users choose latitude, zoom and reviews per tile, and enter either the area or the person-hours.

### How it is built

No build step and no dependencies apart from KaTeX (loaded from a CDN) to display the equations.

```
index.html                    page shell, tabs and the shared calculator engine
calculators/mapswipe.js       MapSwipe definition
calculators/tasking-manager.js  HOT Tasking Manager placeholder
```

Each file in `calculators/` registers one tab with `window.Calculators.register({...})`. The engine draws the inputs, mode switch, result box and the collapsible sections from that definition, so a new calculator needs no changes to the page itself.

### Adding the Tasking Manager calculator

1. Open `calculators/tasking-manager.js` and remove `comingSoon: true`.
2. Fill in the same fields that `calculators/mapswipe.js` uses.

| Field | What it does |
|---|---|
| `intro` | Short paragraph shown above the inputs |
| `modes` | The things you can solve for. Each has a `label` and the list of inputs shown in that mode (`given`). Inputs not named in any mode are always shown |
| `inputs` | Each field with `id`, `symbol`, `label`, `unit`, `default`, `min`/`max`, `hint`. Use `type: 'select'` with `options` for dropdowns and `fixed: true` for read only constants |
| `equations` | A list of `{ tex }` items (rendered with KaTeX) and `{ text }` captions |
| `validate(values, mode)` | Returns a list of error messages, or an empty list |
| `solve(values, mode, f)` | Returns `{ headline, sub, notes, steps, variables }`. `f.num(x, decimals)` and `f.int(x)` format numbers |

3. To add a further calculator, create a new file in `calculators/` and add a `<script>` tag for it in `index.html`. Tabs appear in the order of the script tags. Each tab has its own link, for example `#tasking-manager`.
