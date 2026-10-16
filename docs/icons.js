export const art = (name, extra = '') => `<img class="character ${name} ${extra}" src="assets/characters/${name}.webp" alt="" draggable="false">`;
export const labels = { sun: 'Sol', leaf: 'Hoja', flower: 'Flor', drop: 'Gota', heart: 'Corazón', star: 'Estrella' };
const paths = {
  star: '<path d="m16 3 3.7 8 8.8 1-6.5 6 1.8 9-7.8-4.5L8.2 27l1.8-9-6.5-6 8.8-1Z" fill="#e6b34e" stroke="#b68634" stroke-width="1.2"/>',
  sun: '<circle cx="16" cy="16" r="6" fill="#efc35f" stroke="#c39743" stroke-width="1.2"/><path d="M16 2v4m0 20v4M2 16h4m20 0h4M6 6l3 3m14 14 3 3M6 26l3-3M23 9l3-3" stroke="#d7a447" stroke-width="2" stroke-linecap="round"/>',
  leaf: '<path d="M27 5C8 3 2 16 7 23c8 10 22 0 20-18Z" fill="#90aa70" stroke="#5b7d4c" stroke-width="1.3"/><path d="M4 29 23 10m-9 9-1-8m7 2 4 1" stroke="#5b7d4c" stroke-width="1.5" stroke-linecap="round"/>',
  flower: '<path d="M16 21v9m0-4 7-4" stroke="#72864f" stroke-width="2" stroke-linecap="round"/><g fill="#d88b80" stroke="#b97770" stroke-width=".6"><ellipse cx="16" cy="8" rx="5" ry="6"/><ellipse cx="22" cy="13" rx="6" ry="5"/><ellipse cx="20" cy="20" rx="5" ry="6"/><ellipse cx="11" cy="20" rx="5" ry="6"/><ellipse cx="9" cy="12" rx="6" ry="5"/></g><circle cx="16" cy="14" r="4" fill="#f5d681"/>',
  drop: '<path d="M16 3S6 15 6 21a10 10 0 0 0 20 0C26 15 16 3 16 3Z" fill="#8bbcc2" stroke="#61979f" stroke-width="1.3"/><path d="M10 21c0 3 2 5 5 6" stroke="#e1f0df" stroke-width="2" stroke-linecap="round"/>',
  heart: '<path d="M16 28S3 20 3 11a7 7 0 0 1 13-3 7 7 0 0 1 13 3c0 9-13 17-13 17Z" fill="#d68f82" stroke="#b67467" stroke-width="1.3"/>',
  paw: '<ellipse cx="16" cy="22" rx="8" ry="7" fill="currentColor"/><ellipse cx="6" cy="13" rx="3.5" ry="4.5" fill="currentColor"/><ellipse cx="13" cy="7" rx="3.5" ry="4.5" fill="currentColor"/><ellipse cx="22" cy="8" rx="3.5" ry="4.5" fill="currentColor"/><ellipse cx="28" cy="15" rx="3.5" ry="4.5" fill="currentColor"/>',
  clock: '<circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M16 8v9l6 3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  check: '<circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m10 16 4 4 8-9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  pause: '<path d="M11 7v18M21 7v18" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>',
  sound: '<path d="M5 12h5l8-6v20l-8-6H5Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M23 10c4 3 4 9 0 12m4-16c7 6 7 14 0 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  mute: '<path d="M5 12h5l8-6v20l-8-6H5Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="m24 12 6 8m0-8-6 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  book: '<path d="M16 8C11 4 6 5 3 6v21c4-2 9-2 13 1 4-3 9-3 13-1V6c-4-1-9-2-13 2Zm0 0v20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>'
};
export function icon(name, extra = '') { return `<svg class="symbol ${extra}" viewBox="0 0 32 32" aria-hidden="true">${paths[name] || paths.star}</svg>`; }
