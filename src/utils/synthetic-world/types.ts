// Shared types for the Synthetic World Playground data layer.
//
// The point of this module (and the blog post it accompanies) is that synthetic
// variety comes from *structured decisions made before any text is generated*.
// But the second, quieter point is that "generated" means different things for
// different entities: a flight itinerary is pure code, a chat thread is an LLM
// loop, a sunset is a diffusion model, a PDF is a layout engine. Each entity
// therefore declares a `strategy` and a `buildTrace` that shows how it's really
// produced — not a one-size-fits-all "prompt → text" pretence.

/** One structured decision: a stable key and the pool of values it can take. */
export interface ModifierDef {
    /** Stable machine key, e.g. "severity". Never changes across regenerations. */
    key: string;
    /** Human-facing label for the UI, e.g. "Severity". */
    label: string;
    /** The pool of possible values. Exactly one is chosen per generation. */
    values: string[];
}

/** A concrete set of chosen modifier values, keyed by `ModifierDef.key`. */
export type Modifiers = Record<string, string>;

/**
 * How an entity's artifact is actually produced. This is the corrective the
 * post is making: most synthetic data needs no model at all.
 *   deterministic — assembled entirely in code (no model)
 *   pdf           — deterministic layout engine fed the decisions (no model)
 *   hybrid        — code scaffold + a single LLM call for one free-text field
 *   image-model   — decisions → prompt → diffusion model
 *   llm-multi     — a dialogue generated turn by turn, prompts bouncing off history
 */
export type Strategy = 'deterministic' | 'pdf' | 'hybrid' | 'image-model' | 'llm-multi';

/**
 * The realistic sample built from a set of modifiers, a discriminated union so
 * each entity renders in its native shape — the post's "different windows into
 * one world" idea. `record.llmFields` marks which fields (if any) came from a
 * model, so hybrids can call that out.
 */
export type SampleOutput =
    | { kind: 'record'; fields: Record<string, string | number>; llmFields?: string[] }
    | { kind: 'log'; lines: string[] }
    | { kind: 'conversation'; messages: { author: string; text: string }[] }
    | { kind: 'image'; caption: string; tags: string[]; gradient: [string, string, string] }
    | {
          kind: 'pdf';
          title: string;
          classification: string;
          meta: string;
          sections: { heading: string; lines: string[] }[];
          footer: string;
      };

/**
 * One step in the "how it's actually made" trace shown in the detail view.
 *   comment — a rationale line, e.g. "# no model — assembled from the decisions"
 *   code    — a pipeline call, e.g. "record = build_flight(decisions)"
 *   prompt  — a prompt string with {{key}} placeholders (rendered clickable)
 *   turn    — one iteration of a multi-turn LLM loop (thread)
 */
export type TraceBlock =
    | { kind: 'comment'; text: string }
    | { kind: 'code'; text: string; accent?: boolean }
    | { kind: 'prompt'; label: string; template: string }
    | { kind: 'turn'; n: number; speaker: string; template: string };

/** Everything needed to describe and generate one kind of synthetic entity. */
export interface EntityDefinition {
    /** Stable id used by the public API, e.g. "sre-event". */
    id: string;
    title: string;
    description: string;
    /** Lucide-style icon name, e.g. "siren". */
    icon: string;
    /** How this entity is really produced. */
    strategy: Strategy;
    /** Short badge text, e.g. "deterministic", "LLM · multi-turn". */
    strategyLabel: string;
    /** The variable name the pipeline binds its result to, e.g. "record", "thread". */
    outputName: string;
    /** 6–10 structured decisions, each with its own value pool. */
    modifiers: ModifierDef[];
    /** The pipeline steps that turn the decisions into the artifact. */
    buildTrace(modifiers: Modifiers): TraceBlock[];
    /** The realistic sample artifact the pipeline produces. */
    buildSample(modifiers: Modifiers): SampleOutput;
}

/** A single resolved artifact returned by the generate* API. */
export interface Generation {
    entity: EntityDefinition;
    modifiers: Modifiers;
    trace: TraceBlock[];
    sampleOutput: SampleOutput;
    /** Stable label derived from entity id + seed, e.g. "sre-event-1z141z4". */
    generationId: string;
}
