import { LinesMesh, Color3 } from "@babylonjs/core";
import Editor from "../Editor";
import { CurveHelper } from "../DesignHelper";
import type { Parametric } from "./modeling/Parametric.js";

const lineColor = new Color3(0, 1, 0)

export class AddCurveCommand {
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

        editor.pointerEventHandler.pickedObject = mesh;
        editor.pickables.push(mesh);
        this.mesh = mesh;
    }

    undo() {
        this.mesh?.dispose();
    }

}
