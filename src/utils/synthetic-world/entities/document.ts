// 4. Document or spreadsheet — productivity.

import type { EntityDefinition } from '../types';
import { interpolate } from '../interpolate';

const template =
    'Generate a {{format}} titled "{{title}}" — a {{docType}} owned by {{department}}. ' +
    'It is currently {{status}}, last edited by {{lastEditor}}, marked {{sensitivity}}.';

export const document: EntityDefinition = {
    id: 'document',
    title: 'Document / Spreadsheet',
    description: 'A productivity artifact somewhere in its editing lifecycle.',
    icon: 'file-text',
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
            label: 'Format',
            values: ['doc', 'spreadsheet', 'slide deck'],
        },
        {
            key: 'lastEditor',
            label: 'Last editor',
            values: ['Dana', 'Priya', 'Marco', 'Lena', 'an external contractor'],
        },
        {
            key: 'sensitivity',
            label: 'Sensitivity',
            values: ['public', 'internal', 'confidential', 'restricted'],
        },
    ],
    promptTemplate: template,
    buildPrompt: (m) => interpolate(template, m),
    buildSample: (m) => ({
        kind: 'record',
        fields: {
            title: m.title,
            type: m.docType,
            format: m.format,
            owner: m.department,
            status: m.status,
            lastEditedBy: m.lastEditor,
            sensitivity: m.sensitivity,
            version: `v${(m.title.length % 4) + 1}.${m.status.length % 9}`,
        },
    }),
};
