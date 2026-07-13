import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
    LuCloud,
} from 'react-icons/lu';
import {
    getEntities,
    generateEntity,
    regenerateEntity,
    type EntityDefinition,
    type ModifierDef,
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

// ── The pool cloud: browse (and pick from) every value a decision can take ────

const CLOUD_SIZES = ['text-[11px]', 'text-xs', 'text-[13px]', 'text-sm'];

function PoolCloud({
    modifier,
    current,
    open,
    onToggle,
    onPick,
}: {
    modifier: ModifierDef;
    current: string;
    open: boolean;
    onToggle: (open: boolean) => void;
    onPick: (value: string) => void;
}) {
    const btnRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

    useEffect(() => {
        if (!open) return;
        const r = btnRef.current?.getBoundingClientRect();
        if (r) {
            const width = 260;
            const margin = 8;
            const estHeight = Math.min(340, 70 + modifier.values.length * 26);
            const left = Math.max(margin, Math.min(r.left, window.innerWidth - width - margin));
            // Open below, but flip above when there isn't room.
            const top =
                r.bottom + 6 + estHeight > window.innerHeight - margin
                    ? Math.max(margin, r.top - 6 - estHeight)
                    : r.bottom + 6;
            setPos({ top, left });
        }
        const onDoc = (e: MouseEvent) => {
            if (panelRef.current?.contains(e.target as Node) || btnRef.current?.contains(e.target as Node)) return;
            onToggle(false);
        };
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onToggle(false);
        const onScroll = () => onToggle(false);
        document.addEventListener('mousedown', onDoc);
        document.addEventListener('keydown', onKey);
        window.addEventListener('scroll', onScroll, true);
        return () => {
            document.removeEventListener('mousedown', onDoc);
            document.removeEventListener('keydown', onKey);
            window.removeEventListener('scroll', onScroll, true);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    return (
        <>
            <button
                ref={btnRef}
                onClick={() => onToggle(!open)}
                title={`browse all ${modifier.values.length} ${modifier.label.toLowerCase()} options`}
                aria-label={`browse ${modifier.label} options`}
                className={`ml-1 inline-flex translate-y-px transition-colors ${
                    open ? 'text-accent' : 'text-foreground/25 hover:text-accent'
                }`}
            >
                <LuCloud className="h-3.5 w-3.5" />
            </button>
            {open &&
                pos &&
                typeof document !== 'undefined' &&
                createPortal(
                    <div
                        ref={panelRef}
                        style={{ position: 'fixed', top: pos.top, left: pos.left, width: 260 }}
                        className="synth-pop z-50 rounded-lg border-2 border-border bg-background p-3 font-mono shadow-xl"
                    >
                        <div className="mb-2 flex items-center gap-1.5 text-[11px] tracking-wide text-foreground/50">
                            <LuCloud className="h-3 w-3" />
                            {modifier.label} · {modifier.values.length} possible
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                            {modifier.values.map((v, i) => {
                                const isCurrent = v === current;
                                const size = CLOUD_SIZES[(v.length + i) % CLOUD_SIZES.length];
                                return (
                                    <button
                                        key={v}
                                        onClick={() => onPick(v)}
                                        className={`rounded-full px-2 py-0.5 leading-tight transition-colors ${size} ${
                                            isCurrent
                                                ? 'bg-accent font-bold text-background'
                                                : 'bg-muted/30 text-foreground/70 hover:bg-accent/20 hover:text-accent'
                                        }`}
                                    >
                                        {v}
                                    </button>
                                );
                            })}
                        </div>
                    </div>,
                    document.body
                )}
        </>
    );
}

// ── The decisions dict (numbered, aligned, static) ───────────────────────────

function DecisionsDict({
    entity,
    modifiers,
    onCycle,
    onPick,
    anim,
    baseDelay,
    step,
}: {
    entity: EntityDefinition;
    modifiers: Modifiers;
    onCycle: (key: string) => void;
    onPick: (key: string, value: string) => void;
    anim: Anim;
    baseDelay: number;
    step: number;
}) {
    // Which decision's pool-cloud is open (at most one at a time).
    const [openKey, setOpenKey] = useState<string | null>(null);

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
                        <PoolCloud
                            modifier={m}
                            current={modifiers[m.key]}
                            open={openKey === m.key}
                            onToggle={(o) => setOpenKey(o ? m.key : null)}
                            onPick={(v) => {
                                onPick(m.key, v);
                                setOpenKey(null);
                            }}
                        />
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

// ── The sample artifact — each entity renders as the real thing ──────────────

type Tone = 'neutral' | 'good' | 'bad' | 'accent';

const PILL_TONE: Record<Tone, string> = {
    neutral: 'bg-muted/40 text-foreground/60',
    good: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    bad: 'bg-red-500/15 text-red-600 dark:text-red-400',
    accent: 'bg-accent/15 text-accent',
};

const GOOD = ['confirmed', 'ticketed', 'checked in', 'boarding', 'approved', 'paid', 'delivered', 'done', 'Active'];
const BAD = ['cancelled', 'rejected', 'refunded', 'returned', 'waitlisted', 'wont-fix', 'blocked', 'Offboarding'];

function statusTone(s: string): Tone {
    if (GOOD.includes(s)) return 'good';
    if (BAD.includes(s)) return 'bad';
    return 'neutral';
}

function Pill({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
    return <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${PILL_TONE[tone]}`}>{label}</span>;
}

/** Marks the one field a model wrote (on the hybrids). */
function LlmTag() {
    return (
        <span className="ml-1.5 rounded bg-accent/15 px-1 py-0.5 align-middle text-[9px] font-bold tracking-wide text-accent">
            LLM
        </span>
    );
}

function Field({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div className="text-[9px] tracking-wide text-foreground/40 uppercase">{label}</div>
            <div className="text-[12px] font-semibold break-words">{value}</div>
        </div>
    );
}

/** Deterministic fake barcode from a seed string. */
function Barcode({ seed }: { seed: string }) {
    const bars = Array.from({ length: 44 }, (_, i) => (seed.charCodeAt(i % seed.length) + i * 7) % 3);
    return (
        <div className="mt-3 flex h-8 items-stretch gap-px">
            {bars.map((w, i) => (
                <div
                    key={i}
                    style={{ width: `${w + 1}px` }}
                    className={i % 4 === 0 ? 'bg-foreground/30' : 'bg-foreground/80'}
                />
            ))}
        </div>
    );
}

function BoardingPass({ output }: { output: Extract<SampleOutput, { kind: 'boarding-pass' }> }) {
    return (
        <div className="overflow-hidden rounded-lg border border-border bg-muted/10">
            <div className="flex items-center justify-between bg-accent px-3 py-1.5 text-background">
                <span className="flex items-center gap-1.5 text-xs font-bold">
                    <LuPlane className="h-3.5 w-3.5" />
                    {output.airline}
                </span>
                <span className="text-[10px] tracking-widest uppercase">Boarding Pass</span>
            </div>
            <div className="flex">
                <div className="flex-1 p-3">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold">{output.from}</span>
                        <LuPlane className="h-4 w-4 text-accent" />
                        <span className="text-2xl font-bold">{output.to}</span>
                    </div>
                    <div className="mt-1 text-[10px] text-foreground/45">{output.travelerType}</div>
                    <div className="mt-3 grid grid-cols-3 gap-x-3 gap-y-2">
                        <Field label="Passenger" value={output.passenger} />
                        <Field label="Flight" value={output.flightNo} />
                        <Field label="Date" value={output.date} />
                        <Field label="Cabin" value={output.cabin} />
                        <Field label="PNR" value={output.pnr} />
                    </div>
                    <Barcode seed={output.pnr + output.flightNo} />
                </div>
                <div className="flex w-24 shrink-0 flex-col items-center justify-center gap-1 border-l border-dashed border-border p-3 text-center">
                    <div className="text-[9px] tracking-wide text-foreground/40 uppercase">Seat</div>
                    <div className="text-3xl font-bold text-accent">{output.seat}</div>
                    <Pill label={output.status} tone={statusTone(output.status)} />
                </div>
            </div>
        </div>
    );
}

function BadgeCard({ output }: { output: Extract<SampleOutput, { kind: 'badge' }> }) {
    const initials = output.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2);
    return (
        <div className="mx-auto max-w-[17rem] overflow-hidden rounded-lg border border-border bg-muted/10">
            <div className="h-8 bg-accent" />
            <div className="flex flex-col items-center gap-1 px-4 pb-4">
                <div className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full border-2 border-background bg-accent/20 text-lg font-bold text-accent">
                    {initials}
                </div>
                <div className="text-sm font-bold">{output.name}</div>
                <div className="text-[11px] text-foreground/60">{output.title}</div>
                <Pill label={output.status} tone={statusTone(output.status)} />
                <div className="mt-2 grid w-full grid-cols-2 gap-2">
                    <Field label="Department" value={output.department} />
                    <Field label="ID" value={output.employeeId} />
                    <Field label="Location" value={output.location} />
                </div>
                <div className="mt-2 w-full rounded bg-accent/5 p-2 text-[11px] leading-snug text-foreground/70">
                    <span className="italic">{output.bio}</span>
                    <LlmTag />
                </div>
            </div>
        </div>
    );
}

const APPROVAL_STAMP: Record<string, { word: string; color: string }> = {
    approved: { word: 'APPROVED', color: '#15803d' },
    paid: { word: 'PAID', color: '#15803d' },
    rejected: { word: 'REJECTED', color: '#b91c1c' },
    draft: { word: 'DRAFT', color: '#b45309' },
    'pending manager': { word: 'PENDING', color: '#b45309' },
    'pending finance': { word: 'PENDING', color: '#b45309' },
};

function InvoiceSlip({ output }: { output: Extract<SampleOutput, { kind: 'invoice' }> }) {
    const stamp = APPROVAL_STAMP[output.approval] ?? { word: output.approval.toUpperCase(), color: '#b45309' };
    return (
        <div className="relative mx-auto max-w-[17rem] overflow-hidden rounded-sm bg-[#fbfbf7] p-4 text-[#1a1a1a] shadow-md ring-1 ring-black/10">
            <div className="flex items-center justify-between border-b border-dashed border-black/25 pb-2">
                <span className="text-xs font-bold tracking-wide">PURCHASE REQUEST</span>
                <span className="text-[11px]">{output.number}</span>
            </div>
            <div className="mt-2 space-y-0.5 text-[11px] text-black/70">
                <div className="flex justify-between gap-2">
                    <span>Requester</span>
                    <span className="text-right">{output.requester}</span>
                </div>
                <div className="flex justify-between gap-2">
                    <span>Vendor</span>
                    <span className="text-right">{output.vendor}</span>
                </div>
            </div>
            <div className="mt-3 flex justify-between border-t border-black/15 pt-2 text-[11px]">
                <span>{output.lineItem}</span>
                <span className="font-semibold">{output.amount}</span>
            </div>
            <div className="mt-1 flex justify-between border-t-2 border-black/40 pt-1 text-xs font-bold">
                <span>TOTAL</span>
                <span>{output.amount}</span>
            </div>
            <div
                className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 -rotate-12 rounded border-2 px-2 py-0.5 text-sm font-black tracking-wider uppercase opacity-80"
                style={{ color: stamp.color, borderColor: stamp.color }}
            >
                {stamp.word}
            </div>
        </div>
    );
}

function Stepper({ steps, current, terminal }: { steps: string[]; current: number; terminal: string | null }) {
    if (terminal) {
        return (
            <div className="mt-3 flex items-center gap-2">
                <Pill label={terminal} tone="bad" />
                <span className="text-[11px] text-foreground/45">order did not complete</span>
            </div>
        );
    }
    return (
        <div className="mt-3 flex items-start">
            {steps.map((s, i) => (
                <div key={s} className="flex flex-1 flex-col items-center">
                    <div className="flex w-full items-center">
                        <div className={`h-0.5 flex-1 ${i === 0 ? 'opacity-0' : i <= current ? 'bg-accent' : 'bg-border'}`} />
                        <div
                            className={`h-3 w-3 shrink-0 rounded-full ${
                                i < current ? 'bg-accent' : i === current ? 'bg-accent ring-2 ring-accent/30' : 'bg-border'
                            }`}
                        />
                        <div
                            className={`h-0.5 flex-1 ${
                                i === steps.length - 1 ? 'opacity-0' : i < current ? 'bg-accent' : 'bg-border'
                            }`}
                        />
                    </div>
                    <span className={`mt-1 text-[10px] ${i <= current ? 'text-foreground/70' : 'text-foreground/35'}`}>
                        {s}
                    </span>
                </div>
            ))}
        </div>
    );
}

function OrderSlip({ output }: { output: Extract<SampleOutput, { kind: 'order' }> }) {
    return (
        <div className="rounded-lg border border-border bg-muted/10 p-3">
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold">Order {output.number}</span>
                <span className="text-[11px] text-foreground/50">
                    {output.customer} · {output.payment}
                </span>
            </div>
            <div className="mt-1 flex items-center gap-2">
                <span className="text-sm font-semibold">{output.item}</span>
                {output.discount !== 'no discount' && <Pill label={output.discount} tone="accent" />}
            </div>
            <Stepper steps={output.steps} current={output.current} terminal={output.terminal} />
        </div>
    );
}

const PRIORITY_COLOR: Record<string, string> = { P0: '#ef4444', P1: '#f97316', P2: '#eab308', P3: '#64748b' };

function TicketCard({ output }: { output: Extract<SampleOutput, { kind: 'ticket-card' }> }) {
    return (
        <div
            className="rounded-md border border-l-4 border-border bg-muted/10 p-3"
            style={{ borderLeftColor: PRIORITY_COLOR[output.priority] ?? '#64748b' }}
        >
            <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold tracking-wide text-foreground/55">{output.key}</span>
                <div className="flex gap-1">
                    <Pill label={output.type} />
                    <Pill label={output.priority} tone="accent" />
                </div>
            </div>
            <div className="mt-1 text-sm font-semibold">{output.title}</div>
            <div className="mt-1 text-[11px] leading-snug text-foreground/70">
                <span>{output.description}</span>
                <LlmTag />
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-border/50 pt-2 text-[11px] text-foreground/50">
                <span className="flex items-center gap-1.5">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-muted/50 text-[9px] font-bold text-foreground/60">
                        {output.reporter[0]?.toUpperCase()}
                    </span>
                    {output.reporter}
                </span>
                <div className="flex items-center gap-2">
                    <span className="rounded bg-muted/40 px-1.5 py-0.5 font-semibold">{output.points} pts</span>
                    <Pill label={output.status} tone={statusTone(output.status)} />
                </div>
            </div>
        </div>
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
        case 'boarding-pass':
            return <BoardingPass output={output} />;
        case 'badge':
            return <BadgeCard output={output} />;
        case 'invoice':
            return <InvoiceSlip output={output} />;
        case 'order':
            return <OrderSlip output={output} />;
        case 'ticket-card':
            return <TicketCard output={output} />;
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

    // Jump a decision straight to a chosen value (from the pool cloud).
    function pickModifier(key: string, value: string) {
        if (modifiers[key] === value) return;
        setModifiers({ ...modifiers, [key]: value });
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
                onPick={pickModifier}
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
