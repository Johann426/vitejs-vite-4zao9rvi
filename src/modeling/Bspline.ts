import { curvePoint, curveDers, calcGreville, knotInsert, knotsRemoval, Vector } from "./NurbsLib.js";
import { Parametric } from "./Parametric.ts";

abstract class Bspline extends Parametric {
    protected dmax: number = 3;

    constructor(deg: number, knots: number[] | undefined, ctrlp: Vector[] | undefined) {
        super();
        this.initialize(deg, knots, ctrlp);
    }

    get deg() {
        const nm1 = this.ctrlp.length - 1;
        return nm1 > this.dmax ? this.dmax : nm1;
    }

    get ctrlPoints() {
        return this.ctrlp;
    }

    get nodes() {
        return calcGreville(this.deg, this.knots).map((e) => this.getPointAt(e));
    }

    public initialize(deg: number, knots: number[] | undefined, ctrlp: Vector[] | undefined) {
        this.dmax = deg !== undefined ? deg : 3;
        this.knots = knots !== undefined ? knots : [];
        this.ctrlp = ctrlp !== undefined ? ctrlp : [];
    }

    insertKnotAt(t: number) {
        if (t > this.tmin && t < this.tmax) knotInsert(this.deg, this.knots, this.ctrlp, t, 1);
    }

    removeKnotAt(t: number, n = 1, tol = 1e-4) {
        knotsRemoval(this.deg, this.knots, this.ctrlp, t, n, tol);
    }

    getPointAt(t: number) {
        return curvePoint(this.deg, this.knots, this.ctrlp, t);
    }

    getDerivatives(t: number, k: number) {
        return curveDers(this.deg, this.knots, this.ctrlp, t, k);
    }
}

export { Bspline };
