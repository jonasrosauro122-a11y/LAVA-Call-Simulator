// Small seeded RNG so a scenario can be reproduced from its seed, while different
// seeds produce genuinely different scenarios.
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Rng {
  next: () => number;
  pick: <T>(arr: T[]) => T;
  int: (min: number, max: number) => number;
  chance: (p: number) => boolean;
  shuffle: <T>(arr: T[]) => T[];
}

export function createRng(seed: number): Rng {
  const next = mulberry32(seed);
  const pick = <T>(arr: T[]): T => arr[Math.floor(next() * arr.length)];
  const int = (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min;
  const chance = (p: number) => next() < p;
  const shuffle = <T>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  return { next, pick, int, chance, shuffle };
}
