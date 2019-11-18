export default class Chat {
    public static externalSendChatMessage: (msg: string) => void;
    public static send(message: string) {
        this.externalSendChatMessage(message);
    }
}
