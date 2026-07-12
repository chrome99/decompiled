// 5. Sunset image prompt — media.

import type { EntityDefinition } from '../types';
import { interpolate } from '../interpolate';

const template =
    'A sunset over {{location}} at {{timeOfDay}}, rendered as a {{medium}}, ' +
    '{{weather}} skies, {{composition}}, {{palette}} palette, evoking a {{mood}} mood.';

export const sunsetImage: EntityDefinition = {
    id: 'sunset-image',
    title: 'Sunset Image Prompt',
    description: 'An image-generation prompt assembled from visual decisions.',
    icon: 'sunset',
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
    promptTemplate: template,
    buildPrompt: (m) => interpolate(template, m),
    buildSample: (m) => ({
        kind: 'image-prompt',
        prompt: interpolate(template, m),
        tags: [m.medium, m.timeOfDay, m.weather, m.mood, m.palette].map((t) => t.replace(/\s+/g, '-')),
    }),
};
