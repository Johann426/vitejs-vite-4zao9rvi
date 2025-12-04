import { Scene, Color3, Vector3, ShaderMaterial, PointsCloudSystem, MeshBuilder, VertexBuffer, LinesMesh } from "@babylonjs/core";

import { Vector } from "./modeling/NurbsLib.ts";
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
    const createDesignPoints = function (p: { position: Vector3; color: Color3 }, i: number) {
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
        });

        this.shader = shaderMaterial;
        this.pcs = pcs;
    }

    update(points: Vector[]) {
        const { pcs, shader } = this;
        const particles = pcs.particles;

        if (points.length > particles.length) {
            throw new Error("the number of points exceed MAX_POINTS");
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
    lineColor: Color3;
    shader!: ShaderMaterial;
    mesh!: LinesMesh;

    constructor(lineColor: Color3) {
        this.lineColor = lineColor;
    }

    initialize(scene: Scene) {
        const { lineColor } = this;
        const polygon = MeshBuilder.CreateLines(
            "lines",
            {
                points: new Array(MAX_LINES_SEG).fill(new Vector3(0, 0, 0)),
                updatable: true,
            },
            scene
        );

        // Initialize color vertex data
        const colors = new Array(MAX_LINES_SEG * 4).fill(0);
        // for (let i = 0; i < MAX_LINES_SEG; i++) {
        //     colors[4 * i + 0] = lineColor.r;
        //     colors[4 * i + 1] = lineColor.g;
        //     colors[4 * i + 2] = lineColor.b;
        //     colors[4 * i + 3] = 1.0;
        // }
        polygon.setVerticesData(VertexBuffer.ColorKind, colors);

        // Attach a lightweight ShaderMaterial that reads vertex colors (including alpha)
        // and discards fragments where alpha is zero. This allows us to keep a large
        // preallocated vertex buffer and simply set alpha=0 for unused vertices.
        const lineVertex = `
            precision highp float;

            attribute vec3 position;
            attribute vec4 color;

            uniform mat4 worldViewProjection;

            flat out int i;

            void main(void) {
                gl_Position = worldViewProjection * vec4(position, 1.0);
                i = gl_VertexID;
            }
        `;

        const lineFragment = `
            precision highp float;
            
            uniform vec3 color;
            uniform int drawRange;
            
            flat in int i;
            
            void main(void) {
                if (i >= drawRange) discard;
                // Set the final color
                gl_FragColor = vec4(color, 1.0);
            }
        `;

        const shader = new ShaderMaterial(
            "lineShader",
            scene,
            {
                vertexSource: lineVertex,
                fragmentSource: lineFragment,
            },
            {
                attributes: ["position", "color"],
                uniforms: ["worldViewProjection", "drawRange"],
                needAlphaBlending: true,
            }
        );

        polygon.material = shader;
        this.shader = shader;
        this.mesh = polygon;
    }

    update(points: Vector[]) {
        const { mesh, lineColor: color } = this;

        // If there are no points, disable the mesh and return
        if (!points || points.length === 0) {
            mesh.setEnabled(false);
            return;
        }

        mesh.setEnabled(true);

        // Convert incoming points to Babylon Vector3 array
        const pts: Vector3[] = points.map((p) => new Vector3(p.x, p.y, p.z));

        // Try to reuse existing buffers
        const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
        let colors = mesh.getVerticesData(VertexBuffer.ColorKind);

        const existingVertexCount = positions ? positions.length / 3 : 0;

        if (positions && existingVertexCount >= pts.length) {
            // update positions in-place for used vertices only
            let posIdx = 0;
            for (let i = 0; i < pts.length; i++) {
                positions[posIdx++] = pts[i].x;
                positions[posIdx++] = pts[i].y;
                positions[posIdx++] = pts[i].z;
            }

            mesh.updateVerticesData(VertexBuffer.PositionKind, positions, false);

            // update colors for used vertices only (assume existing color buffer present)
            if (colors) {
                for (let i = 0; i < pts.length; i++) {
                    colors[4 * i + 0] = color.r;
                    colors[4 * i + 1] = color.g;
                    colors[4 * i + 2] = color.b;
                    colors[4 * i + 3] = 1.0;
                }
                mesh.updateVerticesData(VertexBuffer.ColorKind, colors, false);
            }

            // update drawRange uniform so shader discards unused vertices
            try {
                (this.shader as ShaderMaterial).setInt("drawRange", pts.length);
            } catch {
                // ignore
            }
            return;
        }

        // Fallback: create a new mesh instance and disable the old one (do not dispose)
        const scene = mesh.getScene();
        const newMesh = MeshBuilder.CreateLines("lines", { points: pts, updatable: true }, scene) as LinesMesh;
        this.mesh.setEnabled(false);
        this.mesh = newMesh;
        // attach existing shader to new mesh
        try {
            newMesh.material = this.shader;
            (this.shader as ShaderMaterial).setInt("drawRange", pts.length);
        } catch {
            // ignore
        }
        const newColors: number[] = new Array(pts.length * 4);
        for (let i = 0; i < pts.length; i++) {
            newColors[4 * i + 0] = color.r;
            newColors[4 * i + 1] = color.g;
            newColors[4 * i + 2] = color.b;
            newColors[4 * i + 3] = 1.0;
        }
        newMesh.setVerticesData(VertexBuffer.ColorKind, newColors, true);
    }

    setVisible(value: boolean) {
        this.mesh.setEnabled(value);
    }
}

class CurvatureHelper {
    color: Color3;
    mesh!: LinesMesh;

    constructor(color: Color3) {
        this.color = color;
    }

    initialize(scene: Scene) {
        const { color } = this;
        const arr = [];
        for (let i = 0; i < MAX_LINES_SEG; i++) {
            arr.push([new Vector3(0, 0, 0), new Vector3(1, 1, 1)]);
        }
        // creates an instance of a line system
        const curvature = MeshBuilder.CreateLineSystem("lineSystem", { lines: arr }, scene);
        curvature.color = color;
        this.mesh = curvature;
    }

    update(curve: any) {
        const { mesh } = this;
        const positions = mesh.getVerticesData(VertexBuffer.PositionKind);

        if (!positions) return;

        let index = 0;
        for (let i = 0; i < MAX_LINES_SEG; i++) {
            const knots = curve.knots;
            const t_min = knots ? knots[0] : 0.0;
            const t_max = knots ? knots[knots.length - 1] : 1.0;
            const t = t_min + (i / (MAX_LINES_SEG - 1)) * (t_max - t_min);

            const pts = curve.interrogationAt(t);
            const alpha = 1.0;
            const crvt = pts.normal.negate().mul(pts.curvature * alpha);
            const tuft = pts.point.add(crvt);

            positions[index++] = pts.point.x;
            positions[index++] = pts.point.y;
            positions[index++] = pts.point.z;
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
