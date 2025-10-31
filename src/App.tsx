import "./App.css";
import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import { Button } from "@mantine/core";
import {
  FreeCamera,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  Color3,
} from "@babylonjs/core";
import { theme } from "./theme";
import Viewport from "./Viewport";
import { ContextMenuTrigger } from "./ContextMenu";
import Menunar from "./Menubar";
import TreeView from "./TreeView";

const onSceneReady = (scene) => {
  const points = [
    new Vector3(0, 0, 0),
    new Vector3(1, 1, 0),
    new Vector3(2, 0, 1),
    new Vector3(3, 1, 2),
  ];

  const line = MeshBuilder.CreateLines("myline", { points }, scene);
  line.color = new Color3(0, 1, 0);

  // This creates and positions a free camera (non-mesh)
  const camera = new FreeCamera("camera1", new Vector3(0, 5, -10), scene);

  // This targets the camera to scene origin
  camera.setTarget(Vector3.Zero());

  const canvas = scene.getEngine().getRenderingCanvas();

  // This attaches the camera to the canvas
  camera.attachControl(canvas, true);

  // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
  const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);

  // Default intensity is 1. Let's dim the light a small amount
  light.intensity = 0.7;

  // Our built-in 'ground' shape.
  MeshBuilder.CreateGround("ground", { width: 6, height: 6 }, scene);
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

const editor = function () {
  const a = 0;
};

const group = {
  label: "subgroup",
  obj: Object(),
  bool: true,
  group: null,
  items: [{ label: "sub item", obj: Object() }],
};
const item1 = { label: "item1", obj: Object() };
const item2 = { label: "item2", obj: Object() };

import { useState } from "react";

export default function App() {
  return (
    <MantineProvider theme={theme} withGlobalStyles withNormalizeCSS>
      <Menunar editor={editor} id="menubar" />
      <TreeView id="treeview" groupList={[group]} itemList={[item1, item2]} />
      <div>
        <Viewport
          id="viewport"
          antialias
          onSceneReady={onSceneReady}
          onRender={onRender}
        />
      </div>
    </MantineProvider>
  );
}
