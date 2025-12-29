import type Command from "./Command";
import type { Parametric } from "../modeling/Parametric";
import type { Vector } from "../modeling/NurbsLib";

export class RemovePointCommand implements Command {
    private saved: Vector;

    constructor(
        private index: number,
        private curve: Parametric,
        private callback: () => void,
    ) {
        this.saved = curve.designPoints[index];
    }

    execute() {
        const { curve, index } = this;
        // modify point
        curve.remove(index);
        // update vertex buffer
        this.callback();
    }

    undo() {
        const { curve, index, saved } = this;
        // restor saved point
        curve.incert(index, saved);
        // update vertex buffer
        this.callback();
    }

    redo() {
        this.execute();
    }
}
