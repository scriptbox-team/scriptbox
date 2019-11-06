import Aspect from "./aspect";
import Component from "./component";
import Display from "./display";
import SimpleAnimation from "./simple-animation";

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

export default class AnimationController extends Component {
    private _animations: SimpleAnimation[] = [];
    private _frames: {[name: string]: TextureRegion} = {};
    public onUpdate() {
        while (this._animations.length > 0 && !this._animations[this._animations.length - 1].exists) {
            this._animations.pop();
        }
        if (this._animations.length > 0) {
            const animation = this._animations[this._animations.length - 1];
            this.with<Display>("display", (display) => {
                const frame = this._frames[animation.currentFrame.getValue()];
                if (frame !== undefined) {
                    display.textureX.base = frame.x;
                    display.textureY.base = frame.y;
                    display.textureWidth.base = frame.width;
                    display.textureHeight.base = frame.height;
                }
            });
        }
    }
    public animate(frames: FrameData[], loop: boolean) {
        const ent = this.entity.add("simple-animation", "simple-animation", this.owner, frames);
        if (loop) {
            ent.loop();
        }
        this._animations.push(ent);
    }
}
