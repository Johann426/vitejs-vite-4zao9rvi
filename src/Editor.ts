import { useEffect, useRef } from "react";
import { Engine, Scene } from "@babylonjs/core";
import { Vector3, Viewport, ArcRotateCamera, HemisphericLight, MeshBuilder } from "@babylonjs/core";

import { History } from "./commands/History.js";
import { AddCurveCommand } from "./commands/AddcurveCommand.js";

import { BsplineCurveInt } from "./modeling/BsplineCurveInt.js"
import { Vector } from "./modeling/NurbsLib";

export class Editor {
  scene: any;
  cameras: any;
  history: History;

  constructor() {

    this.history = new History();
    this.onKeyDown()

  }

  init(scene: Scene) {

    this.scene = scene;
    this.cameras = [];
    const cameras = this.cameras;

    for (let i = 0; i < 4; i++) {
      cameras.push(new ArcRotateCamera(
        // name, alpha, beta, radius, target position, scene
        `Camera${i}`, 90, 0, 10, new Vector3(0, 0, 0), scene
      ));
    }

    const viewports = [
      new Viewport(0.0, 0.5, 0.5, 0.5), // top-left
      new Viewport(0.5, 0.5, 0.5, 0.5), // top-right
      new Viewport(0.0, 0.0, 0.5, 0.5), // bottom-left
      new Viewport(0.5, 0.0, 0.5, 0.5)  // bottom-right
    ];

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
      // camera.attachControl(true);
    })

    scene.activeCameras = cameras

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);

    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.25;

    // Our built-in 'ground' shape.
    const ground = MeshBuilder.CreateGround("ground", { width: 6, height: 6 }, scene);


  }

  addCurve(curve) {

    this.execute(new AddCurveCommand(this, curve));

  }

  // addInterpolatedCurve( pole ) {

  // 	this.execute( new AddInterpolatedCurveCommand( this, pole ) );

  // }

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

  onKeyDown() {

    document.addEventListener("keydown", (e) => {

      const camera = this.camera;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        // e.preventDefault();
      }
      if (e.key === "x") {
        // Positions the camera overwriting alpha, beta, radius
        camera.setPosition(new Vector3(10, 0, 0));
        // console.log('hello')
      }
      if (e.key === "y") {
        camera.setPosition(new Vector3(0, 10, 0));
      }
      if (e.key === "z") {
        camera.setPosition(new Vector3(0, 0, 10));
      }

    })

  }

}
