import type Command from "./Command";
import type { Mesh } from "@babylonjs/core";
import type { VertexObservable, Observer } from "../modeling/VertexObservable";
import type { Parametric } from "../modeling/Parametric";

export class RemovePointCommand implements Command {
    private curve: Parametric;
    private index: number;
    private saved: Vector;

    constructor(
        index: number
    ) {
        const { curve } = mesh.metadata;
        this.curve = curve;
        // save index and point
        this.index = index;
        this.saved = curve.designPoints[index];
    }

    execute() {
        const { curve, index } = this;
        // modify point
        const vertex = curve.remove(index);
        vertex.reference.notify();
    }

    undo() {
        const { curve, index, saved } = this;
        // restor saved point
        const vertex = curve.incert(index, saved);
        vertex.reference?.notify();
    }

    redo() {
        this.execute();
    }
}
