import ActionInstance from "./action-instance";

export default class TimedDestroy extends ActionInstance {
    public onCreate(time: number = 0) {
        super.onCreate();
        this
            .wait(time)
            .do(() => this.entity.delete());
    }
}
