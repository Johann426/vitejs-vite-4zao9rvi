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

    // Restore the original color of the previously picked object
    restoreColor() {
        const mesh = this.pickedObject
        if (mesh instanceof LinesMesh) {
            mesh.metadata.helper.setColor(this.savedColor);
            this.pickedObject = undefined;

        }
    }

    // Handle pointer move events to highlight objects under the cursor
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
                    const mesh = pickingInfo.meshes[0];
                    this.pickedObject = mesh;
                    this.savedColor = mesh.metadata.helper.color;
                    mesh.metadata.helper.setColor(new Color3(1, 1, 0));
                    this.editor.glowLayer.referenceMeshToUseItsOwnMaterial(mesh);
                    this.editor.glowLayer.removeExcludedMesh(mesh);
                }
            }
        });
    };

    // Handle pointer down events to select objects
    onPointerDown = (pointerInfo: PointerInfo) => {
        const event: PointerEvent = pointerInfo.event as PointerEvent;

        if (event.button === 0) {
            const editor = this.editor;
            const { scene, picker, curvature, ctrlPoints, ctrlPolygon, designPoints } = editor;
            const x1 = scene.pointerX - PICK_TOLERANCE;
            const y1 = scene.pointerY - PICK_TOLERANCE;
            const x2 = scene.pointerX + PICK_TOLERANCE;
            const y2 = scene.pointerY + PICK_TOLERANCE;
            picker.boxPickAsync(x1, y1, x2, y2).then((pickingInfo) => {
                if (pickingInfo) {
                    if (pickingInfo.meshes.length == 0) {
                        [curvature, ctrlPoints, ctrlPolygon, designPoints].map(e => e.setVisible(false));
                    }
                    else if (pickingInfo.meshes[0] instanceof LinesMesh) {
                        const curve = pickingInfo.meshes[0].metadata.model;
                        editor.updateCurveHelper(curve);
                    }
                }
            });
        }

        if (event.button === 2) {
            console.log("right click")
        }
    };

    // Set the list of pickable meshes for the GPU picker
    setPickables(pickables: Mesh[]) {
        const editor = this.editor;
        const picker = editor.picker;
        if (pickables) {
            picker.setPickingList(pickables);
        } else {
            picker.setPickingList(editor.pickables);
        }
    }

    // Clean up observers when disposing of the SelectMesh instance
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
