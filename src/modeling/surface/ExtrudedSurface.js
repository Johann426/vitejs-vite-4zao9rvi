import { NurbsSurface } from "./NurbsSurface.js";

class ExtrudedSurface extends NurbsSurface {
    constructor(crv, vec) {
        const deg_u = crv.deg;

        const deg_v = 1;

        const knot_u = crv.knots;

        const knot_v = [0.0, 0.0, 1.0, 1.0];

        const ctrlp = [];
        ctrlp.push(crv.ctrlPoints);
        ctrlp.push(crv.ctrlPoints.map((e) => e.add(vec)));

        const weights = [];
        weights.push(crv.weights);
        weights.push(crv.weights);

        super(deg_u, deg_v, knot_u, knot_v, ctrlp, weights);
    }
}

export { ExtrudedSurface };
