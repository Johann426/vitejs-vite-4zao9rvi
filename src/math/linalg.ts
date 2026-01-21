// Identity matrix
function identity(n: number): number[][] {
    return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
}

// Transpose of matrix
function transpose(m: number[][]): number[][] {
    const rows = m.length;
    const cols = m[0].length;

    return Array.from({ length: cols }, (_, i) => Array.from({ length: rows }, (_, j) => m[j][i]));
}

// Forward substitution O(n2)
function fwdsub(a: number[][], b: number[], unitDiagonal = false): number[] {
    const n = a.length;

    for (let i = 0; i < n; i++) {
        let s = b[i];
        for (let j = 0; j < i; j++) {
            s -= a[i][j] * b[j];
        }
        b[i] = unitDiagonal ? s : s / a[i][i];
    }

    return b;
}

// Back substitution O(n2)
function backsub(a: number[][], b: number[]): number[] {
    const n = a.length;

    for (let i = n - 1; i >= 0; i--) {
        let s = b[i];
        for (let j = i + 1; j < n; j++) {
            s -= a[i][j] * b[j];
        }
        b[i] = s / a[i][i];
    }

    return b;
}

// Gaussian elimination (caller must ensure A is n x n matrix and b is n vector), O(n3)
function gauss(a: number[][], b: number[]): number[] {
    const n = a.length;

    // Row reduction (into upper triangular form)
    for (let j = 0; j < n - 1; j++) {
        // Partial pivoting: find row with largest absolute value in column j
        let jmax = j;
        for (let i = j + 1; i < n; i++) {
            if (Math.abs(a[i][j]) > Math.abs(a[jmax][j])) {
                jmax = i;
            }
        }
        // Check for singularity
        if (a[jmax][j] === 0) {
            throw new Error("Singular matrix detected");
        }
        // Swap rows in matrix and right-hand side vector
        if (jmax !== j) {
            [a[j], a[jmax]] = [a[jmax], a[j]];
            [b[j], b[jmax]] = [b[jmax], b[j]];
        }
        // Eliminate entries below the pivot
        for (let i = j + 1; i < n; i++) {
            const factor = a[i][j] / a[j][j];
            a[i][j] = 0.0;
            for (let k = j + 1; k < n; k++) {
                a[i][k] -= factor * a[j][k];
            }
            b[i] -= factor * b[j];
        }
    }

    return backsub(a, b);
}

// Thomas algorithm(tridiagonal matrix algorithm)
function tdma(a: number[], b: number[], c: number[], r: number[]): number[] {
    const n = r.length;
    const cp: number[] = new Array(n).fill(0);
    // Modify the first coefficients
    cp[0] = c[0] / b[0];
    r[0] = r[0] / b[0];
    // Forward sweep
    for (let i = 1; i < n; i++) {
        const tmp = b[i] - a[i] * (i > 0 ? cp[i - 1] : 0);
        cp[i] = c[i] / tmp;
        r[i] = (r[i] - a[i] * (i > 0 ? r[i - 1] : 0)) / tmp;
    }
    // Back substitution
    for (let i = n - 2; i >= 0; i--) {
        r[i] -= cp[i] * r[i + 1];
    }

    return r;
}

//Abstract class to solve a set of linear algebraic equations
abstract class Decomposer<T extends { a: number[][] }> {
    a: number[][];
    protected decomposed: T;

    constructor(input: number[][]) {
        this.decomposed = this.dcmp(input); // Perform decomposition
        this.a = this.decomposed.a; // Store decomposed matrix
    }
    protected abstract dcmp(a: number[][]): T;
    abstract solve(b: number[]): number[];
    abstract det(): number;

    solveMatrix(b: number[][]): number[][] {
        const bt = transpose(b);
        const xt = bt.map((bi) => this.solve(bi));
        const x = transpose(xt);
        return x;
    }

    inverse(): number[][] {
        const n = this.a.length;
        return this.solveMatrix(identity(n));
    }

    refine(a: number[][], x0: number[], b: number[]): number[] {
        const m = a.length;
        const n = a[0].length;
        const r: number[] = new Array(m).fill(0);

        // solve A dx = A x0 - b
        for (let i = 0; i < m; i++) {
            let s = -b[i];
            for (let j = 0; j < n; j++) {
                s += a[i][j] * x0[j];
            }
            r[i] = s;
        }
        const e = this.solve(r);

        const x = x0.map((xi, i) => xi - e[i]);
        return x;
    }
}

class LU extends Decomposer<{ a: number[][]; p: number[] }> {
    p: number[];

    constructor(a: number[][]) {
        super(a);
        this.p = this.decomposed.p;
    }

    protected dcmp(a: number[][]): { a: number[][]; p: number[] } {
        // O(n3)
        const n = a.length;
        const p = Array.from({ length: n }, (_, i) => i);

        for (let j = 0; j < n; j++) {
            let jmax = j;
            for (let i = j + 1; i < n; i++) {
                if (Math.abs(a[i][j]) > Math.abs(a[jmax][j])) {
                    jmax = i;
                }
            }

            if (a[jmax][j] === 0) {
                throw new Error("Singular matrix detected");
            }

            if (jmax !== j) {
                [a[j], a[jmax]] = [a[jmax], a[j]];
                [p[j], p[jmax]] = [p[jmax], p[j]];
            }

            for (let i = j + 1; i < n; i++) {
                a[i][j] /= a[j][j];
                for (let k = j + 1; k < n; k++) {
                    a[i][k] -= a[i][j] * a[j][k];
                }
            }
        }

        return { a, p };
    }

    solve(b: number[]): number[] {
        const { a, p } = this;
        const pb = p.map((i) => b[i]);
        const y = fwdsub(a, pb, true);
        const x = backsub(a, y);

        return x;
    }

    det(): number {
        const { a, p } = this;
        const n = p.length;
        let d = 1;
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                if (p[i] > p[j]) d = -d; // flip sigh when an inversion occurs
            }
        }

        for (let i = 0; i < n; i++) {
            d *= a[i][i];
        }

        return d;
    }
}

class QR extends Decomposer<{ a: number[][] }> {
    protected dcmp(a: number[][]): { a: number[][] } {
        const m = a.length; // no. row
        const n = a[0].length; //no. column

        for (let k = 0; k < Math.min(m, n); k++) {
            //A to be transformed successively into partial upper triangular form,
            // vector composed of the first column
            const x = a.slice(k).map((row) => row[k]);
            const normx = Math.sqrt(x.reduce((sum, xi) => sum + xi * xi, 0));
            if (normx === 0) continue;
            // Compute v^T x and v^T v
            const sign = x[0] < 0 ? -1 : 1;
            let vtx = normx * normx + sign * normx * x[0];
            let vtv = 2 * vtx;
            // Compute normal vector of hyperplane for Householder transformation
            const v = [...x];
            v[0] += sign * normx;
            // normalize by v[0] to reuse storage A
            const d = v.length;
            // normalize v
            for (let j = 1; j < d; j++) {
                v[j] /= v[0];
            }
            // Normalize v^T x
            vtx /= v[0];
            vtv /= v[0] * v[0];
            v[0] = 1.0;
            // Apply Householder transformation to A: ( I - 2 v v^T / v^T v ) A
            for (let i = k; i < n; i++) {
                let sum = i === k ? vtx : v.reduce((sum, vj, j) => sum + vj * a[k + j][i], 0); // sum += v^T A
                sum /= vtv;

                for (let j = 0; j < d; j++) {
                    a[k + j][i] -= 2 * v[j] * sum; // A - 2 v w^T where w^T = v^T A / v^T v
                }
            }
            // Store Householder vector in lower part of A
            for (let j = 1; j < d; j++) {
                a[k + j][k] = v[j];
            }
        }

        return { a };
    }

    solve(b: number[]): number[] {
        const a = this.a;
        const m = a.length;
        const n = a[0].length;

        // Compute Q^T b using Householder vectors stored in A
        for (let k = 0; k < n; k++) {
            // Extract Householder vector v from A
            const d = m - k;
            const v = [1.0];
            for (let j = 1; j < d; j++) {
                v.push(a[k + j][k]);
            }
            const vtv = v.reduce((sum, vi) => sum + vi * vi, 0);
            // Apply Householder transformation ( I - 2 v v^T / v^T v ) b
            let s = 0;
            for (let i = 0; i < d; i++) {
                s += v[i] * b[k + i]; // v^T b
            }
            s *= 2 / vtv; // 2 v^T b / v^T v
            // Apply Householder transformation to b
            for (let i = 0; i < d; i++) {
                b[k + i] -= s * v[i]; // b = b - s·v where s = 2 v^T b / v^T v
            }
        }
        // Extract upper triangular matrix R from A
        const r = a.slice(0, n).map((row) => [...row]);
        // Back substitution to solve R x = Q^T b
        const x = backsub(r, b);

        return x;
    }

    det() {
        const a = this.a;
        const n = a[0].length;

        let d = n % 2 == 0 ? 1 : -1;

        for (let i = 0; i < n; i++) {
            d *= a[i][i];
        }

        return d;
    }
}

export { LU, QR };

// // 테스트 행렬과 벡터
// const a: number[][] = [
//     [2, 1, -1],
//     [-3, -1, 2],
//     [-2, 1, 2]
// ];
// const b: number[] = [8, -11, -3];

// // Gauss 소거법으로 해 구하기 (가정: gauss 함수가 정의되어 있음)
// const xGauss = gauss(a.map(row => [...row]), [...b]);
// console.log("Gauss result:", xGauss);

// // 잔차 계산 함수
// function residual(a: number[][], x: number[], b: number[]): number[] {
//     return a.map((row, i) =>
//         row.reduce((sum, aij, j) => sum + aij * x[j], 0) - b[i]
//     );
// }

// // LU, QR 테스트
// for (const solver of [new LU(a.map(row => [...row])), new QR(a.map(row => [...row]))]) {
//     const name = solver.constructor.name;

//     const x0 = solver.solve([...b]);
//     console.log(`${name} solution :`, x0);

//     const x1 = solver.refine(a, x0, [...b]);
//     console.log(`${name} refined  :`, x1);

//     console.log(`${name} residual :`, residual(a, x1, b));
//     console.log(`${name} determinant :`, solver.det());

//     console.log(`${name} inverse  :`);
//     const inv = solver.inverse();
//     for (const row of inv) {
//         console.log("    :", row);
//     }
// }

// const r = [1, 0, 0, 1]
// const x = tdma([0, -1, -1, -1], [2, 2, 2, 2], [-1, -1, -1, 0], r)
// console.log('tdma: ', x)
