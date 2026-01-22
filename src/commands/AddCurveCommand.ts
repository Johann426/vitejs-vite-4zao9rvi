import type Command from "./Command.js";
import type Editor from "../Editor";
import type { Parametric } from "../modeling/Parametric";
import { LinesMesh, Color3 } from "@babylonjs/core";
import { CurveHelper } from "../DesignHelper";

const lineColor = new Color3(0, 1, 0)

export class AddCurveCommand implements Command {
    private mesh: LinesMesh;

    constructor(
        private editor: Editor,
        curve: Parametric
    ) {
        const scene = editor.scene;

        const curvehelper = new CurveHelper(lineColor, curve);
        curvehelper.initialize(scene);
        curvehelper.update();

        const mesh = curvehelper.getMesh();
        mesh.metadata = { curve: curve, helper: curvehelper };
        this.mesh = mesh;
    }

    execute() {
        const { editor, mesh } = this;
        const { selectMesh } = editor;
        editor.pickables.push(mesh);
        selectMesh.setPickingList();
        editor.updateCurveMesh(mesh);
    }

    undo() {
        const { editor, mesh } = this;
        const index = editor.pickables.indexOf(mesh);
        if (index !== -1) {
            editor.pickables.splice(index, 1);
        }
        editor.updateCurveMesh(mesh)
    }

    redo() {
        this.execute();
    }

}
