// 7. Purchase request or invoice — finance / procurement.

import type { EntityDefinition } from '../types';
import { interpolate } from '../interpolate';

const template =
    'Create a purchase request from {{requester}} in {{department}} to buy from ' +
    '{{vendor}} for {{amount}} ({{category}}). Urgency: {{urgency}}. Approval ' +
    'state: {{approvalState}}.';

export const purchaseRequest: EntityDefinition = {
    id: 'purchase-request',
    title: 'Purchase Request',
    description: 'A procurement request with an approval lifecycle.',
    icon: 'receipt',
    modifiers: [
        {
            key: 'requester',
            label: 'Requester',
            values: ['Dana', 'Priya', 'Marco', 'Lena', 'Tomas'],
        },
        {
            key: 'department',
            label: 'Department',
            values: ['Engineering', 'Marketing', 'People Ops', 'Sales', 'Facilities'],
        },
        {
            key: 'vendor',
            label: 'Vendor',
            values: ['Datadog', 'WeWork', 'Figma', 'AWS', 'a boutique agency', 'Staples'],
        },
        {
            key: 'amount',
            label: 'Amount',
            values: ['$480', '$2,300', '$9,900', '$14,500', '$48,000'],
        },
        {
            key: 'urgency',
            label: 'Urgency',
            values: ['low', 'normal', 'high', 'blocking a launch'],
        },
        {
            key: 'approvalState',
            label: 'Approval state',
            values: ['draft', 'pending manager', 'pending finance', 'approved', 'rejected', 'paid'],
        },
        {
            key: 'category',
            label: 'Category',
            values: ['software', 'office space', 'contractor', 'cloud infra', 'supplies', 'travel'],
        },
    ],
    promptTemplate: template,
    buildPrompt: (m) => interpolate(template, m),
    buildSample: (m) => ({
        kind: 'record',
        fields: {
            prNumber: `PR-${(m.vendor.charCodeAt(0) + m.amount.length).toString().padStart(4, '0')}`,
            requester: `${m.requester} · ${m.department}`,
            vendor: m.vendor,
            amount: m.amount,
            category: m.category,
            urgency: m.urgency,
            approval: m.approvalState,
            needsFinance: m.approvalState === 'pending finance' || m.approvalState === 'pending manager' ? 'yes' : 'no',
        },
    }),
};
