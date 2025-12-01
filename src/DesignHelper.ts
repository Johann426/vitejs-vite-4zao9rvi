import {
    Scene,
    Vector3,
    MeshBuilder,
    Color3,
    PointsCloudSystem,
    ShaderMaterial,
} from "@babylonjs/core";

import { Vector } from "./modeling/NurbsLib.ts"

const vertexShaderCode = `
    precision highp float;

    // Attributes
    attribute vec3 position;

    // Uniforms
    uniform float pointSize;
    uniform mat4 worldViewProjection;

    void main(void) {
        gl_PointSize = pointSize;
        gl_Position = worldViewProjection * vec4(position, 1.0);
    }
`;

const fragmentShaderCode = `
    precision highp float;

    // Uniforms
    uniform vec3 color;
    
    void main(void) {
        // Calculate the relative position vector from the point center (0.5, 0.5)
        vec2 diff = gl_PointCoord - vec2(0.5, 0.5);

        // Compute the distance from the center
        float dist = length(diff); 

        // Apply circular mask: discard pixel if distance exceeds 0.5
        if (dist > 0.5) {
            discard;
        }

        // Smooth edge handling for anti-aliasing (optional)
        float alpha = 1.0 - smoothstep(0.45, 0.5, dist);

        // Set the final color
        gl_FragColor = vec4(color, alpha);
    }
`;

function createPointsCloudSystemd(points: Array<Vector>, scene: Scene) {

    const createDesignPoints = function (p: { position: Vector3; color: Color3; }, i: number) {
        p.position = new Vector3(points[i].x, points[i].y, points[i].z);
        p.color = new Color3(1, 1, 0);
    };

    const pointsCloud = new PointsCloudSystem("pointsCloud", 1, scene); // point size 1 will be ignored, since custom shader to be applied

    pointsCloud.addPoints(points.length, createDesignPoints);

    return pointsCloud;

}

class PointHelper {
    pointSize: number;
    pointColor: Color3;
    pcs!: PointsCloudSystem;

    constructor(pointSize: number, pointColor: Color3) {

        this.pointSize = pointSize;
        this.pointColor = pointColor;

    }

    initialize(points: Vector[], scene: Scene) {

        const { pointSize, pointColor } = this;

        const shaderMaterial = new ShaderMaterial(
            "pointShader",
            scene,
            {
                vertexSource: vertexShaderCode,
                fragmentSource: fragmentShaderCode,
            },
            {
                attributes: ["position"],
                uniforms: ["pointSize", "worldViewProjection", "color"],
                needAlphaBlending: true,
            }
        );

        shaderMaterial.setFloat("pointSize", pointSize);
        shaderMaterial.setColor3("color", pointColor);

        const pcs = createPointsCloudSystemd(points, scene);

        pcs.buildMeshAsync().then(() => {
            if (pcs.mesh) {
                pcs.mesh.material = shaderMaterial;
                pcs.mesh.material.pointsCloud = true;
            }
        })

        this.pcs = pcs;

    }

    // setEnabled(value: boolean) {
    //     this.pcs.mesh.isVisible = value;
    // }
}

// const CurvatureHelper{

//     constturctor() {

//     }
// }


// const arr = [];

// for (let i = 0; i < MAX_LINES_SEG; i++) {

//     const knots = curve.knots;
//     const t_min = knots ? knots[0] : 0.0;
//     const t_max = knots ? knots[knots.length - 1] : 1.0;
//     let t = t_min + i / (MAX_LINES_SEG - 1) * (t_max - t_min);

//     const pts = curve.interrogationAt(t);
//     const alpha = 1.0;
//     const crvt = pts.normal.negate().mul(pts.curvature * alpha);
//     const tuft = pts.point.add(crvt);

//     arr.push([new Vector3(pts.point.x, pts.point.y, pts.point.z), new Vector3(tuft.x, tuft.y, tuft.z)],)

// }

// // creates an instance of a line system
// const curvature = MeshBuilder.CreateLineSystem("lineSystem", { lines: arr }, scene);
// curvature.color = new Color3(0.5, 0, 0);

export { PointHelper };