import { Plane as BPlane } from "@babylonjs/core";
import { GPUPicker, Color3, Mesh, PointerEventTypes, Matrix } from "@babylonjs/core";
import type { Scene, Observer, PointerInfo, } from "@babylonjs/core";
import Editor from "../Editor";
import { Vector } from "../modeling/NurbsLib";
import { Plane } from "../modeling/Plane";

// Tolerance in pixels for object picking
const PICK_TOLERANCE = 4;

export class SelectMesh {
    public pickedObject: Mesh | undefined;
    private picker: GPUPicker = new GPUPicker();
    private savedColor = new Color3(0, 0, 0);
    private observers: Observer<PointerInfo>[] = [];

    constructor(
        private editor: Editor,
        private onSelectMesh: (mesh?: Mesh) => void
    ) {
        const scene = editor.scene;
        this.registerCallbacks(scene);
    }

    registerCallbacks(scene: Scene) {
        this.observers.push(scene.onPointerObservable.add(this.onPointerMove, PointerEventTypes.POINTERMOVE));
        this.observers.push(scene.onPointerObservable.add(this.onPointerDown, PointerEventTypes.POINTERDOWN));
    }

    removeCallbacks(scene: Scene) {
        this.observers.forEach(observer => scene.onPointerObservable.remove(observer));
        this.observers.length = 0;
    }

    // Clean up observers when disposing of the SelectMesh instance
    dispose() {
        this.pickedObject = undefined;
        this.picker.dispose();
        const scene = this.editor.scene;
        this.removeCallbacks(scene);
    }

    // Restore the original color of the previously picked object
    restoreColor() {
        const mesh = this.pickedObject
        if (mesh instanceof Mesh) {
            mesh.metadata.helper.setColor(this.savedColor);
            this.pickedObject = undefined;

        }
    }

    // Handle pointer move events to highlight objects under the cursor
    onPointerMove = () => {
        const { editor, picker } = this
        const { scene } = editor;

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
                if (pickingInfo.meshes[0] instanceof Mesh) {
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
        const { editor, picker } = this
        const { scene } = editor;

        const event: PointerEvent = pointerInfo.event as PointerEvent;

        if (event.button === 0) { // left click
            const x1 = scene.pointerX - PICK_TOLERANCE;
            const y1 = scene.pointerY - PICK_TOLERANCE;
            const x2 = scene.pointerX + PICK_TOLERANCE;
            const y2 = scene.pointerY + PICK_TOLERANCE;
            picker.boxPickAsync(x1, y1, x2, y2).then((pickingInfo) => {
                if (pickingInfo) {
                    if (pickingInfo.meshes.length == 0) {
                        this.onSelectMesh();
                    }
                    else if (pickingInfo.meshes[0] instanceof Mesh) {
                        const mesh = pickingInfo.meshes[0];
                        this.onSelectMesh(mesh);
                    }
                }
            });
        }

        if (event.button === 2) { // right click
            const camera = scene.activeCamera;
            const ray = scene.createPickingRay(scene.pointerX, scene.pointerY, Matrix.Identity(), camera);
            // const rayHelper = new RayHelper(ray);
            // rayHelper.show(scene);
            // const pickingInfo = ray.intersectsMesh(mesh);
            const plane = new Plane();
            const origin = new Vector(ray.origin.x, ray.origin.y, ray.origin.z);
            const direction = new Vector(ray.direction.x, ray.direction.y, ray.direction.z);
            console.log("camera", camera?.position);
            console.log("origin", origin.components);
            console.log("direction", direction.components);
            const intersection = plane.intersectRay({ origin: origin, direction: direction });
            console.log("intersect", intersection?.components);

            const groundPlane = new BPlane(0, 0, 1, 0);
            const distance = ray.intersectsPlane(groundPlane);
            if (distance) {
                const hitPoint = ray.origin.add(ray.direction.scale(distance));
                console.log("hitPoint", [hitPoint.x, hitPoint.y, hitPoint.z]);
            }

        }



    };

    // Set the list of pickable meshes for the GPU picker
    setPickables(pickables: Mesh[]) {
        const { editor, picker } = this
        if (pickables) {
            picker.setPickingList(pickables);
        } else {
            picker.setPickingList(editor.pickables);
        }
    }
}
