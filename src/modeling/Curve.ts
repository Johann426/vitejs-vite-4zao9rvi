import type { Vector } from "./NurbsLib";

export default interface Curve<T> {
    designPoints: T[];
    append(v: Vector): void;
    remove(i: number): void;
    modify(i: number, v: Vector): void;
    incert(i: number, v: Vector): void;
    clone(): Curve<T>;
}
