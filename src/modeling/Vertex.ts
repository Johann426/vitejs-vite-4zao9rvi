import { Vector } from "./NurbsLib";

export class Vertex {
    public reference?: any;

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

    set point(v: Vector) {
        this.position = new Vector(v.x, v.y, v.z);
    }

    get point() {
        return this.position;
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

    get knuckle() {
        return this._knuckle;
    }

    set tangentIn(v: Vector) {
        this.tangentI = new Vector(v.x, v.y, v.z);
    }

    get tangentIn() {
        return this.tangentI;
    }

    set tangentOut(v: Vector) {
        this.tangentO = new Vector(v.x, v.y, v.z);
    }

    get tangentOut() {
        return this.tangentO;
    }
}