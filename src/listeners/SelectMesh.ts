import { Color3, LinesMesh, PointerEventTypes } from "@babylonjs/core";
import type { Mesh, Nullable, Observer, PointerInfo, } from "@babylonjs/core";
import Editor from "../Editor";

// Tolerance in pixels for object picking
const PICK_TOLERANCE = 4;

export class SelectMesh {
    editor: Editor;
    pickedObject: Mesh | undefined;
    savedColor = new Color3(0, 0, 0);
    pointerMoveObserver: Nullable<Observer<PointerInfo>> = null;
    pointerDownObserver: Nullable<Observer<PointerInfo>> = null;

    constructor(editor: Editor) {
        this.editor = editor;
        const scene = editor.scene;
        this.pointerMoveObserver = scene.onPointerObservable.add(this.onPointerMove, PointerEventTypes.POINTERMOVE);
        this.pointerDownObserver = scene.onPointerObservable.add(this.onPointerDown, PointerEventTypes.POINTERDOWN);
    }

    restoreColor() {
        if (this.pickedObject instanceof LinesMesh) {
            this.pickedObject.color = this.savedColor;
            this.pickedObject = undefined;
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
                if (pickingInfo.meshes.length == 0) {
                    designPoints.setVisible(false);
                    ctrlPoints.setVisible(false);
                    ctrlPolygon.setVisible(false);
                    curvature.setVisible(false);
                }
                else if (pickingInfo.meshes[0] instanceof LinesMesh) {
                    const curve = pickingInfo.meshes[0].metadata.model;
                    designPoints.update(curve.designPoints);
                    ctrlPoints.update(curve.ctrlPoints);
                    ctrlPolygon.update(curve.ctrlPoints);
                    curvature.update(curve);
                }
            }
        });
    };

    setPickables(pickables: Mesh[]) {
        const editor = this.editor;
        const picker = editor.picker;
        if (pickables) {
            picker.setPickingList(pickables);
        } else {
            picker.setPickingList(editor.pickables);
        }
    }

    dispose() {
        const scene = this.editor.scene;
        if (this.pointerMoveObserver) {
            scene.onPointerObservable.remove(this.pointerMoveObserver);
            this.pointerMoveObserver = null;
        }
        if (this.pointerDownObserver) {
            scene.onPointerObservable.remove(this.pointerDownObserver);
            this.pointerDownObserver = null;
        }
    }
}
