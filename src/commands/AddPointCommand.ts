import type Command from "./Command";
import type { Vector } from "../modeling/NurbsLib";
import type { Parametric } from "../modeling/Parametric";

export class AddPointCommand implements Command {

    constructor(
        private point: Vector,
        private curve: Parametric,
        private callback: () => void,
    ) { }

    execute() {
        const { curve, point } = this;
        // add a point to the curve
        curve.append(point);
        // update vertex buffer
        this.callback();
    }

    undo() {
        const { curve } = this;
        const nm1 = curve.designPoints.length - 1;
        // remove point
        curve.remove(nm1);
        // update vertex buffer
        this.callback();
    }

    redo() {
        this.execute();
    }
}
