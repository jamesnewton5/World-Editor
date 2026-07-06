import { Container, Entity, EntityComponentTypes, EquipmentSlot, ItemStack } from "@minecraft/server";

export class EntityUtilities {
    public static getContainer(entity: Entity): Container | undefined {
        if (!entity.isValid) return undefined;
        const inventoryComponent = entity.getComponent(EntityComponentTypes.Inventory);
        if (inventoryComponent === undefined) return undefined;
        const container = inventoryComponent.container;
        return container;
    }

    public static getHeldItem(entity: Entity): ItemStack | undefined {
        if (!entity.isValid) return undefined;
        const equippableComponent = entity.getComponent(EntityComponentTypes.Equippable);
        if (equippableComponent === undefined) return undefined;
        const itemStack = equippableComponent.getEquipment(EquipmentSlot.Mainhand);
        return itemStack;
    }

    public static setHeldItem(entity: Entity, item: ItemStack | string): void {
        if (!entity.isValid) return;
        const equippableComponent = entity.getComponent(EntityComponentTypes.Equippable);
        if (equippableComponent === undefined) return;
        const itemStack = (typeof item === "string") ? new ItemStack(item) : item;
        equippableComponent.setEquipment(EquipmentSlot.Mainhand, itemStack);
    }

    public static getItemSlot(entity: Entity, item: ItemStack | string): number | undefined {
        if (!entity.isValid) return undefined;
        const inventoryComponent = entity.getComponent(EntityComponentTypes.Inventory);
        if (inventoryComponent === undefined) return undefined;
        const itemStack = (typeof item === "string") ? new ItemStack(item) : item;
        const slotNumber = inventoryComponent.container.find(itemStack);
        return slotNumber;
    }

    public static swapSlots(entity: Entity, slotIndex1: number, slotIndex2: number): void {
        if (!entity.isValid) return;
        const inventoryComponent = entity.getComponent(EntityComponentTypes.Inventory);
        if (inventoryComponent === undefined) return;
        inventoryComponent.container.swapItems(slotIndex1, slotIndex2, inventoryComponent.container);
    }
}