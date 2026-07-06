import { BlockVolume, EntityComponentTypes, ItemStack, system } from "@minecraft/server";
import { CustomEntity, CustomPlayer, EditInfo } from "./types";
import { VolumeMemory } from "./volume_memory";
import { Debug } from "./debug";
import { AddonMessage, MessageType } from "./message_formatting";
import { EntityUtilities } from "./utilities/entity";

export class EditHistory extends Debug {
    private static MAX_EDIT_HISTORY_ITEMS = 27;

    public static undo(customPlayer: CustomPlayer) {
        const editHistoryArray = Array.from(customPlayer._persistentData.editHistory);
        let mostRecentEditInfo: EditInfo | undefined = undefined;
        for (let i = editHistoryArray.length - 1; i >= 0; i--) {
            const editInfo = editHistoryArray[i];
            if (editInfo.reversed) continue;
            mostRecentEditInfo = editInfo;
            break;
        }
        if (mostRecentEditInfo === undefined) {
            AddonMessage.send(customPlayer, "Nothing to undo", MessageType.Error);
            return;
        }
        this.toggleEdit(customPlayer, mostRecentEditInfo);
    }

    public static redo(customPlayer: CustomPlayer) {
        const editHistoryArray = Array.from(customPlayer._persistentData.editHistory);
        let mostRecentEditInfo: EditInfo | undefined = undefined;
        for (let i = 0; i < editHistoryArray.length; i++) {
            const editInfo = editHistoryArray[i];
            if (!editInfo.reversed) continue;
            mostRecentEditInfo = editInfo;
            break;
        }
        if (mostRecentEditInfo === undefined) {
            AddonMessage.send(customPlayer, "Nothing to redo", MessageType.Error);
            return;
        }
        this.toggleEdit(customPlayer, mostRecentEditInfo);
    }

    public static add(customPlayer: CustomPlayer, volume: BlockVolume, title: string) {
        const editInfo: EditInfo = {
            reversed: false,
            title: title,
            description: "guh?",
            volumeStateId: VolumeMemory.saveVolumeState(customPlayer.dimension, volume)
        };
        customPlayer._persistentData.editHistory.add(editInfo);
        this.removeOverflow(customPlayer);
        customPlayer._savePersistentData();
    }

    public static remove(customPlayer: CustomPlayer, editInfoOrVolumeStateId: EditInfo | string) {
        const isVolumeStateId = (typeof editInfoOrVolumeStateId === "string");
        const volumeStateId = isVolumeStateId ? editInfoOrVolumeStateId as string : (editInfoOrVolumeStateId as EditInfo).volumeStateId;
        VolumeMemory.clearSavedState(volumeStateId);

        const editHistory = customPlayer._persistentData.editHistory;
        if (!isVolumeStateId) {
            editHistory.delete(editInfoOrVolumeStateId as EditInfo);
            customPlayer._savePersistentData();
        } else {
            for (const editInfo of editHistory) {
                if (editInfo.volumeStateId !== editInfoOrVolumeStateId) continue;
                editHistory.delete(editInfo);
                customPlayer._savePersistentData();
                return;
            }
        }
    }

    private static removeOverflow(customPlayer: CustomPlayer) {
        const editHistory = customPlayer._persistentData.editHistory;
        if (editHistory.size > this.MAX_EDIT_HISTORY_ITEMS) return;
        const editHistoryArray = Array.from(editHistory);
        for (let i = 0; i < editHistoryArray.length - this.MAX_EDIT_HISTORY_ITEMS; i++) {
            const editInfo = editHistoryArray[i];
            this.remove(customPlayer, editInfo);
        }
    }

    public static toggleEdit(customPlayer: CustomPlayer, editInfo: EditInfo) {
        VolumeMemory.restoreVolumeState(editInfo.volumeStateId);
        editInfo.reversed = !editInfo.reversed;
        customPlayer._savePersistentData();
    }

    public static validateEditHistory(customPlayer: CustomPlayer) {
        const editHistory = customPlayer._persistentData.editHistory;
        for (const editInfo of editHistory) {
            if (VolumeMemory.has(editInfo.volumeStateId)) continue;
            this.remove(customPlayer, editInfo);
        }
    }

    public static clearEditHistory(customPlayer: CustomPlayer) {
        for (const editInfo of customPlayer._persistentData.editHistory) {
            this.remove(customPlayer, editInfo);
        }
    }

    public static editHistoryMenu(customPlayer: CustomPlayer, customEntity: CustomEntity) {
        const container = EntityUtilities.getContainer(customEntity);
        if (container === undefined) return;
        const tempData = customPlayer._tempData;
        tempData.hasContainerOpen = true;

        const editHistoryArray = Array.from(customPlayer._persistentData.editHistory);

        for (let i = 0; i < container.size; i++) {
            if (i >= editHistoryArray.length) break;
            const editInfo = editHistoryArray[i];
            const itemTypeId = !editInfo.reversed ? "minecraft:lime_concrete" : "minecraft:orange_concrete";
            const itemStack = new ItemStack(itemTypeId);
            itemStack.nameTag = editInfo.title;
            container.setItem(i, itemStack);
        }


        const slotsFilled = container.size - container.emptySlotsCount;
        const intervalId = system.runInterval(() => {
            if (!tempData.hasContainerOpen || !customEntity.isValid || !customPlayer.isValid) {
                system.clearRun(intervalId);
                return;
            }
            for (let i = 0; i < slotsFilled; i++) {
                let itemStack = container.getItem(i);
                if (itemStack !== undefined) continue;
                const editInfo = (editHistoryArray[i] as EditInfo);
                this.toggleEdit(customPlayer, editInfo);
                const itemTypeId = !editInfo.reversed ? "minecraft:lime_concrete" : "minecraft:orange_concrete";
                itemStack = new ItemStack(itemTypeId);
                itemStack.nameTag = editInfo.title;
                container.setItem(i, itemStack);
                //  system.clearRun(intervalId);
                const cursorInventory = customPlayer.getComponent(EntityComponentTypes.CursorInventory);
                if (cursorInventory !== undefined) {
                    cursorInventory.clear();
                }
                // customEntity.remove();
                return;
            }
        });
    }
}