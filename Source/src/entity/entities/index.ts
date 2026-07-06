import { EntityConfig } from "../../types";
import { container } from "./container";

export const EntityConfigs: Record<string, EntityConfig> = {
    "world-editor:container": container
};