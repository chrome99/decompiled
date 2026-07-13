import type { EntityDefinition, Modifiers } from '../types';

const SURNAMES = ['Okafor', 'Nguyen', 'Alvarez', 'Kowalski', 'Haddad', 'Bianchi'];

function pnr(m: Modifiers): string {
    const base = (m.route.charCodeAt(0) * 37 + m.date.length * 7 + m.cabin.length).toString(36).toUpperCase();
    return (base + 'X7Q9K2').slice(0, 6);
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
            values: ['12A', '3C', '21F', '31D', '1A'],
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
    buildSample: (m) => {
        const [from, to] = m.route.split(' → ');
        const surname = SURNAMES[(m.route.length + m.seat.length) % SURNAMES.length];
        return {
            kind: 'boarding-pass',
            airline: 'SkyYonder',
            from,
            to,
            flightNo: `SY ${((m.route.charCodeAt(6) || 65) * 3 + m.date.length).toString().padStart(3, '0').slice(0, 3)}`,
            passenger: `${surname}/${m.route.charCodeAt(0) % 2 ? 'J' : 'A'}.`,
            travelerType: m.passenger,
            seat: m.seat,
            cabin: m.cabin,
            date: m.date,
            pnr: pnr(m),
            status: m.bookingState,
        };
    },
};
