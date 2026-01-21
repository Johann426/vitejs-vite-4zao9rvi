import { Color3 } from "@babylonjs/core";

export const PI = Math.PI;
export const MAX_POINTS = 200;
export const MAX_LINE_SEG = 200;

export const CONFIG = {
    curvatureScale: 1.0,
    ctrlPointsSize: 7.0,
    designPointsSize: 8.0,
    curvatureColor: new Color3(0.5, 0.0, 0.0),
    ctrlPointsColor: new Color3(0.5, 0.5, 0.5),
    ctrlpolygonColor: new Color3(0.5, 0.5, 0.5),
    designPointsColor: new Color3(1.0, 1.0, 0.0),
}

export enum HTTP_STATUS {
    SUCCESS = 200,
    CREATED = 201,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    SERVER_ERROR = 500,
}
