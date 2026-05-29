import { system } from "@minecraft/server";
import { PACK_NAME } from "./data";

// MARK: Config
// ----------------------------------------------------------------
export const debugSettingsRecords: Record<string, boolean> = {
    main: true,
    PlayerCache: true,
    AddonMessage: true
};



// MARK: Debug
// ----------------------------------------------------------------
if (debugSettingsRecords.main) console.warn(`\n§aStarting ${PACK_NAME} add-on`); // Creates a divider between the old console messages and the new ones for easier debugging
export class Debug {
    public static printDebug = function (this: any, message: string): void { // [i] First parameter "this" will be ignored by TS compiler
        const name = this.name;
        if (!debugSettingsRecords[name]) return;
        console.info(`§r§7 ${system.currentTick.toString()}§f [${PACK_NAME}] ${name[0] === "_" ? name.replace("_", "") : name} - ${message}`);
    }
}