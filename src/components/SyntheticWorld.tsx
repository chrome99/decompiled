import { useEffect, useMemo, useRef, useState } from 'react';
import type { IconType } from 'react-icons';
import {
    LuUser,
    LuPlane,
    LuMessageSquare,
    LuFileText,
    LuSunset,
    LuSiren,
    LuReceipt,
    LuShoppingCart,
    LuSquareCheckBig,
    LuArrowLeft,
    LuDices,
    LuChevronRight,
} from 'react-icons/lu';
import {
    getEntities,
    generateEntity,
    regenerateEntity,
    type EntityDefinition,
    type Modifiers,
    type SampleOutput,
    type Strategy,
    type TraceBlock,
} from '@/utils/synthetic-world';

// Map the definitions' lucide-style icon names to react-icons components.
const ICONS: Record<string, IconType> = {
    user: LuUser,
    plane: LuPlane,
    'message-square': LuMessageSquare,
    'file-text': LuFileText,
    sunset: LuSunset,
    siren: LuSiren,
    receipt: LuReceipt,
    'shopping-cart': LuShoppingCart,
    'square-check': LuSquareCheckBig,
};

// Each entity reads as a python module in the drawer — snake_case .py names.
const FILENAMES: Record<string, string> = {
    employee: 'employee.py',
    flight: 'flight.py',
    thread: 'thread.py',
    document: 'document.py',
    'sunset-image': 'sunset_image.py',
    'sre-event': 'sre_event.py',
    'purchase-request': 'purchase_request.py',
    'ecommerce-order': 'ecommerce_order.py',
    'issue-ticket': 'issue_ticket.py',
};

// The import line at the top of each "module" reflects how it's really built.
const IMPORTS: Record<Strategy, string> = {
    deterministic: 'from synth import build',
    hybrid: 'from synth import build, model',
    pdf: 'from synth import render_pdf',
    'image-model': 'from synth import build_prompt, image_model',
    'llm-multi': 'from synth import simulate_thread',
};

// A strategy that touches a model gets an accent badge; pure-code ones stay muted.
const USES_MODEL: Record<Strategy, boolean> = {
    deterministic: false,
    pdf: false,
    hybrid: true,
    'image-model': true,
    'llm-multi': true,
};

const entities = getEntities();

// The three interaction flavors, each with its own reveal animation:
//   open   → the whole module streams in (structure + trace + artifact)
//   reroll → structure stays put; every value slot-machines to a new pick
//   cycle  → one value flips to its next option; the rest hold still
type Anim =
    | { type: 'open'; id: number }
    | { type: 'reroll'; id: number }
    | { type: 'cycle'; id: number; key: string };

function prefersReducedMotion(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function Icon({ name, className }: { name: string; className?: string }) {
    const C = ICONS[name] ?? LuFileText;
    return <C className={className} aria-hidden />;
}

/** Small pill naming the entity's generation strategy. */
function StrategyBadge({ strategy, label }: { strategy: Strategy; label: string }) {
    const model = USES_MODEL[strategy];
    return (
        <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide whitespace-nowrap ${
                model ? 'bg-accent/15 text-accent' : 'bg-muted/40 text-foreground/55'
            }`}
        >
            {label}
        </span>
    );
}

// ── Grid ────────────────────────────────────────────────────────────────────

function EntityGrid({ onSelect }: { onSelect: (id: string) => void }) {
    return (
        <div>
            <div className="border-b border-border/70 px-4 py-2.5 text-xs text-foreground/70">
                synthetic_world/
            </div>
            <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3">
                {entities.map((e) => (
                    <button
                        key={e.id}
                        onClick={() => onSelect(e.id)}
                        className="group flex flex-col gap-3 rounded-md border border-border bg-muted/10 p-3 text-left transition-all hover:-translate-y-0.5 hover:border-accent hover:bg-muted/25"
                    >
                        <div className="flex items-start justify-between">
                            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent/10 text-accent transition-colors group-hover:bg-accent/20">
                                <Icon name={e.icon} className="h-6 w-6" />
                            </span>
                            <LuChevronRight className="h-4 w-4 text-foreground/25 transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-foreground group-hover:text-accent">
                                {FILENAMES[e.id]}
                            </div>
                            <div className="mt-0.5 text-[11px] text-foreground/50">{e.title}</div>
                        </div>
                        <div className="mt-auto">
                            <StrategyBadge strategy={e.strategy} label={e.strategyLabel} />
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}

// ── A single decision value (handles the reroll + cycle animations) ──────────

const FLIP_KEYFRAMES: Keyframe[] = [
    { opacity: 0, transform: 'translateY(-0.55em)' },
    { opacity: 1, transform: 'translateY(0)' },
];

function ValueCell({
    value,
    options,
    mode,
    animId,
    startDelay,
    seedOffset,
    title,
    onClick,
}: {
    value: string;
    options: string[];
    mode: 'idle' | 'scramble' | 'flip';
    animId: number;
    startDelay: number;
    seedOffset: number;
    title: string;
    onClick: () => void;
}) {
    const [display, setDisplay] = useState(value);
    const ref = useRef<HTMLButtonElement>(null);

    // Re-runs on every interaction (animId changes) as well as value changes.
    useEffect(() => {
        const reduce = prefersReducedMotion();

        if (mode === 'scramble' && !reduce) {
            // Slot-machine: flick through the option pool, then land on `value`.
            const ticks = 6;
            let tick = 0;
            let interval = 0;
            const start = window.setTimeout(() => {
                interval = window.setInterval(() => {
                    tick += 1;
                    if (tick >= ticks) {
                        window.clearInterval(interval);
                        setDisplay(value);
                    } else {
                        setDisplay(options[(seedOffset + tick) % options.length]);
                    }
                }, 55);
            }, startDelay);
            return () => {
                window.clearTimeout(start);
                window.clearInterval(interval);
            };
        }

        setDisplay(value);
        if (mode === 'flip' && !reduce && ref.current) {
            ref.current.animate(FLIP_KEYFRAMES, { duration: 300, easing: 'ease-out' });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [animId, value, mode]);

    return (
        <button
            ref={ref}
            onClick={onClick}
            title={title}
            className="inline-block rounded-sm font-semibold text-accent underline-offset-2 hover:bg-accent/10 hover:underline"
        >
            "{display}"
        </button>
    );
}

// ── The decisions dict (numbered, aligned, static) ───────────────────────────

function DecisionsDict({
    entity,
    modifiers,
    onCycle,
    anim,
    baseDelay,
    step,
}: {
    entity: EntityDefinition;
    modifiers: Modifiers;
    onCycle: (key: string) => void;
    anim: Anim;
    baseDelay: number;
    step: number;
}) {
    // Align the value column: pad every `"key":` token to the widest one.
    const labelWidth = Math.max(...entity.modifiers.map((m) => m.key.length)) + 3;

    const header = [
        { text: IMPORTS[entity.strategy], tone: 'kw' as const },
        { text: '', tone: 'blank' as const },
        {
            text: `# ${entity.modifiers.length} decisions, resolved before a single token`,
            tone: 'comment' as const,
        },
        { text: 'decisions = {', tone: 'plain' as const },
    ];

    let line = 0;
    const numbered = (node: React.ReactNode, delayIndex: number) => {
        line += 1;
        return (
            <div key={line} className="flex">
                <span className="w-8 shrink-0 pr-3 text-right text-foreground/25 select-none tabular-nums">
                    {line}
                </span>
                <span
                    className="synth-in min-w-0 flex-1 whitespace-pre"
                    style={{ animationDelay: `${baseDelay + delayIndex * step}ms` }}
                >
                    {node}
                </span>
            </div>
        );
    };

    let d = 0;
    return (
        <div className="overflow-x-auto px-4 py-3 text-[13px] leading-relaxed">
            {header.map((h) =>
                numbered(
                    h.tone === 'blank' ? (
                        <>&nbsp;</>
                    ) : (
                        <span
                            className={
                                h.tone === 'comment'
                                    ? 'text-foreground/40 italic'
                                    : h.tone === 'kw'
                                      ? 'text-foreground/55'
                                      : 'text-foreground/80'
                            }
                        >
                            {h.text}
                        </span>
                    ),
                    d++
                )
            )}

            {entity.modifiers.map((m, i) => {
                const label = `"${m.key}":`;
                const pad = ' '.repeat(Math.max(1, labelWidth - m.key.length));
                // Which animation this value plays depends on the interaction:
                // reroll scrambles every value; cycle flips only the one clicked.
                const mode =
                    anim.type === 'reroll'
                        ? 'scramble'
                        : anim.type === 'cycle' && anim.key === m.key
                          ? 'flip'
                          : 'idle';
                return numbered(
                    <>
                        {'    '}
                        <span className="text-foreground/55">{label}</span>
                        {pad}
                        <ValueCell
                            value={modifiers[m.key]}
                            options={m.values}
                            mode={mode}
                            animId={anim.id}
                            startDelay={mode === 'scramble' ? i * 50 : 0}
                            seedOffset={i}
                            title={`${m.label} · ${m.values.length} options`}
                            onClick={() => onCycle(m.key)}
                        />
                        <span className="text-foreground/40">,</span>
                    </>,
                    d++
                );
            })}

            {numbered(<span className="text-foreground/80">{'}'}</span>, d++)}
        </div>
    );
}

// ── A prompt string with clickable, cycleable decision values ────────────────

function PromptText({
    template,
    entity,
    modifiers,
    onCycle,
    anim,
}: {
    template: string;
    entity: EntityDefinition;
    modifiers: Modifiers;
    onCycle: (key: string) => void;
    anim: Anim;
}) {
    const parts = template.split(/(\{\{\s*[\w-]+\s*\}\})/g);
    const flipKey = anim.type === 'cycle' ? anim.key : null;
    return (
        <>
            {parts.map((part, i) => {
                const match = part.match(/\{\{\s*([\w-]+)\s*\}\}/);
                const key = match?.[1];
                if (key && modifiers[key] !== undefined) {
                    const isFlip = key === flipKey;
                    const label = entity.modifiers.find((m) => m.key === key)?.label ?? key;
                    return (
                        <button
                            // Re-key on cycle so the swapped value flips here too.
                            key={isFlip ? `flip-${i}-${anim.id}` : `v-${i}`}
                            onClick={() => onCycle(key)}
                            title={label}
                            className={`rounded-sm font-semibold text-accent underline-offset-2 hover:bg-accent/10 hover:underline${
                                isFlip ? ' synth-flip' : ''
                            }`}
                        >
                            {modifiers[key]}
                        </button>
                    );
                }
                return <span key={i}>{part}</span>;
            })}
        </>
    );
}

// ── The pipeline trace: how this entity is actually produced ──────────────────

function TraceView({
    blocks,
    entity,
    modifiers,
    onCycle,
    anim,
    baseDelay,
    step,
}: {
    blocks: TraceBlock[];
    entity: EntityDefinition;
    modifiers: Modifiers;
    onCycle: (key: string) => void;
    anim: Anim;
    baseDelay: number;
    step: number;
}) {
    return (
        <div className="flex flex-col gap-1 text-[13px] leading-relaxed">
            {blocks.map((b, i) => {
                const style = { animationDelay: `${baseDelay + i * step}ms` };
                if (b.kind === 'comment') {
                    return (
                        <div key={i} className="synth-in text-foreground/40 italic" style={style}>
                            {b.text}
                        </div>
                    );
                }
                if (b.kind === 'code') {
                    return (
                        <div key={i} className="synth-in" style={style}>
                            <span className={b.accent ? 'font-semibold text-accent' : 'text-foreground/80'}>
                                {b.text}
                            </span>
                        </div>
                    );
                }
                if (b.kind === 'prompt') {
                    return (
                        <div key={i} className="synth-in" style={style}>
                            <span className="text-foreground/55">{b.label} = </span>
                            <span className="text-foreground/40">"</span>
                            <PromptText
                                template={b.template}
                                entity={entity}
                                modifiers={modifiers}
                                onCycle={onCycle}
                                anim={anim}
                            />
                            <span className="text-foreground/40">"</span>
                        </div>
                    );
                }
                // turn — one iteration of the thread loop
                return (
                    <div key={i} className="synth-in mt-1 border-l-2 border-border/60 pl-3" style={style}>
                        <div className="text-[11px] tracking-wide text-foreground/40 uppercase">
                            turn {b.n} · {b.speaker}
                        </div>
                        <div className="text-foreground/70">
                            <span className="mr-1 text-accent/70">prompt(history) →</span>
                            <PromptText
                                template={b.template}
                                entity={entity}
                                modifiers={modifiers}
                                onCycle={onCycle}
                                anim={anim}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ── The sample artifact, in its native shape ─────────────────────────────────

function RecordView({ output }: { output: Extract<SampleOutput, { kind: 'record' }> }) {
    const llm = new Set(output.llmFields ?? []);
    return (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[13px]">
            {Object.entries(output.fields).map(([k, v], i) => (
                <div key={k} className="synth-in contents" style={{ animationDelay: `${i * 35}ms` }}>
                    <dt className="text-foreground/45">{k}</dt>
                    <dd className="font-semibold break-words">
                        {String(v)}
                        {llm.has(k) && (
                            <span className="ml-2 rounded bg-accent/15 px-1 py-0.5 text-[9px] font-bold tracking-wide text-accent align-middle">
                                LLM
                            </span>
                        )}
                    </dd>
                </div>
            ))}
        </dl>
    );
}

/** A page-like preview standing in for the rendered PDF. */
function PdfPage({ output }: { output: Extract<SampleOutput, { kind: 'pdf' }> }) {
    return (
        <div className="mx-auto max-w-sm rounded-sm bg-[#fbfbf7] p-5 text-[#1a1a1a] shadow-md ring-1 ring-black/10">
            <div className="flex items-start justify-between gap-3 border-b border-black/15 pb-2">
                <h4 className="text-sm font-bold">{output.title}</h4>
                <span className="rounded-sm border border-black/30 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-black/60 uppercase">
                    {output.classification}
                </span>
            </div>
            <p className="mt-1 text-[10px] text-black/50">{output.meta}</p>
            <div className="mt-3 flex flex-col gap-2">
                {output.sections.map((s) => (
                    <div key={s.heading}>
                        <div className="text-[11px] font-bold">{s.heading}</div>
                        {s.lines.map((l) => (
                            <div key={l} className="text-[11px] text-black/70">
                                {l}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
            <div className="mt-4 border-t border-black/15 pt-1 text-center text-[9px] text-black/40">
                {output.footer}
            </div>
        </div>
    );
}

function SampleView({ output }: { output: SampleOutput }) {
    switch (output.kind) {
        case 'record':
            return <RecordView output={output} />;
        case 'conversation':
            return (
                <div className="flex flex-col gap-2">
                    {output.messages.map((m, i) => (
                        <div
                            key={i}
                            className={`synth-in max-w-[85%] rounded-lg px-3 py-2 text-[13px] ${
                                i % 2 === 0 ? 'self-start bg-muted/30' : 'self-end bg-accent/15'
                            }`}
                            style={{ animationDelay: `${i * 90}ms` }}
                        >
                            <span className="mr-2 text-[11px] font-bold text-foreground/45">{m.author}</span>
                            {m.text}
                        </div>
                    ))}
                </div>
            );
        case 'log':
            return (
                <pre className="overflow-x-auto rounded-md bg-foreground/90 p-3 text-[12px] leading-relaxed text-background">
                    {output.lines.map((l, i) => (
                        <div key={i} className="synth-in" style={{ animationDelay: `${i * 45}ms` }}>
                            {l}
                        </div>
                    ))}
                </pre>
            );
        case 'image':
            return (
                <div className="flex flex-col gap-2">
                    <div
                        className="flex h-32 w-full items-end justify-end rounded-md p-2"
                        style={{
                            backgroundImage: `linear-gradient(to top, ${output.gradient[0]}, ${output.gradient[1]}, ${output.gradient[2]})`,
                        }}
                    >
                        <span className="rounded bg-black/40 px-1.5 py-0.5 text-[10px] text-white/90">
                            {output.caption}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {output.tags.map((t, i) => (
                            <span
                                key={t}
                                className="synth-in rounded-full bg-muted/40 px-2 py-0.5 text-[11px]"
                                style={{ animationDelay: `${i * 40}ms` }}
                            >
                                {t}
                            </span>
                        ))}
                    </div>
                </div>
            );
        case 'pdf':
            return <PdfPage output={output} />;
    }
}

// ── Detail view (one module, opened) ─────────────────────────────────────────

function EntityDetail({ entity, onBack }: { entity: EntityDefinition; onBack: () => void }) {
    // A fresh generation each time this module is opened (mount = open anim).
    const [modifiers, setModifiers] = useState<Modifiers>(() => generateEntity(entity.id).modifiers);
    const [anim, setAnim] = useState<Anim>({ type: 'open', id: 0 });
    // Bumps only when the whole pipeline should re-stream (open + reroll), not cycle.
    const [streamId, setStreamId] = useState(0);
    const sampleRef = useRef<HTMLDivElement>(null);

    const trace = useMemo(() => entity.buildTrace(modifiers), [entity, modifiers]);
    const sample = useMemo(() => entity.buildSample(modifiers), [entity, modifiers]);

    function reroll() {
        setModifiers(regenerateEntity(entity.id).modifiers);
        setAnim((a) => ({ type: 'reroll', id: a.id + 1 }));
        setStreamId((s) => s + 1);
    }

    // Cycle one decision to its next value — a single structured change.
    function cycleModifier(key: string) {
        const def = entity.modifiers.find((m) => m.key === key)!;
        const idx = def.values.indexOf(modifiers[key]);
        setModifiers({ ...modifiers, [key]: def.values[(idx + 1) % def.values.length] });
        setAnim((a) => ({ type: 'cycle', id: a.id + 1, key }));
    }

    // On a single-value cycle the pipeline doesn't re-stream, so pulse the sample
    // block to show the change propagated all the way through.
    useEffect(() => {
        if (anim.type !== 'cycle' || prefersReducedMotion()) return;
        const el = sampleRef.current;
        if (!el) return;
        const accent =
            getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#e14a39';
        el.animate([{ backgroundColor: `${accent}26` }, { backgroundColor: `${accent}00` }], {
            duration: 650,
            easing: 'ease-out',
        });
    }, [anim]);

    // Timing budget for the stream-in, so the pipeline lands after the dict.
    const step = 55;
    const dictLines = entity.modifiers.length + 5;
    const traceDelay = dictLines * step + 120;
    const sampleDelay = traceDelay + trace.length * 80 + 140;

    return (
        <div>
            {/* editor chrome */}
            <div className="flex items-center gap-3 border-b border-border/70 bg-muted/20 px-3 py-2">
                <div className="flex gap-1.5" aria-hidden>
                    <span className="h-3 w-3 rounded-full bg-border" />
                    <span className="h-3 w-3 rounded-full bg-border" />
                    <span className="h-3 w-3 rounded-full bg-border" />
                </div>
                <div className="flex items-center gap-1.5 rounded-t bg-background/60 px-2.5 py-1 text-xs">
                    <Icon name={entity.icon} className="h-4 w-4 text-accent" />
                    <span className="font-semibold">{FILENAMES[entity.id]}</span>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <StrategyBadge strategy={entity.strategy} label={entity.strategyLabel} />
                    <button
                        onClick={reroll}
                        className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-foreground/70 transition-colors hover:bg-accent/15 hover:text-accent"
                        title="Re-pick every decision"
                    >
                        <LuDices className="h-3.5 w-3.5" />
                        regenerate
                    </button>
                    <button
                        onClick={onBack}
                        className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-foreground/70 transition-colors hover:bg-muted/40"
                    >
                        <LuArrowLeft className="h-3.5 w-3.5" />
                        modules
                    </button>
                </div>
            </div>

            {/* the module source: aligned decisions dict */}
            <DecisionsDict
                entity={entity}
                modifiers={modifiers}
                onCycle={cycleModifier}
                anim={anim}
                baseDelay={80}
                step={step}
            />

            {/* the pipeline + its artifact.
                Keyed by streamId so open + reroll re-stream it, while a single
                cycle leaves it mounted (the changed value flips in place). */}
            <div key={streamId} className="border-t border-border/70 bg-muted/[0.12] px-4 py-3">
                <TraceView
                    blocks={trace}
                    entity={entity}
                    modifiers={modifiers}
                    onCycle={cycleModifier}
                    anim={anim}
                    baseDelay={traceDelay}
                    step={80}
                />

                <div
                    className="synth-in mt-3 mb-2 flex gap-2 text-foreground/45"
                    style={{ animationDelay: `${sampleDelay}ms` }}
                >
                    <span className="select-none text-accent/70">&gt;&gt;&gt;</span>
                    <span>{entity.outputName}</span>
                    <span className="synth-caret text-accent">▮</span>
                </div>
                <div
                    ref={sampleRef}
                    className="synth-in -mx-1 rounded-md px-1"
                    style={{ animationDelay: `${sampleDelay + 80}ms` }}
                >
                    <SampleView output={sample} />
                </div>
            </div>
        </div>
    );
}

// ── Root ─────────────────────────────────────────────────────────────────────

export default function SyntheticWorld() {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const entity = useMemo(
        () => (selectedId ? entities.find((e) => e.id === selectedId)! : null),
        [selectedId]
    );

    return (
        <div className="not-prose my-6 overflow-hidden rounded-lg border-2 border-border bg-background font-mono text-foreground">
            {entity ? (
                <EntityDetail key={entity.id} entity={entity} onBack={() => setSelectedId(null)} />
            ) : (
                <EntityGrid onSelect={setSelectedId} />
            )}
        </div>
    );
}
