import { Mesh, LinesMesh, Color3, PointerEventTypes } from "@babylonjs/core";
import Editor from "../Editor";

// Tolerance in pixels for object picking
const PICK_TOLERANCE = 4;

export class SelectMesh {
    editor: Editor;
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
        const { scene, picker } = this.editor;
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

    onPointerDown = () => {
        const { scene, picker, designPoints, ctrlPoints, ctrlPolygon, curvature } = this.editor;
        const x1 = scene.pointerX - PICK_TOLERANCE;
        const y1 = scene.pointerY - PICK_TOLERANCE;
        const x2 = scene.pointerX + PICK_TOLERANCE;
        const y2 = scene.pointerY + PICK_TOLERANCE;
        picker.boxPickAsync(x1, y1, x2, y2).then((pickingInfo) => {
            if (pickingInfo) {
                if (pickingInfo.meshes[0] instanceof LinesMesh) {
                    const curve = pickingInfo.meshes[0].metadata.model
                    designPoints.update(curve.designPoints);
                    ctrlPoints.update(curve.ctrlPoints);
                    ctrlPolygon.update(curve.ctrlPoints);
                    curvature.update(curve);
                    designPoints.setVisible(true);
                    ctrlPoints.setVisible(true);
                    ctrlPolygon.setVisible(true);
                    curvature.setVisible(true);
                } else {
                    designPoints.setVisible(false);
                    ctrlPoints.setVisible(false);
                    ctrlPolygon.setVisible(false);
                    curvature.setVisible(false);
                }
            } else {

            }
        });

    }

    setPickables(pickables: Mesh[]) {
        const editor = this.editor;
        const picker = editor.picker;
        if (pickables) {
            picker.setPickingList(pickables);
        } else {

            picker.setPickingList(editor.pickables);
        }
    }

    addObservable() {
        const scene = this.editor.scene;
        scene.onPointerObservable.add(this.onPointerMove, PointerEventTypes.POINTERMOVE);
        scene.onPointerObservable.add(this.onPointerDown, PointerEventTypes.POINTERDOWN);
    }

    removeObservable() {
        const scene = this.editor.scene;
        scene.onPointerObservable.remove(this.onPointerMove);
    }

}
