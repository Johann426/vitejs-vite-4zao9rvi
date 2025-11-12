import { useEffect, useRef } from "react";
import { Engine, Scene } from "@babylonjs/core";
import { FreeCamera, Vector3, HemisphericLight, MeshBuilder, Color3, Viewport } from "@babylonjs/core";

import { History } from "./commands/History.js";
import { AddCurveCommand } from "./commands/AddcurveCommand.js";

import { BsplineCurveInt } from "./modeling/BsplineCurveInt.js"
import { Vector } from "./modeling/NurbsLib";

export class Editor {
  scene: any;
  history: any;
  camera: any;
  cameras: any;
  canvas: any;

  constructor() {

    this.history = new History();
    this.onKeyDown()

  }

  setCamera() {
    const { scene, cameras, canvas } = this;
    cameras.map((e, i) => {
      e.setTarget(Vector3.Zero());
      e.attachControl(true);
      if (i == 0) e.viewport = new Viewport(0.0, 0.0, 0.5, 0.5);
      if (i == 1) {
        e.viewport = new Viewport(0.5, 0.0, 0.5, 0.5);
        e.setPosition(new Vector3(10, 0, 0));
      }
      if (i == 2) {
        e.viewport = new Viewport(0.5, 0.5, 0.5, 0.5);
        e.setPosition(new Vector3(0, 10, 0));
      }
      if (i == 3) {
        e.viewport = new Viewport(0.0, 0.5, 0.5, 0.5);
        e.setPosition(new Vector3(0, 0, 10));
      }
      scene.activeCameras.push(e);
    })

    cameras[0].detachControl();

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
