import AnimationController from "animation-controller";

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

export default class DefaultPlayerAnimationController extends AnimationController {
    public frames: {[name: string]: TextureRegion} = {
        stand0: {x: 0, y: 0, width: 32, height: 32},
        stand1: {x: 32, y: 0, width: 32, height: 32}
    };
    public onLoad() {
        this.animate([
            {frame: "stand0", duration: 0.7},
            {frame: "stand1", duration: 0.3}
        ], true);
    }
}
