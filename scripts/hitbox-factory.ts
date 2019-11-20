import CollisionBox from "./collision-box";
import Entity, { EntityProxy } from "./entity";
import Position from "./position";

interface HitboxOptions {
    origin: EntityProxy;
    damage: number;
    bounds: {
        x1: number,
        x2: number,
        y1: number,
        y2: number
    };
    lifetime: number;
    facing: number;
    knockback?: number;
    knockbackAngle?: number;
}

export default class HitboxFactory {
    public static createHitbox(options: HitboxOptions) {
        const ent = Entity.create("");
        let pos = {x: 0, y: 0};
        let originBounds = {x1: 0, y1: 0, x2: 0, y2: 0};
        const knockback = options.knockback ? options.knockback : 0;
        let knockbackAngle = options.knockbackAngle ? options.knockbackAngle : -0.767945;
        options.origin.with<Position>("position", (position) => {
            pos = {x: position.x.getValue(), y: position.y.getValue()};
        });
        options.origin.with<CollisionBox>("collision-box", (box) => {
            originBounds = {
                x1: box.x1.getValue(),
                y1: box.y1.getValue(),
                x2: box.x2.getValue(),
                y2: box.y2.getValue()
            };
        });
        let bounds = {
            x1: options.bounds.x1,
            y1: options.bounds.y1,
            x2: options.bounds.x2,
            y2: options.bounds.y2
        };
        if (options.facing > 0) {
            bounds = {
                x1: originBounds.x2 + bounds.x1,
                y1: bounds.y1,
                x2: originBounds.x2 + bounds.x2,
                y2: bounds.y2
            };
        }
        else {
            bounds = {
                x1: originBounds.x1 - bounds.x2,
                y1: bounds.y1,
                x2: originBounds.x1 - bounds.x1,
                y2: bounds.y2
            };
            knockbackAngle = Math.PI - knockbackAngle;
        }
        ent.add("position", "position", undefined, pos.x, pos.y);
        const collisionBox = ent.add(
            "collision-box",
            "collision-box",
            undefined,
            bounds.x1,
            bounds.y1,
            bounds.x2,
            bounds.y2
        );
        collisionBox.dense.base = false;
        ent.add("damaging", "damaging", undefined, options.damage, [options.origin.id]);
        ent.add("launching", "launching", undefined, knockback, knockbackAngle, [options.origin.id]);
        ent.add("timed-destroy", "timed-destroy", undefined, options.lifetime);
        return ent;
    }
}
