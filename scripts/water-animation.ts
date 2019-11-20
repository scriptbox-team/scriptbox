import Component from "./component";
import Display from "./display";

interface TextureRegion {
    x: number;
    y: number;
    width: number;
    height: number;
}

export default abstract class WaterAnimation extends Component {
    private _frames: TextureRegion[] = [
        {x: 0, y: 0, width: 32, height: 32},
        {x: 32, y: 0, width: 32, height: 32},
        {x: 64, y: 0, width: 32, height: 32},
        {x: 96, y: 0, width: 32, height: 32},
        {x: 128, y: 0, width: 32, height: 32},
        {x: 160, y: 0, width: 32, height: 32},
        {x: 192, y: 0, width: 32, height: 32},
        {x: 224, y: 0, width: 32, height: 32},
    ];
    public onUpdate() {
        const frame = this._frames[Math.floor(Date.now() / 50) % 8];
        this.with<Display>("display", (display) => {
            display.textureX.base = frame.x;
            display.textureY.base = frame.y;
            display.textureWidth.base = frame.width;
            display.textureHeight.base = frame.height;
        });
    }
}
