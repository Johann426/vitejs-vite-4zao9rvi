import type Editor from "../Editor";
import { Vector3, MeshBuilder, PointerDragBehavior, LinesMesh } from "@babylonjs/core";
import type { Mesh } from "@babylonjs/core";
import type { Parametric } from "../modeling/Parametric";
import { Vector } from "../modeling/NurbsLib";

export class EditMesh {
    private ptrDrag: PointerDragBehavior[] = [];
    private spheres: Mesh[] = [];
    private savedPoint: Vector = new Vector();

    constructor(
        private editor: Editor,
    ) { }

    registerMesh(mesh: Mesh) {
        const { editor } = this;

        this.unregister();

        if (mesh instanceof LinesMesh) {
            const { curve }: { curve: Parametric } = mesh.metadata;
            const points = curve.designPoints;

            points.forEach((p, i) => {
                const pointerDragBehavior = new PointerDragBehavior();
                this.ptrDrag.push(pointerDragBehavior);
                // use the specified axis/plane fixed
                pointerDragBehavior.useObjectOrientationForDragging = false;
                // disable update on every frame
                pointerDragBehavior.updateDragPlane = false;

                const sphere = MeshBuilder.CreateSphere(`sphere${i}`);
                this.spheres.push(sphere);
                sphere.visibility = 0;
                sphere.addBehavior(pointerDragBehavior);
                sphere.position = new Vector3(p.x, p.y, p.z);

                const vec = () => new Vector(sphere.position.x, sphere.position.y, sphere.position.z);

                // // Enable drag behavior to curve mesh
                // mesh.intersectionThreshold = 2;
                // mesh.addBehavior(pointerDragBehavior);
                pointerDragBehavior.onDragStartObservable.add(() => {
                    this.savedPoint = p;
                });
                pointerDragBehavior.onDragObservable.add(() => {
                    curve.modify(i, vec());
                    editor.updateCurveMesh(mesh);
                });
                pointerDragBehavior.onDragEndObservable.add(() => {
                    // restore curve before drag for undo
                    curve.modify(i, this.savedPoint);
                    // execute command
                    editor.selectMesh.pickedObject = mesh;
                    editor.modPoint(i, vec());
                });

            });

        }
    }

    unregister() {
        const { ptrDrag, spheres } = this;

        ptrDrag.forEach(e => {
            e.onDragStartObservable.clear();
            e.onDragObservable.clear();
            e.onDragEndObservable.clear()
        })
        ptrDrag.length = 0;

        spheres.forEach(e => e.dispose());
        spheres.length = 0;
    }

}