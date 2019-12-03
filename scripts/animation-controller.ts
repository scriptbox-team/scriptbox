import Aspect from "aspect";
import Component from "component";
import Display from "display";
import SimpleAnimation from "simple-animation";

interface FrameData {
    frame: string;
    duration: number;
}

interface TextureRegion {
    x: number;
    y: number;
    width: number;
    height: number;
}

export default abstract class AnimationController extends Component {
    public abstract frames: {[name: string]: TextureRegion};
    private _animations: SimpleAnimation[] = [];
    public onUpdate() {
        while (this._animations.length > 0 && this._animations[this._animations.length - 1].finished) {
            this._animations.pop();
        }
        if (this._animations.length > 0) {
            const animation = this._animations[this._animations.length - 1];
            this.with<Display>("display", (display) => {
                const frame = this.frames[animation.currentFrame.getValue()];
                if (frame !== undefined) {
                    display.textureX = frame.x;
                    display.textureY = frame.y;
                    display.textureWidth = frame.width;
                    display.textureHeight = frame.height;
                }
            });
        }
    }
    public animate(frames: FrameData[], loop: boolean) {
        const ent = this.entity.add("simple-animation", "simple-animation" + Date.now(), this.owner, frames);
        if (loop) {
            ent.loop();
        }
        this._animations.push(ent);
    }
}
