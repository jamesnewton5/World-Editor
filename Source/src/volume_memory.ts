import { BlockVolume, Dimension, StructureSaveMode, system, Vector3, world } from "@minecraft/server";
import { Schema } from "./utilities/schema_validator";
import { PACK_ID } from "./data";
import { Debug } from "./debug";
import { queueMicrotask } from "./general";
import { VectorMath } from "./vector_math";

type VolumeState = {
    id: string;
    dynamicPropertyId: string;
    structureId: string;
    dimensionId: string;
    location: Vector3;
    size: Vector3;

    lastAccessedTick: number;
};

const SchemaVector3 = new Schema({
    options: {
        allowPartial: false,
        allowExtensions: false
    },
    properties: {
        x: {
            require: true,
            propertyType: "number"
        },
        y: {
            require: true,
            propertyType: "number"
        },
        z: {
            require: true,
            propertyType: "number"
        }
    }
});

const SchemaVolumeState = new Schema({
    options: {
        allowPartial: false,
        allowExtensions: false
    },
    properties: {
        id: {
            require: true,
            propertyType: "string"
        },
        structureId: {
            require: true,
            propertyType: "string"
        },
        dynamicPropertyId: {
            require: true,
            propertyType: "string"
        },
        dimensionId: {
            require: true,
            propertyType: "string"
        },
        location: {
            require: true,
            propertyType: SchemaVector3
        },
        size: {
            require: true,
            propertyType: SchemaVector3
        },
        lastAccessedTick: {
            require: true,
            propertyType: "number"
        }
    }
});

export class VolumeMemory extends Debug {
    // esbuild config options may not preserve class names:
    private static readonly CLASS_NAME = "VolumeMemory";
    private static storageScheduledFor = new WeakSet();

    private static MEMORY_INDEX_DYNAMIC_PROPERTY_ID = `${this.CLASS_NAME}_MemoryIndex`;
    private static NONCE_DYNAMIC_PROPERTY_ID = `${this.CLASS_NAME}_Nonce`;
    private static currentIdentifier: number | undefined = undefined;

    private static memoryIndex: Set<string> = new Set();
    private static memory: Map<string, VolumeState> = new Map();

    private static initialised = false;
    public static initialise() {
        if (this.initialised) return;
        this.restoreMemory();
        this.initialised = true;
    }

    private static storeMemoryIndex() {
        const memoryIndexString = JSON.stringify(Array.from(this.memoryIndex));
        world.setDynamicProperty(this.MEMORY_INDEX_DYNAMIC_PROPERTY_ID, memoryIndexString);
        this.printDebug("Updated stored memory index");
    }

    private static restoreMemoryIndex(): void {
        let storedMemoryIndex: Array<string> | undefined = undefined;
        const memoryIndexString = world.getDynamicProperty(this.MEMORY_INDEX_DYNAMIC_PROPERTY_ID) as string | undefined;
        if (memoryIndexString !== undefined) {
            const parsedMemoryIndex = JSON.parse(memoryIndexString) as unknown;
            const SchemaMemoryIndex = new Schema({ arrayOf: "string" });
            const isValid = SchemaMemoryIndex.check(parsedMemoryIndex);
            if (isValid) {
                storedMemoryIndex = parsedMemoryIndex as Array<string>;
                this.printDebug("§aSuccessfully retrieved and parsed stored memory index");
            } else {
                this.printDebug(`§cStored memory index is corrupt`);
                world.setDynamicProperty(this.MEMORY_INDEX_DYNAMIC_PROPERTY_ID, undefined);
            }
        }
        // Add in pre-initialisation entries
        if (this.memoryIndex.size > 0) {
            if (storedMemoryIndex === undefined) storedMemoryIndex = Array.from(this.memoryIndex);
            else storedMemoryIndex.push(...Array.from(this.memoryIndex));
        }

        this.memoryIndex = new Proxy(new Set(storedMemoryIndex), {
            get(target, propertyName) {
                let value = Reflect.get(target, propertyName);
                if (typeof value === "function") value = value.bind(target);
                if (propertyName === "add" || propertyName === "delete") {
                    VolumeMemory.printDebug(`Returning modified method from proxied memory index set`);
                    return (...args: Array<any>) => {
                        value(...args);
                        if (!VolumeMemory.storageScheduledFor.has(target)) {
                            VolumeMemory.storageScheduledFor.add(target);
                            queueMicrotask(() => {
                                VolumeMemory.storeMemoryIndex();
                                VolumeMemory.storageScheduledFor.delete(target);
                            });
                        }
                    }
                }
                return value;
            }
        });
    }

    private static restoreMemory() {
        this.restoreMemoryIndex();
        this.printDebug(`Found ${this.memoryIndex.size} stored dynamic property IDs`);
        for (const dynamicPropertyId of this.memoryIndex) {
            this.retrieveVolumeState(dynamicPropertyId);
        }

        this.memory = new Proxy(this.memory, {
            get(target, propertyName) {
                let value = Reflect.get(target, propertyName);
                if (typeof value === "function") value = value.bind(target);
                if (propertyName === "set" || propertyName === "delete") {
                    VolumeMemory.printDebug(`Returning modified method from proxied memory map`);
                    return (...args: Array<any>) => {
                        const dynamicPropertyId = propertyName === "set" ? (args[1] as VolumeState).dynamicPropertyId : VolumeMemory.memory.get(args[0])?.dynamicPropertyId;
                        value(...args);
                        if (dynamicPropertyId === undefined) return;
                        queueMicrotask(() => {
                            if (propertyName === "set") {
                                VolumeMemory.memoryIndex.add(dynamicPropertyId);
                                VolumeMemory.printDebug(`Added dynamic property ID "${dynamicPropertyId}"`);
                            } else {
                                VolumeMemory.memoryIndex.delete(dynamicPropertyId);
                                world.setDynamicProperty(dynamicPropertyId, undefined);
                                VolumeMemory.printDebug(`Deleted dynamic property ID "${dynamicPropertyId}"`);
                            }
                        });
                    }
                }
                return value;
            }
        });
    }

    private static createIdentifier(): string {
        if (this.currentIdentifier === undefined) this.currentIdentifier = world.getDynamicProperty(this.NONCE_DYNAMIC_PROPERTY_ID) as number | undefined;
        if (this.currentIdentifier === undefined) this.currentIdentifier = 0;
        else this.currentIdentifier++;
        world.setDynamicProperty(this.NONCE_DYNAMIC_PROPERTY_ID, this.currentIdentifier);
        return this.currentIdentifier.toString();
    }

    private static getStructureId(identifier: string): string {
        return `${PACK_ID}:${this.CLASS_NAME}_${identifier}`;
    }

    private static getDynamicPropertyId(identifier: string) {
        return `${this.CLASS_NAME}_${identifier}`;
    }

    private static storeVolumeState(volumeState: VolumeState) {
        const volumeStateString = JSON.stringify(volumeState);
        world.setDynamicProperty(volumeState.dynamicPropertyId, volumeStateString);
        this.printDebug(`Storing VolumeState for ID "${volumeState.id}"`);
    }

    private static retrieveVolumeState(dynamicPropertyId: string) {
        const volumeStateString = world.getDynamicProperty(dynamicPropertyId) as string | undefined;
        if (volumeStateString === undefined) {
            this.printDebug(`Could not access VolumeState, dynamic property "${dynamicPropertyId}" is undefined`);
            return;
        }
        let volumeState: unknown = JSON.parse(volumeStateString) as unknown;
        const isValid = SchemaVolumeState.check(volumeState);
        if (!isValid) {
            this.printDebug(`§cVolumeState from dynamic property "${dynamicPropertyId}" is invalid`);
            return;
        }
        const identifer = (volumeState as VolumeState).id;
        volumeState = this.createVolumeStateProxy(volumeState as VolumeState);
        this.memory.set(identifer, volumeState as VolumeState);
        this.printDebug(`§aRetrieved VolumeState from dynamic property "${dynamicPropertyId}"`);
    }

    public static saveVolumeState(dimension: Dimension, volume: BlockVolume, identifier?: string): string {
        if (identifier === undefined) identifier = this.createIdentifier();
        const dynamicPropertyId = this.getDynamicPropertyId(identifier);
        const structureId = this.getStructureId(identifier);
        this.saveStructure(dimension, volume, structureId);

        const volumeState: VolumeState = this.createVolumeStateProxy({
            id: identifier,
            dynamicPropertyId: dynamicPropertyId,
            structureId: structureId,
            dimensionId: dimension.id,
            location: volume.getMin(),
            size: volume.getSpan(),
            lastAccessedTick: system.currentTick
        });
        this.memory.set(identifier, volumeState);
        this.printDebug(`§aSaved volume state at: ` + Object.values(volume.getMin()).join(", "));
        return identifier;
    }

    private static createVolumeStateProxy(volumeState: VolumeState): VolumeState {
        return new Proxy(volumeState, {
            get(target: VolumeState, propertyName: keyof VolumeState) {
                volumeState.lastAccessedTick = system.currentTick;
                if (!VolumeMemory.storageScheduledFor.has(target)) {
                    VolumeMemory.storageScheduledFor.add(target);
                    queueMicrotask(() => {
                        VolumeMemory.storeVolumeState(target);
                        VolumeMemory.storageScheduledFor.delete(target);
                    });
                }
                return Reflect.get(target, propertyName);
            }
        })
    }

    public static restoreVolumeState(identifier: string): boolean {
        const volumeState = this.memory.get(identifier);
        if (volumeState === undefined) {
            this.printDebug(`§cCould not find cached VolumeState with identifier "${identifier}"`);
            return false;
        }
        // Get dimension
        try {
            var dimension = world.getDimension(volumeState.dimensionId);
        } catch {
            this.printDebug(`§cCould not find dimension with identifier "${volumeState.dimensionId}"`);
            return false;
        }
        // Get structure
        const structureManager = world.structureManager;
        const structure = structureManager.get(volumeState.structureId);
        if (structure === undefined) {
            this.printDebug(`§cCould not find structure with identifier "${volumeState.structureId}"`);
            return false;
        }
        const tempStructureId = `${volumeState.structureId}_temp`;
        structureManager.delete(tempStructureId);
        const structureClone = structure.saveAs(tempStructureId);
        // Save current state to allow redo/undo
        const location = volumeState.location;
        const volume = new BlockVolume(location, VectorMath.add(location, VectorMath.subtract(volumeState.size, 1)));
        this.saveVolumeState(dimension, volume, identifier);
        structureManager.place(structureClone, dimension, location);
        this.printDebug(`§aRestored volume state at: ` + Object.values(volume.getMin()).join(", "));
        return true;
    }

    public static clearSavedState(identifier: string): void {
        this.memory.delete(identifier);
    }

    public static saveStructure(dimension: Dimension, volume: BlockVolume, structureIdentifier: string): void {
        const structureManager = world.structureManager;
        if (structureManager.get(structureIdentifier) !== undefined) {
            // this.printDebug(`§eStructure with identifier "${structureIdentifier}" already exists`);
            structureManager.delete(structureIdentifier);
        }
        structureManager.createFromWorld(structureIdentifier, dimension, volume.getMin(), volume.getMax(), { saveMode: StructureSaveMode.World });
        this.printDebug(`Created structure with identifier "${structureIdentifier}"`);
    }
}