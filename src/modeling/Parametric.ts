import type Curve from "./Curve.js";
import { Vector } from "./NurbsLib.js";

/*
 * Abstract class representing parametric form of geometric model
 */
export abstract class Parametric implements Curve {
    abstract knots: Array<number>;
    abstract ctrlp: Array<Vector>;

    abstract get ctrlPoints(): Array<Vector>;
    abstract get designPoints(): Array<Vector>;

    abstract add(v: Vector): void
    abstract remove(i: number): void
    abstract mod(i: number, v: Vector): void
    abstract split(t: number): void
    abstract getPointAt(t: number): Vector
    abstract getDerivatives(t: number): Array<Vector>;
    abstract clone(): Parametric

    get tmin() {
        return this.knots ? this.knots[0] : 0.0;
    }

    get tmax() {
        return this.knots ? this.knots[this.knots.length - 1] : 1.0;
    }

    getPoints(n: number) {
        const tmin = this.knots ? this.knots[0] : 0.0;
        const tmax = this.knots ? this.knots[this.knots.length - 1] : 1.0;
        const p = [];

        for (let i = 0; i < n; i++) {
            const t = tmin + (i / (n - 1)) * (tmax - tmin);
            p[i] = this.getPointAt(t);
        }

        return p;
    }

    scale(s) {
        const pts = this.designPoints;
        pts.map((e) => {
            e.x *= s;
            e.y *= s;
            e.z *= s;
        });
    }

    /**
     * Find the closest parametric position on the curve from a given point.
     *
     * The distance from P to C(t) is minimized when f = 0, where f =  C'(t) • ( C(t) - P )
     * To obtain the candidate parameter t, Newton iteration is used
     *
     * t* = t - f / f'
     *
     * where, convergence criteria,
     *
     * t* - t < epsilon
     *
     * and orthogonal criteria,
     *
     * f = C'(t) • ( C(t) - P ) < epsilon
     *
     * and coincidence criteria (point lies on the curve),
     *
     * C(t) - P < epsilon
     *
     */
    closestPosition(p) {
        const v = new Vector(p.x, p.y, p.z);
        const n = 200;
        const tmin = this.tmin; //this.knots ? this.knots[ 0 ] : 0.0;
        const tmax = this.tmax; //this.knots ? this.knots[ this.knots.length - 1 ] : 1.0;
        const dtlim = (tmax - tmin) / n; // dt limit
        let t = 0.5 * (this.tmin + this.tmax);
        let min = this.getPointAt(t).sub(v).length();
        let i, pts;

        // Initial guess by evaluating curve points at n equally spaced parametric position
        for (i = 0; i < n; i++) {
            //( i = 1; i < n - 1; i ++ /*temp use for bvh*/) {

            const s = tmin + (i / (n - 1)) * (tmax - tmin);
            const d = this.getPointAt(s).sub(v).length();

            // choose one having the minimum distance from a given point as initial candidate.
            if (d < min) {
                t = s;
                min = d;
            }
        }

        const EPSILON = Number.EPSILON;
        i = 0;
        // Newton iteration
        const imax = 128;
        while (i < imax) {
            const ders = this.getDerivatives(t, 2);
            pts = ders[0];
            const sub = pts.sub(v);

            if (sub.length() < EPSILON) {
                // console.log( 'coincidence' );
                break;
            }

            // f =  C'(t) • ( C(t) - P )
            const f = ders[1].dot(sub);
            // f' = C"(u) * ( C(u) - p ) + C'(u) * C'(u)
            const df = ders[2].dot(sub) + ders[1].dot(ders[1]);
            const dt = -f / df;

            if (dt > dtlim) {
                // console.log( 'dt limit' );
                break; //preliminary measure to prevent the failure of convergence
            }

            const old = t;
            t += dt;

            if (t > tmax) t = tmax;
            if (t < tmin) t = tmin;

            const abs = Math.abs;
            // t* - t  < e1
            const cr1 = abs(t - old) < EPSILON; // is converged?
            // C' • ( C - P ) < e2
            const cr2 = abs(f) < EPSILON; // is orthogonal?
            if (cr1 && cr2) {
                // console.log( 'i = ' + i );
                // console.log( 'criteria 1 ' + dt );
                // console.log( 'criteria 2 ' + f );
                break;
            }

            i++;
            // if ( i == imax ) console.log( 'max iteration' );
        }

        return t;
    }

    closestPoint(v: Vector) {
        const t = this.closestPosition(v);

        return this.getPointAt(t);
    }

    interrogationAt(t: number) {
        const ders = this.getDerivatives(t, 2);
        const binormal = ders[1].cross(ders[2]);
        const normal = binormal.cross(ders[1]);
        const k = binormal.length() / ders[1].length() ** 3;

        return {
            point: ders[0],
            curvature: k,
            tangent: ders[1].normalize(),
            normal: normal.normalize(),
            binormal: binormal.normalize(),
            radiusOfCurvature: 1 / k,
        };
    }

    interrogations(n: number) {
        const t_min = this.knots ? this.knots[0] : 0.0;
        const t_max = this.knots ? this.knots[this.knots.length - 1] : 1.0;
        const p = [];

        for (let i = 0; i < n; i++) {
            const t = t_min + (i / (n - 1)) * (t_max - t_min);
            p.push(this.interrogationAt(t));
        }

        return p;
    }
}
