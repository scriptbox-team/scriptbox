export default class DirectionFlipper {
    public static flip(direction?: "up" | "down" | "left" | "right"): "up" | "down" | "left" | "right" | undefined {
        switch (direction) {
            case "up": return "down";
            case "down": return "up";
            case "left": return "right";
            case "right": return "left";
            default: return undefined;
        }
    }
}
