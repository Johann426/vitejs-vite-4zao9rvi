import { MeshBuilder, Color3 } from "@babylonjs/core";
import Editor from "../Editor";
import { LineHelper } from "../DesignHelper";

const NUM_POINTS = 100;
const lineColor = new Color3(0, 1, 0)

export class AddCurveCommand {
    editor: Editor;
    curve: any;
    mesh: any;

    constructor(editor: any, curve: any) {
        this.editor = editor;
        this.curve = curve;
    }

    execute() {
        const { editor, curve } = this;
        const scene = editor.scene;

        const points = curve.getPoints(NUM_POINTS);
        const line = MeshBuilder.CreateLines(
            "lines",
            {
                points: points,
                updatable: true,
            },
            scene
        );

        line.metadata = { model: curve };
        line.color = new Color3(0, 1, 0);

        editor.pickables.push(line);
        editor.selected = line;
        this.mesh = line;
    }

    undo() {
        const mesh = this.mesh;
        mesh.dispose();
    }

    lineMesh() {
        const line = new LineHelper(lineColor);
        this.mesh = line.mesh;
    }
}
