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


        //create design points, control points, control polygon, curvature
        const designPoints = curve.designPoints;
        const ctrlPoints = curve.ctrlPoints;

        const sphere = MeshBuilder.CreateSphere("point", { diameter: 0.2, segments: 6 }, scene);
        for (let i = 0; i < ctrlPoints.length; i++) {
            const dot = sphere.createInstance("");
            const p = ctrlPoints[i];
            dot.position = new Vector3(p.x, p.y, p.z);
        }

        const line = MeshBuilder.CreateLines(
            "lines",
            {
                points: ctrlPoints,
                updatable: true,
            },
            scene
        );


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
