// SVG gradients are referenced by id, so every drawing needs its own.
let n = 0;
export const nextSvgId = (prefix) => `${prefix}${++n}`;
