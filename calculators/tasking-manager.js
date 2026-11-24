// HOT Tasking Manager person-hours calculator.
// Registers itself with the engine in index.html. See README for the definition format.
(function () {
  const C = 40075016.686;      // Earth's equatorial circumference, m
  const M2_PER_KM2 = 1e6;
  const MIN_PER_H = 60;

  window.Calculators.register({
    id: 'tasking-manager',
    name: 'HOT Tasking Manager',

    intro: `
      <p>A Tasking Manager project divides an area into a grid of square tasks. Each task is mapped by one
      volunteer in an editor such as iD or JOSM, then checked by a more experienced validator. This calculator
      estimates the mapping and validation time a project needs, so you can plan how many mappers and
      validators to recruit before you publish it. Enter your area and the number of volunteers to see the
      total person&#8209;hours and how long each volunteer needs, or enter your volunteers and the hours each
      can give to see how much area they can cover. Time per task varies a lot with building density and
      imagery, so use the averages from a similar past project where you can.</p>`,

    modes: [
      { id: 'PH', label: 'Estimate person‑hours', given: ['A', 'N'] },
      { id: 'A',  label: 'Estimate area',             given: ['N', 'H'] },
    ],

    inputs: [
      { id: 'A',   symbol: 'A',  label: 'Area to map', unit: 'km²', default: 25, min: 0 },
      { id: 'N',   symbol: 'N',  label: 'Number of volunteers', default: 30, min: 1, step: 1 },
      { id: 'H',   symbol: 'H',  label: 'Hours per volunteer', default: 15, min: 0,
        hint: 'The average time each volunteer will spend mapping or validating.' },
      { id: 'phi', symbol: 'φ',  label: 'Latitude of the project', unit: '°', default: 51.15, min: -85, max: 85,
        hint: 'Use the centre of your area. Tasks get smaller further from the equator.' },
      { id: 'Z',   symbol: 'Z',  label: 'Task grid zoom level', type: 'select', default: 17,
        options: [13, 14, 15, 16, 17, 18, 19],
        hint: 'The square grid is built from map tiles at one zoom level. Each step smaller gives four times as many tasks.' },
      { id: 'Tm',  symbol: 'Tₘ', label: 'Minutes to map one task', default: 30, min: 0,
        hint: 'Average for a typical task, including any remapping after feedback.' },
      { id: 'Tv',  symbol: 'Tᵥ', label: 'Minutes to validate one task', default: 10, min: 0,
        hint: 'Validating a well mapped task usually takes much less time than mapping it.' },
    ],

    equations: [
      { text: 'Total person‑hours are the number of volunteers times the average hours each gives' },
      { tex: String.raw`PH = N \times H` },
      { text: 'The person‑hours a project needs are' },
      { tex: String.raw`PH = \dfrac{\left(\dfrac{A}{W^2/10^6}\right) \times (T_m + T_v)}{60}` },
      { text: 'where the ground width of one task square is' },
      { tex: String.raw`W = \dfrac{C\cos(\phi)}{2^Z}` },
      { text: 'Rearranged to find the area that a group of volunteers can cover' },
      { tex: String.raw`A = \dfrac{N \times H \times 60}{T_m + T_v} \times \dfrac{W^2}{10^6}` },
    ],

    validate(v, mode) {
      const errs = [];
      if (!Number.isFinite(v.phi) || Math.abs(v.phi) > 85) errs.push('Latitude needs to be between −85° and 85°.');
      if (!Number.isFinite(v.N) || v.N < 1) errs.push('Enter at least 1 volunteer.');
      if (!Number.isFinite(v.Tm) || v.Tm < 0) errs.push('Enter the minutes it takes to map one task.');
      if (!Number.isFinite(v.Tv) || v.Tv < 0) errs.push('Enter the minutes it takes to validate one task.');
      if (Number.isFinite(v.Tm) && Number.isFinite(v.Tv) && v.Tm + v.Tv <= 0) errs.push('Mapping and validation time cannot both be zero.');
      if (mode === 'PH' && (!Number.isFinite(v.A) || v.A < 0)) errs.push('Enter the size of your area in km².');
      if (mode === 'A' && (!Number.isFinite(v.H) || v.H < 0)) errs.push('Enter the average hours each volunteer can give.');
      return errs;
    },

    solve(v, mode, f) {
      const { phi, Z, N, Tm, Tv } = v;
      const W = C * Math.cos(phi * Math.PI / 180) / Math.pow(2, Z);
      const taskKm2 = W * W / M2_PER_KM2;
      let A, PH, H, tasks;
      if (mode === 'PH') { A = v.A; tasks = A / taskKm2; PH = tasks * (Tm + Tv) / MIN_PER_H; H = PH / N; }
      else               { H = v.H; PH = N * H; tasks = PH * MIN_PER_H / (Tm + Tv); A = tasks * taskKm2; }
      const mapH = tasks * Tm / MIN_PER_H;
      const valH = tasks * Tv / MIN_PER_H;
      const people = `${f.int(N)} volunteer${N === 1 ? '' : 's'}`;
      const hrs = x => `${f.num(x, 1)} hour${Math.abs(x - 1) < 0.05 ? '' : 's'}`;

      const headline = mode === 'PH' ? `${f.num(PH)} person‑hours` : `${f.num(A)} km²`;
      const sub = mode === 'PH'
        ? `to map and validate ${f.num(A, A < 10 ? 1 : 0)} km², which is about ${f.int(tasks)} tasks. Shared between ${people}, that is about <b>${hrs(H)} each</b>.`
        : `can be mapped and validated by ${people} giving ${hrs(H)} each, which is about ${f.int(tasks)} tasks and ${f.num(PH)} person‑hours.`;

      const notes = [
        `Of this time, ${f.num(mapH, 0)} hours are mapping and ${f.num(valH, 0)} hours are validation. Validation needs experienced validators and is often the slowest stage of a project, so make sure enough of your volunteers can validate.`,
      ];

      const steps = [
        `<b>Task width</b> W = ${f.num(C, 3)} × cos(${phi}°) / 2<sup>${Z}</sup> = <b>${f.num(W)} m</b>`,
        `<b>Task area</b> W² / 10⁶ = ${f.num(W * W, 1)} m² / 10⁶ = <b>${taskKm2.toPrecision(5)} km²</b>`,
        ...(mode === 'PH' ? [
          `<b>Number of tasks</b> A / task area = ${f.num(A)} / ${taskKm2.toPrecision(5)} = <b>${f.int(tasks)}</b>`,
          `<b>Person‑hours</b> tasks × (Tₘ + Tᵥ) / 60 = ${f.int(tasks)} × (${Tm} + ${Tv}) / 60 = <b>${f.num(PH)}</b>`,
          `<b>Hours per volunteer</b> PH / N = ${f.num(PH)} / ${f.int(N)} = <b>${f.num(H)}</b>`,
        ] : [
          `<b>Person‑hours</b> N × H = ${f.int(N)} × ${f.num(H)} = <b>${f.num(PH)}</b>`,
          `<b>Number of tasks</b> PH × 60 / (Tₘ + Tᵥ) = ${f.num(PH)} × 60 / (${Tm} + ${Tv}) = <b>${f.int(tasks)}</b>`,
          `<b>Area</b> tasks × task area = ${f.int(tasks)} × ${taskKm2.toPrecision(5)} = <b>${f.num(A)} km²</b>`,
        ]),
        `<b>Split</b> mapping ${f.int(tasks)} × ${Tm} / 60 = ${f.num(mapH)} hours, validation ${f.int(tasks)} × ${Tv} / 60 = ${f.num(valH)} hours`,
      ];

      const variables = [
        ['PH',  'Total person‑hours', 'Calculated', f.num(PH)],
        ['N',   'Number of volunteers', 'Input', f.int(N)],
        ['H',   'Average hours per volunteer', mode === 'PH' ? 'Result' : 'Input', f.num(H)],
        ['A',   'Total mapped area', mode === 'A' ? 'Result' : 'Input', `${f.num(A)} km²`],
        ['C',   "Earth's circumference at the equator", 'Fixed', `${f.num(C, 3)} m`],
        ['φ',   'Project latitude', 'Input', `${phi}°`],
        ['Z',   'Task grid zoom level', 'Input', Z],
        ['W',   'Ground width of one task', 'Calculated', `${f.num(W, 1)} m`],
        ['Tₘ',  'Minutes to map one task', 'Input', Tm],
        ['Tᵥ',  'Minutes to validate one task', 'Input', Tv],
        ['10⁶', 'Converts m² to km²', 'Fixed', '1,000,000'],
        ['60',  'Minutes in an hour', 'Fixed', '60'],
      ];

      return { headline, sub, notes, steps, variables };
    },
  });
})();
