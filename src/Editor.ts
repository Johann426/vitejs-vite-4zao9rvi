import {
    Scene,
    Vector3,
    Color4,
    Viewport,
    ArcRotateCamera,
    HemisphericLight,
    MeshBuilder,
    Mesh,
    PointerEventTypes,
    Plane,
    Ray,
    RayHelper,
    PhysicsRaycastResult,
    HavokPlugin,
} from "@babylonjs/core";
import { History } from "./commands/History.js";
import { AddCurveCommand } from "./commands/AddcurveCommand.js";
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
        const ground = MeshBuilder.CreateGround("ground", { width: 6, height: 6 }, scene);

        this.callbacks.forEach((callback) => callback(scene, "observable added by callback"));

        this.addTestCurve();

        const pointerMove = new PointerMove(this);
        pointerMove.addObservable();
        pointerMove.setPickables(this.pickables);


        // 1. 포인터 위치에서 Ray 생성
        const pickRay = scene.createPickingRay(
            scene.pointerX,
            scene.pointerY,
            null,
            scene.activeCamera
        );

        // 2. 평면 정의 (예: y=0 평면)
        const plane = new Plane(0, 1, 0, 0); // normal=(0,1,0), d=0

        // initialize plugin
        var hk = new HavokPlugin();
        // enable physics in the scene with a gravity
        scene.enablePhysics(new Vector3(0, -9.81, 0), hk);
        var physEngine = scene.getPhysicsEngine();

        var pickingRay = new Ray(
            new Vector3(0, 0, 0),
            new Vector3(0, 1, 0)
        );
        var rayHelper = new RayHelper(pickingRay);
        rayHelper.show(scene);
        var raycastResult = new PhysicsRaycastResult();

        scene.onPointerMove = (evt, pickInfo) => {
            var hit = false;
            var hitPos = null;

            scene.createPickingRayToRef(
                scene.pointerX,
                scene.pointerY,
                null,
                pickingRay,
                scene.activeCamera
            );
            physEngine.raycastToRef(pickingRay.origin, pickingRay.origin.add(pickingRay.direction.scale(10000)), raycastResult);
            hit = raycastResult.hasHit;
            hitPos = raycastResult.hitPointWorld;
        }


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

    addTestCurve() {
        const poles = [
            { point: new Vector(0, 0, 0) },
            { point: new Vector(1, 1, 1) },
            { point: new Vector(2, 0, 0) },
            { point: new Vector(3, 1, 1) },
        ];

        const curve = new BsplineCurveInt(3, poles);

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
