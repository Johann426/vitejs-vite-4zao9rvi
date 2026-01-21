import { PointerEventTypes, Matrix } from "@babylonjs/core";
import type { Scene, Observer, PointerInfo, } from "@babylonjs/core";
import Editor from "../Editor";
import { Vector } from "../modeling/NurbsLib";
import { Plane } from "../modeling/Plane";

interface callbackProps {
    onPointerMove: (v: Vector) => void,
    onPointerDown: (v: Vector) => void,
    onPointerUp: (v: Vector) => void,
};

export class SketchInput {
    private observers: Observer<PointerInfo>[] = [];
    private _sketchPl: Plane = new Plane();
    private _callback: callbackProps;

    constructor(
        private editor: Editor,
    ) {
        this._callback = {
            onPointerMove: () => { },
            onPointerDown: () => { },
            onPointerUp: () => { },
        };
    }

    get callback() {
        return this._callback;
    }

    set callback(callback: callbackProps) {
        this._callback = callback;
    }

    get sketchPlane() {
        return this._sketchPl
    }

    set sketchPlane(plane: Plane) {
        this._sketchPl = plane
    }

    registerCallbacks(scene: Scene) {
        this.observers.push(scene.onPointerObservable.add(this.onPointerMove, PointerEventTypes.POINTERMOVE));
        this.observers.push(scene.onPointerObservable.add(this.onPointerDown, PointerEventTypes.POINTERDOWN));
        this.observers.push(scene.onPointerObservable.add(this.onPointerUp, PointerEventTypes.POINTERUP));
    }

    removeCallbacks(scene: Scene) {
        this.observers.forEach(observer => scene.onPointerObservable.remove(observer));
        this.observers.length = 0;
    }

    // Clean up observers when disposing of the SelectMesh instance
    dispose() {
        const scene = this.editor.scene;
        this.removeCallbacks(scene);
    }

    // Resolve the pointer input to a corresponding point on the sketch plane(or surface)
    coord() {
        const { editor } = this
        const { scene } = editor;

        const camera = scene.activeCamera;
        if (!camera) return;

        const ray = scene.createPickingRay(scene.pointerX, scene.pointerY, Matrix.Identity(), camera);
        const plane = this.sketchPlane;
        const origin = new Vector(ray.origin.x, ray.origin.y, ray.origin.z);
        const direction = new Vector(ray.direction.x, ray.direction.y, ray.direction.z);
        // console.log("camera", camera?.position);
        // console.log("origin", origin.components);
        // console.log("direction", direction.components);
        const intersection = plane.intersectRay({ origin: origin, direction: direction });
        // console.log("intersect", intersection?.components);
        return intersection;
    }

    onPointerMove = () => {
        const v = this.coord();

        if (v) {
            this.callback.onPointerMove(v);
        }
    };

    onPointerDown = () => {
        const v = this.coord();

        if (v) {
            this.callback.onPointerDown(v);
        }
    };

    onPointerUp = () => {
        const v = this.coord();

        if (v) {
            this.callback.onPointerUp(v);
        }
    }
}
