import { system } from "@minecraft/server";
import { PACK_NAME } from "./data";
import { VolumeMemory } from "./volume_memory";

// MARK: Config
// ----------------------------------------------------------------
const DEBUG_SETTINGS: Record<string, boolean> = {
    main: false,
    PlayerCache: false,
    AddonMessage: false,
    VolumeMemory: true
};



// MARK: Debug
// ----------------------------------------------------------------
if (DEBUG_SETTINGS.main) console.warn(`\n§aStarting ${PACK_NAME} add-on`); // Creates a divider between the old console messages and the new ones for easier debugging
export class Debug {
    public static printDebug = function (this: any, message: string): void { // [i] First parameter "this" will be ignored by TS compiler
        const className = this.name;
        if (!DEBUG_SETTINGS[className]) return;
        console.info(`§r§7 ${system.currentTick.toString()}§f [${PACK_NAME}] ${className} - ${message}`);
    }
}