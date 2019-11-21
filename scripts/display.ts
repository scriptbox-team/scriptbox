import Aspect from "aspect";
import Component from "component";

export default class Display extends Component {
    public textureID: Aspect<string> = new Aspect<string>("");
    public xOffset: Aspect<number> = new Aspect<number>(0);
    public yOffset: Aspect<number> = new Aspect<number>(0);
    public depth: Aspect<number> = new Aspect<number>(0);
    public textureX = new Aspect<number>(0);
    public textureY = new Aspect<number>(0);
    public xScale = new Aspect<number>(1);
    public yScale = new Aspect<number>(1);
    public textureWidth = new Aspect<number>(32);
    public textureHeight = new Aspect<number>(32);
    public onCreate(
            textureID: string = "R000000000000000000000000",
            textureX: number = 0,
            textureY: number = 0,
            textureWidth: number = 32,
            textureHeight: number = 32,
            depth: number = 0) {
        super.onCreate();
        this.textureID.base = textureID;
        this.textureX.base = textureX;
        this.textureY.base = textureY;
        this.textureWidth.base = textureWidth;
        this.textureHeight.base = textureHeight;
        this.depth.base = depth;
    }
}
