import type Command from "./Command.js";
import type Editor from "../Editor";
import type { Parametric } from "./modeling/Parametric";
import { LinesMesh, Color3 } from "@babylonjs/core";
import { CurveHelper } from "../DesignHelper";

const lineColor = new Color3(0, 1, 0)

export class AddCurveCommand implements Command {
    editor: Editor;
    curve: Parametric;
    mesh!: LinesMesh;

    constructor(editor: Editor, curve: Parametric) {
        this.editor = editor;
        this.curve = curve;
    }

    execute() {
        const { editor, curve } = this;
        const scene = editor.scene;

        const curvehelper = new CurveHelper(lineColor, curve);
        curvehelper.initialize(scene);
        curvehelper.update();

        const mesh = curvehelper.getMesh();
        mesh.metadata = { curve: curve, helper: curvehelper };

        editor.selectMesh.pickedObject = mesh;
        editor.pickables.push(mesh);
        this.mesh = mesh;
    }

    undo() {
        const { editor, mesh } = this;
        const index = editor.pickables.indexOf(mesh);
        if (index !== -1) {
            editor.pickables.splice(index, 1);
        }
    }

    redo() {
        const { editor, mesh } = this;
        editor.selectMesh.pickedObject = mesh;
        editor.pickables.push(mesh);
    }

}
