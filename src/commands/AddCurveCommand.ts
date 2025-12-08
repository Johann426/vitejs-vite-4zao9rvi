import { LinesMesh, Color3 } from "@babylonjs/core";
import Editor from "../Editor";
import { LinesHelper } from "../DesignHelper";

const NUM_POINTS = 100;
const lineColor = new Color3(0, 1, 0)

export class AddCurveCommand {
    editor: Editor;
    curve: any;
    mesh: LinesMesh | undefined;

    constructor(editor: Editor, curve: any) {
        this.editor = editor;
        this.curve = curve;
    }

    execute() {
        const { editor, curve } = this;
        const scene = editor.scene;

        const lines = new LinesHelper(lineColor);
        lines.initialize(scene);
        lines.update(curve.getPoints(NUM_POINTS));

        const mesh = lines.mesh;;
        mesh.metadata = { helper: lines, model: curve };

        editor.pointerEventHandler.pickedObject = mesh;
        editor.pickables.push(mesh);
        this.mesh = mesh;
    }

    undo() {
        this.mesh?.dispose();
    }

}
