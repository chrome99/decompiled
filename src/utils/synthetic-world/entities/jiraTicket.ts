// 9. Jira ticket or support case — work management.

import type { EntityDefinition } from '../types';
import { interpolate } from '../interpolate';

const template =
    'Write a {{priority}} {{issueType}} on the {{component}} component, reported by ' +
    '{{reporter}}, in {{sprint}}, currently {{status}} and worth {{storyPoints}} ' +
    'points. Labels: {{labels}}.';

export const jiraTicket: EntityDefinition = {
    id: 'jira-ticket',
    title: 'Jira Ticket',
    description: 'A work-management issue with a status and history.',
    icon: 'square-check',
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
            key: 'labels',
            label: 'Labels',
            values: ['regression, urgent', 'tech-debt', 'customer-reported', 'good-first-issue', 'needs-design'],
        },
        {
            key: 'storyPoints',
            label: 'Story points',
            values: ['1', '2', '3', '5', '8', '13'],
        },
    ],
    promptTemplate: template,
    buildPrompt: (m) => interpolate(template, m),
    buildSample: (m) => {
        const key = `${m.component.slice(0, 3).toUpperCase()}-${(m.reporter.length * 13 + m.storyPoints.length).toString().padStart(3, '0')}`;
        const title = `[${m.priority}] ${m.issueType} in ${m.component}`;
        const history =
            m.status === 'reopened'
                ? 'opened → done → reopened'
                : m.status === 'blocked'
                  ? 'opened → in progress → blocked'
                  : `opened → ${m.status}`;
        return {
            kind: 'text',
            content: `${key}  ${title}\nReporter: ${m.reporter}   Sprint: ${m.sprint}   Points: ${m.storyPoints}\nLabels: ${m.labels}\nHistory: ${history}`,
        };
    },
};
