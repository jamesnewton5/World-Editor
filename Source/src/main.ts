// API MODULES
import { BlockVolume, CustomCommandOrigin, StartupEvent, system, world } from "@minecraft/server";

// MARK: Debug
// ----------------------------------------------------------------
type DebugSettings = {
    enabled: boolean;
    prefixLabel: string;
    prefix: string | undefined;
};
export const debugSettingsRecords: Record<string, DebugSettings> = {
    main: {
        enabled: true,
        prefixLabel: " Main: ",
        prefix: undefined
    }
};
// Creates a divider between the old console messages and the new ones for easier debugging
if (debugSettingsRecords.main.enabled) console.warn("§aStarting World Editor add-on");
// Runs once to create an array of enabled modules to iterate through
const enabledDebugModules: Array<DebugSettings> = [];
for (let debugSettings of Object.values(debugSettingsRecords)) {
    if (debugSettings.enabled) enabledDebugModules.push(debugSettings);
}
// Update the prefix of enabled modules to include current tick
system.runInterval(() => {
    const currentTick = system.currentTick;
    for (let debugSettings of enabledDebugModules) {
        debugSettings.prefix = String(currentTick) + debugSettings.prefixLabel;
    }
}, 1);



// MARK: Initialise
// ----------------------------------------------------------------
export const PACK_ID = "world_editor:";
import { customCommandGroups } from "./commands/custom_command_groups";
system.beforeEvents.startup.subscribe((event: StartupEvent) => {
    // Register custom commands
    const customCommandRegistry = event.customCommandRegistry;
    for (let commandGroup of customCommandGroups) {
        for (let commandObject of Object.values(commandGroup)) {
            customCommandRegistry.registerCommand(commandObject.customCommand, commandObject.callbackFunction as (...args: any[]) => any);
        }
    }
});

import { PlayerCache } from "./player/player_cache";
import { BuildTools } from "./build";
world.afterEvents.worldLoad.subscribe(() => {
    PlayerCache.initialise();
    BuildTools.initialise();
});