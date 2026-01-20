import type Editor from "../Editor";
import type { Mesh } from "@babylonjs/core";
import { Vector3, MeshBuilder, PointerDragBehavior, LinesMesh, PointsCloudSystem } from "@babylonjs/core";
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
        const { scene } = editor;

        this.unregister();

        if (mesh instanceof LinesMesh) {
            const { curve }: { curve: Parametric } = mesh.metadata;
            const points = curve.designPoints;

            points.forEach((p, i) => {
                // pointer drag behavier for each point
                const pointerDragBehavior = new PointerDragBehavior();
                this.ptrDrag.push(pointerDragBehavior);
                // use the specified axis/plane fixed
                pointerDragBehavior.useObjectOrientationForDragging = false;
                // disable update on every frame
                pointerDragBehavior.updateDragPlane = false;

                // create invisible sphere 
                const sphere = MeshBuilder.CreateSphere(`sphere${i}`);
                this.spheres.push(sphere);
                sphere.visibility = 1;
                sphere.addBehavior(pointerDragBehavior);
                sphere.position = new Vector3(p.x, p.y, p.z);

                let pcs: PointsCloudSystem;

                pointerDragBehavior.onDragStartObservable.add(() => {
                    this.savedPoint = p;
                    // point being edited
                    pcs = new PointsCloudSystem("editPoint", 10, scene);
                    const func = (particle: { position: Vector3 }) => {
                        const v = curve.designPoints[i];
                        particle.position = new Vector3(v.x, v.y, v.z);
                    }
                    pcs.addPoints(1, func);
                    pcs.buildMeshAsync().then(() => { });

                });

                pointerDragBehavior.onDragObservable.add(() => {
                    const v = getSpherePosition();
                    curve.modify(i, v);
                    editor.updateCurveMesh(mesh);
                    const particles = pcs.particles;
                    // update particle positions from points data
                    particles[0].position = new Vector3(v.x, v.y, v.z);
                    pcs.setParticles();
                })

                pointerDragBehavior.onDragEndObservable.add(() => {
                    // restore curve before drag for undo
                    curve.modify(i, this.savedPoint);
                    // execute command
                    editor.selectMesh.pickedObject = mesh;
                    editor.modPoint(i, getSpherePosition());
                    pcs.dispose();
                });

                function getSpherePosition() {
                    const p = sphere.position;
                    return new Vector(p.x, p.y, p.z);
                }
            });
        }
    }

    unregister() {
        const { ptrDrag, spheres } = this;

        ptrDrag.forEach(e => {
            e.onDragStartObservable.clear();
            e.onDragEndObservable.clear()
            e.onDragObservable.clear();
        })
        ptrDrag.length = 0;

        spheres.forEach(e => e.dispose());
        spheres.length = 0;
    }

}

// // Enable drag behavior to curve mesh
// mesh.intersectionThreshold = 2;
// mesh.addBehavior(pointerDragBehavior);