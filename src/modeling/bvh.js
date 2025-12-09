import { closestPosition } from "./NurbsOper.js";
import { curveSurface } from "./NurbsOper.js";
import * as THREE from "../Rendering/three.module.js";

const MAX_DEPTH_LEVEL = 7; //max depth (2^n devision);
const MAX_DEPTH_LEVEL_Surf = 10;
// const TOL = 1e-12;
const TOL = () => {
    return document.getElementById("split tolerance").value;
};

function intersectCurvePlane(curve, plane, sor) {
    const n = MAX_DEPTH_LEVEL;
    let arr = [curve];
    let k = 0;

    while (arr.length > 0 && k <= n) {
        const tmp = arr.slice();
        arr = [];
        tmp.map((e) => {
            if (intersectBoxPlane(new Box().fromPoints(e.ctrlPoints), plane)) {
                arr.push(...splitAtMid(e));
            }
        });
        // console.log( 'k=', k, 'arr=', arr );
        k++;
    }

    const res = [];

    arr.map((e) => {
        const tmin = e.knots[0];
        const tmax = e.knots[e.knots.length - 1];
        const t0 = 0.5 * (tmin + tmax);
        const t = curveSurface(e, plane, t0, sor);
        const point = e.getPointAt(t);
        const deviation = Math.abs(plane.distanceToPoint(point));

        if (deviation < 1e-6) {
            console.log("deviation is", deviation, "at point of", point);
            res.push([t, point]);
        }
    });

    return res;
}

function selfSplitCurve(curve) {
    const curves = [curve];
    const res = selfIntersectCurve(curve);

    res.map((r) => {
        // [ s, t, p, q ]

        r.slice(0, 3).map((t) => {
            // [ s, t ]

            curves.map((c) => {
                const c0c1 = c.split(t); // split at self-intersect positions

                if (c0c1) {
                    const index = curves.indexOf(c);
                    curves.splice(index, 1);
                    curves.push(...c0c1);
                }
            });
        });
    });

    return curves;
}

function selfIntersectCurve(curve) {
    const n = MAX_DEPTH_LEVEL;
    const res = [];
    let sub = [];
    sub.push(curve);

    for (let i = 0; i < n; i++) {
        // subdivide 2^n times

        const tmp = sub.slice();
        sub = [];
        tmp.map((e) => {
            sub.push(...splitAtMid(e));
        });
    }

    while (sub.length > 0) {
        const c0 = sub.pop();

        sub.map((c1) => {
            const aabb0 = new Box().fromPoints(c0.ctrlPoints);
            const aabb1 = new Box().fromPoints(c1.ctrlPoints);

            if (overlapBox(aabb0, aabb1)) {
                const dt = 0.0001 * (curve.tmax - curve.tmin);
                const t0 = 0.5 * (c0.tmax + c0.tmin);
                const t1 = 0.5 * (c1.tmax + c1.tmin);
                const [s, t] = closestPosition(c0, c1, t0, t1);

                if (Math.abs(s - t) > dt) {
                    const [p, q] = [c0.getPointAt(s), c1.getPointAt(t)];
                    const dis = p.sub(q).length();

                    if (dis < TOL()) {
                        //check if two points close enough

                        console.log("self-intersect positions :", s, t);
                        console.log("self-intersect points :", p, q);
                        res.push([s, t, p, q]);
                    }
                }
            }
        });
    }

    return res; // array of [ s, t, p, q ]
}

function splitCurves(c0, c1, kn = MAX_DEPTH_LEVEL, obj3d) {
    const curves0 = [c0];
    const curves1 = [c1];
    const res = intersectCurves(c0, c1, kn, obj3d);

    res.map((r) => {
        // [ s, t, p, q ]

        const [s, t] = r.slice(0, 3);

        curves0.map((c) => {
            const c0c1 = c.split(s); // split at intersect position

            if (c0c1) {
                const index = curves0.indexOf(c);
                curves0.splice(index, 1);
                curves0.push(...c0c1);
            }
        });

        curves1.map((c) => {
            const c0c1 = c.split(t); // split at intersect position

            if (c0c1) {
                const index = curves1.indexOf(c);
                curves1.splice(index, 1);
                curves1.push(...c0c1);
            }
        });
    });

    return [curves0, curves1];
}

function intersectCurves(c0, c1, kn = MAX_DEPTH_LEVEL, obj3d) {
    // max depth (2^n devision);

    const aabb0 = new Box().fromPoints(c0.ctrlPoints);
    const aabb1 = new Box().fromPoints(c1.ctrlPoints);

    if (intersectBox(aabb0, aabb1)) {
        let arr = [];
        arr.push([c0, c1]);
        let k = 0;

        while (arr.length > 0 && k <= kn) {
            arr = subdivide(arr, obj3d); // curve pairs
            // console.log( 'k=', k, 'arr=', arr );
            k++;
        }

        return intersectCurvePairs(arr);
    } else {
        return [];
    }

    function subdivide(arr, obj3d) {
        const n = arr.length;
        const res = [];

        for (let i = 0; i < n; i++) {
            const c0 = arr[i][0];
            const c1 = arr[i][1];
            // 			console.log( c0 )
            // 			console.log( c1 )
            const box0 = new Box().fromPoints(c0.ctrlPoints);
            const box1 = new Box().fromPoints(c1.ctrlPoints);

            // [ box0, box1 ].map( e => {

            // 	e.maxZ - e.minZ < 1e-12 ? e.maxZ += 1e-12 : null;
            // 	// console.log( 'box resized' );

            // } );

            if (obj3d) {
                [box0, box1].map((e) => {
                    const geometry = new THREE.BoxGeometry(e.maxX - e.minX, e.maxY - e.minY, e.maxZ - e.minZ);
                    geometry.translate(0.5 * (e.maxX + e.minX), 0.5 * (e.maxY + e.minY), 0.5 * (e.maxZ + e.minZ));
                    const material = new THREE.MeshBasicMaterial({ color: 0x22bf66, transparent: true, opacity: 0.5 });
                    const box = new THREE.Mesh(geometry, material);
                    obj3d.pickable.add(box);
                });
            }

            if (intersectBox(box0, box1)) {
                const res0 = splitAtMid(c0);
                const res1 = splitAtMid(c1);

                if (res0 && res1) {
                    const [c00, c01] = res0;
                    const [c10, c11] = res1;
                    res.push([c00, c10]);
                    res.push([c00, c11]);
                    res.push([c01, c10]);
                    res.push([c01, c11]);
                }
            }
        }

        return res;
    }
}

// Find intersect points from subdivided array of curve pairs.
function intersectCurvePairs(arr) {
    const n = arr.length;
    const res = [];

    for (let i = 0; i < n; i++) {
        const c0 = arr[i][0];
        const c1 = arr[i][1];
        const t0 = 0.5 * (c0.tmax + c0.tmin);
        const t1 = 0.5 * (c1.tmax + c1.tmin);
        const [s, t] = closestPosition(c0, c1, t0, t1);
        const [p, q] = [c0.getPointAt(s), c1.getPointAt(t)];
        const dis = p.sub(q).length();

        if (dis < TOL()) {
            //check if two points close enough

            console.log("intersect position & point of curve 0:", s, p);
            console.log("intersect position & point of curve 1:", t, q);
            console.log("distance from curve 0 to 1:", dis);
            res.push([s, t, p, q]);
        }
    }

    return res; // array of [ s, t, p, q ]
}

function splitAtMid(curve) {
    const mid = 0.5 * (curve.tmax + curve.tmin);
    const res = curve.clone().split(mid);

    if (res) {
        return [res[0], res[1]];
    } else {
        console.warn("No split result from");
        console.warn(curve);
        return [curve];
    }
}

// bounding volume hierarchy (BVH)

function intersectBoxPlane(box, plane) {
    const centerX = 0.5 * (box.maxX + box.minX);
    const centerY = 0.5 * (box.maxY + box.minY);
    const centerZ = 0.5 * (box.maxZ + box.minZ);

    const extentX = box.maxX - centerX;
    const extentY = box.maxY - centerY;
    const extentZ = box.maxZ - centerZ;

    const r =
        extentX * Math.abs(plane.normal.x) + extentY * Math.abs(plane.normal.y) + extentZ * Math.abs(plane.normal.z);
    // distance to box center from plane
    const s = plane.normal.x * centerX + plane.normal.y * centerY + plane.normal.z * centerZ + plane.scalar;

    return Math.abs(s) <= r;
}

// Check if a point is inside an axis-aligned bounding boxes (AABB)
function isPointInsideBox(point, box) {
    return (
        point.x >= box.minX &&
        point.x <= box.maxX &&
        point.y >= box.minY &&
        point.y <= box.maxY &&
        point.z >= box.minZ &&
        point.z <= box.maxZ
    );
}

// Check whether an AABB equals with another AABB
function isEqualsBox(a, b) {
    return (
        a.minX.equals(b.minX) &&
        a.maxX.equals(b.maxX) &&
        a.minY.equals(b.minY) &&
        a.maxY.equals(b.maxY) &&
        a.minZ.equals(b.minZ) &&
        a.maxZ.equals(b.maxZ)
    );
}

// Check whether an AABB intersects another AABB
function overlapBox(a, b) {
    return (
        a.minX < b.maxX && a.maxX > b.minX && a.minY < b.maxY && a.maxY > b.minY && a.minZ < b.maxZ && a.maxZ > b.minZ
    );
}

// Check whether an AABB intersects another AABB
function intersectBox(a, b) {
    return (
        a.minX <= b.maxX &&
        a.maxX >= b.minX &&
        a.minY <= b.maxY &&
        a.maxY >= b.minY &&
        a.minZ <= b.maxZ &&
        a.maxZ >= b.minZ
    );
}

// Check whether a sphere contains a point
function isPointInsideSphere(point, sphere) {
    // we are using multiplications because is faster than calling Math.pow
    const distance = Math.sqrt(
        (point.x - sphere.x) * (point.x - sphere.x) +
            (point.y - sphere.y) * (point.y - sphere.y) +
            (point.z - sphere.z) * (point.z - sphere.z)
    );
    return distance <= sphere.radius;
}

// Check whether a sphere intersects another sphere
function intersectSphere(sp1, sp2) {
    // we are using multiplications because it's faster than calling Math.pow
    const distance = Math.sqrt(
        (sp1.x - sp2.x) * (sp1.x - sp2.x) + (sp1.y - sp2.y) * (sp1.y - sp2.y) + (sp1.z - sp2.z) * (sp1.z - sp2.z)
    );
    return distance < sp1.radius + sp2.radius;
}

// Check whether a sphere and an AABB are colliding
function intersect(sphere, box) {
    // get box closest point to sphere center by clamping
    const x = Math.max(box.minX, Math.min(sphere.x, box.maxX));
    const y = Math.max(box.minY, Math.min(sphere.y, box.maxY));
    const z = Math.max(box.minZ, Math.min(sphere.z, box.maxZ));

    // this is the same as isPointInsideSphere
    const distance = Math.sqrt(
        (x - sphere.x) * (x - sphere.x) + (y - sphere.y) * (y - sphere.y) + (z - sphere.z) * (z - sphere.z)
    );

    return distance < sphere.radius;
}

function distanceToPoint(point) {
    return Math.sqrt(distanceSqToPoint(point));
}

function distanceSqToPoint(point) {
    const directionDistance = _vector.subVectors(point, this.origin).dot(this.direction);

    // point behind the ray

    if (directionDistance < 0) {
        return this.origin.distanceToSquared(point);
    }

    _vector.copy(this.direction).multiplyScalar(directionDistance).add(this.origin);

    return _vector.distanceToSquared(point);
}

class Sphere {
    constructor(x, y, z, radius) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.radius = radius;
    }
}

class Box {
    constructor(minX, minY, minZ, maxX, maxY, maxZ) {
        this.minX = minX;
        this.minY = minY;
        this.minZ = minZ;
        this.maxX = maxX;
        this.maxY = maxY;
        this.maxZ = maxZ;
    }

    fromPoints(pts) {
        let minX = pts[0].x;
        let minY = pts[0].y;
        let minZ = pts[0].z;

        let maxX = pts[0].x;
        let maxY = pts[0].y;
        let maxZ = pts[0].z;

        for (let i = 1; i < pts.length; i++) {
            const x = pts[i].x;
            const y = pts[i].y;
            const z = pts[i].z;

            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (z < minZ) minZ = z;

            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
            if (z > maxZ) maxZ = z;
        }

        //If box is too thin, make it slightly thicker
        maxX - minX < 0.001 ? (maxX = minX + 0.001) : null;
        maxY - minY < 0.001 ? (maxY = minY + 0.001) : null;
        maxZ - minZ < 0.001 ? (maxZ = minZ + 0.001) : null;

        return new Box(minX, minY, minZ, maxX, maxY, maxZ);
    }
}

export { intersectCurvePlane, selfSplitCurve, selfIntersectCurve, splitCurves, intersectCurves, isPointInsideSphere };
export { Sphere };
