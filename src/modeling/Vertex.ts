import { Vector } from "./NurbsLib";
import { Parametric } from "./Parametric";
import { CurveHelper } from "../DesignHelper";

export interface Observable<T> {
    observers: T[];
    add(observer: T): void;
    remove(observer: T): void;
    notify(): void;
}

export class Vertex implements Observable<Parametric | CurveHelper> {
    observers: (Parametric | CurveHelper)[] = [];
    position: Vector;
    knuckle: boolean;
    tangentI: Vector;
    tangentO: Vector;

    constructor(position: Vector, knuckle: boolean = false, tangentIn: Vector = new Vector(), tangentOut: Vector = new Vector()) {
        this.position = position;
        this.knuckle = knuckle;
        this.tangentI = tangentIn;
        this.tangentO = tangentOut;
    }

    // notify the observer to update
    notify(): void {
        for (const observer of this.observers) {
            observer.update();
        }
    }

    // add obsrver
    add(observer: Parametric | CurveHelper): void {
        this.observers.push(observer);
    }

    // remove obsrver
    remove(observer: Parametric | CurveHelper): void {
        const index = this.observers.indexOf(observer);
        if (index > -1) {
            this.observers.splice(index, 1);
        }
    }

    private setVector(v: Vector, x: Vector | number = 0, y: number = 0, z: number = 0): void {
        if (x instanceof Vector) {
            v.x = x.x;
            v.y = x.y;
            v.z = x.z;
        } else {
            v.x = x;
            v.y = y;
            v.z = z;
        }
    }

    setPosition(x: Vector | number = 0, y: number = 0, z: number = 0): void {
        this.setVector(this.position, x, y, z);
        this.notify();
    }

    setKnuckle(bool: boolean): void {
        this.knuckle = bool;
        this.notify();
    }

    setTangentIn(x: Vector | number = 0, y: number = 0, z: number = 0): void {
        this.setVector(this.tangentI, x, y, z);
        this.notify();
    }

    setTangentOut(x: Vector | number = 0, y: number = 0, z: number = 0): void {
        this.setVector(this.tangentO, x, y, z);
        this.notify();
    }
}