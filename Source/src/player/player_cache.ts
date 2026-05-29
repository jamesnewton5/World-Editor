import { InputPermissionCategory, Player, system, world } from "@minecraft/server";
import { createCustomPlayer, CustomPlayer } from "./player_constructor";
import { Debug } from "../debug";

export class PlayerCache extends Debug {
    private static map: Map<string, CustomPlayer> = new Map();
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
            for (const [playerId, customPlayer] of this.map) {
                // Code here
            }
        }, 1);
        this.initialised = true;
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