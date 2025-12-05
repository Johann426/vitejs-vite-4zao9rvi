import { Scene, Color3, Vector3, ShaderMaterial, PointsCloudSystem, MeshBuilder, VertexBuffer, LinesMesh } from "@babylonjs/core";
import { Vector } from "./modeling/NurbsLib.ts";

const MAX_POINTS = 2;
const MAX_LINES_SEG = 100;

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

        // Attach a ShaderMaterial that reads vertex index(gl_VertexID) and discards fragments where index is out of range.
        // This allows us to keep a large preallocated vertex buffer and simply set a integer number for the draw range.
        const vertexShaderCode = `
            precision highp float;

            // Attributes
            attribute vec3 position;

            // Uniforms
            uniform float pointSize;
            uniform mat4 worldViewProjection;

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
            uniform vec3 color3;

            // Vertex index
            flat in int i;
            
            void main(void) {
                // Discard pixels when the index is out of draw range
                if (i >= drawRange) discard;

                // Calculate the relative position vector from the point center(0.5, 0.5)
                vec2 diff = gl_PointCoord - vec2(0.5, 0.5);

                // Compute the distance from the center
                float dist = length(diff); 

                // Apply circular mask: discard pixel if distance exceeds 0.5
                if (dist > 0.5) discard;

                // Smooth edge handling for anti-aliasing (optional)
                float alpha = 1.0 - smoothstep(0.45, 0.5, dist);

                // Set the final color
                gl_FragColor = vec4(color3, alpha);
            }
        `;

        const shaderMaterial = new ShaderMaterial(
            "pointShader",
            scene,
            {
                vertexSource: vertexShaderCode,
                fragmentSource: fragmentShaderCode,
            },
            {
                attributes: ["position"],
                uniforms: ["pointSize", "worldViewProjection", "drawRange", "color3"],
                needAlphaBlending: true,
            }
        );

        shaderMaterial.setFloat("pointSize", pointSize);
        shaderMaterial.setColor3("color3", pointColor);

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
        const { pcs, shader, pointSize, pointColor } = this;

        if (!pcs.mesh) return;

        // If there are no points, disable the mesh and return
        if (!points || points.length === 0) {
            pcs.mesh.setEnabled(false);
            return;
        }

        pcs.mesh.setEnabled(true);

        const particles = pcs.particles;

        if (points.length <= particles.length) {
            // update particle positions from points data
            points.map((p, i) => particles[i].position = new Vector3(p.x, p.y, p.z));
            // update drawRange uniform so shader discards unused vertices
            shader.setInt("drawRange", points.length);
            // update the mesh according to the particle positions
            pcs.setParticles(0, points.length, true);
        } else {
            const scene = pcs.mesh.getScene();
            // dispose existing helper point cloud system
            pcs.dispose();
            // new helper point cloud system since larger buffer allocation needed
            const newPcs = new PointsCloudSystem("pointsCloud", 1, scene);
            const createDesignPoints = function (p: { position: Vector3; color: Color3 }, i: number) {
                p.position = new Vector3(points[i].x, points[i].y, points[i].z);
                p.color = pointColor;
            };
            newPcs.addPoints(points.length, createDesignPoints);
            shader.setInt("drawRange", points.length);
            newPcs.buildMeshAsync().then(() => {
                if (newPcs.mesh) {
                    newPcs.mesh.material = shader;
                    newPcs.mesh.material.pointsCloud = true;
                }
            });

            this.pcs = newPcs;
        }
    }

    setVisible(value: boolean) {
        this.pcs.mesh?.setEnabled(value);
    }
}

class LineHelper {
    color3: Color3;
    shader!: ShaderMaterial;
    mesh!: LinesMesh;

    constructor(color3: Color3) {
        this.color3 = color3;
    }

    initialize(scene: Scene) {
        const { color3 } = this;


        const lineVertex = `
            precision highp float;

            // Attributes
            attribute vec3 position;

            // Uniforms
            uniform mat4 worldViewProjection;

            // Send gl_VertexID to the fragment shader as a flat integer(to avoid interpolation)
            flat out int i;

            void main(void) {
                gl_Position = worldViewProjection * vec4(position, 1.0);
                i = gl_VertexID;
            }
        `;

        const lineFragment = `
            precision highp float;
            
            // Uniforms
            uniform int drawRange;
            uniform vec3 color3;
            
            // Vertex index
            flat in int i;
            
            void main(void) {
                // Discard pixels when the index is out of draw range
                if (i >= drawRange) discard;
                
                // Set the final color
                gl_FragColor = vec4(color3, 1.0);
            }
        `;

        const shaderMaterial = new ShaderMaterial(
            "lineShader",
            scene,
            {
                vertexSource: lineVertex,
                fragmentSource: lineFragment,
            },
            {
                attributes: ["position"],
                uniforms: ["worldViewProjection", "drawRange", "color3"],
            }
        );

        shaderMaterial.setColor3("color3", color3);

        const polygon = MeshBuilder.CreateLines(
            "lines",
            {
                points: new Array(MAX_LINES_SEG).fill(new Vector3()),
                material: shaderMaterial,
                updatable: true,
            },
            scene
        );

        this.shader = shaderMaterial;
        this.mesh = polygon;
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

            this.mesh = newMesh;
        }
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

        for (let i = 0; i < MAX_LINES_SEG; i++) {
            const knots = curve.knots;
            const t_min = knots ? knots[0] : 0.0;
            const t_max = knots ? knots[knots.length - 1] : 1.0;
            const t = t_min + (i / (MAX_LINES_SEG - 1)) * (t_max - t_min);

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
}

export { PointHelper, LineHelper, CurvatureHelper };
