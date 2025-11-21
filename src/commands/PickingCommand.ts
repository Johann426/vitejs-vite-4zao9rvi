import { GPUPicker, Color3 } from "@babylonjs/core";
import Editor from "../Editor";

export class PickingCommand {
    editor: Editor;

    constructor(editor: Editor) {
        this.editor = editor;
        const picker = new GPUPicker();
        picker.setPickingList(editor.pickables);

        const scene = editor.scene;

        console.log(scene);

        scene.onPointerObservable.add(() => {
            if (picker.pickingInProgress) {
                return;
            }
            picker.pickAsync(scene.pointerX, scene.pointerY, undefined, undefined).then((pickingInfo) => {
                if (pickingInfo) {
                    console.log(pickingInfo.mesh.name);
                    pickingInfo.mesh.color = new Color3(1, 1, 0);
                }
            });
        });
    }

    execute() {}

    undo() {}
}
