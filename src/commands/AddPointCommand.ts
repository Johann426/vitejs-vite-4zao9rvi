import Editor from "../Editor";
import type { Mesh } from "@babylonjs/core";

const NUM_POINTS = 100;

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
            const lines = mesh.metadata.helper;
            lines.update(curve.getPoints(NUM_POINTS));
            this.mesh = mesh;
        }
    }

    undo() {
        const { mesh } = this;
        if (mesh) {
            const curve = mesh.metadata.model;
            const nm1 = curve.designPoints.length - 1;
            curve.remove(nm1);
            const lines = mesh.metadata.helper;
            lines.update(curve.getPoints(NUM_POINTS));
        }
    }
}
