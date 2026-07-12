// 2. Hotel or flight booking — travel.

import type { EntityDefinition } from '../types';
import { interpolate } from '../interpolate';

const template =
    'Create a travel booking for a {{travelerType}} going to {{destination}} on ' +
    '{{dates}}. Room type: {{roomType}}. The booking is currently {{bookingState}}. ' +
    'Special request: {{specialRequest}}. Loyalty tier: {{loyaltyTier}}.';

export const booking: EntityDefinition = {
    id: 'booking',
    title: 'Hotel / Flight Booking',
    description: 'A travel reservation with its current lifecycle state.',
    icon: 'plane',
    modifiers: [
        {
            key: 'destination',
            label: 'Destination',
            values: ['Lisbon', 'Tokyo', 'Reykjavik', 'Cape Town', 'Denver', 'Singapore'],
        },
        {
            key: 'travelerType',
            label: 'Traveler',
            values: ['solo business traveler', 'couple', 'family of four', 'conference group', 'digital nomad'],
        },
        {
            key: 'dates',
            label: 'Dates',
            values: ['Mar 3–7', 'Jun 14–21', 'Sep 2–4', 'Nov 22–29', 'Dec 27–Jan 2'],
        },
        {
            key: 'roomType',
            label: 'Room / seat',
            values: ['standard king', 'twin double', 'suite', 'economy aisle', 'business class'],
        },
        {
            key: 'bookingState',
            label: 'Booking state',
            values: ['confirmed', 'pending payment', 'checked in', 'cancelled', 'waitlisted', 'refunded'],
        },
        {
            key: 'specialRequest',
            label: 'Special request',
            values: ['late checkout', 'crib in room', 'gluten-free meals', 'airport transfer', 'high floor, quiet', 'none'],
        },
        {
            key: 'loyaltyTier',
            label: 'Loyalty tier',
            values: ['none', 'Silver', 'Gold', 'Platinum'],
        },
    ],
    promptTemplate: template,
    buildPrompt: (m) => interpolate(template, m),
    buildSample: (m) => ({
        kind: 'record',
        fields: {
            confirmation: `BK-${(m.destination.charCodeAt(0) * 37 + m.dates.length).toString(36).toUpperCase()}`,
            destination: m.destination,
            traveler: m.travelerType,
            dates: m.dates,
            room: m.roomType,
            status: m.bookingState,
            request: m.specialRequest,
            loyalty: m.loyaltyTier,
        },
    }),
};
