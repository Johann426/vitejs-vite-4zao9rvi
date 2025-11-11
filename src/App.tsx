import "./App.css";
import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import { Button } from "@mantine/core";
import {
  FreeCamera,
  UniversalCamera,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  Color3,
} from "@babylonjs/core";
import { theme } from "./theme";
import Viewport from "./Viewport";
import { ContextMenuTrigger } from "./ContextMenu";
import Menunar from "./Menubar";
import Sidebar from "./Sidebar";
import TreeView from "./TreeView";
import { Editor } from "./Editor";
import Splitter from "./layout/Splitter";

const editor = new Editor();

const onSceneReady = (scene) => {

  editor.scene = scene;
  editor.addTestCurve();

  scene.clearColor = new Color3(0, 0, 0);

  // // Parameters: name, alpha, beta, radius, target position, scene
  // const camera = new ArcRotateCamera("Camera", 0, 0, 10, new Vector3(0, 0, 0), scene);
  // editor.camera = camera;

  // // This targets the camera to scene origin
  // camera.setTarget(Vector3.Zero());

  const canvas = scene.getEngine().getRenderingCanvas();

  // // This attaches the camera to the canvas
  // camera.attachControl(canvas, true);

  // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
  const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);

  // Default intensity is 1. Let's dim the light a small amount
  light.intensity = 0.7;

  // Our built-in 'ground' shape.
  const ground = MeshBuilder.CreateGround("ground", { width: 6, height: 6 }, scene);

  // // Enable Collisions
  // scene.collisionsEnabled = true;
  // camera.checkCollisions = true;
  // ground.checkCollisions = true;

  // MultiViews
  const cameras = Array(4).fill(0).map(e => new ArcRotateCamera("Camera", 90, 0, 10, new Vector3(0, 0, 0), scene)); // Parameters: name, alpha, beta, radius, target position, scene

  editor.canvas = canvas
  editor.cameras = cameras
  editor.setCamera()

};

/**
 * Will run on every frame render.  We are spinning the box on y-axis.
 */
const onRender = (scene) => {
  // if (box !== undefined) {
  //   const deltaTimeInMillis = scene.getEngine().getDeltaTime();
  //   const rpm = 10;
  //   box.rotation.y += (rpm / 60) * Math.PI * 2 * (deltaTimeInMillis / 1000);
  // }
};

export default function App() {
  return (
    <MantineProvider theme={theme} withGlobalClasses>
      <Menunar editor={editor} id="menubar" />
      <Sidebar editor={editor} id="sidebar" />
      <Splitter />
      <Viewport
        id="viewport"
        antialias
        onSceneReady={onSceneReady}
        onRender={onRender}
      />
    </MantineProvider>
  );
}
