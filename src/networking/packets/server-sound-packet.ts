import _ from "lodash";
import AudioObject from "resource-management/audio-object";
import Packet from "./packet";

export default class ServerSoundPacket extends Packet {
    public static deserialize(obj: any): ServerSoundPacket | undefined {
        if (typeof obj === "object" && obj !== null) {
            if (
                Array.isArray(obj.audioPackage)
            ) {
                const renderObjectArray = [];
                const allClear = _.every(obj.audioPackage, (elem) => {
                    const audioObject = AudioObject.serialize(
                        elem.id,
                        elem.resource,
                        elem.volume,
                        elem.loop
                    );
                    if (audioObject !== undefined) {
                        renderObjectArray.push(audioObject);
                        return true;
                    }
                    return false;
                });
                if (allClear) {
                    return new ServerSoundPacket(obj.audioPackage);
                }
            }
            return undefined;
        }
    }

    public audioPackage: AudioObject[];
    constructor(audioPackage: AudioObject[]) {
        super();
        this.audioPackage = audioPackage;
    }
    public serialize() {
        return this;
    }
}
