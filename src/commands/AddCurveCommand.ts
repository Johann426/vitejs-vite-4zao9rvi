import { MeshBuilder, StandardMaterial, Color3 } from "@babylonjs/core";

export class AddCurveCommand {
    editor: any;
    curve: any;
    mesh: any;

    constructor(editor: any, curve: any) {
        this.editor = editor;
        this.curve = curve;
    }

    execute() {
        const { editor, curve } = this;
        const scene = editor.scene;

        const points = curve.getPoints(100);
        const line = MeshBuilder.CreateLines(
            "lines",
            {
                points: points,
                updatable: true,
            },
            scene
        );

        line.metadata = { model: curve }
        line.color = new Color3(0, 1, 0);

        editor.pickables.push(line);
        this.mesh = line;
    }

    undo() {
        const mesh = this.mesh;
        mesh.dispose();
    }
}
