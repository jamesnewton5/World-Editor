import { EntitySwingSource, InputPermissionCategory, Player, system, world } from "@minecraft/server";
import { createCustomPlayer } from "./player_constructor";
import { CustomPlayer, CustomPlayerCache } from "../types";
import { Debug } from "../debug";
import { EditHistory } from "../edit_history";


type PlayerTickCallback = (customPlayer: CustomPlayer, playerCache: CustomPlayerCache) => void;

export class PlayerCache extends Debug {
    private static map: Map<string, CustomPlayer> = new Map();
    private static playerTickCallbacks: Set<PlayerTickCallback> = new Set();
    private static initialised = false;

    public static initialise() {
        if (this.initialised) return;
        // Add online players
        for (const player of world.getAllPlayers()) { this.addPlayer(player); }
        // Subscribe to players loading into the game
        world.afterEvents.playerSpawn.subscribe((event) => {
            if (!event.initialSpawn) return;
            this.addPlayer(event.player);
        });
        // Remove players that leave
        world.afterEvents.playerLeave.subscribe((event) => {
            this.map.delete(event.playerId);
            this.printDebug(`removed ${event.playerName}`);
        });
        // Tick per player
        system.runInterval(() => {
            for (const customPlayer of this.map.values()) {
                for (const callback of this.playerTickCallbacks) {
                    callback(customPlayer, this.map);
                }
            }
        }, 1);

        world.afterEvents.playerSwingStart.subscribe((event) => {
            const player = event.player;
            if (!player.isValid) return;
            if (event.swingSource !== EntitySwingSource.Attack) return;
            const customPlayer = this.get(player);
            if (customPlayer === undefined) return;
            if (customPlayer._tempData.hasContainerOpen) customPlayer._tempData.hasContainerOpen = false;
        });

        this.initialised = true;
    }

    public static registerPlayerTickCallback(callback: PlayerTickCallback) {
        this.playerTickCallbacks.add(callback);
    }

    public static get(playerOrPlayerId: Player | string): CustomPlayer | undefined {
        const playerId = typeof playerOrPlayerId === "string" ? playerOrPlayerId : playerOrPlayerId.id;
        return this.map.get(playerId);
    }

    private static addPlayer(player: Player) {
        if (this.map.has(player.id)) return;
        if (!player.isValid) return;
        this.resetPlayer(player);
        const customPlayer = createCustomPlayer(player);
        EditHistory.validateEditHistory(customPlayer);
        this.map.set(customPlayer.id, customPlayer);
        this.printDebug(`added ${customPlayer.nameTag}`);
    }

    /** Reset camera, control scheme, HUD visibility, and input permissions */
    private static resetPlayer(player: Player) {
        player.camera.clear();
        player.setControlScheme(undefined);
        player.onScreenDisplay.resetHudElementsVisibility();
        for (const permissionCategoryKey of Object.keys(InputPermissionCategory).filter(key => isNaN(Number(key)))) {
            const permissionCategory = InputPermissionCategory[permissionCategoryKey as any] as unknown as InputPermissionCategory;
            player.inputPermissions.setPermissionCategory((permissionCategory), true);
        }
    }
}