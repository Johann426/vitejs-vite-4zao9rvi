import * as THREE from "../Rendering/three.module.js";
import { BsplineCurveInt } from "../Modeling/BsplineCurveInt.js";
import { Plane } from "../Modeling/Plane.js";
import { Vector } from "../Modeling/NurbsLib.js";
import { updateBuffer, updateLines } from "../Editor.js";

const PI = Math.PI;
const sin = Math.sin;
const cos = Math.cos;

class Hull {
    constructor() {
        this.curves = [];
    }

    gpfRead(txt) {
        const arr = txt.split("\r\n");
        this.Name = arr[0].split(/\s+/)[1];
        this.LWL = arr[1].split(/\s+/)[1];
        this.LBP = arr[2].split(/\s+/)[1];
        this.B = arr[3].split(/\s+/)[1];
        this.T = arr[4].split(/\s+/)[1];
        this.D = arr[4].split(/\s+/)[1];
    }

    drawCons(buffer) {
        const curve = new BsplineCurveInt(3);
        curve.name = "offset function";
        curve.add(new Vector(0.0 * this.LBP, 4.0, 0));
        curve.add(new Vector(0.25 * this.LBP, 2.8, 0));
        curve.add(new Vector(0.5 * this.LBP, 2.8, 0));
        curve.add(new Vector(0.75 * this.LBP, 2.8, 0));
        curve.add(new Vector(1.0 * this.LBP, 4.0, 0));
        curve.addKnuckle(1, new Vector(1, 0, 0));
        //curve.addTangent( 2, new THREE.Vector3( 1, 0, 0 ) );
        curve.addKnuckle(3, true);
        curve.addTangent(3, new Vector(1, 0, 0));

        const geo = buffer.lines.geometry.clone();
        const mat = buffer.lines.material.clone();
        const lines = new THREE.Line(geo, mat);
        Object.defineProperty(lines, "curve", { value: curve });
        lines.name = curve.name;

        buffer.pickable.add(lines);
        buffer.pickable.selected = lines;
        updateBuffer(curve, buffer);
        updateLines(curve, lines);
    }

    dmpRead(txt) {
        const arr = txt.split("\r\n");
        let n, m, row, isNew, isPts, curve;
        let i = 0;

        // const tangent = [];
        // const knuckle = [];
        const pointSlope = [];

        let x0,
            y0,
            z0 = 0;

        while (arr[i] != undefined) {
            row = arr[i].split(/\s+/);

            if (row[1] == "T") {
                // new curve added

                isNew = true;
                n = row[5];
                curve = new BsplineCurveInt(3);
                curve.name = arr[i - 1];
                this.curves.push(curve);
                pointSlope.length = 0;
            }

            if (isNew) {
                // trying to find point info

                if (row.length == 3) {
                    isNew = false;
                    isPts = true;
                    m = row[2]; // number of knuckle and tangent info
                }
            }

            if (isPts) {
                if (row.length == 6 && m > 0) {
                    const info = arr[i - 1].split(/\s+/);
                    const tngt = info[1] == 1 ? true : false; // 1:tangent 2:knuckle
                    const type = info[2]; // 1:SEC 2:WAT 3:BUK
                    const point = row.slice(1, 4).map((e) => Number(e));
                    const slopeIn = angleToVector(row.slice(4, 5), type);
                    const slopeOt = tngt ? slopeIn.clone() : angleToVector(row.slice(5, 6), type);

                    function angleToVector(angle, type) {
                        if (angle == 999) return undefined;

                        const theta = (angle / 180) * PI;

                        switch (type) {
                            case "1":
                                return new THREE.Vector3(0, cos(theta), sin(theta));

                            case "2":
                                return new THREE.Vector3(cos(theta), sin(theta), 0);

                            case "3":
                                return new THREE.Vector3(cos(theta), 0, sin(theta));

                            default:
                                console.warn("no ref lines type");
                                return undefined;
                        }
                    }

                    pointSlope.push([point, slopeIn, slopeOt]);

                    m--;
                }

                if (row.length == 5) {
                    let jm = 0;

                    for (let j = 0; j < n; j++) {
                        const isCenterProfile = curve.name.slice(0, 1) === "B" && curve.name.slice(-7) === "Profile"; // Special case for Stern Profile & Stem Profile (and not for Skeg Profile)
                        row = arr[i].split(/\s+/);
                        const x = Number(row[1]);
                        const y = isCenterProfile ? Number(row[3]) : Number(row[2]);
                        const z = isCenterProfile ? Number(row[2]) : Number(row[3]);
                        const s = Number(row[4]);
                        const isSame = Math.sqrt((x0 - x) ** 2 + (y0 - y) ** 2 + (z0 - z) ** 2) < 1e-9;

                        if (isSame) {
                            // trying to avoid duplicate point

                            jm++;
                        } else {
                            const p = new THREE.Vector3(round(x, 5), round(y, 5), round(z, 5));
                            curve.add(p);

                            if (s != 0) {
                                curve.addKnuckle(j - jm, true);

                                if (pointSlope.length != 0) {
                                    const p0 = new THREE.Vector3(...pointSlope[0][0].map((e) => round(e, 5)));

                                    if (p.equals(p0)) {
                                        const v = pointSlope.shift();
                                        if (v[1] != undefined) curve.addKnuckle(j - jm, v[1], "in");
                                        if (v[2] != undefined) curve.addKnuckle(j - jm, v[2], "out");
                                    }
                                }
                            }
                        }

                        i++;
                        [x0, y0, z0] = [x, y, z];
                    } // end of for loop

                    isPts = false;
                }
            }

            i++;
        } // end of while loop
    }

    getCurves() {}

    drawHull(editor) {
        const meshes = [];

        for (let i = 0; i < this.curves.length; i++) {
            const curve = this.curves[i];
            curve.ctrlPoints;
            curve.plane = lazyNormal(curve);
            const name = curve.name;
            const geo = editor.obj3d.lines.geometry.clone();
            const mat = editor.obj3d.lines.material.clone();
            const lines = new THREE.Line(geo, mat);
            editor.selected = lines;

            Object.defineProperty(lines, "curve", {
                value: curve,
            });

            if (curve.designPoints.length > 0) {
                updateBuffer(curve, editor);
            }

            meshes.push(lines);

            switch (name.slice(0, 3)) {
                case "TAN":
                    mat.color.set(new THREE.Color("Yellow"));
                    break;

                case "KNU":
                    mat.color.set(new THREE.Color("Red"));
                    break;

                case "SEC":
                    mat.color.set(new THREE.Color("LimeGreen"));
                    break;

                case "WAT":
                    const pts = curve.designPoints;

                    if (pts.length > 1) {
                        // preliminary treatment

                        if (pts[0].y == 0) {
                            curve.addKnuckle(0, new Vector(0, 1, 0), "out");
                        }

                        if (pts[pts.length - 1].y == 0) {
                            curve.addKnuckle(pts.length - 1, new Vector(0, -1, 0), "in");
                        }
                    }

                    mat.color.set(new THREE.Color("SteelBlue"));

                    break;

                case "BUT":
                    mat.color.set(new THREE.Color("Magenta"));
                    break;

                default:
                    name.slice(0, 1) === "B" ? mat.color.set(0xcccccc) : mat.color.set(0x808080);
            }
        }

        editor.addMesh(meshes);
    }
}

function lazyNormal(curve) {
    const p0 = curve.getPointAt(curve.tmin);
    const p1 = curve.getPointAt(0.5 * (curve.tmin + curve.tmax));
    const p2 = curve.getPointAt(curve.tmax);

    const n = p2.sub(p0).cross(p1.sub(p2));

    return new Plane().setFromNormalAndCoplanarPoint(
        new Vector(round(n.x, 9), round(n.y, 9), round(n.z, 9)).normalize(),
        p0
    );
}

function round(num, decimal) {
    return Number(num.toFixed(decimal));
}

export { Hull };
