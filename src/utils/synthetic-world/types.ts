// Shared types for the Synthetic World Playground data layer.
//
// The whole point of this module (and the blog post it accompanies) is that
// synthetic variety comes from *structured decisions made before any text is
// generated*. A `ModifierDef` is one such decision, an `EntityDefinition`
// bundles the decisions for one kind of record, and a `Generation` is a single
// resolved artifact: the decisions plus the prompt and sample they produce.

/** One structured decision: a stable key and the pool of values it can take. */
export interface ModifierDef {
    /** Stable machine key, e.g. "severity". Never changes across regenerations. */
    key: string;
    /** Human-facing label for the future UI, e.g. "Severity". */
    label: string;
    /** The pool of possible values. Exactly one is chosen per generation. */
    values: string[];
}

/** A concrete set of chosen modifier values, keyed by `ModifierDef.key`. */
export type Modifiers = Record<string, string>;

/**
 * The realistic sample built from a set of modifiers. It is a discriminated
 * union so each entity family can render in its native shape — the post's
 * "different windows into one world" idea. A future UI switches on `kind`.
 */
export type SampleOutput =
    | { kind: 'text'; content: string }
    | { kind: 'record'; fields: Record<string, string | number> }
    | { kind: 'log'; lines: string[] }
    | { kind: 'conversation'; messages: { author: string; text: string }[] }
    | { kind: 'image-prompt'; prompt: string; tags: string[] };

/** Everything needed to describe and generate one kind of synthetic entity. */
export interface EntityDefinition {
    /** Stable id used by the public API, e.g. "sre-event". */
    id: string;
    title: string;
    description: string;
    /** Lucide-style icon name for the future UI, e.g. "siren". */
    icon: string;
    /** 6–10 structured decisions, each with its own value pool. */
    modifiers: ModifierDef[];
    /** Raw prompt template containing {{key}} placeholders. */
    promptTemplate: string;
    /** Build the filled prompt from a chosen set of modifier values. */
    buildPrompt(modifiers: Modifiers): string;
    /** Build a realistic sample artifact from the same modifier values. */
    buildSample(modifiers: Modifiers): SampleOutput;
}

/** A single resolved artifact returned by the generate* API. */
export interface Generation {
    entity: EntityDefinition;
    modifiers: Modifiers;
    promptTemplate: string;
    filledPrompt: string;
    sampleOutput: SampleOutput;
    /** Stable label derived from entity id + seed, e.g. "sre-event-1z141z4". */
    generationId: string;
}
