import type Editor from "../Editor";
import type { Observer, PointerInfo } from "@babylonjs/core";
import { Vector3, LinesMesh, PointerEventTypes } from "@babylonjs/core";
import type Parametric from "../modeling/Parametric";
import { Vector } from "../modeling/NurbsLib";
import { PICK_MARGIN, CONFIG } from "../constant";

export default class EditMesh {
    public registered: boolean = false;
    public editing: boolean = false;

    private mesh: LinesMesh | null = null;
    private dragIndex: number = -1;
    private savedPt: Vector = new Vector();
    private observers: Observer<PointerInfo>[] = [];

    constructor(private editor: Editor) { }

    dispose() {
        this.unregister();
    }

    registerMesh(mesh: LinesMesh) {
        if (this.registered) this.unregister();

        this.mesh = mesh;
        this.registered = true;

        const { scene } = this.editor;
        this.observers = [
            scene.onPointerObservable.add(this.onPointerMove, PointerEventTypes.POINTERMOVE),
            scene.onPointerObservable.add(this.onPointerDown, PointerEventTypes.POINTERDOWN),
            scene.onPointerObservable.add(this.onPointerUp, PointerEventTypes.POINTERUP),
        ].filter(Boolean) as Observer<PointerInfo>[];
    }

    unregister() {
        if (!this.registered) return;
        const { scene } = this.editor;
        this.observers.forEach(o => scene.onPointerObservable.remove(o));
        this.observers.length = 0;
        this.registered = false;
        this.editing = false;
        this.mesh = null;
        this.dragIndex = -1;
    }

    // Screen-space proximity pick: returns index of the nearest design point within PICK_MARGIN pixels, or -1 if none.
    private pickNearestPoint(points: Vector[]): number {
        const { scene } = this.editor;
        const camera = scene.activeCamera;
        if (!camera) return -1;

        const cx = scene.pointerX;
        const cy = scene.pointerY;
        let minDist = PICK_MARGIN;
        let nearest = -1;

        for (let i = 0; i < points.length; i++) {
            const screen = this.editor.worldToScreen(
                camera,
                new Vector3(points[i].x, points[i].y, points[i].z)
            );
            const dist = Math.hypot(screen.x - cx, screen.y - cy);
            if (dist < minDist) {
                minDist = dist;
                nearest = i;
            }
        }

        return nearest;
    }

    private onPointerMove = () => {
        if (!this.editing || !this.mesh) return;

        const { curve }: { curve: Parametric } = this.mesh.metadata;
        const v = this.editor.getUserCoord(null);
        if (!v) return;

        curve.modify(this.dragIndex, v);
        this.editor.updateCurveMesh(this.mesh);
    };

    private onPointerDown = (pointerInfo: PointerInfo) => {
        if (!this.mesh) return;
        const event = pointerInfo.event as PointerEvent;
        if (event.button !== 0) return;

        const { curve }: { curve: Parametric } = this.mesh.metadata;
        const index = this.pickNearestPoint(curve.designPoints);
        if (index === -1) return;

        const p = curve.designPoints[index];
        this.savedPt = new Vector(p.x, p.y, p.z);
        this.dragIndex = index;
        this.editing = true;
    };

    private onPointerUp = (pointerInfo: PointerInfo) => {
        if (!this.editing || !this.mesh) return;
        const event = pointerInfo.event as PointerEvent;
        if (event.button !== 0) return;

        const { curve }: { curve: Parametric } = this.mesh.metadata;
        const pts = curve.designPoints;
        const newPt = new Vector(pts[this.dragIndex].x, pts[this.dragIndex].y, pts[this.dragIndex].z);

        // restore original so Command records the delta correctly
        curve.modify(this.dragIndex, this.savedPt);

        this.editor.selectMesh.pickedObject = this.mesh;
        this.editor.modPoint(this.dragIndex, newPt);

        this.editing = false;
        this.dragIndex = -1;
    };
}
