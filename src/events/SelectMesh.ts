import { Plane as BPlane } from "@babylonjs/core";
import { GPUPicker, Color3, Mesh, PointerEventTypes, Matrix } from "@babylonjs/core";
import type { Scene, Observer, PointerInfo } from "@babylonjs/core";
import Editor from "../Editor";
import { Vector } from "../modeling/NurbsLib";
import { Plane } from "../modeling/Plane";
import { PICK_MARGIN } from "../constant";

export default class SelectMesh {
    public registered: boolean = false;
    public pickedObject: Mesh | undefined;

    private picker: GPUPicker = new GPUPicker();
    private savedMesh: Mesh | undefined;
    private savedColor: Color3 = new Color3(0, 0, 0);
    private observers: Observer<PointerInfo>[] = [];

    constructor(
        private editor: Editor,
        private onSelectMesh: (mesh?: Mesh) => void
    ) {
        const scene = editor.scene;
        this.registerCallbacks(scene);
    }

    registerCallbacks(scene: Scene) {
        if (this.registered) {
            this.removeCallbacks(scene);
        }

        this.observers.push(scene.onPointerObservable.add(this.onPointerMove, PointerEventTypes.POINTERMOVE));
        this.observers.push(scene.onPointerObservable.add(this.onPointerDown, PointerEventTypes.POINTERDOWN));
        this.registered = true;
        // console.log("registered");
        // console.log(this.editor.pickables);
    }

    removeCallbacks(scene: Scene) {
        this.observers.forEach((observer) => scene.onPointerObservable.remove(observer));
        this.observers.length = 0;
        this.registered = false;
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
        const mesh = this.savedMesh;
        if (mesh instanceof Mesh) {
            mesh.metadata.helper.setColor(this.savedColor);
            this.savedMesh = undefined;
        }
    }

    // Handle pointer move events to highlight objects under the cursor
    onPointerMove = () => {
        const { editor, picker } = this;
        const { scene } = editor;

        if (picker.pickingInProgress) return;

        const [x, y] = [scene.pointerX, scene.pointerY];
        const [x1, y1, x2, y2] = [x - PICK_MARGIN, y - PICK_MARGIN, x + PICK_MARGIN, y + PICK_MARGIN];

        if (this.savedMesh) this.restoreColor();

        picker.boxPickAsync(x1, y1, x2, y2).then((pickingInfo) => {
            if (pickingInfo) {
                if (pickingInfo.meshes[0] instanceof Mesh) {
                    const mesh = pickingInfo.meshes[0];
                    this.savedMesh = mesh;
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
        const { editor, picker } = this;
        const { scene } = editor;
        const [x, y] = [scene.pointerX, scene.pointerY];
        const [x1, y1, x2, y2] = [x - PICK_MARGIN, y - PICK_MARGIN, x + PICK_MARGIN, y + PICK_MARGIN];

        const event: PointerEvent = pointerInfo.event as PointerEvent;

        if (event.button === 0) {
            // left click
            picker.boxPickAsync(x1, y1, x2, y2).then((pickingInfo) => {
                if (pickingInfo) {
                    if (pickingInfo.meshes.length == 0) {
                        if (editor.editMesh.editing) return;
                        this.onSelectMesh();
                        this.pickedObject = undefined;
                        editor.editMesh.unregister();
                    } else if (pickingInfo.meshes[0] instanceof Mesh) {
                        const mesh = pickingInfo.meshes[0];
                        if (this.pickedObject == mesh) {
                            console.log("return");
                            return;
                        }
                        // excute onSelectMesh callback & register mesh to start editing
                        this.onSelectMesh(mesh);
                        editor.editMesh.registerMesh(mesh);
                        this.pickedObject = mesh;
                        // // remove callbacks
                        // const scene = editor.scene;
                        // this.removeCallbacks(scene);
                    }
                }
            });
        }

        if (event.button === 2) {
            // right click
            const camera = scene.activeCamera;
            if (!camera) return;
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

            editor.getUserCoord(0);
        }
    };

    // Set the list of pickable meshes for the GPU picker
    setPickingList(pickables?: Mesh[]) {
        const { editor, picker } = this;
        if (pickables) {
            picker.setPickingList(pickables);
        } else {
            picker.setPickingList(editor.pickables);
        }
    }
}
