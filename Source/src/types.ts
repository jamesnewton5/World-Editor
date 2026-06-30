import { Player, Vector3 } from "@minecraft/server";

// MARK: Player
export type CustomPlayerPersistentData = {
    placeholder: null;
};
export type CustomPlayerTempData = {
    position1: Vector3 | undefined;
    position2: Vector3 | undefined;
    mostRecentBlockBrokenWithToolTick: number;
    mask: string | undefined;
    lastInfoMessageTick: number;
};
export type CustomPlayerData = {
    _persistentData: CustomPlayerPersistentData;
    _tempData: CustomPlayerTempData;
    _messageCooldown: Function;
    _persistentDataSaveScheduled: boolean;
};
export type CustomPlayer = Player & CustomPlayerData;
export type CustomPlayerCache = Map<string, CustomPlayer>;
