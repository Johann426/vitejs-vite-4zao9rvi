import { Scene, Color3, Vector3, ShaderMaterial, PointsCloudSystem, MeshBuilder, VertexBuffer, LinesMesh } from "@babylonjs/core";
import { Vector } from "./modeling/NurbsLib.ts";

const MAX_POINTS = 100;
const MAX_LINE_SEG = 100;

function createPointShader(scene: Scene) {
    // Vertex shader code
    const vs = `
        precision highp float;
        attribute vec3 position;
        uniform float pointSize;
        uniform mat4 worldViewProjection;
        flat out int i;
        void main(void) {
            gl_PointSize = pointSize;
            gl_Position = worldViewProjection * vec4(position, 1.0);
            i = gl_VertexID;
        }
    `;
    // Fragment shader code
    const fs = `
        precision highp float;
        uniform int drawRange;
        uniform vec3 color3;
        flat in int i;
        void main(void) {
            if (i >= drawRange) discard;
            vec2 diff = gl_PointCoord - vec2(0.5, 0.5);
            float dist = length(diff);
            if (dist > 0.5) discard;
            float alpha = 1.0 - smoothstep(0.45, 0.5, dist);
            gl_FragColor = vec4(color3, alpha);
        }
    `;
    // create shader material
    return new ShaderMaterial(
        "pointShader",
        scene,
        {
            vertexSource: vs,
            fragmentSource: fs,
        },
        {
            attributes: ["position"],
            uniforms: ["pointSize", "worldViewProjection", "drawRange", "color3"],
            needAlphaBlending: true,
        }
    );
}

function createLinesShader(scene: Scene) {
    // Vertex shader code
    const vs = `
        precision highp float;
        attribute vec3 position;
        uniform mat4 worldViewProjection;
        flat out int i;
        void main(void) {
            gl_Position = worldViewProjection * vec4(position, 1.0);
            i = gl_VertexID;
        }
    `;
    // Fragment shader code
    const fs = `
        precision highp float;
        uniform int drawRange;
        uniform vec3 color3;
        flat in int i;
        void main(void) {
            if (i >= drawRange) discard;
            gl_FragColor = vec4(color3, 1.0);
        }
    `;
    // create shader material
    return new ShaderMaterial(
        "linesShader",
        scene,
        {
            vertexSource: vs,
            fragmentSource: fs,
        },
        {
            attributes: ["position"],
            uniforms: ["worldViewProjection", "drawRange", "color3"],
        }
    );
}

/**
 * Class to help rendering of points using a custom shader material
 * which uses gl_VertexID to discard fragments outsie the draw range.
 * This allows efficient rendering of a variable number of points
 * without needing to reallocate GPU buffers.
 *  @author Johannd0426 <
 */
export class PointHelper {
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
        // create shader material
        const shader = createPointShader(scene);
        // set initial uniform values in fragment shader
        shader.setFloat("pointSize", pointSize);
        shader.setColor3("color3", pointColor);
        // create a preallocated point cloud system
        const pcs = new PointsCloudSystem("pointsCloud", 1, scene);
        pcs.addPoints(MAX_POINTS);
        // build the point cloud mesh
        pcs.buildMeshAsync().then(() => {
            if (pcs.mesh) {
                pcs.mesh.material = shader;
                pcs.mesh.material.pointsCloud = true;
            }
        });
        // store references
        this.shader = shader;
        this.pcs = pcs;
    }

    update(points: Vector[]) {
        const { pcs, shader } = this;

        if (!pcs.mesh) return;

        // If there are no points, disable the mesh and return
        if (!points || points.length === 0) {
            pcs.mesh.setEnabled(false);
            return;
        }

        pcs.mesh.setEnabled(true);

        // particles in point cloud system
        const particles = pcs.particles;

        if (points.length <= particles.length) {
            // update particle positions from points data
            points.map((p, i) => particles[i].position = new Vector3(p.x, p.y, p.z));
            // update the mesh according to the particle positions
            pcs.setParticles(0, points.length, true);
            // update drawRange uniform so shader discards unused vertices
            shader.setInt("drawRange", points.length);
        } else {
            const scene = pcs.mesh.getScene();
            // dispose existing point cloud system
            pcs.dispose();
            // new point cloud system since larger buffer allocation needed
            const newPcs = new PointsCloudSystem("pointsCloud", 1, scene);
            const createDesignPoints = function (p: { position: Vector3 }, i: number) {
                p.position = new Vector3(points[i].x, points[i].y, points[i].z);
            };
            newPcs.addPoints(points.length, createDesignPoints);
            // build the new point cloud mesh
            newPcs.buildMeshAsync().then(() => {
                if (newPcs.mesh) {
                    newPcs.mesh.material = shader;
                    newPcs.mesh.material.pointsCloud = true;
                }
            });
            // update drawRange uniform so shader discards unused vertices
            shader.setInt("drawRange", points.length);
            // replace old pcs with new pcs
            this.pcs = newPcs;
        }
    }

    setVisible(value: boolean) {
        this.pcs.mesh?.setEnabled(value);
    }

    dispose() {
        this.pcs.dispose();
        this.shader.dispose();
    }
}

/**
 * Class to help rendering of lines using a custom shader material
 * which uses gl_VertexID to discard fragments outsie the draw range.
 * This allows efficient rendering of a variable number of line segments
 * without needing to reallocate GPU buffers.
 *  @author Johannd0426 <
 */
export class LinesHelper {
    color3: Color3;
    shader!: ShaderMaterial;
    mesh!: LinesMesh;

    constructor(color3: Color3) {
        this.color3 = color3;
    }

    initialize(scene: Scene) {
        const { color3 } = this;
        // create shader material
        const shader = createLinesShader(scene);
        // set initial uniform values in fragment shader
        shader.setColor3("color3", color3);
        // create a preallocated line mesh
        const mesh = MeshBuilder.CreateLines(
            "lines",
            {
                points: new Array(MAX_LINE_SEG).fill(new Vector3()),
                material: shader,
                updatable: true,
            },
            scene
        );
        // store references
        this.shader = shader;
        this.mesh = mesh;
    }

    update(points: Vector[]) {
        const { mesh, shader } = this;

        // If there are no points, disable the mesh and return
        if (!points || points.length === 0) {
            mesh.setEnabled(false);
            return;
        }

        mesh.setEnabled(true);

        // preallocated vertex position buffers
        const positions = mesh.getVerticesData(VertexBuffer.PositionKind);

        if (!positions) return;

        if (points.length <= positions.length / 3) {
            // update positions with points data
            for (let i = 0; i < points.length; i++) {
                positions[3 * i + 0] = points[i].x;
                positions[3 * i + 1] = points[i].y;
                positions[3 * i + 2] = points[i].z;
            }
            // update vertex position buffers
            mesh.updateVerticesData(VertexBuffer.PositionKind, positions, false);
            // update drawRange uniform so shader discards unused vertices
            shader.setInt("drawRange", points.length);
        } else {
            const scene = mesh.getScene();
            // dispose existing helper mesh
            mesh.dispose();
            // new helper mesh since larger buffer allocation needed
            const newMesh = MeshBuilder.CreateLines(
                "lines",
                {
                    points: points.map(p => new Vector3(p.x, p.y, p.z)),
                    material: shader,
                    updatable: true,
                },
                scene
            );
            // update drawRange uniform so shader discards unused vertices
            shader.setInt("drawRange", points.length);
            //  replace old mesh with new mesh
            this.mesh = newMesh;
        }
    }

    setVisible(value: boolean) {
        this.mesh.setEnabled(value);
    }

    dispose() {
        this.mesh.dispose();
        this.shader.dispose();
    }
}

/**
 * Class to help rendering of curvature for a given curve
 * using a preallocated line system mesh.
 *  @author Johannd0426 <
 */
export class CurvatureHelper {
    color: Color3;
    mesh!: LinesMesh;

    constructor(color: Color3) {
        this.color = color;
    }

    initialize(scene: Scene) {
        const { color } = this;
        const arr = [];
        for (let i = 0; i < MAX_LINE_SEG; i++) {
            arr.push([new Vector3(), new Vector3()]);
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

        for (let i = 0; i < MAX_LINE_SEG; i++) {
            const knots = curve.knots;
            const t_min = knots ? knots[0] : 0.0;
            const t_max = knots ? knots[knots.length - 1] : 1.0;
            const t = t_min + (i / (MAX_LINE_SEG - 1)) * (t_max - t_min);

            const pts = curve.interrogationAt(t);
            const alpha = 1.0;
            const crvt = pts.normal.negate().mul(pts.curvature * alpha);
            const tuft = pts.point.add(crvt);

            positions[6 * i + 0] = pts.point.x;
            positions[6 * i + 1] = pts.point.y;
            positions[6 * i + 2] = pts.point.z;
            positions[6 * i + 3] = tuft.x;
            positions[6 * i + 4] = tuft.y;
            positions[6 * i + 5] = tuft.z;
        }

        mesh.setEnabled(true);
        mesh.setVerticesData(VertexBuffer.PositionKind, positions);
    }

    setVisible(value: boolean) {
        this.mesh.setEnabled(value);
    }

    dispose() {
        this.mesh.dispose();
    }
}
