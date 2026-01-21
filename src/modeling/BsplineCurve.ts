import { parameterize, deBoorKnots, calcGreville, Vector, split } from "./NurbsLib.js";
import { Bspline } from "./Bspline.ts";

class BsplineCurve extends Bspline {
    needsUpdate: boolean = false;
    param: number[] = [];

    get ctrlPoints() {
        if (this.needsUpdate) {
            this.update();
        }

        return this.ctrlp;
    }

    get designPoints() {
        return this.ctrlp;
    }

    append(v: Vector) {
        this.ctrlp.push(new Vector(v.x, v.y, v.z));
        this.needsUpdate = true;
    }

    remove(i: number) {
        const removed = this.ctrlp.splice(i, 1);
        this.needsUpdate = true;
        return removed[0];
    }

    modify(i: number, v: Vector) {
        this.ctrlp[i] = new Vector(v.x, v.y, v.z);
        this.needsUpdate = true;
    }

    incert(i: number, v: Vector) {
        this.ctrlp.splice(i, 0, new Vector(v.x, v.y, v.z));
        this.needsUpdate = true;
    }

    incertPointAt(t: number, v: Vector) {
        if (t > this.tmin && t < this.tmax) {
            const i = this.param.findIndex((e) => e > t);
            this.incert(i, v);
        }
    }

    incertClosestPoint(v: Vector) {
        const t = this.closestPosition(v);

        if (t > this.tmin && t < this.tmax) {
            const i = calcGreville(this.deg, this.knots).findIndex((e) => e > t);
            this.incert(i, v);
            return i;
        } else if (t == this.tmin) {
            this.incert(0, v);
            return 0;
        } else if (t == this.tmax) {
            this.append(v);
            return this.param.length;
        } else {
            console.warn("Parametric position is out of range");
        }
    }

    split(t: number) {
        const tiny = 1e-9;
        const min = this.tmin + tiny;
        const max = this.tmax - tiny;
        if (t > min && t < max) {
            const arr = split(this.deg, this.knots, this.ctrlp, t);
            if (arr) {
                const c0 = new BsplineCurve(this.deg, arr[0], arr[1]);
                const c1 = new BsplineCurve(this.deg, arr[2], arr[3]);
                return [c0, c1];
            } else {
                console.log("%c no split result", "color: #ff7597; font-weight: bold; background-color: #242424");
            }
        } else {
            console.log("%c no split (out of range)", "color: #ff7597; font-weight: bold; background-color: #242424");
        }
    }

    update() {
        this.param = parameterize(this.ctrlp, "chordal");
        this.knots = deBoorKnots(this.deg, this.param);
        this.needsUpdate = false;
    }

    clone() {
        return new BsplineCurve(this.dmax, this.knots.slice(), this.ctrlp.slice());
    }

    toJSON() {
        const data = {
            metadata: {
                version: 1.0,
                type: this.constructor.name,
                generator: this.constructor.name + ".toJSON",
            },
            deg: this.deg,
            knots: this.knots,
            ctrlp: this.ctrlPoints,
        };

        return data;
    }

    static fromJSON(data: { deg: number, knots: number[], ctrlp: Vector[] }) {
        const deg = data.deg;
        const knot = data.knots;
        const ctrl = data.ctrlp.map((e) => new Vector(...e.components));
        return new BsplineCurve(deg, knot, ctrl);
    }
}

export { BsplineCurve };
