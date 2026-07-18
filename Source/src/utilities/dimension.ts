import { BlockVolume, Dimension, Direction, Vector3 } from "@minecraft/server";

/**
 * Manually excludes structure voids, as they are not counted as passable blocks which is bad.
 * @param dimension 
 * @param rayOrigin 
 * @param rayDirection 
 * @param maxDistance 
 * @returns Location or undefined
 */
export function getSolidBlockHitLocationFromRay(dimension: Dimension, rayOrigin: Vector3, rayDirection: Vector3, maxDistance?: number | undefined): Vector3 | undefined {
    const raycastResult = dimension.getBlockFromRay(rayOrigin, rayDirection, { maxDistance: maxDistance, includePassableBlocks: false, excludeTypes: ["minecraft:structure_void"] });
    if (raycastResult === undefined) return undefined;
    const block = raycastResult.block;
    const blockLocation = block.location;

    const localHitLocation = raycastResult.faceLocation;

    switch (raycastResult.face) {
        case Direction.East:
            if (localHitLocation.x === 0) localHitLocation.x = 1;
            break;
        case Direction.Up:
            if (localHitLocation.y === 0) localHitLocation.y = 1;
            break;
        case Direction.South:
            if (localHitLocation.z === 0) localHitLocation.z = 1;
            break;
        default:
            break;
    }

    const worldHitLocation = {
        x: blockLocation.x + localHitLocation.x,
        y: blockLocation.y + localHitLocation.y,
        z: blockLocation.z + localHitLocation.z
    };
    return worldHitLocation;
}

/**
 * Manually excludes structure voids, as they are not counted as passable blocks which is bad.
 * @param dimension 
 * @param rayOrigin 
 * @param rayDirection 
 * @param maxDistance 
 * @returns Location or undefined
 */
export function getBlockLocationFromRay(dimension: Dimension, rayOrigin: Vector3, rayDirection: Vector3, maxDistance?: number | undefined): Vector3 | undefined {
    const raycastResult = dimension.getBlockFromRay(rayOrigin, rayDirection, { maxDistance: maxDistance, includePassableBlocks: true, excludeTypes: ["minecraft:structure_void"] });
    if (raycastResult === undefined) return undefined;
    const block = raycastResult.block;
    const blockLocation = block.location;
    return blockLocation;
}

export class DimensionUtilities {
    public static forEachBlockOfVolume(volume: BlockVolume, callback: (location: Vector3) => void) {
        const volumeMin = volume.getMin();
        const volumeMax = volume.getMax();
        const currentLocation = { x: 0, y: 0, z: 0 };
        for (let x = volumeMin.x; x <= volumeMax.x; x++) {
            currentLocation.x = x;
            for (let y = volumeMin.y; y <= volumeMax.y; y++) {
                currentLocation.y = y;
                for (let z = volumeMin.z; z <= volumeMax.z; z++) {
                    currentLocation.z = z;
                    callback(currentLocation);
                }
            }
        }
    }
}