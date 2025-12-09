import Editor from "../Editor";
import type { Mesh } from "@babylonjs/core";
import type { Vector } from "../modeling/NurbsLib";

export class AddPointCommand {
    editor: Editor;
    point: Vector;
    mesh: Mesh | undefined;

    constructor(editor: Editor, point: Vector) {
        this.editor = editor;
        this.point = point;
    }

    execute() {
        const { editor, point } = this;
        const mesh = editor.pointerEventHandler.pickedObject;
        if (mesh) {
            const curve = mesh.metadata.model;
            // add point to curve
            curve.add(point);
            // update vertex buffer
            mesh.metadata.helper.update(curve);
        }
        // store reference
        this.mesh = mesh;
    }

    undo() {
        const { mesh } = this;
        if (mesh) {
            const curve = mesh.metadata.model;
            const nm1 = curve.designPoints.length - 1;
            // remove point
            curve.remove(nm1);
            // update vertex buffer
            mesh.metadata.helper.update(curve);
        }
    }
}
