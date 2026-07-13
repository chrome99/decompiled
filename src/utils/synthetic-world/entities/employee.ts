// 1. Employee profile — HR. Hybrid: the record is pure code, but the one-line
// bio is prose, so it takes a single model call.

import type { EntityDefinition, Modifiers } from '../types';

const FIRST_NAMES = ['Dana', 'Priya', 'Marco', 'Lena', 'Sam', 'Ingrid', 'Tomas'];

function nameFor(m: Modifiers): string {
    // Deterministic name pick from the chosen values (no extra randomness).
    const idx = (m.role.length + m.location.length) % FIRST_NAMES.length;
    return `${FIRST_NAMES[idx]} ${m.department.slice(0, 1)}.`;
}

// Stand-in for the model: a one-line bio assembled deterministically, but the
// point is that in a real pipeline this single field is the only LLM call.
function writeBio(m: Modifiers): string {
    const arc =
        m.status === 'Notice period' || m.status === 'Offboarding'
            ? 'now wrapping up their time here'
            : m.status === 'Probation'
              ? 'still in their first stretch'
              : `${m.tenure} in and going strong`;
    return `${nameFor(m)} is a ${m.level.toLowerCase()} ${m.role.toLowerCase()} on the ${m.department} team out of ${m.location}, ${arc}.`;
}

export const employee: EntityDefinition = {
    id: 'employee',
    title: 'Employee Profile',
    description: 'An HR record for a person in the simulated org.',
    icon: 'user',
    strategy: 'hybrid',
    strategyLabel: 'code + 1 LLM call',
    outputName: 'record',
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
    buildTrace: () => [
        { kind: 'comment', text: '# every structured field is pure data — assembled, not written' },
        { kind: 'code', text: 'record = build.employee(decisions)' },
        { kind: 'comment', text: '# one field is prose, so a single model call fills it in:' },
        {
            kind: 'prompt',
            label: 'bio_prompt',
            template:
                'Write a one-line bio for a {{level}} {{role}} in {{department}}, based in {{location}}, {{tenure}} in.',
        },
        { kind: 'code', text: 'record.bio = model(bio_prompt)', accent: true },
    ],
    buildSample: (m) => ({
        kind: 'record',
        fields: {
            name: nameFor(m),
            title: `${m.level} ${m.role}`,
            department: m.department,
            location: m.location,
            employmentType: m.employmentType,
            tenure: m.tenure,
            status: m.status,
            employeeId: `EMP-${(m.department.charCodeAt(0) + m.role.length).toString().padStart(4, '0')}`,
            bio: writeBio(m),
        },
        llmFields: ['bio'],
    }),
};
