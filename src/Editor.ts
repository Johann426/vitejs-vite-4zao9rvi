import type { Scene, Mesh } from "@babylonjs/core";
import { Vector3, Color4, Viewport, ArcRotateCamera, HemisphericLight, MeshBuilder, StandardMaterial, GlowLayer, } from "@babylonjs/core";

import type { Parametric } from "./modeling/Parametric.js";
import { BsplineCurveInt } from "./modeling/BsplineCurveInt.ts";
import { Vector } from "./modeling/NurbsLib";

import type Command from "./commands/Command.js";
import { History } from "./commands/History.js";
import { AddCurveCommand } from "./commands/AddCurveCommand.js";
import { AddPointCommand } from "./commands/AddPointCommand.js";
import { ModifyPointCommand } from "./commands/ModifyPointCommand.ts";
import { RemovePointCommand } from "./commands/RemovePointCommand.ts";
import { RemoveVertexCommand } from "./commands/RemoveVertexCommand.ts";

import { EditMesh } from "./events/EditMesh.ts";
import { SelectMesh } from "./events/SelectMesh.js";
import { KeyEventHandler } from "./events/KeyEvent.js";

import { PointHelper, LinesHelper, CurveHelper, CurvatureHelper } from "./DesignHelper.js";

import { CONFIG } from "./constant.ts";

export default class Editor {
  private timestamp: number;
  private nViewport: number = 0;
  private callbacks: ((scene: Scene) => void)[] = [];
  scene!: Scene;
  keyEventHandler!: KeyEventHandler;
  selectMesh!: SelectMesh;
  glowLayer!: GlowLayer;
  pickables: Mesh[] = [];
  history: History = new History();
  curvature: CurvatureHelper = new CurvatureHelper(CONFIG.curvatureColor, CONFIG.curvatureScale);
  ctrlPoints: PointHelper = new PointHelper(CONFIG.ctrlPointsSize, CONFIG.ctrlPointsColor);
  ctrlPolygon: LinesHelper = new LinesHelper(CONFIG.ctrlpolygonColor);
  designPoints: PointHelper = new PointHelper(CONFIG.designPointsSize, CONFIG.designPointsColor);
  editMesh = new EditMesh(this);

  constructor(
    { timestamp, ...rest }: { timestamp: number }
  ) {
    this.timestamp = timestamp;
    console.log(rest);
  }

  dispose() {
    this.scene.dispose();
    this.keyEventHandler.dispose();
    this.selectMesh.dispose();
    this.glowLayer.dispose();
    this.callbacks = [];
    this.pickables = [];
    this.history.clear();
    this.curvature.dispose();
    this.ctrlPoints.dispose();
    this.ctrlPolygon.dispose();
    this.designPoints.dispose();
  }

  test(scene: Scene) {
    // Create Test curve
    const curve = new BsplineCurveInt(3);
    this.addCurve(curve);

    const mesh = this.pickables[this.pickables.length - 1];
    this.selectMesh.pickedObject = mesh;

    this.addPoint(new Vector(0, 0, 0));
    this.addPoint(new Vector(1, 1, 1));
    this.addPoint(new Vector(0, 0, 2));

    this.addPoint(new Vector(0, 0, 4));
    this.removePoint(3);

    this.addPoint(new Vector(0, 0, 3));
    this.modPoint(3, new Vector(-1, -1, -1));

    this.selectMesh.pickedObject = undefined;
    this.selectMesh.setPickables([mesh]);

    // Ray test
    const plane = MeshBuilder.CreatePlane("plane", { size: 10 }, scene);
    // plane.rotation.x = Math.PI / 2; // xy plane -> x-z plane
    plane.position.y = 0;
    plane.isPickable = true;
    plane.material = new StandardMaterial("mat", scene);
    plane.material.backFaceCulling = false;

    plane.enableEdgesRendering();
    plane.edgesWidth = 2.0;
    plane.edgesColor = new Color4(0.5, 0.5, 0.5, 1);





    // plane.disableEdgesRendering();

    // function getPointerGroundIntersection(scene: Scene, evt: PointerEvent) {
    //   const camera = scene.activeCamera;

    //   if (!camera) return null;

    //   // from cam to pointer ray
    //   const ray = scene.createPickingRay(evt.clientX, evt.clientY, null, camera, false);
    //   const pickInfo = ray.intersectsMesh(plane);

    //   return pickInfo.hit ? pickInfo.pickedPoint! : null;
    // }

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

  }

  onRender(scene: Scene) {
    const startTime = this.timestamp;
    const dt = 0.001 * (Date.now() - startTime)
    // this.curvature.setTime(dt);
    // this.ctrlPoints.setTime(dt);
    // this.ctrlPolygon.setTime(dt);
    this.designPoints.setTime(dt);
  }

  onSceneReady(scene: Scene) {
    scene.clearColor = new Color4(0, 0, 0, 0);

    this.scene = scene;
    this.callbacks.forEach((callback) => callback(scene));

    // Select mesh by using GPU pick
    const onSelectMesh = (mesh?: Mesh) => this.updateCurveMesh(mesh);
    const selectMesh = new SelectMesh(this, onSelectMesh);
    this.selectMesh = selectMesh;

    // Key event observable
    const keyEventHandler = new KeyEventHandler(this);
    this.keyEventHandler = keyEventHandler;
    // glow layer to make mesh glow
    const glowLayer = new GlowLayer("glow", scene);
    this.glowLayer = glowLayer;

    const cameras: ArcRotateCamera[] = [];

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

    //create design points, control points, control polygon, curvature
    const { designPoints, ctrlPoints, curvature, ctrlPolygon } = this;
    [designPoints, ctrlPoints, curvature, ctrlPolygon].map(e => e.initialize(scene));

    // keep active camera after render which may involve unexpected change of active camera
    scene.onAfterRenderObservable.add(() => {
      scene.activeCamera = cameras[this.nViewport];
    })

    this.test(scene);

  }

  // add callback to be excuted when scene is ready
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
      const posX = scene.pointerX;
      const posY = scene.pointerY;
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

  updateCurveMesh(mesh?: Mesh) {
    const { curvature, ctrlPoints, ctrlPolygon, designPoints } = this;
    [curvature, ctrlPoints, ctrlPolygon, designPoints].forEach(e => e.setVisible(false));

    if (!mesh) return;

    const { curve, helper }: { curve: Parametric, helper: CurveHelper } = mesh.metadata;

    if (curve.designPoints.length === 0) {
      helper.setVisible(false);
    } else {
      helper.update();
      curvature.update(curve);
      ctrlPoints.update(curve.ctrlPoints);
      ctrlPolygon.update(curve.ctrlPoints);
      designPoints.update(curve.designPoints);
    }
  }

  addPoint(point: Vector) {
    const mesh = this.selectMesh.pickedObject;

    if (!mesh) return

    const curve: Parametric = mesh.metadata.curve;
    const callback = () => this.updateCurveMesh(mesh);
    this.execute(new AddPointCommand(point, curve, callback));
  }

  modPoint(index: number, point: Vector) {
    const mesh = this.selectMesh.pickedObject;

    if (!mesh) return

    const curve: Parametric = mesh.metadata.curve;
    const callback = () => this.updateCurveMesh(mesh);
    this.execute(new ModifyPointCommand(index, point, curve, callback));
  }

  removePoint(index: number) {
    const mesh = this.selectMesh.pickedObject;

    if (!mesh) return

    const curve: Parametric = mesh.metadata.curve;
    const callback = () => this.updateCurveMesh(mesh);
    curve instanceof BsplineCurveInt ? this.execute(new RemoveVertexCommand(index, curve, callback)) : this.execute(new RemovePointCommand(index, curve, callback));

  }

  addCurve(curve: Parametric) {
    this.execute(new AddCurveCommand(this, curve));
  }

  execute(cmd: Command) {
    this.history.excute(cmd);
  }

}
