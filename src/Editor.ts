import { useEffect, useRef } from "react";
import { Engine, Scene } from "@babylonjs/core";
import { FreeCamera, Vector3, HemisphericLight, MeshBuilder, Color3, } from "@babylonjs/core";

import { History } from "./commands/History.js";
import { AddCurveCommand } from "./commands/AddcurveCommand.js";

import { BsplineCurveInt } from "./modeling/BsplineCurveInt.js"
import { Vector } from "./modeling/NurbsLib";

export class Editor {
  scene: any;
  history: any;

  constructor() {

    this.history = new History();

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

}
