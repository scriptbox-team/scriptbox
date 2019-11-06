import Aspect from "./aspect";
import EventComponent from "./event-component";

interface FrameData {
    frame: string;
    duration: number;
}

export default class SimpleAnimation extends EventComponent {
    public currentFrame: Aspect<string>;
    public onCreate(frames: FrameData[] = []) {
        super.onCreate();
        this.currentFrame = new Aspect<string>("");
        for (const frameData of frames) {
            this
                .do(() => {
                    this.currentFrame.base = frameData.frame;
                })
                .wait(frameData.duration);
        }
    }
    public onUpdate(delta: number) {
        super.onUpdate(delta);
    }
}
