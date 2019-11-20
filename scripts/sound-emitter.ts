import Component from "component";

interface Sound {
    resource: string;
    volume: number;
}

export default class SoundEmitter extends Component {
    public soundQueue: Sound[] = [];
    public play(resource: string, volume: number = 1.0) {
        this.soundQueue.push({resource, volume});
    }
}
