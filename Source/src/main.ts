// API MODULES
import { StartupEvent, system, world } from "@minecraft/server";

// MARK: Initialise
// ----------------------------------------------------------------
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
import { CustomPlayer, CustomPlayerCache } from "./types";
world.afterEvents.worldLoad.subscribe(() => {
    PlayerCache.initialise();
    BuildTools.initialise();

    // Register a callback to occur each tick using this method to avoid circular dependency issues:
    PlayerCache.registerPlayerTickCallback((customPlayer: CustomPlayer, playerCache: CustomPlayerCache) => {

    });
});