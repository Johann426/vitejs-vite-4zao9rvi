import { MeshBuilder, Color3, } from "@babylonjs/core";

export class AddCurveCommand {
    editor: any;
    curve: any;

    constructor(editor: any, curve: any) {

        this.editor = editor;
        this.curve = curve;

    }

    execute() {

        const { editor, curve } = this;

        const points = curve.getPoints(100)
        const mesh = MeshBuilder.CreateLines("myline", { points }, scene);
        mesh.color = new Color3(0, 1, 0);

    }

    undo() {

    }


}