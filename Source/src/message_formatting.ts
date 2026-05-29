// Formatting for consistent info/warning message styles across the addon
import { world, Player } from "@minecraft/server";
import { Debug } from "./debug";

export enum MessageType {
    Info = "Info",
    Warning = "Warning",
    Error = "Error",
    GameVerbose = "GameVerbose",
    GameImportant = "GameImportant",
    GameWarning = "GameWarning"
};

const messagePrefixes: Partial<Record<MessageType, string>> = {
    [MessageType.Info]: "§r§a[i]§7 ",
    [MessageType.Warning]: "§r§e[!]§7 ",
    [MessageType.Error]: "§r§c[!]§7 ",
    [MessageType.GameVerbose]: "§r§e[>]§7 ",
    [MessageType.GameImportant]: "§r§a[>]§7 ",
    [MessageType.GameWarning]: "§r§c[>]§7 "
};

export class AddonMessage extends Debug {
    private static formatMessage(message: string): string {
        if (message.length < 1) return message;

        // Fullstop at end
        const lastChar = message[message.length - 1];
        if (lastChar !== ".") message += ".";
        // Capitalise first letter
        const firstChar = message[0];
        message = firstChar.toUpperCase() + message.slice(1);

        return message;
    }

    public static send(domain: Player | typeof world, message: string, messageType: MessageType, formatMessage: boolean = true): void {
        if (domain instanceof Player) this.printDebug("Sending message to " + domain.nameTag);
        else this.printDebug("Sending message to world");

        if (formatMessage) message = this.formatMessage(message);
        const messagePrefix = messagePrefixes[messageType];
        message = messagePrefix + message;
        domain.sendMessage(message);
    }
}