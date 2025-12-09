import { GPUPicker, Mesh, LinesMesh, Color3 } from "@babylonjs/core";
import Editor from "../Editor";

export class PickingCommand {
    editor: Editor;
    pickedObject: Mesh | undefined;
    savedColor = new Color3(0, 0, 0);

    constructor(editor: Editor) {
        this.editor = editor;
        const scene = editor.scene;

        // set up gpu picker
        const picker = new GPUPicker();
        picker.setPickingList(editor.pickables);

        const restoreColor = () => {
            if (this.pickedObject instanceof LinesMesh) {
                this.pickedObject.color = this.savedColor;
                this.pickedObject = undefined;
            }
        };

        const onPointerMove = () => {
            if (picker.pickingInProgress) {
                return;
            }
            if (this.pickedObject) restoreColor();
            const offset = 2;
            const x1 = scene.pointerX - offset;
            const y1 = scene.pointerY - offset;
            const x2 = scene.pointerX + offset;
            const y2 = scene.pointerY + offset;
            picker.boxPickAsync(x1, y1, x2, y2).then((pickingInfo) => {
                if (pickingInfo) {
                    if (pickingInfo.meshes[0] instanceof LinesMesh) {
                        this.pickedObject = pickingInfo.meshes[0];
                        this.savedColor = pickingInfo.meshes[0].color;
                        pickingInfo.meshes[0].color = new Color3(1, 1, 0);
                    }
                }
            });
        };
    }

    execute() {}

    undo() {}
}
