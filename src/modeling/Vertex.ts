import { Vector } from "./NurbsLib";

export class Vertex {
    /**
     * @param position defines position vector of the vertex
     * @param _knuckle defines knuckle
     * @param tangentI defines tangential vector entering the vertex
     * @param tangentO defines tangential vector exiting the vertex
     */
    constructor(
        private position: Vector,
        private _knuckle: boolean = false,
        private tangentI: Vector = new Vector(),
        private tangentO: Vector = new Vector(),
    ) { }

    get point() {
        return this.position;
    }

    set point(v: Vector) {
        this.position = v;
    }

    get tangentIn() {
        return this.tangentI;
    }

    set tangentIn(v: Vector) {
        this.tangentI = v;
    }

    get tangentOut() {
        return this.tangentO;
    }

    set tangentOut(v: Vector) {
        this.tangentO = v;
    }

    get knuckle() {
        return this._knuckle;
    }

    set knuckle(bool: boolean) {
        if (bool) {
            this._knuckle = true;
        } else {
            this._knuckle = false;
            this.tangentI = new Vector();
            this.tangentO = new Vector();
        }
    }
}
