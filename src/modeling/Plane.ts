import { Vector } from "./NurbsLib.js";

class Plane {
    normal: Vector;
    scalar: number;

    constructor(n = new Vector(0, 0, 1), d = -0) {
        //Hesse normal form, Nx - d = 0

        this.normal = new Vector(n.x, n.y, n.z).normalize();
        this.scalar = d;
    }

    setFromNormalAndCoplanarPoint(normal: Vector, point: Vector): Plane {
        this.normal = new Vector(normal.x, normal.y, normal.z).normalize();
        this.scalar = -point.dot(normal);

        return this;
    }

    setFromCoplanarPoints(a: Vector, b: Vector, c: Vector): Plane {
        const normal = c.sub(b).cross(a.sub(b)).normalize();

        this.setFromNormalAndCoplanarPoint(normal, a);

        return this;
    }

    distanceToPoint(point: Vector): number {
        return this.normal.dot(point) + this.scalar;
    }

    distanceToSphere(sphere: { center: Vector, radius: number }) {
        return this.distanceToPoint(sphere.center) - sphere.radius;
    }

    closestPoint(v: Vector): Vector {
        return new Vector(v.x, v.y, v.z).add(this.normal.mul(-this.distanceToPoint(v)));
    }

    projectPoint(point: Vector): Vector {
        return this.normal.mul(-this.distanceToPoint(point)).add(point);
    }

    mirrorPoint(point: Vector): Vector {
        return point.add(this.normal.mul(-2.0 * this.distanceToPoint(point)));
    }

    // if intersection point(p) exist, p = O + tD,  Np - d = 0, substituting, N(O + tD) - d = 0, then t = -(N·O - D) / N·D
    intersectRay(ray: { origin: Vector, direction: Vector }): Vector | null {

        const normal = this.normal;
        const denominator = normal.dot(ray.direction)
        const epsilon = 1e-12;
        if (Math.abs(denominator) < epsilon) { // plane is coplanar with ray
            return null;
        }

        const t = - (normal.dot(ray.origin) - this.scalar) / denominator;

        return t >= 0 ? ray.origin.add(ray.direction.mul(t)) : null;

    }

    clone(): Plane {
        return new Plane(this.normal, this.scalar);
    }
}

export { Plane };
