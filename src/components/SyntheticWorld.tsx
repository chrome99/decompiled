import { useEffect, useMemo, useState } from 'react';
import {
    getEntities,
    generateEntity,
    regenerateEntity,
    generateEntityWithSeed,
    type EntityDefinition,
    type Modifiers,
    type SampleOutput,
} from '@/utils/synthetic-world';

// No icon library is installed, so map the definitions' lucide-style icon names
// to emoji. Keeps the island dependency-free.
const ICONS: Record<string, string> = {
    user: '🧑',
    plane: '✈️',
    'message-square': '💬',
    'file-text': '📄',
    sunset: '🌇',
    siren: '🚨',
    receipt: '🧾',
    'shopping-cart': '🛒',
    'square-check': '✅',
};

const entities = getEntities();

/** Total number of distinct modifier combinations an entity can produce. */
function combinations(entity: EntityDefinition): number {
    return entity.modifiers.reduce((n, m) => n * m.values.length, 1);
}

/** Render the prompt template with chosen values highlighted as "decisions". */
function FilledPrompt({ entity, modifiers }: { entity: EntityDefinition; modifiers: Modifiers }) {
    const parts = entity.promptTemplate.split(/(\{\{\s*[\w-]+\s*\}\})/g);
    return (
        <p className="leading-relaxed">
            {parts.map((part, i) => {
                const match = part.match(/\{\{\s*([\w-]+)\s*\}\}/);
                if (match && modifiers[match[1]] !== undefined) {
                    return (
                        <span key={i} className="rounded bg-accent/15 px-1 font-semibold text-accent">
                            {modifiers[match[1]]}
                        </span>
                    );
                }
                return <span key={i}>{part}</span>;
            })}
        </p>
    );
}

/** Render a sample artifact in its native shape (the "different windows" idea). */
function SampleView({ output }: { output: SampleOutput }) {
    switch (output.kind) {
        case 'record':
            return (
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                    {Object.entries(output.fields).map(([k, v]) => (
                        <div key={k} className="contents">
                            <dt className="text-foreground/60">{k}</dt>
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
                            className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                                i % 2 === 0 ? 'self-start bg-muted/40' : 'self-end bg-accent/15'
                            }`}
                        >
                            <span className="mr-2 text-xs font-bold text-foreground/50">{m.author}</span>
                            {m.text}
                        </div>
                    ))}
                </div>
            );
        case 'log':
            return (
                <pre className="overflow-x-auto rounded bg-foreground/90 p-3 text-xs leading-relaxed text-background">
                    {output.lines.join('\n')}
                </pre>
            );
        case 'image-prompt':
            return (
                <div className="flex flex-col gap-3">
                    <div className="h-24 w-full rounded bg-gradient-to-t from-accent/70 via-accent/30 to-muted/40" />
                    <p className="text-sm italic">{output.prompt}</p>
                    <div className="flex flex-wrap gap-1.5">
                        {output.tags.map((t) => (
                            <span key={t} className="rounded-full bg-muted/40 px-2 py-0.5 text-xs">
                                {t}
                            </span>
                        ))}
                    </div>
                </div>
            );
        case 'text':
            return <pre className="overflow-x-auto text-sm leading-relaxed whitespace-pre-wrap">{output.content}</pre>;
    }
}

export default function SyntheticWorld() {
    const [entityId, setEntityId] = useState(entities[0].id);
    // Initial render must be deterministic so server-rendered HTML matches the
    // client on hydration — hence a fixed seed here, not a random one. We
    // randomize after mount (below) to give a fresh example per page load.
    const [modifiers, setModifiers] = useState<Modifiers>(
        () => generateEntityWithSeed(entities[0].id, 1).modifiers
    );

    // Client-only: once hydrated, re-roll to a random example for this page load.
    useEffect(() => {
        setModifiers(generateEntity(entities[0].id).modifiers);
    }, []);

    const entity = useMemo(() => entities.find((e) => e.id === entityId)!, [entityId]);
    const sample = useMemo(() => entity.buildSample(modifiers), [entity, modifiers]);

    function selectEntity(id: string) {
        setEntityId(id);
        setModifiers(generateEntity(id).modifiers);
    }

    function reroll() {
        setModifiers(regenerateEntity(entityId).modifiers);
    }

    // Cycle a single modifier to its next value — one structured decision changed.
    function cycleModifier(key: string) {
        const def = entity.modifiers.find((m) => m.key === key)!;
        const idx = def.values.indexOf(modifiers[key]);
        setModifiers({ ...modifiers, [key]: def.values[(idx + 1) % def.values.length] });
    }

    return (
        <div className="not-prose my-6 rounded-lg border-2 border-border bg-background font-mono text-foreground">
            {/* Entity picker */}
            <div className="flex gap-1 overflow-x-auto border-b-2 border-border p-2">
                {entities.map((e) => (
                    <button
                        key={e.id}
                        onClick={() => selectEntity(e.id)}
                        title={e.title}
                        className={`flex shrink-0 items-center gap-1.5 rounded px-2.5 py-1.5 text-sm transition-colors ${
                            e.id === entityId ? 'bg-accent text-background' : 'hover:bg-muted/40'
                        }`}
                    >
                        <span aria-hidden>{ICONS[e.icon] ?? '•'}</span>
                        <span className="whitespace-nowrap">{e.title}</span>
                    </button>
                ))}
            </div>

            <div className="p-4">
                <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm text-foreground/70">{entity.description}</p>
                    <button
                        onClick={reroll}
                        className="rounded bg-accent px-3 py-1.5 text-sm font-semibold text-background transition-opacity hover:opacity-85"
                    >
                        🎲 Re-roll
                    </button>
                </div>

                {/* 1. Structured decisions */}
                <p className="mb-2 text-xs tracking-wide text-foreground/50 uppercase">
                    Structured decisions · click to change
                </p>
                <div className="mb-1 flex flex-wrap gap-2">
                    {entity.modifiers.map((m) => (
                        <button
                            key={m.key}
                            onClick={() => cycleModifier(m.key)}
                            title={`${m.label} — click to cycle (${m.values.length} options)`}
                            className="group rounded border border-border bg-muted/20 px-2 py-1 text-left text-sm transition-colors hover:border-accent"
                        >
                            <span className="block text-[10px] tracking-wide text-foreground/50 uppercase">
                                {m.label}
                            </span>
                            <span className="font-semibold text-accent group-hover:underline">{modifiers[m.key]}</span>
                        </button>
                    ))}
                </div>
                <p className="mb-4 text-xs text-foreground/50">
                    1 of {combinations(entity).toLocaleString()} possible combinations — before a single word is written.
                </p>

                {/* 2. Filled prompt */}
                <div className="mb-4">
                    <p className="mb-2 text-xs tracking-wide text-foreground/50 uppercase">↓ becomes a prompt</p>
                    <div className="rounded border border-border bg-muted/10 p-3 text-sm">
                        <FilledPrompt entity={entity} modifiers={modifiers} />
                    </div>
                </div>

                {/* 3. Sample output */}
                <div>
                    <p className="mb-2 text-xs tracking-wide text-foreground/50 uppercase">
                        ↓ and a sample record ({sample.kind})
                    </p>
                    <div className="rounded border border-border bg-muted/10 p-3">
                        <SampleView output={sample} />
                    </div>
                </div>
            </div>
        </div>
    );
}
