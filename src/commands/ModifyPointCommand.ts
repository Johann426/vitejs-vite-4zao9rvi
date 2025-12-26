import Editor from "../Editor";
import type Command from "./Command";
import type { Mesh } from "@babylonjs/core";
import { Vector } from "../modeling/NurbsLib";
import type { Parametric } from "../modeling/Parametric";
import type { CurveHelper } from "../DesignHelper";
import { VertexObservable, Observer } from "../modeling/VertexObservable";

export class ModifyPointCommand implements Command {
    private curve: Parametric;
    private observable: VertexObservable;
    private observer: Observer;
    private point: Vector;
    private index: number;
    private saved: Vector;

    constructor(
        editor: Editor,
        point: Vector,
        mesh: Mesh,
        index: number
    ) {
        const { curve, helper }: { curve: Parametric, helper: CurveHelper } = mesh.metadata;
        this.curve = curve;
        // save index and point
        this.index = index;
        this.point = point;
        const v = curve.designPoints[index];
        this.saved = new Vector(v.x, v.y, v.z);
    }

    execute() {
        const { curve, index, point } = this;
        // modify point
        const vertex = curve.modify(index, point);
        console.log(vertex);
        vertex.reference?.notify();
    }

    undo() {
        const { curve, index, saved } = this;
        // restor saved point
        const vertex = curve.modify(index, point);
        console.log(vertex);
        vertex.reference?.notify();
    }
}
