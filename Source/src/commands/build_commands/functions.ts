import { BlockType, BlockVolume, CustomCommandOrigin, Player, system, world } from "@minecraft/server";
import { BuildTools } from "../../build";
import { AddonMessage, MessageType } from "../../message_formatting";
import { PlayerCache } from "../../player/player_cache";

function checkIfPlayer(origin: any) {
    const sourceEntity = origin.sourceEntity;
    if (sourceEntity === undefined) return null;
    if (sourceEntity.typeId !== "minecraft:player") return null;
    if (!sourceEntity.isValid) return null;
    return sourceEntity;
}

export class BuildFunctions {
    runSetCommand(origin: CustomCommandOrigin, blockType: BlockType) {
        const player = checkIfPlayer(origin);
        if (!player) return;
        const customPlayer = PlayerCache.get(player);
        if (customPlayer === undefined) return;
        BuildTools.set(customPlayer, blockType);
    }

    runReplaceCommand(origin: CustomCommandOrigin, blockType: BlockType, replacementBlockType: BlockType) {
        const player = checkIfPlayer(origin);
        if (!player) return;
        const customPlayer = PlayerCache.get(player);
        if (customPlayer === undefined) return;
        BuildTools.replace(customPlayer, blockType, replacementBlockType);
    }

    runGmaskCommand(origin: CustomCommandOrigin, blockType: BlockType | undefined) {
        const player = checkIfPlayer(origin);
        if (!player) return;
        const customPlayer = PlayerCache.get(player);
        if (customPlayer === undefined) return;
        const blockTypeId = blockType?.id;
        customPlayer._tempData.gmask = blockTypeId;
        system.run(() => {
            if (blockTypeId === undefined) {
                AddonMessage.send(customPlayer, "Gmask removed", MessageType.Info);
            } else {
                AddonMessage.send(customPlayer, `Gmask set to ${blockTypeId}`, MessageType.Info);
            }
        });
    }
}