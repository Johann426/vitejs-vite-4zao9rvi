import Editor from "../Editor";
import type Command from "./Command";
import type { Mesh } from "@babylonjs/core";
import type { Vertex } from "../modeling/Vertex";

export class RemovePointCommand implements Command {
    editor: Editor;
    index: number;
    saved: Vertex | undefined;
    mesh: Mesh | undefined;

    constructor(editor: Editor, index: number) {
        this.editor = editor;
        this.index = index;
        this.mesh = editor.selectMesh.pickedObject;
    }

    execute() {
        const { index, mesh } = this;
        if (mesh) {
            const { curve, helper } = mesh.metadata;
            // remove point
            const vertex = curve.remove(index);
            // saved vertex
            this.saved = vertex;
            // remove observers to observable
            vertex.remove(curve);
            vertex.remove(helper);
        }
    }

    undo() {
        const { mesh, saved, index } = this;
        if (mesh && saved) {
            // restor saved point
            const { curve, helper } = mesh.metadata;
            curve.incert(index, saved);
            // add observers to observable
            saved.add(curve);
            saved.add(helper);
        }
    }
}
