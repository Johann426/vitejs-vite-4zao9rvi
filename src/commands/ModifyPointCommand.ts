import Editor from "../Editor";
import type Command from "./Command";
import type { Mesh } from "@babylonjs/core";
import { Vector } from "../modeling/NurbsLib";

export class ModifyPointCommand implements Command {
    editor: Editor;
    point: Vector;
    index: number;
    saved: Vector | undefined;
    mesh: Mesh | undefined;

    constructor(editor: Editor, point: Vector, index: number) {
        this.editor = editor;
        this.point = point;
        this.index = index;
        this.mesh = editor.selectMesh.pickedObject;
    }

    execute() {
        const { point, index, mesh } = this;
        if (mesh) {
            const curve = mesh.metadata.curve;
            // saved point
            const v = curve.designPoints[index];
            this.saved = new Vector(v.x, v.y, v.z);
            // modify point
            curve.mod(index, point);
        }
    }

    undo() {
        const { mesh, saved, index } = this;
        if (mesh) {
            // restor saved point
            const curve = mesh.metadata.curve;
            curve.mod(index, saved);
        }
    }
}
