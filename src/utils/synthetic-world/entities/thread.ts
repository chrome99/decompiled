// 3. Slack / Teams thread — communication.

import type { EntityDefinition } from '../types';
import { interpolate } from '../interpolate';

const template =
    'Write a chat thread ({{tone}}, {{urgency}}) between {{participants}} who are ' +
    '{{relationship}}, about "{{subject}}". It includes {{attachment}} and ends ' +
    'with the conversation being {{outcome}}.';

export const thread: EntityDefinition = {
    id: 'thread',
    title: 'Slack / Teams Thread',
    description: 'A short chat conversation with a shape decided up front.',
    icon: 'message-square',
    modifiers: [
        {
            key: 'participants',
            label: 'Participants',
            values: ['Dana and Priya', 'the whole #payments channel', 'Marco and a customer', 'three on-call engineers', 'Legal and Sales'],
        },
        {
            key: 'relationship',
            label: 'Relationship',
            values: ['close teammates', 'in different departments', 'manager and report', 'meeting for the first time', 'old colleagues'],
        },
        {
            key: 'urgency',
            label: 'Urgency',
            values: ['routine', 'time-sensitive', 'urgent', 'no rush'],
        },
        {
            key: 'subject',
            label: 'Subject',
            values: ['the Q3 launch slipping', 'a failing deploy', 'a confusing invoice', 'weekend on-call coverage', 'a customer escalation'],
        },
        {
            key: 'attachment',
            label: 'Attachment',
            values: ['a screenshot', 'a linked doc', 'a stack trace', 'a spreadsheet', 'no attachment'],
        },
        {
            key: 'tone',
            label: 'Tone',
            values: ['friendly', 'terse', 'anxious', 'joking', 'slightly tense'],
        },
        {
            key: 'outcome',
            label: 'Outcome',
            values: ['resolved', 'escalated', 'left unanswered', 'punted to a meeting', 'agreed on next steps'],
        },
    ],
    promptTemplate: template,
    buildPrompt: (m) => interpolate(template, m),
    buildSample: (m) => {
        const opener =
            m.urgency === 'urgent' || m.urgency === 'time-sensitive'
                ? `hey — quick one about ${m.subject}, need eyes now`
                : `when you get a sec, wanted to chat about ${m.subject}`;
        const middle =
            m.attachment === 'no attachment'
                ? `nothing to share yet, just wanted to flag it`
                : `dropping ${m.attachment} here so we're looking at the same thing`;
        const closer =
            m.outcome === 'left unanswered'
                ? `…`
                : m.outcome === 'escalated'
                  ? `ok this is bigger than us, looping in the lead`
                  : `great, ${m.outcome}. thanks!`;
        return {
            kind: 'conversation',
            messages: [
                { author: 'A', text: opener },
                { author: 'B', text: middle },
                { author: 'A', text: closer },
            ],
        };
    },
};
