import { Entity, Player, PlayerInteractWithEntityAfterEvent, PlayerInteractWithEntityBeforeEvent, Vector3 } from "@minecraft/server";

// MARK: Player
export type CustomPlayerPersistentData = {
    editHistory: EditHistory;
    clipboard: ClipboardInfo | null;
};
export type CustomPlayerTempData = {
    position1: Vector3 | undefined;
    position2: Vector3 | undefined;
    mask: string | undefined;
    lastInfoMessageTick: number;
    assignedContainerEntityId: string | undefined;
    hasContainerOpen: boolean;
};
export type CustomPlayerData = {
    _savePersistentData: () => void;
    _persistentData: CustomPlayerPersistentData;
    _tempData: CustomPlayerTempData;
    _messageCooldown: Function;
    _persistentDataSaveScheduled: boolean;
};
export type CustomPlayer = Player & CustomPlayerData;
export type CustomPlayerCache = Map<string, CustomPlayer>;
export type EditHistory = Set<EditInfo>;
export type EditInfo = {
    reversed: boolean;
    title: string;
    description: string;
    volumeStateId: string;
};

export type ClipboardInfo = {
    structureId: string;
    offset: Vector3;
    size: Vector3;
};

// MARK: Entity
export type CustomEntity = Entity & CustomEntityData;
export type CustomEntityCache = Map<string, CustomEntity>;
export type EntityTickCallback = (entity: CustomEntity, entityCache: CustomEntityCache) => void;
export type CustomEntityData = {
    _callbacksPerTick: Set<EntityTickCallback>;
    _tempData: CustomEntityTempData;
    //_persistentData: CustomEntityPersistentData;
    //_persistentDataSaveScheduled: boolean;
};
export type CustomEntityPersistentData = {
    // Undefined values are not preserved when using JSON.stringify
    // This will cause the player data to be invalid and get reset - using null is easier and safer
    placeholder: null;
};
export type CustomEntityTempData = {
    placeholder: null;
};
export type EntityConfig = {
    onInteract?: (event: PlayerInteractWithEntityAfterEvent, customEntity: CustomEntity, customPlayer: CustomPlayer) => void,
    beforeInteract?: (event: PlayerInteractWithEntityBeforeEvent, customEntity: CustomEntity, customPlayer: CustomPlayer) => void
};
