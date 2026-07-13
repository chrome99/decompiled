// Central registry of every synthetic entity generator.

import type { EntityDefinition } from './types';
import { employee } from './entities/employee';
import { flight } from './entities/flight';
import { thread } from './entities/thread';
import { document } from './entities/document';
import { sunsetImage } from './entities/sunsetImage';
import { sreEvent } from './entities/sreEvent';
import { purchaseRequest } from './entities/purchaseRequest';
import { ecommerceOrder } from './entities/ecommerceOrder';
import { issueTicket } from './entities/issueTicket';

/** All nine entity definitions, in a fixed display order. */
export const entities: EntityDefinition[] = [
    employee,
    flight,
    thread,
    document,
    sunsetImage,
    sreEvent,
    purchaseRequest,
    ecommerceOrder,
    issueTicket,
];

const byId = new Map<string, EntityDefinition>(entities.map((e) => [e.id, e]));

/** Look up an entity by id, throwing a clear error if it doesn't exist. */
export function getEntityDefinition(entityId: string): EntityDefinition {
    const entity = byId.get(entityId);
    if (!entity) {
        throw new Error(
            `Unknown synthetic entity "${entityId}". Known ids: ${entities.map((e) => e.id).join(', ')}.`
        );
    }
    return entity;
}

/** The index of an entity in the registry (used to derive per-entity seeds). */
export function entityIndex(entityId: string): number {
    return entities.findIndex((e) => e.id === entityId);
}
