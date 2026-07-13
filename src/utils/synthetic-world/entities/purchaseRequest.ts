import type { EntityDefinition } from '../types';

export const purchaseRequest: EntityDefinition = {
    id: 'purchase-request',
    title: 'Purchase Request',
    description: 'A procurement request with an approval lifecycle.',
    icon: 'receipt',
    strategy: 'deterministic',
    strategyLabel: 'deterministic',
    outputName: 'record',
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
            // Kept broad so any vendor/category pairing reads plausibly.
            key: 'vendor',
            label: 'Vendor',
            values: ['a SaaS vendor', 'a cloud provider', 'a design agency', 'a hardware reseller', 'an office supplier', 'a consultancy'],
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
            values: ['software', 'cloud infra', 'services', 'equipment', 'supplies', 'consulting'],
        },
    ],
    buildTrace: () => [
        { kind: 'comment', text: '# a purchase request is a form — pure data, no model' },
        { kind: 'code', text: 'record = build.purchase_request(decisions)' },
    ],
    buildSample: (m) => ({
        kind: 'invoice',
        number: `PR-${(m.vendor.charCodeAt(0) + m.amount.length).toString().padStart(4, '0')}`,
        requester: `${m.requester} · ${m.department}`,
        vendor: m.vendor,
        lineItem: `${m.category} (${m.urgency})`,
        amount: m.amount,
        category: m.category,
        approval: m.approvalState,
    }),
};
