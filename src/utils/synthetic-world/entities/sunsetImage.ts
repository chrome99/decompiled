import type { EntityDefinition } from '../types';

const template =
    'A sunset over {{location}} at {{timeOfDay}}, rendered as {{medium}}: ' +
    '{{weather}} skies, {{composition}}, a {{palette}} palette; the mood is {{mood}}.';

// The image the model would return, mocked as a gradient keyed to the palette.
const GRADIENTS: Record<string, [string, string, string]> = {
    'warm amber': ['#7c2d12', '#ea580c', '#fcd34d'],
    'cool violet': ['#312e81', '#7c3aed', '#f0abfc'],
    'muted pastel': ['#8a7468', '#e8b4a0', '#fce7d8'],
    'high-contrast': ['#0b1020', '#ef4444', '#fde047'],
    monochrome: ['#1f2937', '#6b7280', '#e5e7eb'],
};

export const sunsetImage: EntityDefinition = {
    id: 'sunset-image',
    title: 'Sunset Image',
    description: 'An image described by decisions and painted by a model.',
    icon: 'sunset',
    strategy: 'image-model',
    strategyLabel: 'image model',
    outputName: 'image',
    modifiers: [
        {
            key: 'location',
            label: 'Location',
            values: ['a coastal cliff', 'a city skyline', 'a wheat field', 'a mountain lake', 'a desert highway', 'a harbor'],
        },
        {
            key: 'timeOfDay',
            label: 'Time of day',
            values: ['golden hour', 'the last minute before dusk', 'blue hour', 'twilight'],
        },
        {
            key: 'weather',
            label: 'Weather',
            values: ['clear', 'scattered cloud', 'stormy', 'hazy', 'misty'],
        },
        {
            key: 'composition',
            label: 'Composition',
            values: ['wide establishing shot', 'tight silhouette', 'reflection in water', 'rule-of-thirds horizon', 'low-angle foreground detail'],
        },
        {
            key: 'medium',
            label: 'Medium',
            values: ['photograph', 'oil painting', 'watercolor', 'cinematic still', 'risograph print'],
        },
        {
            key: 'mood',
            label: 'Mood',
            values: ['serene', 'melancholic', 'triumphant', 'nostalgic', 'ominous'],
        },
        {
            key: 'palette',
            label: 'Palette',
            values: ['warm amber', 'cool violet', 'muted pastel', 'high-contrast', 'monochrome'],
        },
    ],
    buildTrace: () => [
        { kind: 'comment', text: "# pixels can't be templated — you describe it, a model paints it" },
        { kind: 'prompt', label: 'prompt', template },
        { kind: 'code', text: 'image = image_model(prompt, steps=30)', accent: true },
    ],
    buildSample: (m) => ({
        kind: 'image',
        caption: `${m.medium} · 1024×1024 · diffusion model`,
        tags: [m.timeOfDay, m.weather, m.mood, m.palette].map((t) => t.replace(/\s+/g, '-')),
        gradient: GRADIENTS[m.palette] ?? GRADIENTS['warm amber'],
    }),
};
