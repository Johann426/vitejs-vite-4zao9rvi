import type Command from "./Command";
import type Editor from "../Editor";
import type { Mesh } from "@babylonjs/core";
import type { Vector } from "../modeling/NurbsLib";
import type { Parametric } from "../modeling/Parametric";
import type { CurveHelper } from "../DesignHelper";
import { VertexObservable, Observer } from "../modeling/VertexObservable";

export class AddPointCommand implements Command {
    private curve: Parametric;
    private observable: VertexObservable;
    private observer: Observer;

    constructor(
        editor: Editor,
        point: Vector,
        mesh: Mesh,
    ) {
        const { curve, helper }: { curve: Parametric, helper: CurveHelper } = mesh.metadata;
        this.curve = curve;
        // Create and store observable
        const observable = new VertexObservable(point);
        this.observable = observable;
        // add callback and store observer
        const callback = () => {
            if (curve.designPoints.length === 0) return
            helper.update();
            const { curvature, ctrlPoints, ctrlPolygon, designPoints } = editor;
            curvature.update(curve);
            ctrlPoints.update(curve.ctrlPoints);
            ctrlPolygon.update(curve.ctrlPoints);
            designPoints.update(curve.designPoints);
        }
        this.observer = this.observable.add(callback);
    }

    execute() {
        const { curve, observable } = this;
        // add a point to the curve
        curve.append(observable.vertex.point);
        // update vertex buffer
        observable.notify();
    }

    undo() {
        const { curve, observable, observer } = this;
        const nm1 = curve.designPoints.length - 1;
        // remove point
        curve.remove(nm1);
        // update vertex buffer
        observable.notify();
        // remove observer
        if (observer) {
            observable.remove(observer);
        }
    }

    redo() {
        const { curve, observable, observer } = this;
        // add a point to the curve
        curve.append(observable.vertex.point);
        // add observer
        observable.observers.push(observer);
        // update vertex buffer
        observable.notify();
    }
}
