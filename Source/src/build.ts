import { world, system, BlockVolume, Direction, Vector3, Dimension, BlockType, EntitySwingSource, Player } from "@minecraft/server";
import { AddonMessage, MessageType } from "./message_formatting";
import { PlayerCache } from "./player/player_cache";
import { CustomPlayer } from "./types";
import { TOOL_TYPE_ID } from "./data";
import { VectorMath } from "./vector_math";
import { DimensionUtilities, getBlockLocationFromRay } from "./utilities/dimension";
import { VFX } from "./utilities/vfx";
import { VolumeMemory } from "./volume_memory";
import { EditHistory } from "./edit_history";

export class BuildTools {
    private static initialised = false;
    public static initialise() {
        if (this.initialised) return;

        world.beforeEvents.playerBreakBlock.subscribe((event) => {
            if (event.itemStack?.typeId === TOOL_TYPE_ID && event.player.getGameMode() === "Creative") event.cancel = true;
        });

        world.afterEvents.playerSwingStart.subscribe((event) => {
            if (event.swingSource !== EntitySwingSource.Attack && event.swingSource !== EntitySwingSource.Mine) return;
            const player = event.player;
            if (event.heldItemStack?.typeId !== TOOL_TYPE_ID || player.getGameMode() !== "Creative") return;
            this.setPositionFromViewDirection(player, "position1");
        });

        world.beforeEvents.itemUse.subscribe((event) => {
            if (event.itemStack?.typeId !== TOOL_TYPE_ID) return;
            const player = event.source;
            event.cancel = true;
            if (player.getGameMode() !== "Creative") return;
            this.setPositionFromViewDirection(player, "position2");
        });

        world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
            if (event.itemStack?.typeId !== TOOL_TYPE_ID) return;
            const player = event.player;
            event.cancel = true;
            if (!event.isFirstEvent) return;
            if (player.getGameMode() !== "Creative") return;
            const customPlayer = PlayerCache.get(player);
            if (customPlayer === undefined) return;
            //  system.run(() => this.setPosition(customPlayer, "position2", event.block.location));
        });

        this.initialised = true;
    }

    private static setPositionFromViewDirection(player: Player, propertyKey: "position1" | "position2") {
        const customPlayer = PlayerCache.get(player);
        if (customPlayer === undefined) return;
        system.runTimeout(() => {
            if (!customPlayer.isValid) return;
            const aimingAtLocation = getBlockLocationFromRay(customPlayer.dimension, customPlayer.getHeadLocation(), customPlayer.getViewDirection(), 48);
            if (aimingAtLocation === undefined) return;
            this.setPosition(customPlayer, propertyKey, aimingAtLocation);
        }, 1);
    }

    public static setPosition(customPlayer: CustomPlayer, propertyKey: "position1" | "position2", location: Vector3 | undefined) {
        const tempData = customPlayer._tempData;
        if (location !== undefined) VectorMath.floor(location);
        tempData[propertyKey] = location;
        if (location === undefined) return;
        // Highlight
        VFX.highlightBlock(customPlayer, location);
        // Message
        if (customPlayer._messageCooldown()) return;
        const oppositePropertyKey = propertyKey === "position1" ? "position2" : "position1";
        const oppositePosition = tempData[oppositePropertyKey];
        if (oppositePosition === undefined) {
            customPlayer.sendMessage(`§7${propertyKey === "position1" ? "First" : "Second"} position set to (${location.x}, ${location.y}, ${location.z}).`);
        } else {
            const volume = new BlockVolume(location, oppositePosition);
            const volumeCapacity = volume.getCapacity();
            customPlayer.sendMessage(`§7${propertyKey === "position1" ? "First" : "Second"} position set to (${location.x}, ${location.y}, ${location.z}). (${volumeCapacity})`);
        }
    }

    public static getSelectedVolume(customPlayer: CustomPlayer): BlockVolume | undefined {
        const position1 = customPlayer._tempData.position1;
        const position2 = customPlayer._tempData.position2;
        if (position1 === undefined || position2 === undefined) {
            AddonMessage.send(customPlayer, "Make a selection", MessageType.Error);
            return undefined;
        }
        return new BlockVolume(position1, position2);
    }

    public static set(customPlayer: CustomPlayer, blockType: BlockType) {
        const volume = this.getSelectedVolume(customPlayer);
        if (volume === undefined) return;
        this.setVolume(customPlayer, volume, blockType.id);
    }

    public static replace(customPlayer: CustomPlayer, blockType: BlockType, replacementBlockType: BlockType) {
        const volume = this.getSelectedVolume(customPlayer);
        if (volume === undefined) return;
        this.replaceVolume(customPlayer, volume, blockType.id, replacementBlockType.id);
    }

    private static async setVolume(customPlayer: CustomPlayer, volume: BlockVolume, blockTypeId: string) {
        const dimension = customPlayer.dimension;
        await loadVolume(dimension, volume);

        EditHistory.add(customPlayer, volume, `Set ${blockTypeId.split(":").length > 0 ? blockTypeId.split(":")[1] : blockTypeId}`);

        const mask = customPlayer._tempData.mask;
        const includeTypes = (mask !== undefined ? [mask] : undefined);

        const volumeHeight = volume.getSpan().y;
        const yLevel = volume.getMax().y;
        const volumeSlice = new BlockVolume({ x: volume.from.x, y: yLevel, z: volume.from.z }, { x: volume.to.x, y: yLevel, z: volume.to.z });

        for (let i = 0; i < volumeHeight; i++) {
            // Run twice in case water flows
            dimension.fillBlocks(volumeSlice, blockTypeId, { blockFilter: { includeTypes: includeTypes } });
            dimension.fillBlocks(volumeSlice, blockTypeId, { blockFilter: { includeTypes: includeTypes } });
            volumeSlice.translate({ x: 0, y: -1, z: 0 });
        }


        // BlockFilter for dimension.getBlocks is broken in some chunks currently if the filter includes air

        /*
        const blockIterator = dimension.getBlocks(volume, { includeTypes: includeTypes }).getBlockLocationIterator();
        for (const location of blockIterator) {
            dimension.setBlockType(location, blockTypeId)
        }

        return;
        const volumeHeight = volume.getSpan().y;
        const yLevel = volume.getMax().y;
        const volumeSlice = new BlockVolume({ x: volume.from.x, y: yLevel, z: volume.from.z }, { x: volume.to.x, y: yLevel, z: volume.to.z });

        for (let i = 0; i < volumeHeight; i++) {
            // Run twice in case water flows
            const blocks = dimension.getBlocks(volume, { includeTypes: validBlocks }).getBlockLocationIterator();
            for (const location of blocks) {
                dimension.setBlockType(location, blockTypeId)
            }
            volumeSlice.translate({ x: 0, y: -1, z: 0 });
            continue;
            dimension.fillBlocks(volumeSlice, blockTypeId, { blockFilter: { includeTypes: includeTypes } });
            dimension.fillBlocks(volumeSlice, blockTypeId, { blockFilter: { includeTypes: includeTypes } });
            volumeSlice.translate({ x: 0, y: -1, z: 0 });
        }
        */
    }

    private static async replaceVolume(customPlayer: CustomPlayer, volume: BlockVolume, blockTypeId: string, replacementBlockTypeId: string) {
        const dimension = customPlayer.dimension;
        await loadVolume(dimension, volume);

        EditHistory.add(customPlayer, volume, `Replaced with ${blockTypeId.split(":").length > 0 ? blockTypeId.split(":")[1] : blockTypeId}`);

        const mask = customPlayer._tempData.mask;
        const includeTypes = (mask !== undefined ? [mask] : []);
        if (includeTypes.length > 0 && !includeTypes.includes(blockTypeId)) {
            AddonMessage.send(customPlayer, "Command conflicts with current mask", MessageType.Error);
            return;
        }

        const volumeHeight = volume.getSpan().y;
        const yLevel = volume.getMax().y;
        const volumeSlice = new BlockVolume({ x: volume.from.x, y: yLevel, z: volume.from.z }, { x: volume.to.x, y: yLevel, z: volume.to.z });

        for (let i = 0; i < volumeHeight; i++) {
            // Run twice in case water flows
            dimension.fillBlocks(volumeSlice, replacementBlockTypeId, { blockFilter: { includeTypes: [blockTypeId] } });
            dimension.fillBlocks(volumeSlice, replacementBlockTypeId, { blockFilter: { includeTypes: [blockTypeId] } });
            volumeSlice.translate({ x: 0, y: -1, z: 0 });
        }
    }
}

// DimensionUtilities.forEachBlockOfVolume(volume, (location) => {
//     const block = dimension.getBlock(location);
//     if (block === undefined) return;
//     const typeId = block.typeId;
//     if (typeId === blockTypeId) return;
//     if (includeTypes !== undefined && !includeTypes.has(typeId)) return;
//     dimension.setBlockType(location, blockTypeId);
// });

export function vector3ToString(vector: Vector3) {
    let string = vector.x + "," + vector.y + "," + vector.z;
    return string;
}

// Important: When using load volume do all operations required in that volume on the same tick, before it gets unloaded
export function loadVolume(dimension: Dimension, volume: BlockVolume) {
    return new Promise((resolve) => {
        let queueObject = {
            dimension: dimension,
            volume: volume,
            resolve
        };
        // Add to queue, and try to start the queue manager
        loadVolumeQueue.push(queueObject);
        queueManager();
    });
}

let loadVolumeQueue: Array<any> = [];
let queueManagerRunning = false;
// Could speed this up by using more than one ticking area
function queueManager() {
    if (queueManagerRunning) return;
    queueManagerRunning = true;
    queueManagerLoop();
    function queueManagerLoop() {
        let queueObject = loadVolumeQueue[0];
        if (world.tickingAreaManager.hasTickingArea("temporaryArea")) world.tickingAreaManager.removeTickingArea("temporaryArea");

        let cancelled = false;
        let loaded = false;

        system.runTimeout(() => {
            if (loaded) return;
            cancelled = true;
            queueManagerLoop();
            AddonMessage.send(world, "Chunk loading timed out, retrying", MessageType.Warning);
        }, 100);

        const volumeMin = queueObject.volume.getMin();
        const volumeMax = queueObject.volume.getMax();
        world.tickingAreaManager.createTickingArea("temporaryArea", { dimension: queueObject.dimension, from: volumeMin, to: volumeMax }).then(result => {
            if (cancelled) return;
            loaded = true;
            loadVolumeQueue.splice(0, 1);
            queueObject.resolve(true);
            if (loadVolumeQueue.length > 0) {
                system.runTimeout(() => {
                    queueManagerLoop();
                }, 1);
            } else {
                queueManagerRunning = false;
            }
            world.tickingAreaManager.removeTickingArea("temporaryArea");
        });
    }
}