import { weightedCtrlp, deWeight, parameterize, deBoorKnots, calcGreville, split, Vector } from "./NurbsLib.js";
import { Nurbs } from "./Nurbs.js";

class NurbsCurve extends Nurbs {
    get ctrlPoints() {
        if (this.needsUpdate) {
            const ctrlp = deWeight(this.ctrlpw);
            this.prm = parameterize(ctrlp, "chordal");
            this.knots = deBoorKnots(this.deg, this.prm);
            this.needsUpdate = false;
        }

        return deWeight(this.ctrlpw);
    }

    get designPoints() {
        return this.ctrlpw;
        //return deWeight( this.ctrlpw );
    }

    get parameter() {
        return this.prm;
    }

    add(v) {
        const w = 1.0;
        this.ctrlpw.push(weightedCtrlp(v, w));
        this.needsUpdate = true;
    }

    remove(i) {
        const removed = this.ctrlpw.splice(i, 1);
        this.needsUpdate = true;
        return deWeight(removed[0]);
    }

    mod(i, v) {
        const w = this.ctrlpw[i].w;
        this.ctrlpw[i] = weightedCtrlp(v, w);
        this.needsUpdate = true;
    }

    incert(i, v) {
        const w = 1.0;
        this.ctrlpw.splice(i, 0, weightedCtrlp(v, w));
        this.needsUpdate = true;
    }

    incertPointAt(t, v) {
        if (t > this.tmin && t < this.tmax) {
            const i = this.prm.findIndex((e) => e > t);
            this.incert(i, v);
        }
    }

    incertClosestPoint(v) {
        const t = this.closestPosition(v);

        if (t > this.tmin && t < this.tmax) {
            const i = calcGreville(this.deg, this.knots).findIndex((e) => e > t);
            this.incert(i, v);
            return i;
        } else if (t == this.tmin) {
            this.incert(0, v);
            return 0;
        } else if (t == this.tmax) {
            this.add(v);
            return this.prm.length;
        } else {
            console.warn("Parametric position is out of range");
        }
    }

    split(t) {
        const tiny = 1e-9;
        const min = this.tmin + tiny;
        const max = this.tmax - tiny;

        if (t > min && t < max) {
            const arr = split(this.deg, this.knots, this.ctrlpw, t);
            const c0 = new this.constructor(
                this.deg,
                arr[0],
                deWeight(arr[1]),
                arr[1].map((e) => e.w)
            );
            const c1 = new this.constructor(
                this.deg,
                arr[2],
                deWeight(arr[3]),
                arr[3].map((e) => e.w)
            );
            return [c0, c1];
        } else {
            console.log("%c no split (out of range)", "color: #ff7597; font-weight: bold; background-color: #242424");
        }
    }

    clone() {
        return new this.constructor(this.dmax, this.knots.slice(), this.ctrlPoints.slice(), this.weights.slice());
    }

    toJSON() {
        const data = {
            metadata: {
                version: 1.0,
                type: this.constructor.name,
                generator: this.constructor.name + ".toJSON",
            },
        };

        data.deg = this.deg;
        data.knots = this.knots;
        data.ctrlp = this.ctrlPoints;
        data.weight = this.weights;

        return data;
    }

    static fromJSON(data) {
        const deg = data.deg;
        const knot = data.knots;
        const ctrl = data.ctrlp.map((e) => new Vector(...e.components));
        const w = data.weight;
        return new NurbsCurve(deg, knot, ctrl, w);
    }
}

export { NurbsCurve };
