import Editor from "../Editor";
import type { Mesh } from "@babylonjs/core";
import type { Vector } from "../modeling/NurbsLib";
import { Vertex } from "../modeling/BsplineCurveInt";

export class AddVertexCommand {
    editor: Editor;
    vertex: Vertex;
    mesh: Mesh | undefined;

    constructor(editor: Editor, point: Vector) {
        this.editor = editor;
        this.vertex = new Vertex(point);
    }

    execute() {
        const { editor, vertex } = this;
        const mesh = editor.selectMesh.pickedObject;
        if (mesh) {
            const { curve, helper } = mesh.metadata;
            // add point to curve
            curve.add(vertex);
            // update vertex buffer
            helper.update();
            // add observers to observable
            vertex.add(curve);
            vertex.add(helper);
        }
        // store reference
        this.mesh = mesh;
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
