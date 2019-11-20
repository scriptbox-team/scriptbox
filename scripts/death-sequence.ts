import ActionInstance from "action-instance";
import Aspect from "aspect";
import AspectModifier from "aspect-modifier";
import Chat from "chat";
import Control from "control";
import Hurtable from "hurtable";

export default class DeathSequence extends ActionInstance {
    public currentFrame: Aspect<string>;
    public onCreate(respawnTime: number = 3) {
        super.onCreate();
        let canControlModifier: AspectModifier<boolean> | undefined;
        this
            .do(() => {
                if (this.entity.controller !== undefined) {
                    Chat.send(`${this.entity.controller.displayName} died!`);
                }
                this.with<Control>("control", (control) => {
                    canControlModifier = control.canControl.addModifier((v) => false);
                });
            })
            .wait(respawnTime)
            .do(() => {
                this.with<Hurtable>("hurtable", (hurtable) => {
                    hurtable.respawn();
                });
                if (canControlModifier) {
                    canControlModifier.delete();
                }
            });
    }
    public onPostUpdate(delta: number) {
        super.onPostUpdate(delta);
    }
}
