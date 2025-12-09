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
            curve.add(point);
            const helper = mesh.metadata.helper;
            helper.update(curve);
            this.mesh = mesh;
        }
    }

    undo() {
        const { mesh } = this;
        if (mesh) {
            const curve = mesh.metadata.model;
            const nm1 = curve.designPoints.length - 1;
            curve.remove(nm1);
            const helper = mesh.metadata.helper;
            helper.update(curve);
        }
    }
}
