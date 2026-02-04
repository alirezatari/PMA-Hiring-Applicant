// Minimal Jalali (Shamsi) -> Gregorian conversion utilities.
// Based on the well-known jalaali conversion algorithm (MIT-licensed in jalaali-js).

type GDate = { gy: number; gm: number; gd: number };

function div(a: number, b: number) {
  return ~~(a / b);
}

function jalCal(jy: number) {
  // Jalaali years starting the 33-year rule.
  const breaks = [
    -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097,
    2192, 2262, 2324, 2394, 2456, 3178,
  ];

  let bl = breaks.length;
  let gy = jy + 621;
  let leapJ = -14;
  let jp = breaks[0];
  let jm = 0;
  let jump = 0;

  if (jy < jp || jy >= breaks[bl - 1]) {
    throw new Error("سال شمسی نامعتبر است");
  }

  for (let i = 1; i < bl; i += 1) {
    jm = breaks[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ = leapJ + div(jump, 33) * 8 + div((jump % 33), 4);
    jp = jm;
  }

  let n = jy - jp;
  leapJ = leapJ + div(n, 33) * 8 + div(((n % 33) + 3), 4);
  if (jump % 33 === 4 && jump - n === 4) leapJ += 1;

  let leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  let march = 20 + leapJ - leapG;

  if (jump - n < 6) {
    n = n - jump + div(jump + 4, 33) * 33;
  }
  let leap = (((n + 1) % 33) - 1) % 4;
  if (leap === -1) leap = 4;

  return { leap: leap === 0, gy, march };
}

function g2d(gy: number, gm: number, gd: number) {
  let d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
    div(153 * ((gm + 9) % 12) + 2, 5) +
    gd -
    34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}

function d2g(jdn: number): GDate {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div((j % 1461), 4) * 5 + 308;
  const gd = div((i % 153), 5) + 1;
  const gm = ((div(i, 153) % 12) + 1);
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

function j2d(jy: number, jm: number, jd: number) {
  const r = jalCal(jy);
  return (
    g2d(r.gy, 3, r.march) +
    (jm - 1) * 31 -
    div(jm, 7) * (jm - 7) +
    jd -
    1
  );
}

export function jalaliToGregorian(jy: number, jm: number, jd: number): GDate {
  return d2g(j2d(jy, jm, jd));
}

/**
 * Convert Jalali date (YYYY/MM/DD) to an ISO date-time string in local time.
 * Returns undefined if input is empty or invalid.
 */
export function jalaliToIsoString(jalali: string): string | undefined {
  const s = (jalali || "").trim();
  if (!s) return undefined;
  const m = s.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (!m) return undefined;
  const jy = Number(m[1]);
  const jm = Number(m[2]);
  const jd = Number(m[3]);
  if (!Number.isFinite(jy) || !Number.isFinite(jm) || !Number.isFinite(jd)) return undefined;
  if (jm < 1 || jm > 12 || jd < 1 || jd > 31) return undefined;

  const g = jalaliToGregorian(jy, jm, jd);
  const dt = new Date(g.gy, g.gm - 1, g.gd, 0, 0, 0);
  if (Number.isNaN(dt.getTime())) return undefined;
  return dt.toISOString();
}
