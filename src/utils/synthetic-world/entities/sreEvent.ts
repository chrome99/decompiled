// 6. SRE error event or log — observability.

import type { EntityDefinition } from '../types';
import { interpolate } from '../interpolate';

const template =
    'Write an incident log for a {{severity}} on {{service}} in {{environment}}. ' +
    'It lasted {{duration}}, root cause was {{rootCause}}, customer impact was ' +
    '{{customerImpact}}. The incident is now {{status}}.';

export const sreEvent: EntityDefinition = {
    id: 'sre-event',
    title: 'SRE Error Event',
    description: 'An observability log entry for a production incident.',
    icon: 'siren',
    modifiers: [
        {
            key: 'severity',
            label: 'Severity',
            values: ['SEV1', 'SEV2', 'SEV3', 'SEV4'],
        },
        {
            key: 'service',
            label: 'Service',
            values: ['checkout-api', 'auth-gateway', 'payments-worker', 'search-indexer', 'notification-svc'],
        },
        {
            key: 'environment',
            label: 'Environment',
            values: ['production', 'staging', 'production (eu-west-1)', 'production (us-east-1)'],
        },
        {
            key: 'duration',
            label: 'Duration',
            values: ['4 minutes', '23 minutes', '1h 12m', '3 hours', 'ongoing'],
        },
        {
            key: 'rootCause',
            label: 'Root cause',
            values: ['a bad deploy', 'DB connection pool exhaustion', 'an expired TLS cert', 'upstream provider outage', 'a memory leak', 'a config typo'],
        },
        {
            key: 'customerImpact',
            label: 'Customer impact',
            values: ['none', 'elevated latency', 'partial outage', 'full outage', 'degraded checkout'],
        },
        {
            key: 'status',
            label: 'Status',
            values: ['mitigated', 'resolved', 'investigating', 'monitoring', 'postmortem scheduled'],
        },
    ],
    promptTemplate: template,
    buildPrompt: (m) => interpolate(template, m),
    buildSample: (m) => {
        const levelWord = m.severity === 'SEV1' || m.severity === 'SEV2' ? 'ERROR' : 'WARN';
        return {
            kind: 'log',
            lines: [
                `[${m.severity}] ${levelWord} service=${m.service} env=${m.environment}`,
                `  root_cause="${m.rootCause}" duration=${m.duration}`,
                `  customer_impact="${m.customerImpact}" status=${m.status}`,
                `  runbook=https://runbooks.internal/${m.service}`,
            ],
        };
    },
};
