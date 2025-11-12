import "./App.css";
import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import {
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  Color3,
} from "@babylonjs/core";
import { theme } from "./theme";
import Viewport from "./Viewport";
import Menunar from "./Menubar";
import Sidebar from "./Sidebar";
import { Editor } from "./Editor";
import Divider from "./layout/Divider";

const editor = new Editor();

const onSceneReady = (scene) => {

  editor.scene = scene;
  editor.addTestCurve();

  scene.clearColor = new Color3(0, 0, 0);

  // // Parameters: name, alpha, beta, radius, target position, scene
  // const camera = new ArcRotateCamera("Camera", 0, 0, 10, new Vector3(0, 0, 0), scene);

  // // This targets the camera to scene origin
  // camera.setTarget(Vector3.Zero());

  // const canvas = scene.getEngine().getRenderingCanvas();

  // // Enable Collisions
  // scene.collisionsEnabled = true;
  // camera.checkCollisions = true;
  // ground.checkCollisions = true;

  editor.init(scene)

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
      <Divider editor={editor} id="Divider" />
      <Viewport
        id="viewport"
        antialias
        onSceneReady={onSceneReady}
        onRender={onRender}
      />
    </MantineProvider>
  );
}
