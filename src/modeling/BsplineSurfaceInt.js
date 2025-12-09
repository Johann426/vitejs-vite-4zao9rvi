import { surfacePoint, deBoorKnots, globalCurveInterpTngt } from "./NurbsLib.js";

class BsplineSurfaceInt {
    constructor(ni, nj, points, degU, degV, type = "chordal") {
        this.ni = ni;
        this.nj = nj;
        this.points = points;
        this.maxU = degU;
        this.maxV = degV;
        this.type = type;
        this.pole = [];

        for (let j = 0; j < nj; j++) {
            this.pole[j] = [];

            for (let i = 0; i < ni; i++) {
                this.pole[j].push({ point: points[j][i] });
            }
        }
    }

    get degU() {
        return this.ni - 1 > this.maxU ? this.maxU : this.ni - 1;
    }

    get degV() {
        return this.nj - 1 > this.maxV ? this.maxV : this.nj - 1;
    }

    getPointAt(t1, t2) {
        this._calcCtrlPoints();
        const ni = this.knots.row - this.degU - 1;
        const nj = this.knots.col - this.degV - 1;

        return surfacePoint(ni, nj, this.degU, this.degV, this.knots.row, this.knots.col, this.ctrlp, t1, t2);
    }

    getPoints(n, m) {
        this._calcCtrlPoints();
        const p = [];

        for (let j = 0; j < m; j++) {
            p[j] = [];
            const t2 = j / (m - 1);

            for (let i = 0; i < n; i++) {
                const t1 = i / (n - 1);

                p[j][i] = surfacePoint(
                    this.ni,
                    this.nj,
                    this.degU,
                    this.degV,
                    this.knots.row,
                    this.knots.col,
                    this.ctrlp,
                    t1,
                    t2
                );
            }
        }

        return p;
    }

    _calcCtrlPoints() {
        const ni = this.ni;
        const nj = this.nj;
        const points = this.points; //this.pole.map( e => e.point )
        this.para = this._parameterize(ni, nj, points, this.type);
        this.knots = this._calcKnots(this.degU, this.degV, this.para);
        this.ctrlp = [];

        for (let j = 0; j < nj; j++) {
            this.ctrlp[j] = globalCurveInterpTngt(this.degU, this.para.row, this.knots.row, this.pole[j]);
        }

        for (let i = 0; i < ni; i++) {
            const r = [];

            for (let j = 0; j < nj; j++) {
                r[j] = { point: this.ctrlp[j][i] };
            }

            const ctrl = globalCurveInterpTngt(this.degV, this.para.col, this.knots.col, r);

            for (let j = 0; j < nj; j++) {
                this.ctrlp[j][i] = ctrl[j];
            }
        }
    }

    _calcKnots(degU, degV, prm) {
        const knot = {
            row: [],
            col: [],
        };

        knot.row = deBoorKnots(degU, prm.row);
        knot.col = deBoorKnots(degV, prm.col);

        return knot;
    }

    _parameterize(ni, nj, points, curveType) {
        const prm = {
            row: new Array(ni).fill(0),
            col: new Array(nj).fill(0),
        };

        for (let j = 0; j < nj; j++) {
            let sum = 0.0;
            const tmp = [];

            for (let i = 1; i < ni; i++) {
                const del = points[j][i].clone().sub(points[j][i - 1]);
                const len = curveType === "centripetal" ? Math.sqrt(del.length()) : del.length();
                sum += len;
                tmp[i] = sum;
            }

            for (let i = 1; i < ni; i++) {
                tmp[i] /= sum;
                prm.row[i] += tmp[i] / nj;
            }
        }

        prm.row[0] = 0.0;

        prm.row[ni - 1] = 1.0; //last one to be 1.0 instead of 0.999999..

        for (let i = 0; i < ni; i++) {
            let sum = 0.0;
            const tmp = [];

            for (let j = 1; j < nj; j++) {
                const del = points[j][i].clone().sub(points[j - 1][i]);
                const len = curveType === "centripetal" ? Math.sqrt(del.length()) : del.length();
                sum += len;
                tmp[j] = sum;
            }

            for (let j = 1; j < nj; j++) {
                tmp[j] /= sum;
                prm.col[j] += tmp[j] / ni;
            }
        }

        prm.col[0] = 0.0;

        prm.col[nj - 1] = 1.0; //last one to be 1.0 instead of 0.999999..

        return prm;
    }
}

export { BsplineSurfaceInt };
