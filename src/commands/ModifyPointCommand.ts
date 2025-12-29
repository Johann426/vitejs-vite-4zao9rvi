import type Command from "./Command";
import { Vector } from "../modeling/NurbsLib";
import type { Parametric } from "../modeling/Parametric";

export class ModifyPointCommand implements Command {
    private saved: Vector;

    constructor(
        private index: number,
        private point: Vector,
        private curve: Parametric,
        private callback: () => void,
    ) {
        this.saved = curve.designPoints[index];
    }

    execute() {
        const { curve, index, point } = this;
        // modify point
        curve.modify(index, point);
        // update vertex buffer
        this.callback();
    }

    undo() {
        const { curve, index, saved } = this;
        // restor saved point
        curve.modify(index, saved);
        // update vertex buffer
        this.callback();
    }

    redo() {
        this.execute();
    }
}
