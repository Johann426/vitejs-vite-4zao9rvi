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
  GlowLayer,
} from "@babylonjs/core";
import { History } from "./commands/History.js";
import { AddCurveCommand } from "./commands/AddCurveCommand.js";
import { AddPointCommand } from "./commands/AddPointCommand.js";
import { BsplineCurveInt } from "./modeling/BsplineCurveInt.js";
import { Vector } from "./modeling/NurbsLib";
import { Parametric } from "./modeling/Parametric";
import { PointHelper, LinesHelper, CurvatureHelper } from "./DesignHelper.js";
import { SelectMesh } from "./listeners/SelectMesh.js";
import { KeyEventHandler } from "./listeners/KeyEvent.js";

const startTime = Date.now();
const curvatureScale = 1.0;
const curvatureColor = new Color3(0.5, 0.0, 0.0);
const ctrlPointsSize = 7.0;
const ctrlPointsColor = new Color3(0.5, 0.5, 0.5)
const ctrlpolygonColor = new Color3(0.5, 0.5, 0.5)
const designPointsSize = 8.0;
const designPointsColor = new Color3(1.0, 1.0, 0.0);

export default class Editor {
  scene!: Scene;
  keyEventHandler!: KeyEventHandler;
  selectMesh!: SelectMesh;
  glowLayer!: GlowLayer;
  callbacks: Array<(scene: Scene) => void>;
  pickables: Array<Mesh>;
  selected: Mesh | undefined;
  picker: GPUPicker;
  history: History;
  curvature: CurvatureHelper;
  ctrlPoints: PointHelper;
  ctrlPolygon: LinesHelper;
  designPoints: PointHelper;
  nViewport: number = 0;

  constructor() {
    this.callbacks = [];
    this.pickables = [];
    this.selected = undefined;
    this.picker = new GPUPicker(); // set up gpu picker
    this.history = new History();
    this.curvature = new CurvatureHelper(curvatureColor, curvatureScale);
    this.ctrlPoints = new PointHelper(ctrlPointsSize, ctrlPointsColor);
    this.ctrlPolygon = new LinesHelper(ctrlpolygonColor);
    this.designPoints = new PointHelper(designPointsSize, designPointsColor);
  }

  get viewportIndex() {
    return this.nViewport;
  }



  dispose() {
    this.scene.dispose();
    this.keyEventHandler.dispose();
    this.selectMesh.dispose();
    this.glowLayer.dispose();
    this.callbacks = [];
    this.pickables = [];
    this.selected = undefined;
    this.picker.dispose();
    this.history.clear();
    this.curvature.dispose();
    this.ctrlPoints.dispose();
    this.ctrlPolygon.dispose();
    this.designPoints.dispose();
  }

  test() {
    // Create Test curve
    const curve = new BsplineCurveInt(3);
    this.addCurve(curve);

    const mesh = this.pickables[this.pickables.length - 1];
    this.selectMesh.pickedObject = mesh;
    this.addPoint(new Vector(0, 0, 0));
    this.addPoint(new Vector(1, 1, 1));
    this.addPoint(new Vector(0, 0, 2));
    this.addPoint(new Vector(1, 1, 3));
    this.updateCurveHelper(curve);

    this.selectMesh.pickedObject = undefined;
    this.selectMesh.setPickables([mesh]);

  }

  onRender(scene: Scene) {
    // const dt = 0.001 * (Date.now() - startTime)
    // this.curvature.shader.setFloat("time", dt);
    // this.ctrlPoints.shader.setFloat("time", dt);
    // this.ctrlPolygon.shader.setFloat("time", dt);
    // this.designPoints.shader.setFloat("time", dt);
    // console.log(scene.activeCamera?.name);
  }

  onSceneReady(scene: Scene) {
    scene.clearColor = new Color4(0, 0, 0, 1);

    this.scene = scene;
    this.callbacks.forEach((callback) => callback(scene));

    // Select mesh by using GPU pick
    const selectMesh = new SelectMesh(this);
    this.selectMesh = selectMesh;
    // Key event observable
    const keyEventHandler = new KeyEventHandler(this);
    this.keyEventHandler = keyEventHandler;
    // glow layer to make mesh glow
    const glowLayer = new GlowLayer("glow", scene);
    this.glowLayer = glowLayer;

    const cameras: Array<ArcRotateCamera> = [];

    for (let i = 0; i < 4; i++) {
      cameras.push(new ArcRotateCamera(`Camera${i}`, 0, 0, 0, new Vector3(0, 0, 0), scene));
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

    // keep active camera after render which may involve unexpected change of active camera
    scene.onAfterRenderObservable.add(() => {
      scene.activeCamera = cameras[this.nViewport];
    })

    this.test();

  }

  addCallback(callback: (scene: Scene) => void) {
    this.callbacks.push(callback);
  }

  removeCallback(callback: (scene: Scene) => void) {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) this.callbacks.splice(index, 1);
  }

  // set index of viewport correspond to the pointer's coordinates
  setIndexViewport(dividerX: number, dividerY: number): number {
    const scene = this.scene;
    const canvas = scene.getEngine().getRenderingCanvas();

    if (canvas) {
      // Get coordinates of pointer within the canvas
      const offset = getComputedStyle(document.body).getPropertyValue("--menuH");
      const posX = scene.pointerX;
      const posY = scene.pointerY - parseFloat(offset);
      // Convert canvas coordinates to normalized viewport coordinates (0 to 1)
      const normalizedX = posX / canvas.clientWidth;
      const normalizedY = posY / canvas.clientHeight;
      // Determine which viewport is clicked and store the ref
      if (normalizedX <= dividerX && normalizedY <= dividerY) {
        this.nViewport = 0;
      } else if (normalizedX > dividerX && normalizedY <= dividerY) {
        this.nViewport = 1;
      } else if (normalizedX <= dividerX && normalizedY >= dividerY) {
        this.nViewport = 2;
      } else {
        this.nViewport = 3;
      }
    }

    return this.nViewport;
  }

  // set active camera correspond to the viewport
  setActiveCamera(dividerX: number, dividerY: number) {
    const scene = this.scene;
    const cameras = scene.activeCameras;

    if (!cameras) return;

    const previous = this.nViewport;
    const n = this.setIndexViewport(dividerX, dividerY);

    if (n === previous) return;

    cameras[previous].detachControl();
    cameras[n].attachControl();
    scene.activeCamera = cameras[n];
  }

  addPoint(point: Vector) {
    this.execute(new AddPointCommand(this, point));
  }

  addCurve(curve: Parametric) {
    this.execute(new AddCurveCommand(this, curve));
  }

  updateCurveHelper(curve: Parametric) {
    const { curvature, ctrlPoints, ctrlPolygon, designPoints } = this;
    curvature.update(curve);
    ctrlPoints.update(curve.ctrlPoints);
    ctrlPolygon.update(curve.ctrlPoints);
    designPoints.update(curve.designPoints);
  }

  // addInterpolatedCurve( pole ) {

  // 	this.execute( new AddInterpolatedCurveCommand( this, pole ) );

  // }

  execute(cmd) {
    this.history.excute(cmd);
  }

}
