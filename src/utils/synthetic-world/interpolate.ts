// Placeholder interpolation for prompt templates.

import type { Modifiers } from './types';

const PLACEHOLDER = /\{\{\s*([\w-]+)\s*\}\}/g;

/**
 * Replace every `{{key}}` in `template` with `values[key]`. Repeated
 * placeholders are all replaced. A key with no matching value is left as the
 * literal `{{key}}` so gaps are visible rather than silently blanked.
 */
export function interpolate(template: string, values: Modifiers): string {
    return template.replace(PLACEHOLDER, (whole, key: string) =>
        Object.prototype.hasOwnProperty.call(values, key) ? values[key] : whole
    );
}

/** The set of placeholder keys referenced by a template (deduplicated, in order). */
export function placeholderKeys(template: string): string[] {
    const keys: string[] = [];
    for (const match of template.matchAll(PLACEHOLDER)) {
        if (!keys.includes(match[1])) keys.push(match[1]);
    }
    return keys;
}
