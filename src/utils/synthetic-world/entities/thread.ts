// The bounce is the point: each turn's prompt is built from the running history,
// so the prompts visibly quote prior replies. The "model" is stubbed with
// deterministic templates, but the loop structure is real.

import type { EntityDefinition, Modifiers, TraceBlock } from '../types';

type Turn = { speaker: string; template: string; reply: string };

function speakers(m: Modifiers): [string, string] {
    const [a, b] = m.participants.split(' & ');
    return [a ?? 'A', b ?? 'B'];
}

function reply(intent: 'open' | 'respond' | 'resolve', m: Modifiers): string {
    const [, b] = speakers(m);
    if (intent === 'open') {
        const lead =
            m.urgency === 'urgent' || m.urgency === 'time-sensitive'
                ? `hey ${b} — quick one on ${m.subject}, need eyes now.`
                : `hey ${b}, when you get a sec — about ${m.subject}.`;
        return m.attachment === 'nothing'
            ? lead
            : `${lead} dropping ${m.attachment} so we're looking at the same thing.`;
    }
    if (intent === 'respond') {
        return m.tone === 'terse'
            ? `looking now. what's off exactly?`
            : `got it — took a look. so the issue is ${m.subject.replace(/^the /, '')}?`;
    }
    // resolve
    switch (m.outcome) {
        case 'escalated':
            return `ok this is bigger than us — looping in the lead.`;
        case 'left open':
            return `hmm. let me dig a bit and get back to you.`;
        case 'punted to a meeting':
            return `let's grab 15 min tomorrow and close it out.`;
        case 'agreed next steps':
            return `great — I'll take the first step, you take the second.`;
        default:
            return `that clears it up. thanks — marking this ${m.outcome}.`;
    }
}

/** Run the turn loop: build each prompt from history, "call the model", append. */
function simulate(m: Modifiers): Turn[] {
    const [a, b] = speakers(m);
    const plan: { speaker: string; intent: 'open' | 'respond' | 'resolve'; template: string }[] = [
        {
            speaker: a,
            intent: 'open',
            template: `Open the thread as ${a}, who is {{relationship}} with ${b}. Tone: {{tone}}, urgency: {{urgency}}. Subject: {{subject}}. Reference {{attachment}}.`,
        },
        {
            speaker: b,
            intent: 'respond',
            template: `Reply as ${b}. They just said: "{{prev}}". Hold the {{tone}} tone and ask about {{subject}}.`,
        },
        {
            speaker: a,
            intent: 'resolve',
            template: `Reply as ${a}. So far: "{{prev}}". Bring the thread to: {{outcome}}.`,
        },
    ];

    const turns: Turn[] = [];
    let prev = '';
    for (const step of plan) {
        // The prompt literally interpolates the previous reply — the "bounce".
        const template = step.template.replace('{{prev}}', prev || '(nothing yet)');
        const text = reply(step.intent, m);
        turns.push({ speaker: step.speaker, template, reply: text });
        prev = text;
    }
    return turns;
}

export const thread: EntityDefinition = {
    id: 'thread',
    title: 'Team Chat Thread',
    description: 'A short conversation generated one prompt at a time.',
    icon: 'message-square',
    strategy: 'llm-multi',
    strategyLabel: 'LLM · multi-turn',
    outputName: 'thread',
    modifiers: [
        {
            key: 'participants',
            label: 'Participants',
            values: ['Priya & Dana', 'Marco & a customer', 'a PM & an engineer', 'Legal & Sales', 'on-call & their lead'],
        },
        {
            key: 'relationship',
            label: 'Relationship',
            values: ['close teammates', 'in different departments', 'manager & report', 'meeting for the first time'],
        },
        {
            key: 'subject',
            label: 'Subject',
            values: ['the Q3 invoice mismatch', 'a failing deploy', 'weekend on-call cover', 'a customer escalation', 'the launch slipping'],
        },
        {
            key: 'tone',
            label: 'Tone',
            values: ['friendly', 'terse', 'anxious', 'lightly tense', 'joking'],
        },
        {
            key: 'urgency',
            label: 'Urgency',
            values: ['no rush', 'routine', 'time-sensitive', 'urgent'],
        },
        {
            key: 'attachment',
            label: 'Attachment',
            values: ['a screenshot', 'a linked doc', 'a stack trace', 'a spreadsheet', 'nothing'],
        },
        {
            key: 'outcome',
            label: 'Outcome',
            values: ['resolved', 'escalated', 'left open', 'punted to a meeting', 'agreed next steps'],
        },
    ],
    buildTrace: (m) => {
        const blocks: TraceBlock[] = [
            { kind: 'comment', text: '# dialogue is generated turn by turn — each prompt built from the history' },
            { kind: 'code', text: 'thread = simulate_thread(decisions)', accent: true },
        ];
        simulate(m).forEach((t, i) => {
            blocks.push({ kind: 'turn', n: i + 1, speaker: t.speaker, template: t.template });
        });
        return blocks;
    },
    buildSample: (m) => ({
        kind: 'conversation',
        messages: simulate(m).map((t) => ({ author: t.speaker, text: t.reply })),
    }),
};
