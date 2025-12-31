import { Vector3, MeshBuilder, PointerDragBehavior, LinesMesh } from "@babylonjs/core";
import type { Mesh } from "@babylonjs/core";
import type { Parametric } from "../modeling/Parametric";

export class EditMesh {
    private pointerDragBehavior: PointerDragBehavior = new PointerDragBehavior();
    private spheres: Mesh[] = [];

    constructor() {
        const pointerDragBehavior = this.pointerDragBehavior;
        // use the specified axis/plane fixed
        pointerDragBehavior.useObjectOrientationForDragging = false;
        // disable update on every frame
        pointerDragBehavior.updateDragPlane = false;

        pointerDragBehavior.onDragStartObservable.add((event) => {
            console.log("dragStart");
            console.log(event);
        });
        pointerDragBehavior.onDragObservable.add((event) => {
            console.log("drag");
            console.log(event);
        });
        pointerDragBehavior.onDragEndObservable.add((event) => {
            console.log("dragEnd");
            console.log(event);
        });
    }

    set dragAxis(axis: Vector3) {
        this.pointerDragBehavior.options = { dragAxis: axis };
    }

    set dragPlaneNormal(normal: Vector3) {
        this.pointerDragBehavior.options = { dragPlaneNormal: normal };
    }

    registerMesh(mesh: Mesh) {
        const { pointerDragBehavior } = this;
        if (mesh instanceof LinesMesh) {
            const { curve }: { curve: Parametric } = mesh.metadata;
            const points = curve.designPoints;

            points.forEach((p, i) => {
                const sphere = MeshBuilder.CreateSphere(`sphere${i}`);
                // sphere.visibility = 0;
                sphere.addBehavior(pointerDragBehavior);
                sphere.position.x = p.x;
                sphere.position.y = p.y;
                sphere.position.z = p.z;
                this.spheres.push(sphere);
                // // Enable drag behavior to curve mesh
                // mesh.intersectionThreshold = 2;
                // mesh.addBehavior(pointerDragBehavior);
            });

        }
    }

    unregister() {
        this.spheres.forEach(e => e.dispose());
        this.spheres.length = 0;
    }

}