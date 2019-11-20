import Aspect from "aspect";
import AspectModifier from "aspect-modifier";
import Component from "component";
import Position from "position";

export default class Hurtable extends Component {
    public maxHP: Aspect<number> = new Aspect(100);
    public currentHP: Aspect<number> = new Aspect(100);
    public respawnLocationX: Aspect<number> = new Aspect(0);
    public respawnLocationY: Aspect<number> = new Aspect(0);
    private _hpLimitModifier?: AspectModifier<number>;
    public onLoad() {
        this.currentHP.addModifier((hp) => {
            const maxHP = this.maxHP.getValue();
            if (hp > maxHP) {
                return maxHP;
            }
            if (hp < 0) {
                return 0;
            }
            return hp;
        });
    }
    public hurt(damage: number) {
        if (this.currentHP.getValue() > 0) {
            this.currentHP.base -= damage;
            if (this.currentHP.getValue() <= 0) {
                this.die();
            }
        }
    }
    public die() {
        this.entity.add("death-sequence", "death-sequence" + Date.now(), this.owner);
    }
    public respawn() {
        this.currentHP.base = this.maxHP.getValue();
        this.with<Position>("position", (position) => {
            position.x.base = this.respawnLocationX.getValue();
            position.y.base = this.respawnLocationY.getValue();
        });
    }
    public onUnload() {
        if (this._hpLimitModifier) {
            this._hpLimitModifier.delete();
        }
    }
}
