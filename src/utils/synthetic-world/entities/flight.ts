// 2. Flight booking — travel. Pure deterministic: an itinerary is structured
// data, so it's assembled entirely in code. No model.

import type { EntityDefinition, Modifiers } from '../types';

function pnr(m: Modifiers): string {
    // A believable 6-char record locator, derived from the decisions.
    const base = (m.route.charCodeAt(0) * 37 + m.date.length * 7 + m.cabin.length).toString(36).toUpperCase();
    return (base + 'X7Q').slice(0, 6);
}

function flightNo(m: Modifiers): string {
    return `SY ${((m.route.charCodeAt(6) || 65) * 3 + m.date.length).toString().padStart(3, '0').slice(0, 3)}`;
}

export const flight: EntityDefinition = {
    id: 'flight',
    title: 'Flight Booking',
    description: 'An airline itinerary with its current lifecycle state.',
    icon: 'plane',
    strategy: 'deterministic',
    strategyLabel: 'deterministic',
    outputName: 'itinerary',
    modifiers: [
        {
            key: 'route',
            label: 'Route',
            values: ['SFO → NRT', 'JFK → LHR', 'LIS → GRU', 'SIN → SYD', 'DEN → CUN', 'FRA → CPT'],
        },
        {
            key: 'date',
            label: 'Date',
            values: ['Mar 3', 'Jun 14', 'Sep 2', 'Nov 22', 'Dec 27'],
        },
        {
            key: 'cabin',
            label: 'Cabin',
            values: ['economy', 'premium economy', 'business', 'first'],
        },
        {
            key: 'passenger',
            label: 'Passenger',
            values: ['a solo business traveler', 'a family of four', 'a couple', 'a conference group'],
        },
        {
            key: 'seat',
            label: 'Seat',
            values: ['aisle', 'window', 'exit row', 'bulkhead', 'no preference'],
        },
        {
            key: 'bookingState',
            label: 'Booking state',
            values: ['confirmed', 'ticketed', 'checked in', 'boarding', 'cancelled', 'waitlisted'],
        },
        {
            key: 'loyaltyTier',
            label: 'Loyalty tier',
            values: ['none', 'Silver', 'Gold', 'Platinum'],
        },
    ],
    buildTrace: () => [
        { kind: 'comment', text: '# a flight itinerary is structured data — no model involved' },
        { kind: 'code', text: 'itinerary = build.flight(decisions)' },
    ],
    buildSample: (m) => ({
        kind: 'record',
        fields: {
            recordLocator: pnr(m),
            flight: flightNo(m),
            route: m.route,
            date: m.date,
            cabin: m.cabin,
            seat: m.seat,
            passenger: m.passenger,
            status: m.bookingState,
            loyalty: m.loyaltyTier,
        },
    }),
};
