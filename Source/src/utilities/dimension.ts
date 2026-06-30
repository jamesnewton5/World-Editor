import { Dimension, Direction, Vector3 } from "@minecraft/server";

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

    let localHitLocation = raycastResult.faceLocation;
    switch (raycastResult.face) {
        case Direction.East:
            localHitLocation.x += 1;
            break;
        case Direction.Up:
            localHitLocation.y = +1;
            break;
        case Direction.South:
            localHitLocation.z = +1;
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