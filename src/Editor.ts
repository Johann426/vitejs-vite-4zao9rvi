import { useEffect, useRef } from "react";
import { Engine, Scene } from "@babylonjs/core";

import { FreeCamera, Vector3, HemisphericLight, MeshBuilder, Color3, } from "@babylonjs/core";
import { BsplineCurveInt } from "./modeling/BsplineCurveInt.js"
import { Vector } from "./modeling/NurbsLib";

export class Editor {

  constructor() {
  }

  // addCurve(curve) {

  //   this.execute(new AddCurveCommand(this, curve));

  // }

  // addInterpolatedCurve( pole ) {

  // 	this.execute( new AddInterpolatedCurveCommand( this, pole ) );

  // }

  addTestCurve(scene) {

    BsplineCurveInt

    const poles = [
      { point: new Vector(0, 0, 0) },
      { point: new Vector(1, 1, 1) },
      { point: new Vector(2, 0, 0) },
      { point: new Vector(3, 1, 1) }
    ];

    const curve = new BsplineCurveInt(3, poles)
    const points = curve.getPoints(100)

    const line = MeshBuilder.CreateLines("myline", { points }, scene);
    line.color = new Color3(0, 1, 0);

  }

}
