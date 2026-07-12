// Seeded pseudo-random helpers.
//
// Everything downstream is a pure function of a seed, so the same seed always
// produces the same world. That's the "reproducible facts" half of the post's
// "truth first, text second" argument: structure is deterministic, only the
// prose (which we don't do here) would be allowed to vary.

import type { ModifierDef, Modifiers } from './types';

/** A deterministic random source: repeated calls yield the next number in [0, 1). */
export type Rng = () => number;

/**
 * mulberry32 — a tiny, well-distributed 32-bit PRNG. Given the same seed it
 * always yields the same sequence, which is what makes generation reproducible.
 */
export function mulberry32(seed: number): Rng {
    let a = seed >>> 0;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** A fresh random 32-bit seed. Used once on page load so a refresh = new world. */
export function randomSeed(): number {
    return Math.floor(Math.random() * 0x100000000) >>> 0;
}

/** Advance a seed to the next one in a stable, deterministic way (an LCG step). */
export function nextSeed(seed: number): number {
    return (Math.imul(seed, 1664525) + 1013904223) >>> 0;
}

/** Pick one element from a non-empty array using the given rng. */
export function pick<T>(rng: Rng, arr: readonly T[]): T {
    return arr[Math.floor(rng() * arr.length)];
}

/** Choose one value per modifier key, producing a complete `Modifiers` set. */
export function pickModifiers(rng: Rng, defs: ModifierDef[]): Modifiers {
    const result: Modifiers = {};
    for (const def of defs) {
        result[def.key] = pick(rng, def.values);
    }
    return result;
}

/** Stable, human-scannable id for a generation, e.g. "sre-event-1z141z4". */
export function generationIdFrom(entityId: string, seed: number): string {
    return `${entityId}-${(seed >>> 0).toString(36)}`;
}
