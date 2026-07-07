import { BlockVolume, EntityComponentTypes, ItemStack, RawMessage, system } from "@minecraft/server";
import { CustomEntity, CustomPlayer, EditInfo } from "./types";
import { VolumeMemory } from "./volume_memory";
import { Debug } from "./debug";
import { AddonMessage, MessageType } from "./message_formatting";
import { EntityUtilities } from "./utilities/entity";

export class EditHistory extends Debug {
    private static MAX_EDIT_HISTORY_ITEMS = 18;

    public static undo(customPlayer: CustomPlayer) {
        const editInfo = this.getEditInfoFromUndoOrRedo(customPlayer, "undo");
        if (editInfo === undefined) return;
        this.toggleEdit(customPlayer, editInfo);
        AddonMessage.send(customPlayer, `Undo successful`, MessageType.Info);
    }

    public static redo(customPlayer: CustomPlayer) {
        const editInfo = this.getEditInfoFromUndoOrRedo(customPlayer, "redo");
        if (editInfo === undefined) return;
        this.toggleEdit(customPlayer, editInfo);
        AddonMessage.send(customPlayer, `Redo successful`, MessageType.Info);
    }

    private static getEditInfoFromUndoOrRedo(customPlayer: CustomPlayer, action: "undo" | "redo"): EditInfo | undefined {
        const editHistoryArray = Array.from(customPlayer._persistentData.editHistory);
        let i = action === "undo" ? editHistoryArray.length - 1 : 0;
        let conditionExpression = action === "undo" ? () => i >= 0 : () => i < editHistoryArray.length;
        let endExpression = action === "undo" ? () => i-- : () => i++;
        const targetBoolean = action === "undo" ? false : true;

        let selectedEditInfo: EditInfo | undefined = undefined;
        for (i; conditionExpression(); endExpression()) {
            const editInfo = editHistoryArray[i];
            if (editInfo.reversed !== targetBoolean) continue;
            selectedEditInfo = editInfo;
            break;
        }
        if (selectedEditInfo === undefined) AddonMessage.send(customPlayer, `Nothing to ${action}`, MessageType.Error);
        return selectedEditInfo;
    }

    public static add(customPlayer: CustomPlayer, volume: BlockVolume, actionName: string, blockTypeId?: string) {
        const title = this.getTitle(actionName, volume, blockTypeId);
        const description = this.getDescription(volume);
        const editInfo: EditInfo = {
            reversed: false,
            title: title,
            description: description,
            volumeStateId: VolumeMemory.saveVolumeState(customPlayer.dimension, volume)
        };
        customPlayer._persistentData.editHistory.add(editInfo);
        this.removeOverflow(customPlayer);
        customPlayer._savePersistentData();
    }

    private static getTitle(actionName: string, volume: BlockVolume, blockTypeId?: string): string {
        if (blockTypeId !== undefined) {
            let blockName = blockTypeId.split(":").length > 0 ? blockTypeId.split(":")[1] : blockTypeId;
            blockName = blockName[0].toUpperCase() + blockName.slice(1);
            blockName = blockName.replaceAll("_", " ");
            const preposition = actionName === "Set" ? "to" : "with";
            // const title = `§r${actionName} ${volume.getCapacity()} blocks ${preposition} ${blockName}`;
            const title = `§r§f${actionName} ${preposition} ${blockName}`;
            return title;
        } else {
            if (actionName === "Pasted") {
                return `Pasted at ${Object.values(volume.getMin()).join(", ")}`;
            } else {
                return "unknown";
            }
        }
    }

    private static getDescription(volume: BlockVolume) {
        const description = `§7From (${Object.values(volume.getMin()).join(", ")})\n§7To (${Object.values(volume.getMax()).join(", ")})`;
        return description;
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
        if (editHistory.size <= this.MAX_EDIT_HISTORY_ITEMS) return;
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
        AddonMessage.send(customPlayer, "Edit history cleared", MessageType.Info);
    }

    public static editHistoryMenu(customPlayer: CustomPlayer, customEntity: CustomEntity) {
        const container = EntityUtilities.getContainer(customEntity);
        if (container === undefined) return;
        const tempData = customPlayer._tempData;
        tempData.hasContainerOpen = true;

        const editHistoryArray = Array.from(customPlayer._persistentData.editHistory);

        // TODO: Improve this
        // Remove any blocks added to player inventory
        for (let i = 0; i < container.size; i++) {
            if (i >= editHistoryArray.length) break;
            const editInfo = editHistoryArray[i];
            const itemTypeId = !editInfo.reversed ? "minecraft:lime_concrete" : "minecraft:orange_concrete";
            const itemStack = new ItemStack(itemTypeId);
            itemStack.nameTag = editInfo.title;
            itemStack.setLore(editInfo.description.split("\n"));
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

                const editsToToggle = [];
                for (let j = i + 1; j < editHistoryArray.length; j++) {
                    const editInfo = editHistoryArray[j];
                    if (editInfo.reversed) continue; // Undo everything after
                    editsToToggle.unshift(editInfo);
                }

                for (const editInfo of editsToToggle) {
                    this.toggleEdit(customPlayer, editInfo);
                }

                this.toggleEdit(customPlayer, editInfo);

                for (const editInfo of editsToToggle.reverse()) {
                    this.toggleEdit(customPlayer, editInfo);
                }


                const itemTypeId = !editInfo.reversed ? "minecraft:lime_concrete" : "minecraft:orange_concrete";
                itemStack = new ItemStack(itemTypeId);
                itemStack.nameTag = editInfo.title;
                itemStack.setLore(editInfo.description.split("\n"));
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