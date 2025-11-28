import {
    Scene,
    Vector3,
    Color4,
    Viewport,
    ArcRotateCamera,
    HemisphericLight,
    MeshBuilder,
    Mesh,
    StandardMaterial,
    Plane,
    PointerEventTypes,
    Ray,
    RayHelper,
    PhysicsRaycastResult,
    HavokPlugin,
    Color3,
    PointsCloudSystem,
    ShaderMaterial,
    Effect,
} from "@babylonjs/core";
import { History } from "./commands/History.js";
import { AddCurveCommand } from "./commands/AddCurveCommand.js";
import { BsplineCurveInt } from "./modeling/BsplineCurveInt.js";
import { Vector } from "./modeling/NurbsLib";
import { Parametric } from "./modeling/Parametric";
import { PointerMove } from "./PointerMove.js";

export default class Editor {
    scene!: Scene;
    history: History = new History();
    callbacks: Array<(scene: Scene, msg: string) => void> = [];
    pickables: Array<Mesh> = [];
    pickedObject: Mesh | undefined;
    savedColor = 0;

    constructor() {
        this.callbacks.push(this.onKeyDown);
    }

    dispose() {
        this.scene.dispose();
        this.history.clear();
        this.callbacks = [];
        this.pickables = [];
    }

    onSceneReady(scene: Scene) {
        this.scene = scene;
        scene.clearColor = new Color4(0, 0, 0, 1);
        // Enable the Geometry Buffer Renderer
        scene.enableGeometryBufferRenderer();

        const cameras = [];

        for (let i = 0; i < 4; i++) {
            cameras.push(
                new ArcRotateCamera(
                    // name, alpha, beta, radius, target position, scene
                    `Camera${i}`,
                    90,
                    0,
                    10,
                    new Vector3(0, 0, 0),
                    scene
                )
            );
        }

        // Set up viewport of each camera
        const viewports = [
            // x, y, width, height
            new Viewport(0.0, 0.5, 0.5, 0.5), // top-left
            new Viewport(0.5, 0.5, 0.5, 0.5), // top-right
            new Viewport(0.0, 0.0, 0.5, 0.5), // bottom-left
            new Viewport(0.5, 0.0, 0.5, 0.5), // bottom-right
        ];

        // Set up position of each camera
        const positions = [
            new Vector3(10, 0, 0), // x-view
            new Vector3(10, 10, 10), // perspective
            new Vector3(0, 10, 0), // y-view
            new Vector3(0, 0, 10), // z-view
        ];

        cameras.map((camera: ArcRotateCamera, i: number) => {
            camera.setTarget(Vector3.Zero()); // camera target to scene origin
            camera.viewport = viewports[i];
            camera.setPosition(positions[i]);
        });
        cameras[0].attachControl(true);
        cameras[0].angularSensibilityX = Infinity
        cameras[0].angularSensibilityY = Infinity
        cameras[2].angularSensibilityX = Infinity
        cameras[2].angularSensibilityY = Infinity
        cameras[3].angularSensibilityX = Infinity
        cameras[3].angularSensibilityY = Infinity

        scene.activeCameras = cameras;

        // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
        const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);

        // Default intensity is 1. Let's dim the light a small amount
        light.intensity = 0.25;

        // built-in 'ground' shape.
        // const ground = MeshBuilder.CreateGround("ground", { width: 6, height: 6 }, scene);
        // const ground = MeshBuilder.CreatePlane("plane", { width: 6, height: 6, sideOrientation: Mesh.DOUBLESIDE }, scene);

        this.callbacks.forEach((callback) => callback(scene, "observable added by callback"));

        // Create Test curve
        const poles = [
            { point: new Vector(0, 0, 0) },
            { point: new Vector(1, 1, 1) },
            { point: new Vector(2, 0, 0) },
            { point: new Vector(3, 1, 1) },
        ];
        const curve = new BsplineCurveInt(3, poles);
        this.addTestCurve(curve);

        // GPU pick test
        const pointerMove = new PointerMove(this);
        pointerMove.addObservable();
        pointerMove.setPickables(this.pickables);

        // Ray test
        function getPointerGroundIntersection(scene: Scene, evt: PointerEvent) {
            const camera = scene.activeCamera;
            if (!camera) return null;

            // 1) from cam to pointer ray
            const ray = scene.createPickingRay(
                evt.clientX,
                evt.clientY,
                null,
                camera,
                false
            );

            const plane = MeshBuilder.CreatePlane("p", { size: 10 }, scene);
            plane.rotation.x = Math.PI / 2; // xy plane -> x-z plane
            plane.position.y = 0;
            plane.isPickable = true;
            plane.material = new StandardMaterial("mat", scene);
            plane.material.backFaceCulling = false;

            const pickInfo = ray.intersectsMesh(plane);

            return pickInfo.hit ? pickInfo.pickedPoint! : null;

        }

        scene.onPointerObservable.add((pointerInfo) => {
            if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
                const evt = pointerInfo.event as PointerEvent;
                const point = getPointerGroundIntersection(scene, evt);

                if (point) {
                    point.y = 0;
                    console.log("Intersection:", point.toString());
                } else {
                    console.log("No intersection with ground plane");
                }
            }
        });

        const MAX_LINES_SEG = 400;


        //create design points, control points, control polygon, curvature
        const designPoints = curve.designPoints;
        const ctrlPoints = curve.ctrlPoints;

        const points = new PointsCloudSystem("designPoints", 5, scene); // point size: 5
        const createDesignPoints = function (p: { position: Vector3; color: Color3; }, i: number) {
            p.position = new Vector3(designPoints[i].x, designPoints[i].y, designPoints[i].z);
            p.color = new Color3(1, 1, 0);
        };
        points.addPoints(designPoints.length, createDesignPoints); // createPoint 함수를 1번 실행하여 단일 점 생성
        points.buildMeshAsync();

        const ctrl = new PointsCloudSystem("ctrlPoints", 5, scene); // point size: 5
        const createCtrlPoints = function (p: { position: Vector3; color: Color3; }, i: number) {
            p.position = new Vector3(ctrlPoints[i].x, ctrlPoints[i].y, ctrlPoints[i].z);
            p.color = new Color3(0.5, 0.5, 0.5);
        };
        ctrl.addPoints(ctrlPoints.length, createCtrlPoints); // createPoint 함수를 1번 실행하여 단일 점 생성
        // ctrl.buildMeshAsync();

        const vertexShaderCode = `
            precision highp float;

            // Attributes
            attribute vec3 position;
            attribute vec4 color;

            // Uniforms
            uniform mat4 worldViewProjection;
            uniform float pointSize;

            // Varyings
            varying vec4 vColor;

            void main(void) {
                gl_Position = worldViewProjection * vec4(position, 1.0);
                gl_PointSize = pointSize;
                vColor = color;
            }
        `;

        const fragmentShaderCode = `
            precision highp float;

            // Varyings
            varying vec4 vColor;

            void main(void) {
                // 점의 중심 (0.5, 0.5)으로부터의 상대 위치 벡터 계산
                vec2 diff = gl_PointCoord - vec2(0.5, 0.5);

                // 중심으로부터의 거리 계산
                float dist = length(diff); 

                // 둥근 마스크 적용: 거리가 0.5를 초과하면 픽셀을 버림
                if (dist > 0.5) {
                    discard;
                }

                // Anti-aliasing을 위한 부드러운 가장자리 처리 (선택 사항)
                float alpha = 1.0 - smoothstep(0.48, 0.5, dist);
                
                // 최종 색상 설정
                gl_FragColor = vec4(vColor.rgb, vColor.a * alpha);
            }
        `;

        Effect.ShadersStore["customVertexShader"] = vertexShaderCode;
        Effect.ShadersStore["customFragmentShader"] = fragmentShaderCode;

        const shaderMaterial = new ShaderMaterial(
            "roundPointShader",
            scene,
            {
                vertex: "custom",
                fragment: "custom",
            },
            {
                // 셰이더에서 사용하는 속성과 유니폼 정의
                attributes: ["position", "color"], // PCS에서 제공하는 속성
                uniforms: ["worldViewProjection", "pointSize"] // 셰이더에서 사용할 유니폼 변수
            }
        );

        shaderMaterial.setFloat("pointSize", 10.0);

        ctrl.buildMeshAsync().then(() => {
            if (ctrl.mesh) {
                ctrl.mesh.material = shaderMaterial;
            } else {
                console.log('no mesh')
            }
        })


        const ctrlPolygon = MeshBuilder.CreateLines(
            "lines",
            {
                points: ctrlPoints,
                updatable: true,
            },
            scene
        );

        const arr = [];

        for (let i = 0; i < MAX_LINES_SEG; i++) {

            const knots = curve.knots;
            const t_min = knots ? knots[0] : 0.0;
            const t_max = knots ? knots[knots.length - 1] : 1.0;
            let t = t_min + i / (MAX_LINES_SEG - 1) * (t_max - t_min);

            const pts = curve.interrogationAt(t);
            const alpha = 1.0;
            const crvt = pts.normal.negate().mul(pts.curvature * alpha);
            const tuft = pts.point.add(crvt);

            arr.push([new Vector3(pts.point.x, pts.point.y, pts.point.z), new Vector3(tuft.x, tuft.y, tuft.z)],)

        }

        // creates an instance of a line system
        const curvature = MeshBuilder.CreateLineSystem("lineSystem", { lines: arr }, scene);
        curvature.color = new Color3(0.5, 0, 0);

        // // updates the existing instance of lineSystem : no need for the parameter scene here
        // lineSystem = MeshBuilder.CreateLineSystem("lineSystem", { lines: arr, instance: lineSystem });


    }

    addCallback(callback: (scene: Scene, msg: string) => void) {
        this.callbacks.push(callback);
    }

    removeCallback(callback: (scene: Scene) => void) {
        const index = this.callbacks.indexOf(callback);
        if (index > -1) this.callbacks.splice(index, 1);
    }

    addCurve(curve: Parametric) {
        this.execute(new AddCurveCommand(this, curve));
    }

    // addInterpolatedCurve( pole ) {

    // 	this.execute( new AddInterpolatedCurveCommand( this, pole ) );

    // }

    updatelines(curve: Parametric, points: Vector[]) {
        MeshBuilder.CreateLines(null, {
            points: points,
            instance: curve,
        });
    }

    updateSurface(mesh, positions) {
        mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
        // mesh.updateVerticesData(BABYLON.VertexBuffer.NormalKind, normals);
        // mesh.updateVerticesData(BABYLON.VertexBuffer.ColorKind, colors);
        // mesh.updateVerticesData(BABYLON.VertexBuffer.UVKind, uvs);
    }

    execute(cmd) {
        this.history.excute(cmd);
    }

    addTestCurve(curve) {

        this.execute(new AddCurveCommand(this, curve));

    }

    onKeyDown(scene: Scene) {
        document.addEventListener("keydown", (e) => {
            const camera = scene.activeCamera;

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
                // e.preventDefault();
            }
            if (camera) {
                if (e.key === "x") {
                    // Positions the camera overwriting alpha, beta, radius
                    camera.position = new Vector3(10, 0, 0);
                }
                if (e.key === "y") {
                    camera.position = new Vector3(0, 10, 0);
                }
                if (e.key === "z") {
                    camera.position = new Vector3(0, 0, 10);
                }
            }
        });
    }
}
