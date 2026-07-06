import { EntityComponentTypes, ItemStack, system } from "@minecraft/server";
import { EntityConfig } from "../../types";
import { EntityUtilities } from "../../utilities/entity";
import { BuildTools } from "../../build";
import { VolumeMemory } from "../../volume_memory";
import { EditHistory } from "../../edit_history";

export const container: EntityConfig = {
    beforeInteract(event, customEntity, customPlayer) {
        const tempData = customPlayer._tempData;
        if (tempData.assignedContainerEntityId !== customEntity.id) {
            event.cancel = true;
            return;
        }

        system.run(() => {
            if (!customEntity?.isValid || !customPlayer?.isValid) return;
            EditHistory.editHistoryMenu(customPlayer, customEntity);
        });
    },
}