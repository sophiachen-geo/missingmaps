// MapSwipe person-hours calculator.
// Registers itself with the engine in index.html. See README for the definition format.
(function () {
  const C = 40075016.686;      // Earth's equatorial circumference, m
  const M2_PER_KM2 = 1e6;
  const S_PER_H = 3600;
  const MAX_PROJECT_KM2 = 5000; // MapSwipe limit per project

  window.Calculators.register({
    id: 'mapswipe',
    name: 'MapSwipe',

    intro: `
      <p>A MapSwipe project splits an area into small satellite image tiles, and each tile has to be checked
      by several volunteers before the project is complete. This calculator turns that work into an estimate
      of volunteer time, so you can judge whether a project fits your community, your mapathon or your deadline
      before you launch it. Enter your area to see the person&#8209;hours it needs, or enter the hours your
      volunteers can give to see how much area they can cover. It works for tile based projects such as Find,
      Compare and Completeness, but not for Validate, which works on building footprints instead of tiles.</p>`,

    modes: [
      { id: 'PH', label: 'Estimate person\u2011hours', given: 'A' },
      { id: 'A',  label: 'Estimate area',         given: 'PH' },
    ],

    inputs: [
      { id: 'A',   symbol: 'A',  label: 'Area to map', unit: 'km²', default: 3210, min: 0 },
      { id: 'PH',  symbol: 'PH', label: 'Person-hours available', default: 1454.45, min: 0 },
      { id: 'phi', symbol: 'φ',  label: 'Latitude of the project', unit: '°', default: 51.15, min: -85, max: 85,
        hint: 'Use the centre of your area. Tiles get smaller further from the equator.' },
      { id: 'Z',   symbol: 'Z',  label: 'Zoom level', type: 'select', default: 18,
        options: [14, 15, 16, 17, 18, 19, 20, 21, 22],
        hint: 'MapSwipe tiles are usually zoom 18. Each step up gives four times as many tiles.' },
      { id: 'R',   symbol: 'R',  label: 'Reviews per tile', default: 5, min: 1, step: 1,
        hint: 'The verification number. MapSwipe uses 3 by default and recommends 5 for harder tasks.' },
      { id: 'T',   symbol: 'T',  label: 'Seconds per tile', default: 3, fixed: true,
        hint: 'Fixed average swipe time.' },
    ],

    equations: [
      { tex: String.raw`PH = \dfrac{\left(\dfrac{A}{W^2/10^6}\right) \times R \times T}{3600}` },
      { text: 'where the ground width of one tile is' },
      { tex: String.raw`W = \dfrac{C\cos(\phi)}{2^Z}` },
      { text: 'Rearranged to find the area instead' },
      { tex: String.raw`A = \dfrac{PH \times 3600}{R \times T} \times \dfrac{W^2}{10^6}` },
    ],

    validate(v, mode) {
      const errs = [];
      if (!Number.isFinite(v.phi) || Math.abs(v.phi) > 85) errs.push('Latitude needs to be between −85° and 85°.');
      if (!Number.isFinite(v.R) || v.R <= 0) errs.push('Reviews per tile needs to be at least 1.');
      if (mode === 'PH' && (!Number.isFinite(v.A) || v.A < 0)) errs.push('Enter the size of your area in km².');
      if (mode === 'A' && (!Number.isFinite(v.PH) || v.PH < 0)) errs.push('Enter the number of person-hours available.');
      return errs;
    },

    solve(v, mode, f) {
      const { phi, Z, R, T } = v;
      const W = C * Math.cos(phi * Math.PI / 180) / Math.pow(2, Z);
      const tileKm2 = W * W / M2_PER_KM2;
      let A, PH, tiles;
      if (mode === 'PH') { A = v.A;  tiles = A / tileKm2;              PH = tiles * R * T / S_PER_H; }
      else               { PH = v.PH; tiles = PH * S_PER_H / (R * T); A = tiles * tileKm2; }
      const seconds = tiles * R * T;
      const reviews = `${R} review${R === 1 ? '' : 's'}`;

      const headline = mode === 'PH' ? `${f.num(PH)} person\u2011hours` : `${f.num(A)} km²`;
      const sub = mode === 'PH'
        ? `to map ${f.num(A, 0)} km² at zoom ${Z} with ${reviews} per tile, which is about ${f.int(tiles)} tiles`
        : `can be covered with ${f.num(PH)} person-hours at zoom ${Z} with ${reviews} per tile, which is about ${f.int(tiles)} tiles`;

      const notes = [];
      if (A > MAX_PROJECT_KM2) {
        const n = Math.ceil(A / MAX_PROJECT_KM2);
        notes.push(`MapSwipe accepts up to ${f.int(MAX_PROJECT_KM2)} km² per project, so this area would need to be split into at least ${n} projects.`);
      }

      const steps = [
        `<b>Tile width</b> W = ${f.num(C, 3)} × cos(${phi}°) / 2<sup>${Z}</sup> = <b>${f.num(W)} m</b>`,
        `<b>Tile area</b> W² / 10⁶ = ${f.num(W * W, 1)} m² / 10⁶ = <b>${tileKm2.toPrecision(5)} km²</b>`,
        ...(mode === 'PH' ? [
          `<b>Number of tiles</b> A / tile area = ${f.num(A)} / ${tileKm2.toPrecision(5)} = <b>${f.int(tiles)}</b>`,
          `<b>Total swipe time</b> tiles × R × T = ${f.int(tiles)} × ${R} × ${T} = <b>${f.int(seconds)} s</b>`,
          `<b>Person-hours</b> ${f.int(seconds)} / 3600 = <b>${f.num(PH)}</b>`,
        ] : [
          `<b>Total swipe time</b> PH × 3600 = ${f.num(PH)} × 3600 = <b>${f.int(seconds)} s</b>`,
          `<b>Number of tiles</b> seconds / (R × T) = ${f.int(seconds)} / (${R} × ${T}) = <b>${f.int(tiles)}</b>`,
          `<b>Area</b> tiles × tile area = ${f.int(tiles)} × ${tileKm2.toPrecision(5)} = <b>${f.num(A)} km²</b>`,
        ]),
      ];

      const out = r => (r === mode ? 'Result' : 'Input');
      const variables = [
        ['PH',   'Total person-hours', out('PH'), f.num(PH)],
        ['A',    'Total mapped area', out('A'), `${f.num(A)} km²`],
        ['C',    "Earth's circumference at the equator", 'Fixed', `${f.num(C, 3)} m`],
        ['φ',    'Project latitude', 'Input', `${phi}°`],
        ['Z',    'Zoom level', 'Input', Z],
        ['W',    'Ground width of one tile', 'Calculated', `${f.num(W, 1)} m`],
        ['R',    'Reviews per tile', 'Input', R],
        ['T',    'Seconds per tile', 'Fixed', T],
        ['10⁶',  'Converts m² to km²', 'Fixed', '1,000,000'],
        ['3600', 'Seconds in an hour', 'Fixed', '3,600'],
      ];

      return { headline, sub, notes, steps, variables };
    },
  });
})();
