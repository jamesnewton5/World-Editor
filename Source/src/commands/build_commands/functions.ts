import { BlockType, BlockVolume, CustomCommandOrigin, ItemStack, Player, system, world } from "@minecraft/server";
import { BuildTools } from "../../build";
import { AddonMessage, MessageType } from "../../message_formatting";
import { PlayerCache } from "../../player/player_cache";
import { EntityUtilities } from "../../utilities/entity";
import { TOOL_TYPE_ID } from "../../data";

function checkIfPlayer(origin: CustomCommandOrigin) {
    const sourceEntity = origin.sourceEntity;
    if (sourceEntity === undefined) return null;
    if (sourceEntity.typeId !== "minecraft:player") return null;
    if (!sourceEntity.isValid) return null;
    return sourceEntity;
}

export class BuildFunctions {
    runWandCommand(origin: CustomCommandOrigin) {
        const player = checkIfPlayer(origin) as Player | null;
        if (!player) return;
        system.run(() => {
            const toolItemStack = new ItemStack(TOOL_TYPE_ID);
            const mainHand = EntityUtilities.getHeldItem(player);
            const slotNumber = EntityUtilities.getItemSlot(player, toolItemStack);
            if (mainHand === undefined) {
                if (slotNumber !== undefined) {
                    EntityUtilities.swapSlots(player, slotNumber, player.selectedSlotIndex);
                } else {
                    EntityUtilities.setHeldItem(player, TOOL_TYPE_ID);
                }
            } else if (mainHand.typeId !== TOOL_TYPE_ID && slotNumber === undefined) {
                player.addItem(toolItemStack);
            }
        });
    }

    runSetCommand(origin: CustomCommandOrigin, blockType: BlockType) {
        const player = checkIfPlayer(origin) as Player | null;
        if (!player) return;
        const customPlayer = PlayerCache.get(player);
        if (customPlayer === undefined) return;
        BuildTools.set(customPlayer, blockType);
    }

    runReplaceCommand(origin: CustomCommandOrigin, blockType: BlockType, replacementBlockType: BlockType) {
        const player = checkIfPlayer(origin) as Player | null;
        if (!player) return;
        const customPlayer = PlayerCache.get(player);
        if (customPlayer === undefined) return;
        BuildTools.replace(customPlayer, blockType, replacementBlockType);
    }

    runMaskCommand(origin: CustomCommandOrigin, blockType: BlockType | undefined) {
        const player = checkIfPlayer(origin) as Player | null;
        if (!player) return;
        const customPlayer = PlayerCache.get(player);
        if (customPlayer === undefined) return;
        const blockTypeId = blockType?.id;
        customPlayer._tempData.mask = blockTypeId;
        system.run(() => {
            if (blockTypeId === undefined) {
                AddonMessage.send(customPlayer, "Mask reset", MessageType.Info);
            } else {
                AddonMessage.send(customPlayer, `Mask set to ${blockTypeId}`, MessageType.Info);
            }
        });
    }
}