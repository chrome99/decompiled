import type { EntityDefinition, Modifiers } from '../types';

const FIRST_NAMES = ['Dana', 'Priya', 'Marco', 'Lena', 'Sam', 'Ingrid', 'Tomas'];

function nameFor(m: Modifiers): string {
    const idx = (m.role.length + m.location.length) % FIRST_NAMES.length;
    return `${FIRST_NAMES[idx]} ${m.department.slice(0, 1)}.`;
}

// The one field a model writes; deterministic here so the demo reproduces.
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
            // Department-neutral so no pairing ever reads oddly (no "Engineer in Legal").
            key: 'role',
            label: 'Role',
            values: ['Analyst', 'Specialist', 'Associate', 'Coordinator', 'Generalist', 'Partner', 'Advisor'],
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
        kind: 'badge',
        name: nameFor(m),
        title: `${m.level} ${m.role}`,
        department: m.department,
        employeeId: `EMP-${(m.department.charCodeAt(0) + m.role.length).toString().padStart(4, '0')}`,
        location: m.location,
        status: m.status,
        bio: writeBio(m),
    }),
};
