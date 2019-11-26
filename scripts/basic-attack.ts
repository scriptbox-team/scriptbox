import Attack from "attack";
import HitboxFactory from "hitbox-factory";
import PlayerControl from "player-control";
import SoundEmitter from "sound-emitter";
import AnimationController from "animation-controller";

interface FrameData {
    frame: string;
    duration: number;
    attackData?: {
        hitbox: {
            x1: number,
            y1: number,
            x2: number,
            y2: number
        };
        damage: number;
        knockback: number;
        knockbackAngle: number;
        sound: string;
    };
}

export default class BasicAttack extends Attack {
    public frameData: FrameData[] = [
        {frame: "attack1", duration: 0.1},
        {frame: "attack2", duration: 0.1},
        {frame: "attack3", duration: 0.1, attackData: {
            hitbox: {
                x1: 5,
                y1: 0,
                x2: 32,
                y2: 32
            },
            damage: 20,
            knockback: 250,
            knockbackAngle: -0.767945,
            sound: "R000000000000000000000004"
        }},
        {frame: "attack4", duration: 0.1},
    ];
    public execute() {
        this.attack();
    }
    public attack() {
        const ai = this.entity.add("action-instance", "attack" + Date.now(), this.owner);
        this.with<AnimationController>("animation-controller", (ac) => {
            ac.animate(this.frameData, false);
        });
        for (const frame of this.frameData) {
            ai.do(() => {
                const attackData = frame.attackData;
                if (attackData !== undefined) {
                    let facing = 1;
                    this.with<PlayerControl>("control", (playerControl) => {
                        facing = playerControl.facing.getValue();
                    });
                    this.with<SoundEmitter>("sound-emitter", (soundEmitter) => {
                        soundEmitter.play(attackData.sound, 1);
                    });
                    HitboxFactory.createHitbox({
                        origin: this.entity,
                        damage: attackData.damage,
                        bounds: attackData.hitbox,
                        lifetime: frame.duration,
                        knockback: attackData.knockback,
                        knockbackAngle: attackData.knockbackAngle,
                        facing
                    });
                }
            })
                .wait(frame.duration);
        }
        return ai;
    }
}
