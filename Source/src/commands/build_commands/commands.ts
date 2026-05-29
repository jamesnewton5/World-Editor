import { CustomCommandParamType } from "@minecraft/server";
import { CommandPermissionLevel } from "../data";
import { BuildFunctions } from "./functions";
import { PACK_ID } from "../../data";

export const buildCommands = {
    setCommand: {
        customCommand: {
            name: `${PACK_ID}:set`,
            description: "Set blocks in a selection.",
            permissionLevel: CommandPermissionLevel.Admin,
            mandatoryParameters: [{ type: CustomCommandParamType.BlockType, name: "blockType" }]
        },
        callbackFunction: BuildFunctions.prototype.runSetCommand
    },
    replaceCommand: {
        customCommand: {
            name: `${PACK_ID}:replace`,
            description: "Replace blocks in a selection.",
            permissionLevel: CommandPermissionLevel.Admin,
            mandatoryParameters: [{ type: CustomCommandParamType.BlockType, name: "blockType" }, { type: CustomCommandParamType.BlockType, name: "blockType" }]
        },
        callbackFunction: BuildFunctions.prototype.runReplaceCommand
    },
    maskCommand: {
        customCommand: {
            name: `${PACK_ID}:mask`,
            description: "Select a block to use as a mask for operations.",
            permissionLevel: CommandPermissionLevel.Admin,
            optionalParameters: [{ type: CustomCommandParamType.BlockType, name: "blockType" }]
        },
        callbackFunction: BuildFunctions.prototype.runMaskCommand
    }
}