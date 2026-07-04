import { Dimension, MolangVariableMap, Vector3 } from "@minecraft/server";
import { VectorMath } from "../vector_math";
import { CustomPlayer } from "../types";

export class VFX {
    public static highlightBlock(customPlayer: CustomPlayer, location: Vector3) {
        if (!customPlayer.dimension.isChunkLoaded(location)) return;
        const blockCenter = VectorMath.add(location, 0.5);
        for (const direction of [
            { x: 1, y: 0, z: 0 },
            { x: -1, y: 0, z: 0 },
            { x: 0, y: 0, z: 1 },
            { x: 0, y: 0, z: -1 },
            { x: 0, y: -1, z: 0 },
            { x: 0, y: 1, z: 0 }
        ]) {
            const molangVariableMap = new MolangVariableMap();
            molangVariableMap.setVector3("variable.direction", direction);
            customPlayer.spawnParticle("world-editor:block_highlight", blockCenter, molangVariableMap);
        }
    }
}