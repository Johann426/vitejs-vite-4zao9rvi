import type Command from "./Command";
import type { Mesh } from "@babylonjs/core";
import { Vector } from "../modeling/NurbsLib";
import type { Parametric } from "../modeling/Parametric";

export class ModifyPointCommand implements Command {
    private curve: Parametric;
    private point: Vector;
    private index: number;
    private saved: Vector;

    constructor(
        point: Vector,
        index: number,
        mesh: Mesh,
    ) {
        const { curve } = mesh.metadata;
        this.curve = curve;
        // save index and point
        this.index = index;
        this.point = point;
        this.saved = curve.designPoints[index];
    }

    execute() {
        const { curve, index, point } = this;
        // modify point
        const vertex = curve.modify(index, point);
        vertex.reference.notify();
    }

    undo() {
        const { curve, index, saved } = this;
        // restor saved point
        const vertex = curve.modify(index, saved);
        vertex.reference?.notify();
    }

    redo() {
        this.execute();
    }
}
