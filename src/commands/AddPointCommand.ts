import Editor from "../Editor";
import type { Mesh } from "@babylonjs/core";

export class AddPointCommand {
    editor: Editor;
    point: any;
    mesh: Mesh | undefined;

    constructor(editor: Editor, point: any) {
        this.editor = editor;
        this.point = point;
    }

    execute() {
        const { editor, point } = this;
        const mesh = editor.pointerEventHandler.pickedObject;
        if (mesh) {
            const curve = mesh.metadata.model;
            curve.add(point);
            editor.updateCurve(curve);
            this.mesh = mesh;
        }
    }

    undo() {
        const { editor, mesh } = this;
        if (mesh) {
            const curve = mesh.metadata.model;
            const nm1 = curve.designPoints.length - 1;
            curve.remove(nm1);
            editor.updateCurve(curve);
        }
    }
}
