import { parameterize, assignKnot, globalCurveInterpTngt, split, Vector, } from "./NurbsLib.js";
import { Bspline } from "./Bspline.ts";
import { BsplineCurve } from "./BsplineCurve.ts";
import { Vertex } from "./Vertex.ts";

export class BsplineCurveInt extends Bspline {
    method = "chordal";
    needsUpdate: boolean = false;

    constructor(deg: number, private vertices: Vertex[] = []) {
        super(deg, Array(), Array());
        this.vertices = vertices;
    }

    get deg() {
        const nm1 = this.vertices.length - 1;
        return nm1 > 1 ? this.dmax : nm1;
    }

    get ctrlPoints() {
        if (this.needsUpdate) this._calcCtrlPoints();
        return this.ctrlp;
    }

    get designPoints() {
        return this.vertices.map((e) => e.point);
    }

    append(v: Vertex) {
        // this.vertices.push(new Vertex(new Vector(v.x, v.y, v.z)));
        this.vertices.push(v);
        this.needsUpdate = true;
    }

    remove(i: number): Vertex {
        const vertex = this.vertices.splice(i, 1)[0];
        this.needsUpdate = true;
        return vertex;
    }

    modify(i: number, v: Vector): Vertex {
        const vertex = this.vertices[i];
        vertex.point = v;
        this.needsUpdate = true;
        return vertex;
    }

    incert(i: number, v: Vector) {
        this.vertices.splice(i, 0, new Vertex(new Vector(v.x, v.y, v.z)));
        this.needsUpdate = true;
    }

    incertPointAt(t: number, v: Vector) {
        if (t > this.tmin && t < this.tmax) {
            const i = this.param.findIndex((e) => e > t);
            this.incert(i, v);
        }
    }

    incertClosestPoint(v: Vector, isKept: boolean) {
        const t = this.closestPosition(v);
        const p = isKept ? new Vector(v.x, v.y, v.z) : this.getPointAt(t);

        if (t > this.tmin && t < this.tmax) {
            const i = this.param.findIndex((e) => e > t);
            this.incert(i, p);
            return i;
        } else if (t == this.tmin) {
            this.incert(0, v);
            return 0;
        } else if (t == this.tmax) {
            this.append(v);
            return this.param.length;
        } else {
            console.warn("Parametric position is out of range", t);
        }
    }

    addTangent(i: number, v: Vector) {
        v.normalize();
        Object.assign(this.vertices[i], { fold: true, in: new Vector(v.x, v.y, v.z), out: new Vector(v.x, v.y, v.z) });
        this.needsUpdate = true;
    }

    addKnuckle(i: number, v: Vector, inout) {
        if (typeof v == "boolean") {
            Object.assign(this.vertices[i], { fold: v });
        } else {
            v.normalize();
            Object.assign(this.vertices[i], { fold: true });
            this.vertices[i][inout] = new Vector(v.x, v.y, v.z);
        }

        this.needsUpdate = true;
    }

    removeKnuckle(i: number) {
        const removed = ["fold", "in", "out"].map((key) => this.vertices[i][key]);
        ["fold", "in", "out"].map((key) => delete this.vertices[i][key]);
        this.needsUpdate = true;
        return removed;
    }

    removeTangent(i: number) {
        const removed = this.vertices[i].tangentO;
        ["fold", "in", "out"].map((key) => delete this.vertices[i][key]);
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
        const n = this.vertices.length;
        const index = []; // index array of corners
        index.push(0); // the first into index

        for (let i = 1; i < n - 1; i++) {
            this.vertices[i].knuckle ? index.push(i) : null; // knuckle into index
        }

        index.push(n - 1); // the last into index

        const lPole: Vertex[][] = []; // local pole points

        for (let i = 1; i < index.length; i++) {
            const pts = this.vertices.slice(index[i - 1], index[i] + 1);
            // lPole.push(pts.map((e) => Object.assign({}, e)));
            lPole.push(pts);
        }

        [this.param, this.knots, this.ctrlp] = this._assignEndDers(lPole.shift());

        lPole.map((pole) => {
            const aPrm = this.param[this.param.length - 1];
            const aKnot = this.knots[this.knots.length - 1];
            const [prm, knot, ctrl] = this._assignEndDers(pole);
            this.param = this.param.concat(prm.slice(1).map((e) => e + aPrm));
            this.knots = this.knots.slice(0, -1).concat(knot.slice(this.deg + 1).map((e) => e + aKnot));
            this.ctrlp = this.ctrlp.concat(ctrl.slice(1));
        });
    }

    // After dividing a curve into local parts, assign end derivatives to each of coner points
    _assignEndDers(points: Vertex[]) {
        const nm1 = points.length - 1;
        const pts = points.map((e) => e.point);
        const prm = parameterize(pts, this.method);
        const pole = points.map(e => ({ point: e.point }))

        // specify end derivatives
        if (points.length > 1) {
            const p0 = points[0];
            const p1 = points[nm1];
            const [d0, d1] = this._specifyEndDers(pts, prm);
            pole[0].slope = p0.tangentO.length() !== 0 ? p0.tangentO : d0.normalize();
            pole[nm1].slope = p1.tangentI.length() !== 0 ? p1.tangentI : d1.normalize();
        }

        const knots = assignKnot(this.deg, prm);
        return [prm, knots, globalCurveInterpTngt(this.deg, prm, knots, pole)];
    }

    _specifyEndDers(pts: Vector[], prm: number[]) {
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
        return new BsplineCurveInt(this.dmax, this.vertices.slice());
    }

    toJSON() {
        const data = {
            metadata: {
                version: 1.0,
                type: this.constructor.name,
                generator: this.constructor.name + ".toJSON",
            },
            deg: this.deg,
            points: this.vertices,
        };

        return data;
    }

    static fromJSON(data: { deg: number, points: Vertex[] }) {
        return new BsplineCurveInt(data.deg, data.points);
    }
}
