import Aspect from "aspect";
import Component from "component";

export default class Display extends Component {
    public textureID = "";
    public xOffset = 0;
    public yOffset = 0;
    public depth = 0;
    public textureX = 0;
    public textureY = 0;
    public xScale = 1;
    public yScale = 1;
    public textureWidth = 32;
    public textureHeight = 32;
    public onCreate(
            textureID: string = "R000000000000000000000000",
            textureX: number = 0,
            textureY: number = 0,
            textureWidth: number = 32,
            textureHeight: number = 32,
            depth: number = 0) {
        super.onCreate();
        this.textureID = textureID;
        this.textureX = textureX;
        this.textureY = textureY;
        this.textureWidth = textureWidth;
        this.textureHeight = textureHeight;
        this.depth = depth;
    }
}
