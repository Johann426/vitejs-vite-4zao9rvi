import { parameterize, assignKnot, globalCurveInterpTngt, split, Vector, } from "./NurbsLib.js";
import { Bspline } from "./Bspline.ts";
import { BsplineCurve } from "./BsplineCurve.ts";
import type { Parametric } from "./Parametric.ts";

interface Observable {
    add(observer: Parametric): void;
    remove(observer: Parametric): void;
    notify(): void;
}

export class Pole implements Observable {
    private observers: Parametric[] = [];
    point: Vector;
    fold: boolean;
    in: Vector | null;
    out: Vector | null;

    constructor(point: Vector, knuckle: boolean = false, tangentIn: Vector | null = null, tangentOut: Vector | null = null) {
        this.point = point;
        this.fold = knuckle;
        this.in = tangentIn;
        this.out = tangentOut;
    }

    add(observer: Parametric): void {
        this.observers.push(observer);
    }

    remove(observer: Parametric): void {
        const index = this.observers.indexOf(observer);
        if (index > -1) {
            this.observers.splice(index, 1);
        }
    }

    notify(): void {
        for (const observer of this.observers) {
            observer.update();
        }
    }

    setPoint(x: number, y: number, z: number): void {
        this.point.x = x;
        this.point.y = y;
        this.point.z = z;
        this.notify();
    }
}

export class BsplineCurveInt extends Bspline {
    method = "chordal";
    needsUpdate: boolean = false;

    constructor(deg: number, private pole: Array<Pole>) {
        super(deg, Array(), Array());

        if (pole !== undefined) {
            this.pole = pole;
            this._calcCtrlPoints();
        } else {
            this.pole = [];
        }
    }

    get deg() {
        const nm1 = this.pole.length - 1;
        return nm1 > 1 ? this.dmax : nm1;
    }

    get ctrlPoints() {
        if (this.needsUpdate) this._calcCtrlPoints();
        return this.ctrlp;
    }

    get designPoints() {
        return this.pole.map((e) => e.point);
    }

    get parameter() {
        return this.prm;
    }

    add(v: Vector) {
        // this.pole.push({ point: new Vector(v.x, v.y, v.z) });
        const point = new Vector(v.x, v.y, v.z);
        this.pole.push(new Pole(point));
        this.needsUpdate = true;
    }

    remove(i: number) {
        const removed = this.pole.splice(i, 1);
        this.needsUpdate = true;
        return removed[0];
    }

    mod(i: number, v: Vector) {
        this.pole[i].point = new Vector(v.x, v.y, v.z);
        this.needsUpdate = true;
    }

    incert(i: number, v: Vector) {
        // this.pole.splice(i, 0, { point: new Vector(v.x, v.y, v.z) });
        const point = new Vector(v.x, v.y, v.z);
        this.pole.splice(i, 0, new Pole(point));
        this.needsUpdate = true;
    }

    incertPointAt(t: number, v: Vector) {
        if (t > this.tmin && t < this.tmax) {
            const i = this.prm.findIndex((e) => e > t);
            this.incert(i, v);
        }
    }

    incertClosestPoint(v: Vector, isKept: boolean) {
        const t = this.closestPosition(v);
        const p = isKept ? new Vector(v.x, v.y, v.z) : this.getPointAt(t);

        if (t > this.tmin && t < this.tmax) {
            const i = this.prm.findIndex((e) => e > t);
            this.incert(i, p);
            return i;
        } else if (t == this.tmin) {
            this.incert(0, v);
            return 0;
        } else if (t == this.tmax) {
            this.add(v);
            return this.prm.length;
        } else {
            console.warn("Parametric position is out of range", t);
        }
    }

    addTangent(i: number, v: Vector) {
        v.normalize();
        Object.assign(this.pole[i], { fold: true, in: new Vector(v.x, v.y, v.z), out: new Vector(v.x, v.y, v.z) });
        this.needsUpdate = true;
    }

    addKnuckle(i: number, v: Vector, inout) {
        if (typeof v == "boolean") {
            Object.assign(this.pole[i], { fold: v });
        } else {
            v.normalize();
            Object.assign(this.pole[i], { fold: true });
            this.pole[i][inout] = new Vector(v.x, v.y, v.z);
        }

        this.needsUpdate = true;
    }

    removeKnuckle(i: number) {
        const removed = ["fold", "in", "out"].map((key) => this.pole[i][key]);
        ["fold", "in", "out"].map((key) => delete this.pole[i][key]);
        this.needsUpdate = true;
        return removed;
    }

    removeTangent(i: number) {
        const removed = this.pole[i].out;
        ["fold", "in", "out"].map((key) => delete this.pole[i][key]);
        this.needsUpdate = true;
        return removed;
    }

    getPointAt(t: number) {
        if (this.needsUpdate) this._calcCtrlPoints();
        return super.getPointAt(t);
    }

    getPoints(n: number) {
        if (this.needsUpdate) this._calcCtrlPoints();
        return super.getPoints(n);
    }

    getDerivatives(t: number, k: number) {
        if (this.needsUpdate) this._calcCtrlPoints();
        return super.getDerivatives(t, k);
    }

    interrogations(n: number) {
        if (this.needsUpdate) this._calcCtrlPoints();

        return super.interrogations(n);
    }

    update() {
        this._calcCtrlPoints();
    }

    _calcCtrlPoints() {
        this._subdivision();

        this.needsUpdate = false;
    }

    // Subdivide a curve into local parts
    _subdivision() {
        const n = this.pole.length;
        const index = []; // index array of corners
        index.push(0); // the first into index

        for (let i = 1; i < n - 1; i++) {
            this.pole[i].fold ? index.push(i) : null; // knuckle into index
        }

        index.push(n - 1); // the last into index

        const lPole = []; // local pole points

        for (let i = 1; i < index.length; i++) {
            const tmp = this.pole.slice(index[i - 1], index[i] + 1);
            lPole.push(tmp.map((e) => Object.assign({}, e)));
        }

        [this.prm, this.knots, this.ctrlp] = this._assignEndDers(lPole.shift());

        lPole.map((pole) => {
            const aPrm = this.prm[this.prm.length - 1];
            const aKnot = this.knots[this.knots.length - 1];
            const [prm, knot, ctrl] = this._assignEndDers(pole);
            this.prm = this.prm.concat(prm.slice(1).map((e) => e + aPrm));
            this.knots = this.knots.slice(0, -1).concat(knot.slice(this.deg + 1).map((e) => e + aKnot));
            this.ctrlp = this.ctrlp.concat(ctrl.slice(1));
        });
    }

    // After dividing a curve into local parts, assign end derivatives to each of coner points
    _assignEndDers(pole: Array<Pole>) {
        const nm1 = pole.length - 1;
        const pts = pole.map((e) => e.point);
        const prm = parameterize(pts, this.method);

        // specify end derivatives
        if (pole.length > 1) {
            const p0 = pole[0];
            const p1 = pole[nm1];
            const [d0, d1] = this._specifyEndDers(pts, prm);
            p0.slope = p0.out ? p0.out : d0.normalize();
            p1.slope = p1.in ? p1.in : d1.normalize();
        }

        const knots = assignKnot(this.deg, prm);
        return [prm, knots, globalCurveInterpTngt(this.deg, prm, knots, pole)];
    }

    _specifyEndDers(pts: Array<Vector>, prm: Array<number>) {
        const nm1 = pts.length - 1;

        if (pts.length == 2) {
            const d0 = pts[1].sub(pts[0]);
            const de = pts[nm1].sub(pts[nm1 - 1]);
            return [d0, de];
        } else {// pts.length > 2
            const alpha1 = (prm[1] - prm[0]) / (prm[2] - prm[0]);
            const d1 = pts[1].sub(pts[0]).mul(1 / (prm[1] - prm[0]));
            const d2 = pts[2].sub(pts[1]).mul(1 / (prm[2] - prm[1]));
            const d0 = d1.mul(2).sub(d1.mul(1 - alpha1).add(d2.mul(alpha1)));

            const alpha = (prm[nm1 - 1] - prm[nm1 - 2]) / (prm[nm1] - prm[nm1 - 2]);
            const dn = pts[nm1].sub(pts[nm1 - 1]).mul(1 / (prm[nm1] - prm[nm1 - 1]));
            const dm = pts[nm1 - 1].sub(pts[nm1 - 2]).mul(1 / (prm[nm1 - 1] - prm[nm1 - 2]));
            const de = dn.mul(2).sub(dm.mul(1 - alpha).add(dn.mul(alpha)));

            return [d0, de];

            // 5-point method (unstable when end point close to ajacent point )
            const abs = Math.abs;
            const q1 = pts[1].sub(pts[0]);
            const q2 = pts[2].sub(pts[1]);
            const q0 = q1.mul(2).sub(q2);
            const qm1 = q0.mul(2).sub(q1);
            const tmp = abs(qm1.cross(q0).length());
            const alpha0 = tmp / (tmp + abs(q1.cross(q2).length()));
            const v0 = q0.mul(1 - alpha0).add(q1.mul(alpha0));
            const qn = pts[nm1].sub(pts[nm1 - 1]);
            const qm = pts[nm1 - 1].sub(pts[nm1 - 2]);
            const qn1 = qn.mul(2).sub(qm);
            const qn2 = qn1.mul(2).sub(qn);
            const temp = abs(qm.cross(qn).length());
            const alphan = temp / (temp + abs(qn1.cross(qn2).length()));
            const vn = qn.mul(1 - alphan).add(qn1.mul(alphan));

            return [v0.normalize(), vn.normalize()];
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

    clone() {
        // const pole: Array<Pole> = [];
        // this.pole.map((e, i) => {
        //     pole.push({ point: new Vector(e.point.x, e.point.y, e.point.z) });

        //     e["fold"] ? (pole[i]["fold"] = e["fold"]) : null;

        //     ["in", "out"].map((key) => {
        //         e[key] ? (pole[i][key] = new Vector(e[key].x, e[key].y, e[key].z)) : null;
        //     });
        // });

        // return new this.constructor(this.dmax, pole);
        return new BsplineCurveInt(this.dmax, this.pole.slice());
    }

    toJSON() {
        const data = {
            metadata: {
                version: 1.0,
                type: this.constructor.name,
                generator: this.constructor.name + ".toJSON",
            },
            deg: this.deg,
            pole: this.pole,
        };

        return data;
    }

    static fromJSON(data: { deg: number, pole: Array<Pole> }) {
        // const pole = data.pole;

        // pole.map((e) => {
        //     e.point = new Vector(...e.point.components);

        //     ["in", "out"].map((key) => {
        //         const v = e[key];
        //         v ? (e[key] = new Vector(...v.components)) : null;
        //     });
        // });

        return new BsplineCurveInt(data.deg, data.pole);
    }
}
