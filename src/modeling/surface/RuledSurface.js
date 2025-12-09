import { deWeight, knotMults, elevateDegree } from "../NurbsLib.js";
import { NurbsSurface } from "./NurbsSurface.js";

class RuledSurface extends NurbsSurface {
    constructor(c0, c1) {
        super();

        this.curves = [];

        for (let i = 0; i < arguments.length; i++) {
            this.curves.push(arguments[i]);
        }

        if (arguments.length === 2) this.initialize();
    }

    initialize() {
        let deg, knot;
        const c0 = this.curves[0];
        const c1 = this.curves[1];

        if (c0.deg === c1.deg) {
            deg = c0.deg;
            knot = mergeKnots(knotMults(c0.knots), knotMults(c1.knots));
        } else if (c0.deg > c1.deg) {
            deg = c0.deg;
            const arr = elevateDegree(c1.deg, c1.knots, c1.ctrlpw, c0.deg - c1.deg);
            c1.initialize(
                deg,
                arr[0],
                deWeight(arr[1]),
                arr[1].map((e) => e.w)
            );
            knot = mergeKnots(knotMults(c0.knots), knotMults(arr[0]));
        } else if (c1.deg > c0.deg) {
            deg = c1.deg;
            const arr = elevateDegree(c0.deg, c0.knots, c0.ctrlpw, c1.deg - c0.deg);
            c0.initialize(
                deg,
                arr[0],
                deWeight(arr[1]),
                arr[1].map((e) => e.w)
            );
            knot = mergeKnots(knotMults(c1.knots), knotMults(arr[0]));
        }

        const ctrlp = [];
        const weights = [];

        knotRefinement(c0, knot);
        ctrlp[0] = c0.ctrlPoints;
        weights[0] = c0.weights;

        knotRefinement(c1, knot);
        ctrlp[1] = c1.ctrlPoints;
        weights[1] = c1.weights;

        super.initialize(deg, 1, knot, [0.0, 0.0, 1.0, 1.0], ctrlp, weights);
    }
}

function mergeKnots(arr0, arr1) {
    for (let j = 0; j < arr0.length; j++) {
        const e = arr0[j];
        let flag = true;

        for (let i = 0; i < arr1.length; i++) {
            if (arr1[i].knot === e.knot) {
                if (arr1[i].mult < e.mult) arr1[i].mult = e.mult;
                flag = false;
            }
        }

        if (flag) arr1.push(e);
    }

    const knots = [];

    for (let i = 0; i < arr1.length; i++) {
        for (let j = 0; j < arr1[i].mult; j++) {
            knots.push(arr1[i].knot);
        }
    }

    return knots.sort((a, b) => a - b);
}

function knotRefinement(curve, knot) {
    const knotmults0 = knotMults(curve.knots);
    const knotmults1 = knotMults(knot);

    for (let j = 0; j < knotmults1.length; j++) {
        const e = knotmults1[j];
        let isNew = true;

        for (let i = 0; i < knotmults0.length; i++) {
            if (knotmults0[i].knot === e.knot) {
                while (knotmults0[i].mult < e.mult) {
                    curve.insertKnotAt(e.knot);
                    knotmults0[i].mult++;
                }

                isNew = false;
            }
        }

        if (isNew) {
            for (let i = 0; i < e.mult; i++) {
                curve.insertKnotAt(e.knot);
            }
        }
    }
}

function merge(arr0, arr1) {
    const n = arr0.length;

    for (let i = 0; i < n; i++) {
        const e = arr0[i];
        if (includes(arr1, e)) arr1.push(e);
    }

    return arr1.sort((a, b) => a - b);
}

export { RuledSurface };
