import { GPUPicker, Mesh, LinesMesh, Color3, PointerEventTypes } from "@babylonjs/core";
import Editor from "./Editor";

// Tolerance in pixels for object picking
const PICK_TOLERANCE = 4;

export class PointerMove {
    editor: Editor;
    picker = new GPUPicker(); // set up gpu picker
    pickedObject: Mesh | undefined;
    savedColor = new Color3(0, 0, 0);

    constructor(editor: Editor) {
        this.editor = editor;

    }

    restoreColor() {
        console.log("hello")
        if (this.pickedObject instanceof LinesMesh) {
            this.pickedObject.color = this.savedColor;
            this.pickedObject = undefined
        }
    }

    onPointerMove = () => {
        const { picker } = this;
        const scene = this.editor.scene;
        if (picker.pickingInProgress) {
            return;
        }
        if (this.pickedObject) this.restoreColor();
        const x1 = scene.pointerX - PICK_TOLERANCE;
        const y1 = scene.pointerY - PICK_TOLERANCE;
        const x2 = scene.pointerX + PICK_TOLERANCE;
        const y2 = scene.pointerY + PICK_TOLERANCE;
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

    onPointerDownSelect = () => {

    }

    setPickables(pickables: Mesh[]) {
        if (pickables) {
            this.picker.setPickingList(pickables);
        } else {
            const editor = this.editor;
            this.picker.setPickingList(editor.pickables);
        }
    }

    addObservable() {
        const scene = this.editor.scene;
        scene.onPointerObservable.add(this.onPointerMove, PointerEventTypes.POINTERMOVE);
    }

    removeObservable() {
        const scene = this.editor.scene;
        scene.onPointerObservable.remove(this.onPointerMove);
    }

}
