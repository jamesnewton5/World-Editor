import { system, Vector3 } from "@minecraft/server";
import { CustomPlayerData } from "../types";

export const customPlayerDataTemplate: CustomPlayerData = {
    // Will get stored automatically when it is updated
    _persistentData: {
        placeholder: null
    },
    // Only stored in memory
    _tempData: {
        position1: undefined,
        position2: undefined,
        mask: undefined,
        lastInfoMessageTick: 0
    },
    _messageCooldown: function messageCooldown() {
        const MESSAGE_COOLDOWN_TICKS = 5;
        const currentTick = system.currentTick;
        const ticksSinceMessage = currentTick - this._tempData.lastInfoMessageTick;
        if (ticksSinceMessage <= MESSAGE_COOLDOWN_TICKS) return true;
        this._tempData.lastInfoMessageTick = currentTick;
        return false;
    },
    _persistentDataSaveScheduled: false
};