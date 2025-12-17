import Editor from "../Editor";
import { BsplineCurveInt } from "../modeling/BsplineCurveInt";
import { Vertex } from "../modeling/VertexObservable";
import type Command from "./Command";
import type { Mesh } from "@babylonjs/core";
import type { Vector } from "../modeling/NurbsLib";
import type { CurveHelper } from "../DesignHelper";

export class AddPointCommand implements Command {
    editor: Editor;
    vertex: Vertex;
    mesh: Mesh | undefined;

    constructor(editor: Editor, point: Vector) {
        this.editor = editor;
        this.vertex = new Vertex(point);
        this.mesh = editor.selectMesh.pickedObject;
    }

    execute() {
        const { vertex, mesh } = this;
        if (mesh) {
            const { curve, helper }: { curve: BsplineCurveInt, helper: CurveHelper } = mesh.metadata;
            // add point to curve
            curve.add(vertex);
            // update vertex buffer
            helper.update();
            // add observers to observable
            vertex.add(curve);
            vertex.add(helper);
        }
    }

    undo() {
        const { mesh, vertex } = this;
        if (mesh) {
            const { curve, helper } = mesh.metadata;
            const nm1 = curve.designPoints.length - 1;
            // remove point
            curve.remove(nm1);
            // update vertex buffer
            helper.update(curve);
            // remove observers to observable
            vertex.remove(curve);
            vertex.remove(helper);
        }
    }
}
