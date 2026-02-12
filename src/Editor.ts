import type { Scene, Mesh, Camera, Engine, AbstractEngine } from "@babylonjs/core";
import { Vector3, Color4, Matrix, Viewport, ArcRotateCamera, HemisphericLight, MeshBuilder, StandardMaterial, GlowLayer, PointsCloudSystem, MeshShapeBlock, } from "@babylonjs/core";

import type Parametric from "./modeling/Parametric.js";
import BsplineCurveInt from "./modeling/BsplineCurveInt.ts";
import { Vector } from "./modeling/NurbsLib";

import type Command from "./commands/Command.js";
import History from "./commands/History.js";
import AddCurveCommand from "./commands/AddCurveCommand.js";
import AddPointCommand from "./commands/AddPointCommand.js";
import ModifyPointCommand from "./commands/ModifyPointCommand.ts";
import RemovePointCommand from "./commands/RemovePointCommand.ts";
import RemoveVertexCommand from "./commands/RemoveVertexCommand.ts";

import KeyEventHandler from "./events/KeyEvent.js";
import SelectMesh from "./events/SelectMesh.js";
import EditMesh from "./events/EditMesh.ts";
import SketchInput from "./events/SketchInput.ts";
import TreeNode from "./events/TreeNode.ts";

import { PointHelper, LinesHelper, CurveHelper, CurvatureHelper } from "./DesignHelper.js";

import { CONFIG } from "./constant.ts";

export default class Editor {
  scene!: Scene;
  glowLayer!: GlowLayer;

  // event handler
  keyEventHandler!: KeyEventHandler;
  selectMesh!: SelectMesh;
  editMesh = new EditMesh(this);
  sketchInput = new SketchInput(this);

  // list of pickable meshes
  pickables: Mesh[] = [];
  treeNode: TreeNode = new TreeNode("root");

  // repeat callback by space key event
  repeat: () => void = () => { };

  // design helpers
  private curvature: CurvatureHelper = new CurvatureHelper(CONFIG.curvatureColor, CONFIG.curvatureScale);
  private ctrlPoints: PointHelper = new PointHelper(CONFIG.ctrlPointsSize, CONFIG.ctrlPointsColor);
  private ctrlPolygon: LinesHelper = new LinesHelper(CONFIG.ctrlpolygonColor);
  private designPoints: PointHelper = new PointHelper(CONFIG.designPointsSize, CONFIG.designPointsColor);

  private timestamp: number;
  private nViewport: number = 0;
  private initializers: ((scene: Scene) => void)[] = [];
  private history: History = new History();

  constructor(
    { timestamp, ...rest }: { timestamp: number }
  ) {
    this.timestamp = timestamp;
    console.log(rest);
  }

  dispose() {
    this.scene.dispose();
    this.glowLayer.dispose();
    this.keyEventHandler.dispose();
    this.selectMesh.dispose();
    this.editMesh.dispose();
    this.sketchInput.dispose();
    this.curvature.dispose();
    this.ctrlPoints.dispose();
    this.ctrlPolygon.dispose();
    this.designPoints.dispose();
    this.history.clear();
    this.initializers = [];
    this.pickables = [];
  }

  test(scene: Scene) {
    // Create Test curve
    const curve = new BsplineCurveInt(3);
    this.addCurve(curve);

    const mesh = this.pickables[this.pickables.length - 1];
    this.selectMesh.pickedObject = mesh;

    this.addPoint(new Vector(0, 0, 0));
    this.addPoint(new Vector(1, 1, 0));
    this.addPoint(new Vector(2, 0, 0));
    this.addPoint(new Vector(3, 1, 0));

    this.selectMesh.setPickingList();

    const engine = scene.getEngine();
    const w = engine.getRenderWidth();
    const h = engine.getRenderHeight();

    const points = curve.designPoints;

    points.forEach(p => {
      const v = new Vector3(p.x, p.y, p.z);
      const camera = scene.activeCameras![0];
      const screenPos = this.worldToScreen(camera, v);
      console.log("screen coords:", screenPos.x / w, screenPos.y / h);
      // console.log("screen coords:", screenPos.x, screenPos.y, screenPos.z);
    })

    points.forEach(p => {
      const v = new Vector3(p.x, p.y, p.z);
      const camera = scene.activeCameras![3];
      const screenPos = this.worldToScreen(camera, v);
      console.log("screen coords:", screenPos.x / w, screenPos.y / h);
      // console.log("screen coords:", screenPos.x, screenPos.y, screenPos.z);
    })

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
    this.initializers.forEach((callback) => callback(scene));

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
      new Vector3(10, 10, -10), // perspective
      new Vector3(0, 10, 0), // y-view
      new Vector3(0, 0, -10), // z-view
    ];

    cameras.map((camera: ArcRotateCamera, i: number) => {
      camera.setTarget(Vector3.Zero()); // camera target to scene origin
      camera.viewport = viewports[i];
      camera.setPosition(positions[i]);
    });
    cameras[0].attachControl(true);
    cameras[2].upVector = new Vector3(0, -1, 0); // default is Vector3(0, 1, 0)
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

  // add initializer to be excuted when scene is ready
  addInitializer(fn: (scene: Scene) => void) {
    this.initializers.push(fn);
  }

  // Project a position vector onto screen coordinates
  worldToScreen(camera: Camera, v: Vector3) {
    const view = camera.getViewMatrix();
    const projection = camera.getProjectionMatrix();
    const transform = view.multiply(projection);

    const { scene } = this;
    const engine = scene.getEngine();
    const w = engine.getRenderWidth();
    const h = engine.getRenderHeight();

    // convert viewport into pixel unit
    const viewport = camera.viewport.toGlobal(w, h);

    const p = Vector3.Project(
      v,
      Matrix.Identity(),
      transform,
      viewport
    );

    return new Vector3(p.x, p.y, p.z);
  }

  // Unproject from screen space(top-left) to 3D world position
  screenToWorld(camera: Camera, v: Vector3) {
    const scene = this.scene;
    const engine = scene.getEngine();
    const w = engine.getRenderWidth();
    const h = engine.getRenderHeight();

    // convert viewport(bottom-left) into pixel unit
    const viewport = camera.viewport.toGlobal(w, h);
    const localX = v.x - viewport.x;
    const localY = v.y - (h - viewport.y - viewport.height);

    return Vector3.Unproject(
      // new Vector3(scene.pointerX, scene.pointerY, 0),
      // engine.getRenderWidth(),
      // engine.getRenderHeight(),
      new Vector3(localX, localY, v.z),
      viewport.width,
      viewport.height,
      Matrix.Identity(),
      camera.getViewMatrix(),
      camera.getProjectionMatrix()
    );
  }

  getUserCoord(sketchPlane: any) {// sketchPlane could be surface, currently z-plane
    // Get coordinates of pointer within the canvas (in pixel)
    const scene = this.scene;
    const x = scene.pointerX;
    const y = scene.pointerY;

    const camera = scene.activeCamera;
    if (!camera) return;

    // Near plane of screen space (z=0)
    const origin = this.screenToWorld(camera, new Vector3(x, y, 0));

    // Far plane of screen space (z=1)
    const dest = this.screenToWorld(camera, new Vector3(x, y, 1));

    // direction vector
    const direction = dest.subtract(origin).normalize();

    // ray equation: P(t) = O + t D, where O is origin and D is direction
    if (direction.z !== 0) {
      // Pz(t) = 0 at z-plane, t = - Oz / Dz
      const t = -origin.z / direction.z;
      if (t >= 0) {
        //intersection point with sketch plane
        const p = origin.add(direction.scale(t));
        console.log("origin", origin);
        console.log("direction", direction);
        console.log("Intersection point:", p);
        return new Vector(p.x, p.y, p.z);
      }
    }
  }

  // set index of viewport correspond to the pointer's coordinates
  setIndexViewport(dividerX: number, dividerY: number): number {
    const scene = this.scene;
    const canvas = scene.getEngine().getRenderingCanvas();

    if (canvas) {
      // Get coordinates of pointer within the canvas
      const x = scene.pointerX;
      const y = scene.pointerY;
      // Convert canvas coordinates to normalized viewport coordinates (0 to 1)
      const normalizedX = x / canvas.clientWidth;
      const normalizedY = y / canvas.clientHeight;
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

  undo() {
    this.history.undo();
  }

  redo() {
    this.history.redo();
  }

  // command of execute
  execute(cmd: Command) {
    this.history.excute(cmd);
  }

  // execute command of add a curve
  addCurve(curve: Parametric) {
    this.execute(new AddCurveCommand(this, curve));
  }

  // execute command of add a point
  addPoint(point: Vector) {
    const mesh = this.selectMesh.pickedObject;

    if (!mesh) return

    const curve: Parametric = mesh.metadata.curve;
    const callback = () => this.updateCurveMesh(mesh);
    this.execute(new AddPointCommand(point, curve, callback));
  }

  // execute command
  modPoint(index: number, point: Vector) {
    const mesh = this.selectMesh.pickedObject;

    if (!mesh) return

    const curve: Parametric = mesh.metadata.curve;
    const callback = () => this.updateCurveMesh(mesh);
    this.execute(new ModifyPointCommand(index, point, curve, callback));
  }

  // execute command
  removePoint(index: number) {
    const mesh = this.selectMesh.pickedObject;

    if (!mesh) return

    const curve: Parametric = mesh.metadata.curve;
    const callback = () => this.updateCurveMesh(mesh);
    if (curve instanceof BsplineCurveInt) {
      this.execute(new RemoveVertexCommand(index, curve, callback))
    } else {
      this.execute(new RemovePointCommand(index, curve, callback));
    }
  }

  // callback function of add an interpolated curve to be used in menubar and sidebar
  addInterpolatedSpline = () => {
    const editor = this;
    const { selectMesh, pickables, treeNode } = editor;

    const addBsplineCurveInt = () => {
      const curve = new BsplineCurveInt(3);
      editor.addCurve(curve);

      const mesh = pickables[pickables.length - 1];
      selectMesh.pickedObject = mesh;

      addPointCurve(editor);

      // new tree item
      const treeItem = treeNode.newItem("new curve", mesh);

    };

    addBsplineCurveInt();
    editor.repeat = addBsplineCurveInt;

  };

}

// prepare event handlers for adding points to the selected curve
export function addPointCurve(editor: Editor) {
  const { scene, selectMesh, sketchInput } = editor;

  const mesh = selectMesh.pickedObject;
  if (!mesh) return;

  const curve = mesh.metadata.curve;

  sketchInput.callback = {
    onPointerMove: (v: Vector) => {
      curve.append(new Vector(v.x, v.y, v.z));
      editor.updateCurveMesh(mesh);
      const index = curve.designPoints.length - 1;
      curve.remove(index);
    },
    onPointerDown: (v: Vector) => {
      editor.addPoint(v);
    },
    onPointerUp: (v: Vector) => { },
  };

  selectMesh.removeCallbacks(scene);
  sketchInput.registerCallbacks(scene);
}

// prepare event handlers for removing points from the selected curve
export function removePointCurve(editor: Editor) {
  const { scene, selectMesh } = editor;

  const mesh = selectMesh.pickedObject;
  if (!mesh) return;

  const curve = mesh.metadata.curve;
  const points = curve.designPoints;
  const pcss: PointsCloudSystem[] = [];

  points.forEach((p: Vector) => {
    const pcs = new PointsCloudSystem("designPoints", 10, scene);
    const func = (particle: { position: Vector3 }) => {
      particle.position = new Vector3(p.x, p.y, p.z);
    };
    pcs.addPoints(1, func);
    pcs.buildMeshAsync().then(() => {
      if (!pcs.mesh) return
      console.log(pcs.mesh.isPickable);
      pcs.mesh.isPickable = true;
      pcs.particles[0].color = new Color4(1, 0, 0, 1);
      pcs.particles[0].position = new Vector3(0, 0, 0);
      pcs.setParticles();
      pcss.push(pcs);
      selectMesh.setPickingList(pcss.map(e => e.mesh!)); //not working in gpu pick
    });
  })
}