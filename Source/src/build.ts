import { world, system, BlockVolume, Direction, Vector3, Dimension, BlockType } from "@minecraft/server";
import { AddonMessage, MessageType } from "./message_formatting";
import { PlayerCache } from "./player/player_cache";
import { CustomPlayer } from "./player/player_constructor";

export class BuildTools {
    private static initialised = false;
    public static initialise() {
        if (this.initialised) return;

        world.beforeEvents.playerBreakBlock.subscribe((event) => {
            const player = event.player;
            if (event.itemStack?.typeId === "minecraft:wooden_axe" && player.getGameMode() === "Creative") {
                event.cancel = true;

                // Set position 1
                const customPlayer = PlayerCache.get(player);
                if (customPlayer === undefined) return;
                const position1 = event.block.location;
                customPlayer._tempData.position1 = position1;

                // Chat message
                if (customPlayer._messageCooldown()) return;
                const position2 = customPlayer._tempData.position2;
                if (position2 === undefined) {
                    customPlayer.sendMessage(`§7First position set to (${position1.x}, ${position1.y}, ${position1.z}).`);
                } else {
                    const volume = new BlockVolume(position1, position2);
                    const volumeCapacity = volume.getCapacity();
                    customPlayer.sendMessage(`§7First position set to (${position1.x}, ${position1.y}, ${position1.z}). (${volumeCapacity})`);
                }
            }
        });

        world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
            const player = event.player;
            if (event.itemStack?.typeId === "minecraft:wooden_axe" && player.getGameMode() === "Creative") {
                event.cancel = true;
                if (!event.isFirstEvent) return;

                // Set position 2
                const customPlayer = PlayerCache.get(player);
                if (customPlayer === undefined) return;
                const position2 = event.block.location;
                customPlayer._tempData.position2 = position2;

                // Chat message
                if (customPlayer._messageCooldown()) return;
                const position1 = customPlayer._tempData.position1;
                if (position1 === undefined) {
                    customPlayer.sendMessage(`§7Second position set to (${position2.x}, ${position2.y}, ${position2.z}).`);
                } else {
                    const volume = new BlockVolume(position1, position2);
                    const volumeCapacity = volume.getCapacity();
                    customPlayer.sendMessage(`§7Second position set to (${position2.x}, ${position2.y}, ${position2.z}). (${volumeCapacity})`);
                }
            }
        });

        this.initialised = true;
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
        system.run(() => this.setVolume(customPlayer, volume, blockType.id));
    }

    public static replace(customPlayer: CustomPlayer, blockType: BlockType, replacementBlockType: BlockType) {
        const volume = this.getSelectedVolume(customPlayer);
        if (volume === undefined) return;
        system.run(() => this.replaceVolume(customPlayer, volume, blockType.id, replacementBlockType.id));
    }

    private static async setVolume(customPlayer: CustomPlayer, volume: BlockVolume, blockTypeId: string) {
        const dimension = customPlayer.dimension;
        await loadVolume(dimension, volume);

        const gmask = customPlayer._tempData.gmask;
        const includeTypes = (gmask !== undefined ? [gmask] : [])

        const volumeHeight = volume.getSpan().y;
        const yLevel = volume.getMax().y;
        const volumeSlice = new BlockVolume({ x: volume.from.x, y: yLevel, z: volume.from.z }, { x: volume.to.x, y: yLevel, z: volume.to.z });

        for (let i = 0; i < volumeHeight; i++) {
            // Run twice in case water flows
            dimension.fillBlocks(volumeSlice, blockTypeId, { blockFilter: { includeTypes: includeTypes } });
            dimension.fillBlocks(volumeSlice, blockTypeId, { blockFilter: { includeTypes: includeTypes } });
            volumeSlice.translate({ x: 0, y: -1, z: 0 });
        }
    }

    private static async replaceVolume(customPlayer: CustomPlayer, volume: BlockVolume, blockTypeId: string, replacementBlockTypeId: string) {
        const dimension = customPlayer.dimension;
        await loadVolume(dimension, volume);

        const gmask = customPlayer._tempData.gmask;
        const includeTypes = (gmask !== undefined ? [gmask] : []);
        if (includeTypes.length > 0 && !includeTypes.includes(blockTypeId)) {
            AddonMessage.send(customPlayer, "Command conflicts with current Gmask", MessageType.Error);
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
        });
    }
}