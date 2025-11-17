import { Scene, Vector3, Color4, Viewport, ArcRotateCamera, HemisphericLight, MeshBuilder, AbstractMesh, GPUPicker, Color3, PointerEventTypes } from "@babylonjs/core";
import { History } from "./commands/History.js";
import { AddCurveCommand } from "./commands/AddcurveCommand.js";
import { PickingCommand } from "./commands/PickingCommand.js";
import { BsplineCurveInt } from "./modeling/BsplineCurveInt.js"
import { Vector } from "./modeling/NurbsLib";
import { Parametric } from "./modeling/Parametric"

export default class Editor {
  scene: undefined | Scene;
  history: History = new History();
  callbacks: Array<(scene: Scene) => void> = [];
  pickables: Array<AbstractMesh> = [];

  constructor() {
    this.callbacks.push(this.onKeyDown);
  }

  clear() {
    this.scene = undefined;
    this.history = new History();
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
      cameras.push(new ArcRotateCamera(
        // name, alpha, beta, radius, target position, scene
        `Camera${i}`, 90, 0, 10, new Vector3(0, 0, 0), scene
      ));
    }

    // Set up viewport of each camera
    const viewports = [
      // x, y, width, height
      new Viewport(0.0, 0.5, 0.5, 0.5), // top-left
      new Viewport(0.5, 0.5, 0.5, 0.5), // top-right
      new Viewport(0.0, 0.0, 0.5, 0.5), // bottom-left
      new Viewport(0.5, 0.0, 0.5, 0.5)  // bottom-right
    ];

    // Set up position of each camera
    const positions = [
      new Vector3(10, 0, 0), // x-view
      new Vector3(10, 10, 10), // perspective
      new Vector3(0, 10, 0), // y-view
      new Vector3(0, 0, 10), // z-view
    ]

    cameras.map((camera: ArcRotateCamera, i: number) => {
      camera.setTarget(Vector3.Zero()); // camera target to scene origin
      camera.viewport = viewports[i];
      camera.setPosition(positions[i]);
    })
    cameras[0].attachControl(true);

    scene.activeCameras = cameras

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);

    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.25;

    // built-in 'ground' shape.
    const ground = MeshBuilder.CreateGround("ground", { width: 6, height: 6 }, scene);

    this.callbacks.forEach(callback => callback(scene));

    this.addTestCurve();

    // set up gpu picker
    const picker = new GPUPicker();
    picker.setPickingList(this.pickables);

    const onPointerMove = () => {
      if (picker.pickingInProgress) {
        return;
      }
      const offset = 2;
      const x1 = scene.pointerX - offset;
      const y1 = scene.pointerY - offset;
      const x2 = scene.pointerX + offset;
      const y2 = scene.pointerY + offset;
      picker.boxPickAsync(x1, y1, x2, y2).then((pickingInfo) => {
        if (pickingInfo) {
          if (pickingInfo.meshes[0]) {
            console.log(pickingInfo.meshes[0].name);
            pickingInfo.meshes[0].color = new Color3(1, 1, 0);
          }
        }
      });
    }

    scene.onPointerObservable.add(onPointerMove, PointerEventTypes.POINTERMOVE);

  }

  addCallback(callback: (scene: Scene) => void) {
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
      instance: curve
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
      { point: new Vector(3, 1, 1) }
    ];

    const curve = new BsplineCurveInt(3, poles)

    this.execute(new AddCurveCommand(this, curve))

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

    })

  }

}
