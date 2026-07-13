import { useMemo, useState } from 'react';
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
    booking: 'booking.py',
    thread: 'thread.py',
    document: 'document.py',
    'sunset-image': 'sunset_image.py',
    'sre-event': 'sre_event.py',
    'purchase-request': 'purchase_request.py',
    'ecommerce-order': 'ecommerce_order.py',
    'jira-ticket': 'jira_ticket.py',
};

const entities = getEntities();

function Icon({ name, className }: { name: string; className?: string }) {
    const C = ICONS[name] ?? LuFileText;
    return <C className={className} aria-hidden />;
}

/** Total number of distinct modifier combinations an entity can produce. */
function combinations(entity: EntityDefinition): number {
    return entity.modifiers.reduce((n, m) => n * m.values.length, 1);
}

// ── Grid ────────────────────────────────────────────────────────────────────

function EntityGrid({ onSelect }: { onSelect: (id: string) => void }) {
    return (
        <div>
            <div className="flex items-center justify-between border-b border-border/70 px-4 py-2.5 text-xs text-foreground/50">
                <span className="text-foreground/70">synthetic_world/</span>
                <span>9 modules · pick one to generate</span>
            </div>
            <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3">
                {entities.map((e) => (
                    <button
                        key={e.id}
                        onClick={() => onSelect(e.id)}
                        className="group flex flex-col gap-2 rounded-md border border-border bg-muted/10 p-3 text-left transition-all hover:-translate-y-0.5 hover:border-accent hover:bg-muted/25"
                    >
                        <div className="flex items-center justify-between">
                            <Icon name={e.icon} className="h-4 w-4 text-accent" />
                            <LuChevronRight className="h-4 w-4 text-foreground/30 transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-foreground group-hover:text-accent">
                                {FILENAMES[e.id]}
                            </div>
                            <div className="mt-0.5 text-[11px] text-foreground/50">{e.title}</div>
                        </div>
                        <div className="mt-auto text-[10px] tracking-wide text-foreground/40 tabular-nums">
                            {combinations(e).toLocaleString()} variants
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}

// ── The decisions dict (numbered, aligned, static) ───────────────────────────

function DecisionsDict({
    entity,
    modifiers,
    onCycle,
    baseDelay,
    step,
}: {
    entity: EntityDefinition;
    modifiers: Modifiers;
    onCycle: (key: string) => void;
    baseDelay: number;
    step: number;
}) {
    // Align the value column: pad every `"key":` token to the widest one.
    const labelWidth = Math.max(...entity.modifiers.map((m) => m.key.length)) + 3;

    const header = [
        { text: 'from synth import generate', tone: 'kw' as const },
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

            {entity.modifiers.map((m) => {
                const label = `"${m.key}":`;
                const pad = ' '.repeat(Math.max(1, labelWidth - m.key.length));
                return numbered(
                    <>
                        {'    '}
                        <span className="text-foreground/55">{label}</span>
                        {pad}
                        <button
                            onClick={() => onCycle(m.key)}
                            title={`${m.label} — click to cycle (${m.values.length} options)`}
                            className="rounded-sm font-semibold text-accent underline-offset-2 hover:bg-accent/10 hover:underline"
                        >
                            "{modifiers[m.key]}"
                        </button>
                        <span className="text-foreground/40">,</span>
                    </>,
                    d++
                );
            })}

            {numbered(<span className="text-foreground/80">{'}'}</span>, d++)}
        </div>
    );
}

// ── The filled prompt (values highlighted) ───────────────────────────────────

function FilledPrompt({ entity, modifiers }: { entity: EntityDefinition; modifiers: Modifiers }) {
    const parts = entity.promptTemplate.split(/(\{\{\s*[\w-]+\s*\}\})/g);
    return (
        <span className="leading-relaxed">
            {parts.map((part, i) => {
                const match = part.match(/\{\{\s*([\w-]+)\s*\}\}/);
                if (match && modifiers[match[1]] !== undefined) {
                    return (
                        <span key={i} className="font-semibold text-accent">
                            {modifiers[match[1]]}
                        </span>
                    );
                }
                return <span key={i}>{part}</span>;
            })}
        </span>
    );
}

// ── The sample artifact, in its native shape ─────────────────────────────────

function SampleView({ output }: { output: SampleOutput }) {
    switch (output.kind) {
        case 'record':
            return (
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[13px]">
                    {Object.entries(output.fields).map(([k, v], i) => (
                        <div key={k} className="synth-in contents" style={{ animationDelay: `${i * 35}ms` }}>
                            <dt className="text-foreground/45">{k}</dt>
                            <dd className="font-semibold break-words">{String(v)}</dd>
                        </div>
                    ))}
                </dl>
            );
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
        case 'image-prompt':
            return (
                <div className="flex flex-col gap-3">
                    <div className="h-24 w-full rounded-md bg-gradient-to-t from-accent/70 via-accent/30 to-muted/40" />
                    <p className="text-[13px] italic">{output.prompt}</p>
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
        case 'text':
            return (
                <pre className="overflow-x-auto text-[13px] leading-relaxed whitespace-pre-wrap">{output.content}</pre>
            );
    }
}

// ── Detail view (one module, opened) ─────────────────────────────────────────

function EntityDetail({
    entity,
    onBack,
}: {
    entity: EntityDefinition;
    onBack: () => void;
}) {
    // A fresh generation each time this module is opened; runId replays the
    // stream-in animation on regenerate by remounting the animated regions.
    const [modifiers, setModifiers] = useState<Modifiers>(() => generateEntity(entity.id).modifiers);
    const [runId, setRunId] = useState(0);

    const sample = useMemo(() => entity.buildSample(modifiers), [entity, modifiers]);

    function reroll() {
        setModifiers(regenerateEntity(entity.id).modifiers);
        setRunId((n) => n + 1);
    }

    // Cycle one decision to its next value — a single structured change.
    function cycleModifier(key: string) {
        const def = entity.modifiers.find((m) => m.key === key)!;
        const idx = def.values.indexOf(modifiers[key]);
        setModifiers({ ...modifiers, [key]: def.values[(idx + 1) % def.values.length] });
    }

    // Timing budget for the stream-in, so the REPL output lands after the dict.
    const dictLines = entity.modifiers.length + 5;
    const step = 55;
    const promptDelay = dictLines * step + 120;
    const sampleDelay = promptDelay + 220;

    return (
        <div key={`${entity.id}-${runId}`}>
            {/* editor chrome */}
            <div className="flex items-center gap-3 border-b border-border/70 bg-muted/20 px-3 py-2">
                <div className="flex gap-1.5" aria-hidden>
                    <span className="h-3 w-3 rounded-full bg-border" />
                    <span className="h-3 w-3 rounded-full bg-border" />
                    <span className="h-3 w-3 rounded-full bg-border" />
                </div>
                <div className="flex items-center gap-1.5 rounded-t bg-background/60 px-2.5 py-1 text-xs">
                    <Icon name={entity.icon} className="h-3.5 w-3.5 text-accent" />
                    <span className="font-semibold">{FILENAMES[entity.id]}</span>
                </div>
                <div className="ml-auto flex items-center gap-1">
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
                baseDelay={80}
                step={step}
            />

            {/* REPL output: prompt + sample, each in its native shape */}
            <div className="border-t border-border/70 bg-muted/[0.12] px-4 py-3 text-[13px]">
                <div
                    className="synth-in mb-1 flex gap-2 text-foreground/45"
                    style={{ animationDelay: `${promptDelay}ms` }}
                >
                    <span className="select-none text-accent/70">&gt;&gt;&gt;</span>
                    <span>build_prompt(decisions)</span>
                </div>
                <p
                    className="synth-in mb-4 pl-6 text-foreground/85"
                    style={{ animationDelay: `${promptDelay + 60}ms` }}
                >
                    <span className="text-foreground/40">'</span>
                    <FilledPrompt entity={entity} modifiers={modifiers} />
                    <span className="text-foreground/40">'</span>
                </p>

                <div
                    className="synth-in mb-2 flex gap-2 text-foreground/45"
                    style={{ animationDelay: `${sampleDelay}ms` }}
                >
                    <span className="select-none text-accent/70">&gt;&gt;&gt;</span>
                    <span>generate(decisions)</span>
                    <span className="text-foreground/30"># → {sample.kind}</span>
                    <span className="synth-caret text-accent">▮</span>
                </div>
                <div
                    className="synth-in pl-6"
                    style={{ animationDelay: `${sampleDelay + 80}ms` }}
                >
                    <SampleView output={sample} />
                </div>
            </div>

            {/* footer */}
            <div className="border-t border-border/70 px-4 py-2.5 text-[11px] text-foreground/45">
                1 of{' '}
                <span className="font-semibold text-foreground/70 tabular-nums">
                    {combinations(entity).toLocaleString()}
                </span>{' '}
                possible combinations · click any value to change one decision, or regenerate to reshuffle
                them all.
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
                <EntityDetail entity={entity} onBack={() => setSelectedId(null)} />
            ) : (
                <EntityGrid onSelect={setSelectedId} />
            )}
        </div>
    );
}
