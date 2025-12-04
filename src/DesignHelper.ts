import {
    Scene,
    Color3,
    Vector3,
    ShaderMaterial,
    PointsCloudSystem,
    MeshBuilder,
    VertexBuffer,
} from "@babylonjs/core";

import { Vector } from "./modeling/NurbsLib.ts"
import type { initializeWebWorker } from "@babylonjs/core/Misc/khronosTextureContainer2Worker";

const MAX_POINTS = 1000;
const MAX_LINES_SEG = 1000;

const vertexShaderCode = `
    precision highp float;

    // Attributes
    attribute vec3 position;

    // Uniforms
    uniform float pointSize;
    uniform mat4 worldViewProjection;
    uniform int drawRange;

    // Send gl_VertexID to the fragment shader as a flat integer(to avoid interpolation)
    flat out int i;

    void main(void) {
        gl_PointSize = pointSize;
        gl_Position = worldViewProjection * vec4(position, 1.0);
        i = gl_VertexID;
    }
`;

const fragmentShaderCode = `
    precision highp float;

    // Uniforms
    uniform int drawRange;
    uniform vec3 color;

    // Vertex index
    flat in int i;
    
    void main(void) {
        // Discard pixels when the index is over the range
        if (i >= drawRange) {
            discard;
        }

        // Calculate the relative position vector from the point center(0.5, 0.5)
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
    shader!: ShaderMaterial;
    pcs!: PointsCloudSystem;

    constructor(pointSize: number, pointColor: Color3) {

        this.pointSize = pointSize;
        this.pointColor = pointColor;

    }

    initialize(scene: Scene) {

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
                uniforms: ["pointSize", "worldViewProjection", "color", "drawRange"],
                needAlphaBlending: true,
            }
        );

        shaderMaterial.setFloat("pointSize", pointSize);
        shaderMaterial.setColor3("color", pointColor);

        // const pcs = createPointsCloudSystemd(points, scene);
        const pcs = new PointsCloudSystem("pointsCloud", 1, scene);
        pcs.addPoints(MAX_POINTS);

        pcs.buildMeshAsync().then(() => {
            if (pcs.mesh) {
                pcs.mesh.material = shaderMaterial;
                pcs.mesh.material.pointsCloud = true;
            }
        })

        this.shader = shaderMaterial;
        this.pcs = pcs;

    }

    update(points: Vector[]) {
        const { pcs, shader } = this;
        const particles = pcs.particles;

        if (points.length > particles.length) {
            throw new Error("the number of points exceed MAX_POINTS")
        }

        for (let i = 0; i < points.length; i++) {
            particles[i].position = new Vector3(points[i].x, points[i].y, points[i].z);
        }

        shader.setInt("drawRange", points.length);

        // pcs.setParticles();
        pcs.setParticles(0, points.length, true);

    }

    setVisible(value: boolean) {
        this.pcs.mesh?.setEnabled(value);
    }
}

class PolygonHelper {
    color: Color3;
    mesh!

    constructor(color: Color3) {
        this.color = color;
    }

    initialize(scene: Scene) {

        const polygon = MeshBuilder.CreateLines(
            "lines",
            {
                points: new Array(MAX_LINES_SEG).fill(new Vector3(0, 0, 0)),
                updatable: true,
            },
            scene
        );

        this.mesh = polygon
    }

    update(points: Vector[]) {
        const { mesh } = this;
        const positions = mesh.getVerticesData(VertexBuffer.PositionKind); // 2 points per line segment x 3 (Vector3)
        let index = 0;

        for (let i = 0; i < points.length; i++) {
            positions[index++] = points[i].x;
            positions[index++] = points[i].y;
            positions[index++] = points[i].z;
        }

        mesh.setVerticesData(VertexBuffer.PositionKind, positions);

    }

    setVisible(value: boolean) {
        this.mesh.setEnabled(value);
    }
}

class CurvatureHelper {
    color: Color3;
    mesh!

    constructor(color: Color3) {
        this.color = color;
    }

    initialize(scene: Scene) {
        const { color } = this;
        const arr = [];
        for (let i = 0; i < MAX_LINES_SEG; i++) {
            arr.push([new Vector3(0, 0, 0), new Vector3(1, 1, 1)],)
        }
        // creates an instance of a line system
        const curvature = MeshBuilder.CreateLineSystem("lineSystem", { lines: arr }, scene);
        curvature.color = color;
        this.mesh = curvature;
    }

    update(curve) {
        const { mesh } = this;
        const positions = mesh.getVerticesData(VertexBuffer.PositionKind); // 2 points per line segment x 3 (Vector3)

        let index = 0;
        for (let i = 0; i < MAX_LINES_SEG; i++) {

            const knots = curve.knots;
            const t_min = knots ? knots[0] : 0.0;
            const t_max = knots ? knots[knots.length - 1] : 1.0;
            let t = t_min + i / (MAX_LINES_SEG - 1) * (t_max - t_min);

            const pts = curve.interrogationAt(t);
            const alpha = 1.0;
            const crvt = pts.normal.negate().mul(pts.curvature * alpha);
            const tuft = pts.point.add(crvt);

            positions[index++] = pts.point.x
            positions[index++] = pts.point.y
            positions[index++] = pts.point.z
            positions[index++] = tuft.x;
            positions[index++] = tuft.y;
            positions[index++] = tuft.z;

        }

        mesh.setVerticesData(VertexBuffer.PositionKind, positions);

    }

    setVisible(value: boolean) {
        this.mesh.setEnabled(value);
    }

}




export { PointHelper, PolygonHelper, CurvatureHelper };