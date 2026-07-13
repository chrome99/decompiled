// 9. Issue tracker ticket — work management. Hybrid: the metadata (type,
// priority, status, points) is pure code; only the human-written description
// comes from a single model call.

import type { EntityDefinition, Modifiers } from '../types';

function ticketKey(m: Modifiers): string {
    const n = (m.reporter.length * 13 + m.storyPoints.length * 7) % 900;
    return `${m.component.slice(0, 3).toUpperCase()}-${(n + 100).toString()}`;
}

// Stand-in for the model: a short description. In a real pipeline this is the
// one LLM call; the rest of the ticket is assembled in code.
function writeDescription(m: Modifiers): string {
    const verb = m.issueType === 'bug' ? 'is broken' : m.issueType === 'feature' ? 'is missing' : 'needs work';
    return `The ${m.component} ${verb}. Reported by ${m.reporter}; severity ${m.priority}. Needs attention this ${m.sprint === 'the backlog' ? 'quarter' : 'sprint'}.`;
}

export const issueTicket: EntityDefinition = {
    id: 'issue-ticket',
    title: 'Issue Ticket',
    description: 'A work-management issue with a status and history.',
    icon: 'square-check',
    strategy: 'hybrid',
    strategyLabel: 'code + 1 LLM call',
    outputName: 'ticket',
    modifiers: [
        {
            key: 'issueType',
            label: 'Issue type',
            values: ['bug', 'feature', 'chore', 'spike', 'support case'],
        },
        {
            key: 'priority',
            label: 'Priority',
            values: ['P0', 'P1', 'P2', 'P3'],
        },
        {
            key: 'component',
            label: 'Component',
            values: ['checkout', 'auth', 'billing', 'search', 'mobile app', 'admin panel'],
        },
        {
            key: 'reporter',
            label: 'Reporter',
            values: ['Dana', 'a customer', 'the on-call engineer', 'QA', 'a product manager'],
        },
        {
            key: 'status',
            label: 'Status',
            values: ['open', 'in progress', 'blocked', 'in review', 'reopened', 'done', 'wont-fix'],
        },
        {
            key: 'sprint',
            label: 'Sprint',
            values: ['Sprint 14', 'Sprint 15', 'the backlog', 'next quarter'],
        },
        {
            key: 'storyPoints',
            label: 'Story points',
            values: ['1', '2', '3', '5', '8', '13'],
        },
    ],
    buildTrace: () => [
        { kind: 'comment', text: '# ticket metadata is pure code — type, priority, status, points' },
        { kind: 'code', text: 'ticket = build.ticket(decisions)' },
        { kind: 'comment', text: '# only the description is prose, so one model call:' },
        {
            kind: 'prompt',
            label: 'desc_prompt',
            template: 'Write a short {{issueType}} description for the {{component}} component ({{priority}}), reported by {{reporter}}.',
        },
        { kind: 'code', text: 'ticket.description = model(desc_prompt)', accent: true },
    ],
    buildSample: (m) => ({
        kind: 'record',
        fields: {
            ticket: ticketKey(m),
            type: m.issueType,
            priority: m.priority,
            component: m.component,
            reporter: m.reporter,
            status: m.status,
            sprint: m.sprint,
            points: m.storyPoints,
            description: writeDescription(m),
        },
        llmFields: ['description'],
    }),
};
