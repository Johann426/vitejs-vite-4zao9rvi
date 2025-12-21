import type Command from "./Command";
import type Editor from "../Editor";
import type { Mesh } from "@babylonjs/core";
import type { Vector } from "../modeling/NurbsLib";
import type { Parametric } from "../modeling/Parametric";
import type { CurveHelper } from "../DesignHelper";
import { Vertex, Observer } from "../modeling/VertexObservable";

export class AddPointCommand implements Command {
    private curve: Parametric;
    private vertex: Vertex;
    private observer: Observer;

    constructor(
        editor: Editor,
        point: Vector,
        mesh: Mesh,
    ) {
        const { curve, helper }: { curve: Parametric, helper: CurveHelper } = mesh.metadata;
        this.curve = curve;
        // Create and store observable(vertex)
        const vertex = new Vertex(point);
        this.vertex = vertex;
        // add callback to observable(vertex) and store observer
        const callback = () => {
            if (curve.designPoints.length === 0) return
            helper.update();
            const { curvature, ctrlPoints, ctrlPolygon, designPoints } = editor;
            curvature.update(curve);
            ctrlPoints.update(curve.ctrlPoints);
            ctrlPolygon.update(curve.ctrlPoints);
            designPoints.update(curve.designPoints);
        }
        this.observer = this.vertex.add(callback);
    }

    execute() {
        const { curve, vertex } = this;
        // add vertex to curve
        curve.add(vertex);
        // update vertex buffer
        vertex.notify();
    }

    undo() {
        const { curve, vertex, observer } = this;
        const nm1 = curve.designPoints.length - 1;
        // remove point
        curve.remove(nm1);
        // update vertex buffer
        vertex.notify();
        // remove observer
        if (observer) {
            vertex.remove(observer);
        }

    }

    redo() {
        const { curve, vertex, observer } = this;
        // add vertex to curve
        curve.add(vertex);
        // add observer
        vertex.observers.push(observer);
        // update vertex buffer
        vertex.notify(curve);
    }
}
