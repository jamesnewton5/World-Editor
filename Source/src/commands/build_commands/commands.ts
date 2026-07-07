import { CustomCommandParamType } from "@minecraft/server";
import { CommandPermissionLevel } from "../data";
import { BuildFunctions } from "./functions";
import { PACK_ID } from "../../data";

export const buildCommands = {
    wandCommand: {
        customCommand: {
            name: `${PACK_ID}:wand`,
            description: "Add the WorldEditor tool to your inventory.",
            permissionLevel: CommandPermissionLevel.Admin
        },
        callbackFunction: BuildFunctions.runWandCommand
    },
    copyCommand: {
        customCommand: {
            name: `${PACK_ID}:copy`,
            description: "Copy selection to the clipboard.",
            permissionLevel: CommandPermissionLevel.Admin
        },
        callbackFunction: BuildFunctions.runCopyCommand
    },
    pasteCommand: {
        customCommand: {
            name: `${PACK_ID}:paste`,
            description: "Paste selection from clipboard.",
            permissionLevel: CommandPermissionLevel.Admin
        },
        callbackFunction: BuildFunctions.runPasteCommand
    },
    historyCommand: {
        customCommand: {
            name: `${PACK_ID}:history`,
            description: "Open the edit history menu.",
            permissionLevel: CommandPermissionLevel.Admin
        },
        callbackFunction: BuildFunctions.runHistoryCommand
    },
    editHistoryCommand: {
        customCommand: {
            name: `${PACK_ID}:edit_history`,
            description: "Open the edit history menu.",
            permissionLevel: CommandPermissionLevel.Admin
        },
        callbackFunction: BuildFunctions.runHistoryCommand
    },
    clearEditHistoryCommand: {
        customCommand: {
            name: `${PACK_ID}:clear_edit_history`,
            description: "Clear your edit history.",
            permissionLevel: CommandPermissionLevel.Admin
        },
        callbackFunction: BuildFunctions.runClearEditHistoryCommand
    },
    undoCommand: {
        customCommand: {
            name: `${PACK_ID}:undo`,
            description: "Undo your last edit.",
            permissionLevel: CommandPermissionLevel.Admin
        },
        callbackFunction: BuildFunctions.runUndoCommand
    },
    redoCommand: {
        customCommand: {
            name: `${PACK_ID}:redo`,
            description: "Redo your last edit.",
            permissionLevel: CommandPermissionLevel.Admin
        },
        callbackFunction: BuildFunctions.runRedoCommand
    },
    pos1Command: {
        customCommand: {
            name: `${PACK_ID}:pos1`,
            description: "Set the first position in a selection.",
            permissionLevel: CommandPermissionLevel.Admin
        },
        callbackFunction: BuildFunctions.runPos1Command
    },
    pos2Command: {
        customCommand: {
            name: `${PACK_ID}:pos2`,
            description: "Set the second position in a selection.",
            permissionLevel: CommandPermissionLevel.Admin
        },
        callbackFunction: BuildFunctions.runPos2Command
    },
    deselectCommand: {
        customCommand: {
            name: `${PACK_ID}:deselect`,
            description: "Clear current selection.",
            permissionLevel: CommandPermissionLevel.Admin
        },
        callbackFunction: BuildFunctions.runDeselectCommand
    },
    setCommand: {
        customCommand: {
            name: `${PACK_ID}:set`,
            description: "Set blocks in a selection.",
            permissionLevel: CommandPermissionLevel.Admin,
            mandatoryParameters: [{ type: CustomCommandParamType.BlockType, name: "blockType" }]
        },
        callbackFunction: BuildFunctions.runSetCommand
    },
    replaceCommand: {
        customCommand: {
            name: `${PACK_ID}:replace`,
            description: "Replace blocks in a selection.",
            permissionLevel: CommandPermissionLevel.Admin,
            mandatoryParameters: [{ type: CustomCommandParamType.BlockType, name: "blockType" }, { type: CustomCommandParamType.BlockType, name: "blockType" }]
        },
        callbackFunction: BuildFunctions.runReplaceCommand
    },
    // maskCommand: {
    //     customCommand: {
    //         name: `${PACK_ID}:mask`,
    //         description: "Select a block to use as a mask for operations.",
    //         permissionLevel: CommandPermissionLevel.Admin,
    //         optionalParameters: [{ type: CustomCommandParamType.BlockType, name: "blockType" }]
    //     },
    //     callbackFunction: BuildFunctions.runMaskCommand
    // }
}