import { Entity } from "@minecraft/server";
import { customEntityDataTemplate } from "./custom_entity_template";
import { CustomEntity, CustomEntityData, CustomEntityPersistentData, EntityTickCallback } from "../types";
import { deepClone, queueMicrotask } from "../general";

const emptySet = {
    size: 0,
    has: () => false
};
Object.freeze(emptySet);

export function createCustomEntity(entity: Entity): CustomEntity {
    // Create data
    const defaultCustomEntityData = deepClone(customEntityDataTemplate);

    //const storedPersistentData = retrievePersistentData(entity);

    const customEntityData: CustomEntityData = {
        _callbacksPerTick: emptySet as unknown as Set<EntityTickCallback>,
        //_persistentData: storedPersistentData,
        _tempData: defaultCustomEntityData._tempData,
        //_persistentDataSaveScheduled: defaultCustomEntityData._persistentDataSaveScheduled
    };

    // Create custom entity & proxy for saving persistent data
    const customEntity = Object.assign(entity, customEntityData);
    //customEntity._persistentData = createPersistentDataProxy(customEntity, customEntity._persistentData);
    return customEntity;
}
/*
function createPersistentDataProxy(customEntity: CustomEntity, persistentData: CustomEntityPersistentData) {
    schedulePersistentDataSave(customEntity);

    return new Proxy(persistentData, {
        set(target: CustomEntityPersistentData, propertyName: keyof CustomEntityPersistentData, newValue: CustomEntityPersistentData[keyof CustomEntityPersistentData]) {
            if (target[propertyName] === newValue) return true;
            (target as any)[propertyName] = newValue;
            schedulePersistentDataSave(customEntity);
            return true;
        }
    });
}

function schedulePersistentDataSave(customEntity: CustomEntity) {
    if (customEntity._persistentDataSaveScheduled) return;
    customEntity._persistentDataSaveScheduled = true;
    queueMicrotask(() => { savePersistentData(customEntity) });
}

function savePersistentData(customEntity: CustomEntity) {
    customEntity._persistentDataSaveScheduled = false;
    if (!customEntity.isValid) return;
    const persistentData = customEntity._persistentData;
    const persistentDataString = JSON.stringify(persistentData);
    customEntity.setDynamicProperty("_persistentData", persistentDataString);
}

function retrievePersistentData(entity: Entity): CustomEntityPersistentData {
    let persistentData: CustomEntityPersistentData;
    const persistentDataString = entity.getDynamicProperty("_persistentData") as string;
    if (persistentDataString !== undefined) {
        persistentData = JSON.parse(persistentDataString) as CustomEntityPersistentData;
        return validateData(persistentData);
    }
    persistentData = { ...customEntityDataTemplate._persistentData };
    return persistentData;
}

function validateData(persistentData: CustomEntityPersistentData) {
    const validatedData: any = {};
    for (let [key, defaultValue] of Object.entries(customEntityDataTemplate._persistentData)) {
        const valueToCheck = (persistentData as any)[key];
        if (typeof defaultValue !== typeof null && typeof defaultValue !== typeof valueToCheck) {
            validatedData[key] = defaultValue;
        } else {
            validatedData[key] = valueToCheck;
        }
    }
    return validatedData;
}
*/