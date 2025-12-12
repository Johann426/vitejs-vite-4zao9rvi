import type { Vector } from "./NurbsLib";

export default interface Curve {
    add(v: Vector): void;
    remove(i: number): void;
    mod(i: number, v: Vector): void;
    split(t: number): void;
    getPointAt(t: number): Vector;
    getDerivatives(t: number): Array<Vector>;
    clone(): Curve;
}
