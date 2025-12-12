import type Command from "./Command.js";
import type Editor from "../Editor";
import type { Parametric } from "./modeling/Parametric";
import { LinesMesh, Color3 } from "@babylonjs/core";
import { CurveHelper } from "../DesignHelper";

const lineColor = new Color3(0, 1, 0)

export class AddCurveCommand implements Command {
    editor: Editor;
    curve: Parametric;
    mesh: LinesMesh | undefined;

    constructor(editor: Editor, curve: Parametric) {
        this.editor = editor;
        this.curve = curve;
    }

    execute() {
        const { editor, curve } = this;
        const scene = editor.scene;

        const curvehelper = new CurveHelper(lineColor, curve);
        curvehelper.initialize(scene);
        curvehelper.update(curve);

        const mesh = curvehelper.mesh;

        editor.selectMesh.pickedObject = mesh;
        editor.pickables.push(mesh);
        this.mesh = mesh;
    }

    undo() {
        this.mesh?.dispose();
    }

}
