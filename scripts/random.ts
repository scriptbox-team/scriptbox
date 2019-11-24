export default class Random {
    public static int(num: number, num2?: number) {
        return Math.floor(this.float(num, num2));
    }
    public static float(num: number, num2?: number) {
        if (num2 !== undefined) {
            return num + Math.random() * (num2 - num);
        }
        return Math.random() * num;
    }
    public static random() {
        return Math.random();
    }
}
