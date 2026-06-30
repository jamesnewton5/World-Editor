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
    maskCommand: {
        customCommand: {
            name: `${PACK_ID}:mask`,
            description: "Select a block to use as a mask for operations.",
            permissionLevel: CommandPermissionLevel.Admin,
            optionalParameters: [{ type: CustomCommandParamType.BlockType, name: "blockType" }]
        },
        callbackFunction: BuildFunctions.runMaskCommand
    }
}