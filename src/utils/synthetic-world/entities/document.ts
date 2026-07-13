import type { EntityDefinition, Modifiers } from '../types';

function version(m: Modifiers): string {
    return `v${(m.title.length % 4) + 1}.${m.status.length % 9}`;
}

export const document: EntityDefinition = {
    id: 'document',
    title: 'PDF Document',
    description: 'A formatted document rendered from a fixed layout.',
    icon: 'file-text',
    strategy: 'pdf',
    strategyLabel: 'deterministic PDF',
    outputName: 'pdf',
    modifiers: [
        {
            key: 'docType',
            label: 'Document type',
            values: ['project proposal', 'meeting notes', 'budget model', 'design spec', 'runbook', 'onboarding checklist'],
        },
        {
            key: 'title',
            label: 'Title',
            values: ['Q3 Roadmap', 'Vendor Comparison', 'Incident Postmortem', 'Hiring Plan', 'Pricing v2', 'Migration Steps'],
        },
        {
            key: 'department',
            label: 'Owner dept',
            values: ['Engineering', 'Finance', 'Product', 'People Ops', 'Marketing'],
        },
        {
            key: 'status',
            label: 'Status',
            values: ['draft', 'in review', 'approved', 'stale', 'archived'],
        },
        {
            key: 'format',
            label: 'Page size',
            values: ['A4', 'US Letter'],
        },
        {
            key: 'owner',
            label: 'Owner',
            values: ['Dana', 'Priya', 'Marco', 'Lena', 'an external contractor'],
        },
        {
            key: 'sensitivity',
            label: 'Sensitivity',
            values: ['Public', 'Internal', 'Confidential', 'Restricted'],
        },
    ],
    buildTrace: () => [
        { kind: 'comment', text: '# a formatted page is a fixed layout — a template engine, not a model' },
        { kind: 'code', text: "pdf = render_pdf(decisions, template='doc_v2')" },
    ],
    buildSample: (m) => ({
        kind: 'pdf',
        title: m.title,
        classification: m.sensitivity,
        meta: `${m.docType} · ${m.department} · ${m.status} · ${m.format} · ${version(m)}`,
        sections: [
            {
                heading: '1. Overview',
                lines: [`Owner: ${m.owner}`, `Department: ${m.department}`, `Status: ${m.status}`],
            },
            {
                heading: '2. Details',
                lines: [`Type: ${m.docType}`, `Classification: ${m.sensitivity}`, `Revision: ${version(m)}`],
            },
        ],
        footer: `Page 1 of 1 · ${m.sensitivity} · SynthCorp`,
    }),
};
