// 1. Employee profile — HR.

import type { EntityDefinition } from '../types';
import { interpolate } from '../interpolate';

const template =
    'Generate an HR profile for a {{level}} {{role}} in {{department}}, based in ' +
    '{{location}}, employed {{employmentType}} with {{tenure}} of tenure. Current ' +
    'employment status: {{status}}.';

export const employee: EntityDefinition = {
    id: 'employee',
    title: 'Employee Profile',
    description: 'An HR record for a person in the simulated org.',
    icon: 'user',
    modifiers: [
        {
            key: 'department',
            label: 'Department',
            values: ['Engineering', 'Finance', 'Sales', 'People Ops', 'Legal', 'Support', 'Marketing'],
        },
        {
            key: 'level',
            label: 'Level',
            values: ['Junior', 'Mid-level', 'Senior', 'Staff', 'Principal', 'Lead'],
        },
        {
            key: 'role',
            label: 'Role',
            values: ['Software Engineer', 'Accountant', 'Account Executive', 'Recruiter', 'Counsel', 'Support Agent', 'PMM'],
        },
        {
            key: 'tenure',
            label: 'Tenure',
            values: ['3 months', '11 months', '2 years', '4 years', '7 years'],
        },
        {
            key: 'location',
            label: 'Location',
            values: ['Remote (US)', 'New York, NY', 'London, UK', 'Berlin, DE', 'Austin, TX', 'Remote (EU)'],
        },
        {
            key: 'employmentType',
            label: 'Employment type',
            values: ['full-time', 'part-time', 'contract', 'intern'],
        },
        {
            key: 'status',
            label: 'Status',
            values: ['Active', 'On leave', 'Notice period', 'Probation', 'Offboarding'],
        },
    ],
    promptTemplate: template,
    buildPrompt: (m) => interpolate(template, m),
    buildSample: (m) => {
        const first = ['Dana', 'Priya', 'Marco', 'Lena', 'Sam', 'Ingrid', 'Tomas'];
        // Deterministic name pick from the chosen values (no extra randomness).
        const idx = (m.role.length + m.location.length) % first.length;
        const name = `${first[idx]} ${m.department.slice(0, 1)}.`;
        return {
            kind: 'record',
            fields: {
                name,
                title: `${m.level} ${m.role}`,
                department: m.department,
                location: m.location,
                employmentType: m.employmentType,
                tenure: m.tenure,
                status: m.status,
                employeeId: `EMP-${(m.department.charCodeAt(0) + m.role.length).toString().padStart(4, '0')}`,
            },
        };
    },
};
