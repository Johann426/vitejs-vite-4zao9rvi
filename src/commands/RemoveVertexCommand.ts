import type Command from "./Command";
import type { Vertex } from "../modeling/Vertex";
import type { BsplineCurveInt } from "../modeling/BsplineCurveInt";

export class RemoveVertexCommand implements Command {
    private saved: Vertex;

    constructor(
        private index: number,
        private curve: BsplineCurveInt,
        private callback: () => void
    ) {
        this.saved = curve.vertices[index];
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
        // restor saved info
        curve.incert(index, saved.point);
        curve.addKnuckle(index);
        curve.addTangent(index, saved.tangentIn, saved.tangentOut);
        // update vertex buffer
        this.callback();
    }

    redo() {
        this.execute();
    }
}
