import { BlockVolume, Dimension, Vector3, world } from "@minecraft/server";
import { Schema } from "./utilities/schema_validator";

type VolumeState = {
    id: string;
    dimensionId: string;
    location: Vector3;
    size: Vector3;
    structureId: string;
};

const SchemaVector3 = new Schema({
    properties: {
        allowPartial: false,
        allowExtensions: false
    },
    types: {
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
    properties: {
        allowPartial: false,
        allowExtensions: false
    },
    types: {
        id: {
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
        structureId: {
            require: true,
            propertyType: "string"
        }
    }
});



export class VolumeMemory {
    private static memory: Map<string, VolumeState> = new Map();

    private static storeVolumeState(volumeState: VolumeState) {

        const volumeStateString = JSON.stringify(volumeState);
        const dynamicPropertyId = `VolumeMemory_${volumeState.id}`;
        world.setDynamicProperty(dynamicPropertyId, volumeStateString);
    }

    private static retrieveVolumeState(dynamicPropertyId: string): VolumeState | undefined {
        const volumeStateString = world.getDynamicProperty(dynamicPropertyId) as string | undefined;
        if (volumeStateString === undefined) return undefined;
        const volumeState = JSON.stringify(volumeStateString) as any;


        world.setDynamicProperty(dynamicPropertyId, volumeStateString);
    }

    public static getIdentifier() {

    }

    // When making an edit, store volume state of the volume, make the edit, then save the state
    public static saveVolumeState(dimension: Dimension, volume: BlockVolume): string {
        /*
        Get volume
        Save as structure
        Create identifier
        Store info under identifier: dimensionId, structureName, location
        */


        const identifier = "placeholder";
        return identifier;
    }

    public static restoreVolumeState(identifier: string): boolean {
        return true;
    }

    public static clearSavedState(identifier: string): void {

    }

    public static saveStructure(dimension: Dimension, volume: BlockVolume): string {
        const identifier = "placeholder";
        return identifier;
    }
}