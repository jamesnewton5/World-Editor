import { world, Dimension, Entity, EntityComponentTypes, system } from "@minecraft/server";
import { Debug } from "../debug";
import { CustomEntity, CustomEntityCache, EntityTickCallback } from "../types";
import { createCustomEntity } from "./entity_constructor";
import { EntityConfigs } from "./entities";
import { PlayerCache } from "../player/player_cache";

export class EntityCache extends Debug {
    public static map: CustomEntityCache = new Map();
    private static entitiesWithCallbacks: Map<string, CustomEntity> = new Map();
    private static entityTickCallbacks: Map<string, Set<EntityTickCallback>> = new Map();

    private static includeEntityTypeIds: Set<string> = new Set([
        "world-editor:container"
    ]);

    // Remove temporary/utility entities
    private static REMOVE_ENTITY_TYPES_ON_LOAD: Array<string> = [
        "world-editor:container"
    ];

    public static registerEntityTickCallback(typeId: string, callback: EntityTickCallback) {
        const existingCallbacks = this.entityTickCallbacks.get(typeId);
        if (existingCallbacks !== undefined) {
            existingCallbacks.add(callback);
        } else {
            const callbacks = new Set([callback]);
            this.entityTickCallbacks.set(typeId, callbacks);
        }
    }

    private static initialised = false;
    public static initialise() {
        if (this.initialised) return;

        const dimensionsLoaded: Set<Dimension> = new Set();
        for (const player of world.getAllPlayers()) {
            dimensionsLoaded.add(player.dimension);
        }
        for (const dimension of dimensionsLoaded) {
            const entities = dimension.getEntities();
            for (const entity of entities) {
                const removed = this.removeIfRequired(entity);
                if (removed) continue;
                this.cacheEntity(entity);
            }
        }
        this.printDebug(`World loaded, entities in cache: ${this.map.size.toString()}`);


        // Subscribe to events
        world.afterEvents.entitySpawn.subscribe((event) => {
            this.cacheEntity(event.entity);
        });

        world.afterEvents.entityLoad.subscribe((event) => {
            const entity = event.entity;
            const removed = this.removeIfRequired(entity);
            if (removed) return;
            this.cacheEntity(entity);
        });

        world.afterEvents.entityRemove.subscribe((event) => {
            this.uncacheEntity(event.removedEntityId, event.typeId);
        });

        world.beforeEvents.playerInteractWithEntity.subscribe((event) => {
            const { player, target } = event;
            // Get callback
            const config = EntityConfigs[target.typeId];
            if (config === undefined) return;
            const callback = config.beforeInteract;
            if (callback === undefined) return;
            // Get custom types
            const customEntity = this.map.get(target.id);
            if (!customEntity?.isValid) return;
            const customPlayer = PlayerCache.get(player);
            if (!customPlayer?.isValid) return;
            callback(event, customEntity, customPlayer);
        });

        // Tick per entity
        system.runInterval(() => {
            for (const customEntity of this.entitiesWithCallbacks.values()) {
                if (!customEntity.isValid) continue;
                const callbacks = customEntity._callbacksPerTick;
                for (const callback of callbacks) {
                    callback(customEntity, this.map);
                }
            }
        }, 1);

        this.initialised = true;
    }

    private static removeIfRequired(entity: Entity): boolean {
        if (!this.REMOVE_ENTITY_TYPES_ON_LOAD.includes(entity.typeId)) return false;
        this.printDebug(`Attempting to remove entity ${entity.typeId}`)
        try { entity.remove(); } catch { }
        return true;
    }

    private static cacheEntity(entity: Entity) {
        if (!this.includeEntityTypeIds.has(entity.typeId)) return;
        if (!entity.isValid) return;
        const customEntity = createCustomEntity(entity);
        this.map.set(entity.id, customEntity);
        const callbacks = this.entityTickCallbacks.get(entity.typeId);
        if (callbacks === undefined) return;
        customEntity._callbacksPerTick = callbacks;
        this.entitiesWithCallbacks.set(entity.id, customEntity);
    }

    private static uncacheEntity(id: string, typeId?: string | undefined) {
        this.map.delete(id);
        if (this.entitiesWithCallbacks.has(id)) this.entitiesWithCallbacks.delete(id);
    }
}