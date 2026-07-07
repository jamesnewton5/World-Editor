import { Player } from "@minecraft/server";
import { customPlayerDataTemplate } from "./player_template";
import { deepClone, queueMicrotask } from "../general";
import { CustomPlayer, CustomPlayerData, CustomPlayerPersistentData } from "../types";
import { VolumeMemory } from "../volume_memory";

export function createCustomPlayer(player: Player): CustomPlayer {
    // Create data
    const defaultCustomPlayerData = deepClone(customPlayerDataTemplate);
    const storedPersistentData = retrievePersistentData(player);
    storedPersistentData.editHistory = new Set(storedPersistentData.editHistory);

    const customPlayerData: CustomPlayerData = {
        _savePersistentData: customPlayerDataTemplate._savePersistentData,
        _persistentData: storedPersistentData,
        _tempData: defaultCustomPlayerData._tempData,
        _messageCooldown: customPlayerDataTemplate._messageCooldown,
        _persistentDataSaveScheduled: defaultCustomPlayerData._persistentDataSaveScheduled
    };
    // Create custom player & proxy for saving persistent data
    let customPlayer = Object.assign(player, customPlayerData);

    customPlayer._persistentData = createPersistentDataProxy(customPlayer, customPlayer._persistentData);
    customPlayer._savePersistentData = () => savePersistentData(customPlayer);
    customPlayer = new Proxy(customPlayer, {
        get(target: CustomPlayer, propertyName: keyof typeof customPlayer) {
            let value = Reflect.get(target, propertyName);
            if (value === undefined) return undefined;
            if (typeof value === "function") value = value.bind(target);
            if (propertyName !== "getHeadLocation") return value;
            return () => {
                const headLocation = (value as Function)();
                headLocation.y += 0.1;
                return headLocation;
            }
        }
    });
    return customPlayer;
}

function createPersistentDataProxy(customPlayer: CustomPlayer, persistentData: CustomPlayerPersistentData) {
    schedulePersistentDataSave(customPlayer);

    return new Proxy(persistentData, {
        set(target: CustomPlayerPersistentData, propertyName: keyof typeof customPlayer._persistentData, newValue) {
            const value = target[propertyName];
            if ((typeof newValue !== "object" || newValue === null) && value === newValue) return true;
            target[propertyName] = newValue;
            schedulePersistentDataSave(customPlayer);
            return true;
        }
    });
}

function schedulePersistentDataSave(customPlayer: CustomPlayer) {
    if (customPlayer._persistentDataSaveScheduled) return;
    customPlayer._persistentDataSaveScheduled = true;
    queueMicrotask(() => { savePersistentData(customPlayer) });
}

function savePersistentData(customPlayer: CustomPlayer) {
    customPlayer._persistentDataSaveScheduled = false;
    if (!customPlayer.isValid) return;
    const persistentData = { ...customPlayer._persistentData } as any;
    persistentData.editHistory = Array.from(customPlayer._persistentData.editHistory)
    const persistentDataString = JSON.stringify(persistentData);
    customPlayer.setDynamicProperty("_persistentData", persistentDataString);
}

function retrievePersistentData(player: Player): CustomPlayerPersistentData {
    let persistentData: CustomPlayerPersistentData;
    const persistentDataString = player.getDynamicProperty("_persistentData") as string;
    if (persistentDataString !== undefined) {
        persistentData = JSON.parse(persistentDataString) as CustomPlayerPersistentData;
        return validateData(persistentData);
    }
    persistentData = { ...customPlayerDataTemplate._persistentData };
    return persistentData;
}

function validateData(persistentData: CustomPlayerPersistentData) {
    const validatedData: any = {};
    for (let [key, defaultValue] of Object.entries(customPlayerDataTemplate._persistentData)) {
        const valueToCheck = (persistentData as any)[key];
        if (typeof defaultValue !== typeof valueToCheck) {
            validatedData[key] = defaultValue;
        } else {
            validatedData[key] = valueToCheck;
        }
    }
    return validatedData;
}