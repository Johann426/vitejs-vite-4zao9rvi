import {
  Scene,
  Vector3,
  Color4,
  Viewport,
  ArcRotateCamera,
  GPUPicker,
  HemisphericLight,
  MeshBuilder,
  Mesh,
  StandardMaterial,
  Color3,
} from "@babylonjs/core";
import { History } from "./commands/History.js";
import { AddCurveCommand } from "./commands/AddCurveCommand.js";
import { AddPointCommand } from "./commands/AddPointCommand.js";
import { BsplineCurveInt } from "./modeling/BsplineCurveInt.js";
import { Vector } from "./modeling/NurbsLib";
import { Parametric } from "./modeling/Parametric";
import { PointHelper, CurvatureHelper, LineHelper } from "./DesignHelper.js";
import { SelectMesh } from "./listeners/SelectMesh.js";
import { KeyEventHandler } from "./listeners/KeyEvent.js";

export default class Editor {
  scene!: Scene;
  keyEventHandler!: KeyEventHandler;
  pointerEventHandler!: SelectMesh;
  callbacks: Array<(scene: Scene, msg: string) => void>;
  pickables: Array<Mesh>;
  selected: Mesh | undefined;
  picker: GPUPicker;
  history: History;
  designPoints: PointHelper;
  ctrlPoints: PointHelper;
  curvature: CurvatureHelper;
  ctrlPolygon: LineHelper;

  constructor() {
    this.callbacks = [];
    this.pickables = [];
    this.selected = undefined;
    this.picker = new GPUPicker(); // set up gpu picker
    this.history = new History();
    this.designPoints = new PointHelper(8.0, new Color3(1.0, 1.0, 0.0));
    this.ctrlPoints = new PointHelper(8.0, new Color3(0.5, 0.5, 0.5));
    this.curvature = new CurvatureHelper(new Color3(0.5, 0.0, 0.0));
    this.ctrlPolygon = new LineHelper(new Color3(0.5, 0.5, 0.5));
  }

  dispose() {
    this.scene.dispose();
    this.callbacks = [];
    this.pickables = [];
    this.history.clear();
    this.designPoints.dispose();
    this.ctrlPoints.dispose();
    this.curvature.dispose();
    this.ctrlPolygon.dispose();
  }

  onRender(scene: Scene) { }

  onSceneReady(scene: Scene) {
    scene.clearColor = new Color4(0, 0, 0, 1);

    const scope = this;
    scope.scene = scene;
    scope.callbacks.forEach((callback) => callback(scene, "observable added by callback"));

    // Select mesh by using GPU pick
    const selectMesh = new SelectMesh(scope);
    this.pointerEventHandler = selectMesh;
    // Key event observable
    const keyEventHandler = new KeyEventHandler(scope);
    this.keyEventHandler = keyEventHandler;

    const cameras: Array<ArcRotateCamera> = [];

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
    [0, 2, 3].map((i: number) => {
      cameras[i].angularSensibilityX = Infinity
      cameras[i].angularSensibilityY = Infinity
    })

    scene.activeCameras = cameras;

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);

    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.25;

    // Ray test
    function getPointerGroundIntersection(scene: Scene, evt: PointerEvent) {
      const camera = scene.activeCamera;

      if (!camera) return null;

      // 1) from cam to pointer ray
      const ray = scene.createPickingRay(evt.clientX, evt.clientY, null, camera, false);

      const plane = MeshBuilder.CreatePlane("p", { size: 10 }, scene);
      // plane.rotation.x = Math.PI / 2; // xy plane -> x-z plane
      plane.position.y = 0;
      plane.isPickable = true;
      plane.material = new StandardMaterial("mat", scene);
      plane.material.backFaceCulling = false;

      const pickInfo = ray.intersectsMesh(plane);

      return pickInfo.hit ? pickInfo.pickedPoint! : null;
    }

    // scene.onPointerObservable.add((pointerInfo) => {
    //   if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
    //     const evt = pointerInfo.event as PointerEvent;
    //     const point = getPointerGroundIntersection(scene, evt);

    //     if (point) {
    //       console.log("Intersection:", point.toString());
    //     } else {
    //       console.log("No intersection with ground plane");
    //     }
    //   }
    // });

    //create design points, control points, control polygon, curvature
    const { designPoints, ctrlPoints, curvature, ctrlPolygon } = this;
    [designPoints, ctrlPoints, curvature, ctrlPolygon].map(e => e.initialize(scene));

    // Create Test curve
    const poles = [
      { point: new Vector(0, 0, 0) },
      { point: new Vector(1, 1, 1) },
      { point: new Vector(2, 0, 0) },
      { point: new Vector(3, 1, 1) },
    ];
    const curve = new BsplineCurveInt(3, poles);

    // const curve = new BsplineCurveInt(3);
    this.addCurve(curve);
    // this.addPoint(new Vector(0, 0, 0));
    // this.addPoint(new Vector(1, 1, 1));
    // this.addPoint(new Vector(2, 0, 0));
    // this.addPoint(new Vector(3, 1, 1));

    selectMesh.setPickables(this.pickables);

  }

  addCallback(callback: (scene: Scene, msg: string) => void) {
    this.callbacks.push(callback);
  }

  removeCallback(callback: (scene: Scene) => void) {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) this.callbacks.splice(index, 1);
  }

  addPoint(point: Vector) {
    this.execute(new AddPointCommand(this, point));
  }

  addCurve(curve: Parametric) {
    this.execute(new AddCurveCommand(this, curve));
  }

  updateCurveHelper(curve: any) {
    const { designPoints, ctrlPoints, curvature, ctrlPolygon } = this;

    designPoints.update(curve.designPoints);
    ctrlPoints.update(curve.ctrlPoints);
    ctrlPolygon.update(curve.ctrlPoints);
    curvature.update(curve);
  }

  // addInterpolatedCurve( pole ) {

  // 	this.execute( new AddInterpolatedCurveCommand( this, pole ) );

  // }

  execute(cmd) {
    this.history.excute(cmd);
  }

}
