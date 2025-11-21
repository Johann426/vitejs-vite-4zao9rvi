class Propeller {
    constructor() {
        this.ids = [];

        this.isNondimensional = true;

        this.NoBlade = 4;

        this.rbyR = [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
        this.pitch = [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0];
        this.rake = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
        this.skew = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
        this.chord = [0.2214, 0.2402, 0.2546, 0.2653, 0.273, 0.2766, 0.274, 0.2504, 0.0];
        this.camber = [0.0538, 0.0509, 0.0446, 0.0373, 0.0301, 0.0234, 0.0177, 0.0143, 0.0];
        this.thick = [0.0308, 0.0283, 0.0254, 0.0223, 0.0186, 0.0146, 0.0105, 0.0065, 0.0025];

        this.meanline = {
            name: "NACA 66 a = 1.0 meanline",
            xc: [
                0.0, 0.005, 0.0075, 0.0125, 0.025, 0.05, 0.075, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55,
                0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1.0,
            ],
            yc: [
                0.0, 0.25, 0.35, 0.535, 0.93, 1.58, 2.12, 2.585, 3.365, 3.98, 4.475, 4.86, 5.15, 5.355, 5.475, 5.515,
                5.475, 5.355, 5.15, 4.86, 4.475, 3.98, 3.365, 2.585, 1.58, 0.0,
            ],
            dydx: [
                0.0, 0.4212, 0.38875, 0.3477, 0.29155, 0.2343, 0.19995, 0.17485, 0.13805, 0.1103, 0.08745, 0.06745,
                0.04925, 0.03225, 0.01595, 0.0, -0.01595, -0.03225, -0.04925, -0.06745, -0.08745, -0.1103, -0.13805,
                -0.17485, -0.2343, 0.0,
            ],
        };

        this.section = {
            name: "NACA 66 (mod)",
            xc: [
                0.0, 0.005, 0.0075, 0.0125, 0.025, 0.05, 0.075, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55,
                0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1.0,
            ],
            ytm: [
                0.0, 0.0665, 0.0812, 0.1044, 0.1466, 0.2066, 0.2525, 0.2907, 0.3521, 0.4, 0.4363, 0.4637, 0.4832,
                0.4952, 0.5, 0.4962, 0.4846, 0.4653, 0.4383, 0.4035, 0.3612, 0.311, 0.2532, 0.1877, 0.1143, 0.0333,
            ],
        };
    }

    readTxt(txt) {
        const arr = txt.split("\r\n");
        this.dia = Number(arr[4].split(/\s+/)[1]);
        this.NoBlade = Number(arr[4].split(/\s+/)[2]);
        this.HubD_face = Number(arr[5].split(/\s+/)[1]);
        this.HubD_back = Number(arr[5].split(/\s+/)[2]);
        this.HubL_face = Number(arr[5].split(/\s+/)[3]);
        this.HubL_back = Number(arr[5].split(/\s+/)[4]);
        this.rbyR = arr[6].split(/\s+/).map((e) => Number(e));
        this.rbyR.splice(0, 1);
        this.pitch = arr[7].split(/\s+/).map((e) => Number(e));
        this.pitch.splice(0, 1);
        this.rake = arr[8].split(/\s+/).map((e) => Number(e));
        this.rake.splice(0, 1);
        this.skew = arr[9].split(/\s+/).map((e) => Number(e));
        this.skew.splice(0, 1);
        this.chord = arr[10].split(/\s+/).map((e) => Number(e));
        this.chord.splice(0, 1);
        this.camber = arr[11].split(/\s+/).map((e) => Number(e));
        this.camber.splice(0, 1);
        this.thick = arr[12].split(/\s+/).map((e) => Number(e));
        this.thick.splice(0, 1);
    }

    getXYZ() {
        return this.calcPropGeom(
            this.NoBlade,
            this.rbyR,
            this.pitch,
            this.chord,
            this.skew,
            this.rake,
            this.camber,
            this.thick,
            this.meanline,
            this.section
        );
    }

    calcPropGeom(NoBlade = 2, rbyR, pitch, chord, skew, rake, camber, thick, meanline, section) {
        const PI = Math.PI;
        const r = rbyR.map((x) => x * 0.5);
        const nj = rbyR.length;
        const ni = section.xc.length;
        const xc = meanline.xc;
        const yc = meanline.yc;
        const dydx = meanline.dydx;
        if (xc.toString() != section.xc.toString())
            console.log("the data of meanline and that of section are not matched");
        const ytm = section.ytm;

        chord[nj - 1] = Math.max(chord[nj - 1], thick[nj - 1] / 0.2);

        let max = 0;
        for (let i = 0; i < ni; i++) {
            if (yc[i] > max) max = yc[i];
        }

        const blade = [];

        for (let k = 1; k <= NoBlade; k++) {
            const x = Array.from(Array(ni), () => new Array(nj));
            const y = Array.from(Array(ni), () => new Array(nj));
            const z = Array.from(Array(ni), () => new Array(nj));

            const phi = (2 * PI * (k - 1)) / NoBlade;

            // Suction side
            for (let j = 0; j < nj; j++) {
                const radius = 0.5 * rbyR[j];
                const skewRad = (skew[j] / 180) * PI;
                const pitchAngle = Math.atan(pitch[j] / (2 * PI * r[j]));

                for (let i = 0; i < ni; i++) {
                    const camberAngle = Math.atan(dydx[i]);
                    const yt = ytm[i] * thick[j];
                    const yu = (yc[i] / max) * camber[j] * chord[j] + yt * Math.cos(camberAngle);

                    x[i][j] =
                        -(rake[j] + radius * skewRad * Math.tan(pitchAngle)) +
                        (0.5 - xc[i]) * chord[j] * Math.sin(pitchAngle) +
                        yu * Math.cos(pitchAngle);

                    y[i][j] =
                        radius *
                        Math.sin(
                            skewRad -
                                ((0.5 - xc[i]) * chord[j] * Math.cos(pitchAngle) - yu * Math.sin(pitchAngle)) / radius
                        );

                    z[i][j] =
                        radius *
                        Math.cos(
                            skewRad -
                                ((0.5 - xc[i]) * chord[j] * Math.cos(pitchAngle) - yu * Math.sin(pitchAngle)) / radius
                        );

                    const y1 = y[i][j];
                    const z1 = z[i][j];

                    y[i][j] = y1 * Math.cos(phi) - z1 * Math.sin(phi);
                    z[i][j] = y1 * Math.sin(phi) + z1 * Math.cos(phi);
                }
            }

            const back = {
                name: "suction side",
                x: x.map((e) => {
                    return e.slice();
                }),
                y: y.map((e) => {
                    return e.slice();
                }),
                z: z.map((e) => {
                    return e.slice();
                }),
            };

            // pressure side
            for (let j = 0; j < nj; j++) {
                const radius = 0.5 * rbyR[j];
                const skewRad = (skew[j] / 180) * PI;
                const pitchAngle = Math.atan(pitch[j] / (2 * PI * r[j]));

                for (let i = 0; i < ni; i++) {
                    const camberAngle = Math.atan(dydx[i]);
                    const yt = ytm[i] * thick[j];
                    const yl = (yc[i] / max) * camber[j] * chord[j] - yt * Math.cos(camberAngle);

                    x[i][j] =
                        -(rake[j] + radius * skewRad * Math.tan(pitchAngle)) +
                        (0.5 - xc[i]) * chord[j] * Math.sin(pitchAngle) +
                        yl * Math.cos(pitchAngle);

                    y[i][j] =
                        radius *
                        Math.sin(
                            skewRad -
                                ((0.5 - xc[i]) * chord[j] * Math.cos(pitchAngle) - yl * Math.sin(pitchAngle)) / radius
                        );

                    z[i][j] =
                        radius *
                        Math.cos(
                            skewRad -
                                ((0.5 - xc[i]) * chord[j] * Math.cos(pitchAngle) - yl * Math.sin(pitchAngle)) / radius
                        );

                    const y1 = y[i][j];
                    const z1 = z[i][j];

                    y[i][j] = y1 * Math.cos(phi) - z1 * Math.sin(phi);
                    z[i][j] = y1 * Math.sin(phi) + z1 * Math.cos(phi);
                }
            }

            const face = {
                name: "pressure side",
                x: x,
                y: y,
                z: z,
            };

            blade.push({
                name: "No." + k + " blade",
                back: back,
                face: face,
            });
        }

        return blade;
    }
}

export { Propeller };
