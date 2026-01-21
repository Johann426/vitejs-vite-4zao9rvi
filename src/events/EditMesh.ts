import type Editor from "../Editor";
import type { Mesh } from "@babylonjs/core";
import { Vector3, MeshBuilder, PointerDragBehavior, LinesMesh, PointsCloudSystem } from "@babylonjs/core";
import type { Parametric } from "../modeling/Parametric";
import { Vector } from "../modeling/NurbsLib";

export class EditMesh {
    public editing: boolean = false;

    private ptrDrag: PointerDragBehavior[] = [];
    private spheres: Mesh[] = [];
    private savedPt: Vector = new Vector();

    constructor(
        private editor: Editor,
    ) { }

    // Clean up observers when disposing of the SelectMesh instance
    dispose() {
        this.spheres.forEach(e => e.dispose());
        this.spheres.length = 0;
    }

    registerMesh(mesh: Mesh) {
        this.unregister();

        const { editor } = this;
        const { scene } = editor;
        const camera = scene.activeCamera;
        if (!camera) return;

        const distance = Vector3.Distance(camera.position, new Vector3());
        const fov = camera.fov;
        const screenHeight = scene.getEngine().getRenderHeight();
        // 거리 d에서 월드 단위 1이 차지하는 픽셀 수 계산
        const worldUnitInPixels = screenHeight / (2 * Math.tan(fov / 2)) / distance;
        const desiredPixelSize = 10;
        // 원하는 픽셀 크기를 맞추기 위한 스케일
        const scale = desiredPixelSize / worldUnitInPixels;

        if (mesh instanceof LinesMesh) {
            this.editCurve(mesh, scale);
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

    async editCurve(mesh: LinesMesh, scale: number) {

        function delay(ms: number) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        await delay(200);

        const { editor } = this;
        const { scene } = editor;
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
            const sphere = MeshBuilder.CreateSphere(`sphere${i}`, { diameter: scale });
            this.spheres.push(sphere);
            sphere.visibility = 1;
            sphere.addBehavior(pointerDragBehavior);
            sphere.position = new Vector3(p.x, p.y, p.z);

            let pcs: PointsCloudSystem;
            let v: Vector3;

            pointerDragBehavior.onDragStartObservable.add(() => {
                this.editing = true;
                this.savedPt = p;
                // point being edited
                pcs = new PointsCloudSystem("editPoint", 10, scene);
                const func = (particle: { position: Vector3 }) => {
                    const v = curve.designPoints[i];
                    particle.position = new Vector3(v.x, v.y, v.z);
                }
                pcs.addPoints(1, func);
                pcs.buildMeshAsync();
            });

            pointerDragBehavior.onDragObservable.add(() => {
                const p = pointerDragBehavior.lastDragPosition;
                v = new Vector3(p.x, p.y, p.z);
                curve.modify(i, new Vector(v.x, v.y, v.z));
                editor.updateCurveMesh(mesh);
                const particles = pcs.particles;
                // update particle position
                particles[0].position = v;
                pcs.setParticles();
            })

            pointerDragBehavior.onDragEndObservable.add(() => {
                this.editing = false;
                // restore curve before drag for undo
                curve.modify(i, this.savedPt);
                // execute command
                editor.selectMesh.pickedObject = mesh;
                editor.modPoint(i, new Vector(v.x, v.y, v.z));
                pcs.dispose();
            });
        });
    }

}

// // Enable drag behavior to curve mesh
// mesh.intersectionThreshold = 2;
// mesh.addBehavior(pointerDragBehavior);