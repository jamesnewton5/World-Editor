import { BlockType, BlockVolume, CustomCommandOrigin, ItemStack, Player, system, world, CustomCommandResult, CustomCommandStatus, Entity, PlatformType, InputButton, ButtonState } from "@minecraft/server";
import { BuildTools } from "../../build";
import { AddonMessage, MessageType } from "../../message_formatting";
import { PlayerCache } from "../../player/player_cache";
import { EntityUtilities } from "../../utilities/entity";
import { PACK_ID, TOOL_TYPE_ID } from "../../data";
import { CustomPlayer } from "../../types";
import { VectorMath } from "../../vector_math";
import { MinecraftEffectTypes } from "@minecraft/vanilla-data";
import { EditHistory } from "../../edit_history";

function getCustomPlayer(origin: CustomCommandOrigin) {
    const sourceEntity = origin.sourceEntity;
    if (sourceEntity === undefined) return undefined;
    if (sourceEntity.typeId !== "minecraft:player") return undefined;
    if (!sourceEntity.isValid) return undefined;
    const customPlayer = PlayerCache.get(sourceEntity as Player);
    return customPlayer;
}

const result: CustomCommandResult = {
    status: CustomCommandStatus.Success
};

const methodProxyHandler = {
    apply(target: any, thisArg: any, args: Array<any>) {
        const origin = args[0];
        const customPlayer = getCustomPlayer(origin);
        if (customPlayer === undefined) return;
        args[0] = customPlayer;
        system.run(() => {
            Reflect.apply(target, thisArg, args);
        });
        return result;
    }
};

export const BuildFunctions = new Proxy({
    /*
    High Priority::
        Change build functions to use more structures
        /cui (client-user-interface, will show selection)
        /walls
        /faces
        /move
        /copy
        /cut
        /paste
        /undo
        /redo

    Low Priority:
        Handle multiple dimensions

    DONE:
        /deselect
        /pos1
        /pos2
    */

    runWandCommand: function (customPlayer: CustomPlayer) {
        const toolItemStack = new ItemStack(TOOL_TYPE_ID);
        const mainHand = EntityUtilities.getHeldItem(customPlayer);
        const slotNumber = EntityUtilities.getItemSlot(customPlayer, toolItemStack);
        if (mainHand === undefined) {
            if (slotNumber !== undefined) {
                EntityUtilities.swapSlots(customPlayer, slotNumber, customPlayer.selectedSlotIndex);
            } else {
                EntityUtilities.setHeldItem(customPlayer, TOOL_TYPE_ID);
            }
        } else if (mainHand.typeId !== TOOL_TYPE_ID && slotNumber === undefined) {
            customPlayer.addItem(toolItemStack);
        }
    },
    runHistoryCommand: function (customPlayer: CustomPlayer) {
        const dimension = customPlayer.dimension;
        let containerEntity: Entity | undefined;
        const tempData = customPlayer._tempData;
        tempData.hasContainerOpen = false;
        if (tempData.assignedContainerEntityId !== undefined) {
            const previousContainerEntity = world.getEntity(tempData.assignedContainerEntityId);
            if (previousContainerEntity !== undefined) {
                try {
                    previousContainerEntity.remove();
                } catch { }
            }
        }

        try {
            containerEntity = dimension.spawnEntity(`${PACK_ID}:container`, customPlayer.getHeadLocation());
        } catch {
            AddonMessage.send(customPlayer, "Something went wrong", MessageType.Error);
            return;
        }
        containerEntity.addEffect(MinecraftEffectTypes.Invisibility, 20000000, { amplifier: 0, showParticles: false });
        const interactInputName = customPlayer.clientSystemInfo.platformType === PlatformType.Desktop ? "Right-click" : "Interact"
        AddonMessage.send(customPlayer, `${interactInputName} to open the history menu`, MessageType.Info);
        containerEntity.nameTag = "Edit History";

        const containerId = containerEntity.id;
        tempData.assignedContainerEntityId = containerId;

        const intervalId = system.runInterval(() => {
            if (!customPlayer.isValid ||
                !containerEntity.isValid
            ) {
                tempData.hasContainerOpen = false;
                if (containerEntity.isValid) try { containerEntity.remove(); } catch { }
                system.clearRun(intervalId);
                return;
            }

            containerEntity.teleport(customPlayer.getHeadLocation());

            // Close container
            if (
                customPlayer.dimension.id !== dimension.id ||
                customPlayer.inputInfo.getButtonState(InputButton.Jump) === ButtonState.Pressed ||
                customPlayer.inputInfo.getButtonState(InputButton.Sneak) === ButtonState.Pressed ||
                VectorMath.magnitude(customPlayer.inputInfo.getMovementVector()) > 1e-6
            ) {
                try { containerEntity.remove(); } catch { }
                system.clearRun(intervalId);
                if (!tempData.hasContainerOpen) AddonMessage.send(customPlayer, "Cancelled", MessageType.Warning);
                else tempData.hasContainerOpen = false;
                return;
            }
        });
    },
    runClearEditHistoryCommand: function (customPlayer: CustomPlayer) {
        EditHistory.clearEditHistory(customPlayer);
    },
    runUndoCommand: function (customPlayer: CustomPlayer) {
        EditHistory.undo(customPlayer);
    },
    runRedoCommand: function (customPlayer: CustomPlayer) {
        EditHistory.redo(customPlayer);
    },
    runPos1Command: function (customPlayer: CustomPlayer) {
        BuildTools.setPosition(customPlayer, "position1", customPlayer.location);
    },
    runPos2Command: function (customPlayer: CustomPlayer) {
        BuildTools.setPosition(customPlayer, "position2", customPlayer.location);
    },
    runDeselectCommand: function (customPlayer: CustomPlayer) {
        BuildTools.setPosition(customPlayer, "position1", undefined);
        BuildTools.setPosition(customPlayer, "position2", undefined);
        AddonMessage.send(customPlayer, `Selection cleared`, MessageType.Info);
    },
    runSetCommand: function (customPlayer: CustomPlayer, blockType: BlockType) {
        BuildTools.set(customPlayer, blockType);
    },
    runReplaceCommand: function (customPlayer: CustomPlayer, blockType: BlockType, replacementBlockType: BlockType) {
        BuildTools.replace(customPlayer, blockType, replacementBlockType);
    },
    runMaskCommand: function (customPlayer: CustomPlayer, blockType: BlockType | undefined) {
        const blockTypeId = blockType?.id;
        customPlayer._tempData.mask = blockTypeId;
        if (blockTypeId === undefined) {
            AddonMessage.send(customPlayer, "Mask reset", MessageType.Info);
        } else {
            AddonMessage.send(customPlayer, `Mask set to ${blockTypeId}`, MessageType.Info);
        }
    }
}, {
    get(target, propertyName, receiver) {
        const value = Reflect.get(target, propertyName, receiver);
        if (typeof value === 'function') {
            return new Proxy(value, methodProxyHandler);
        }
        return value;
    }
});