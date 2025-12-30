import type Command from "./Command";
import type { Vector } from "../modeling/NurbsLib";
import type Curve from "../modeling/Curve";

export class RemovePointCommand implements Command {
    private saved: Vector;

    constructor(
        private index: number,
        private curve: Curve<Vector>,
        private callback: () => void,
    ) {
        this.saved = curve.designPoints[index];
    }

    execute() {
        const { curve, index } = this;
        // remove point
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
