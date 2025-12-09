import {
    nurbsCurvePoint,
    nurbsCurveDers,
    weightedCtrlp,
    deWeight,
    calcGreville,
    knotInsert,
    knotsRemoval,
} from "./NurbsLib.js";
import { Parametric } from "./Parametric.js";

class Nurbs extends Parametric {
    constructor(deg, knots, ctrlp, weight) {
        super();

        this.initialize(deg, knots, ctrlp, weight);
    }

    get deg() {
        const nm1 = this.ctrlpw.length - 1;
        return nm1 > this.dmax ? this.dmax : nm1;
    }

    get ctrlPoints() {
        return deWeight(this.weightedControlPoints);
    }

    get weightedControlPoints() {
        return this.ctrlpw;
    }

    get nodes() {
        return calcGreville(this.deg, this.knots).map((e) => this.getPointAt(e));
    }

    get weights() {
        return this.weightedControlPoints.map((e) => e.w);
    }

    initialize(deg, knots, ctrlp, weight) {
        this.dmax = deg;

        this.knots = knots !== undefined ? knots : [];

        this.ctrlpw = ctrlp !== undefined ? ctrlpw() : [];

        function ctrlpw() {
            if (ctrlp[0].w) {
                //assume Vector4 to be weighted control points

                return ctrlp;
            } else {
                const w = weight !== undefined ? weight : new Array(ctrlp.length).fill(1.0);

                return weightedCtrlp(ctrlp, w);
            }
        }
    }

    insertKnotAt(t) {
        if (t > this.tmin && t < this.tmax) knotInsert(this.deg, this.knots, this.ctrlpw, t, 1);
    }

    removeKnotAt(t, n = 1, tol = 1e-4) {
        knotsRemoval(this.deg, this.knots, this.ctrlpw, t, n, tol);
    }

    getPointAt(t) {
        return nurbsCurvePoint(this.deg, this.knots, this.ctrlpw, t);
    }

    getDerivatives(t, k) {
        return nurbsCurveDers(this.deg, this.knots, this.ctrlpw, t, k);
    }
}

export { Nurbs };
