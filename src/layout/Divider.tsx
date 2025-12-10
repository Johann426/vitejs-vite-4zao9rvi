import React, { useState, useRef, useEffect } from "react";
import { Scene, Viewport, Camera, Observer, PointerInfo, PointerEventTypes } from "@babylonjs/core";
import Editor from "../Editor";

interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
    editor: Editor;
}

export default function Divider({ editor, ...rest }: DividerProps) {
    const cameraRef = useRef<number>(0); // ref to active camera number
    const parentRef = useRef<HTMLDivElement>(null); // ref to the root container
    const [x, setX] = useState(0.5); // left position of vertical splitter
    const [y, setY] = useState(0.5); // top position of horizontal splitter

    // Set event listener(s) when the component mounts
    useEffect(() => {
        const { scene } = editor;

        const observable = (scene: Scene, msg: string) => {
            console.log(msg);
            const setControl = (i: number) => {
                const cameras = scene.activeCameras;
                if (!cameras) return;
                const n = cameraRef.current;
                if (n == i) return;
                // const cameras = scene.activeCameras;
                cameras[n]?.detachControl();
                cameras[i]?.attachControl(true);
                scene.activeCamera = cameras[i];
                // scene.switchActiveCamera(cameras[i]);
                cameraRef.current = i;
            };

            const onPointerDown = (pointerInfo: PointerInfo) => {
                const canvas = scene.getEngine().getRenderingCanvas();
                if (!canvas) return;
                // Get coordinates of pointer within the canvas
                const offset = getComputedStyle(document.body).getPropertyValue("--menuH");
                const posX = pointerInfo.event.clientX;
                const posY = pointerInfo.event.clientY - parseFloat(offset);
                // Convert canvas coordinates to normalized viewport coordinates (0 to 1)
                const normalizedX = posX / canvas.clientWidth;
                const normalizedY = posY / canvas.clientHeight;
                // Determine which viewport/camera is clicked and switch the active interaction camera
                if (normalizedX <= x && normalizedY <= y) {
                    setControl(0);
                } else if (normalizedX > x && normalizedY <= y) {
                    setControl(1);
                } else if (normalizedX <= x && normalizedY >= y) {
                    setControl(2);
                } else {
                    setControl(3);
                }
            };

            scene.onPointerObservable.add(onPointerDown, PointerEventTypes.POINTERDOWN);
        };

        if (scene && !scene.isDisposed) {
            observable(scene, "observable added in divider");
        } else {
            // add observable by callback when scene is not ready or disposed
            editor.addCallback(observable);
        }

        // Cleanup when component unmounts
        return () => {
            if (scene && !scene.isDisposed) {
                scene.onPointerObservable.clear();
                console.log("observable removed in divider");
            }
        };
    }, [editor, x, y]); // re-render with changed dependencies

    const getPosX = (e: PointerEvent) => {
        // left position (normalized from 0 to 1)
        const width = parentRef.current?.clientWidth ?? 100;
        const coorx = e.clientX / width;
        return Math.max(0, Math.min(1, coorx));
    };

    const getPosY = (e: PointerEvent) => {
        // top position (normalized from 0 to 1)
        const height = parentRef.current?.clientHeight ?? 100;
        const offset = getComputedStyle(document.body).getPropertyValue("--menuH");
        const coory = (e.clientY - parseFloat(offset)) / height;
        return Math.max(0, Math.min(1, coory));
    };

    const setPositionX = (e: PointerEvent) => {
        const posX = getPosX(e);
        setX(posX);
        setViewport(posX, y);
    };

    const setPositionY = (e: PointerEvent) => {
        const posY = getPosY(e);
        setY(posY);
        setViewport(x, posY);
    };

    const setViewport = (x: number, y: number) => {
        const { scene } = editor;
        const cameras = scene.activeCameras;

        const viewport = [
            new Viewport(0, 1 - y, x, y), // top-left
            new Viewport(x, 1 - y, 1 - x, y), // top-right
            new Viewport(0, 0, x, 1 - y), // bottom-left
            new Viewport(x, 0, 1 - x, 1 - y), // bottom-right
        ];

        cameras?.map((camera: Camera, i: number) => {
            camera.viewport = viewport[i];
        });
    };

    return (
        <div ref={parentRef} {...rest}>
            <div //top-left overlay
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: `${x * 100}%`,
                    height: `${y * 100}%`,
                    backgroundColor: "rgba(255, 0, 0, 0.1)",
                }}
            />
            <div // top-right overlay
                style={{
                    position: "absolute",
                    left: `${x * 100}%`,
                    top: 0,
                    width: `${(1 - x) * 100}%`,
                    height: `${y * 100}%`,
                    backgroundColor: "rgba(0, 255, 0, 0.1)",
                }}
            />
            <div // bottome-left overlay
                style={{
                    position: "absolute",
                    left: 0,
                    top: `${y * 100}%`,
                    width: `${x * 100}%`,
                    height: `${(1 - y) * 100}%`,
                    backgroundColor: "rgba(0, 0, 255, 0.1)",
                }}
            />
            <div // bottom-right overlay
                style={{
                    position: "absolute",
                    left: `${x * 100}%`,
                    top: `${y * 100}%`,
                    width: `${(1 - x) * 100}%`,
                    height: `${(1 - y) * 100}%`,
                    backgroundColor: "rgba(0, 255, 255, 0.1)",
                }}
            />
            <div // divider vertical
                onPointerDown={(event) => {
                    event.stopPropagation();
                    const onPointerMove = (e: PointerEvent) => setPositionX(e);
                    const onPointerUp = () => {
                        document.removeEventListener("pointermove", onPointerMove);
                        document.removeEventListener("pointerup", onPointerUp);
                    };
                    document.addEventListener("pointermove", onPointerMove);
                    document.addEventListener("pointerup", onPointerUp);
                }}
                style={{
                    position: "absolute",
                    left: `${x * 100}%`,
                    width: "2px",
                    height: "100%",
                    background: "gray",
                    cursor: "ew-resize",
                    zIndex: 1,
                    pointerEvents: "auto",
                }}
            />
            <div // divider horizontal
                onPointerDown={(event) => {
                    event.stopPropagation();
                    const onPointerMove = (e: PointerEvent) => setPositionY(e);
                    const onPointerUp = () => {
                        document.removeEventListener("pointermove", onPointerMove);
                        document.removeEventListener("pointerup", onPointerUp);
                    };
                    document.addEventListener("pointermove", onPointerMove);
                    document.addEventListener("pointerup", onPointerUp);
                }}
                style={{
                    position: "absolute",
                    top: `${y * 100}%`,
                    width: "100%",
                    height: "2px",
                    background: "gray",
                    cursor: "ns-resize",
                    zIndex: 1,
                    pointerEvents: "auto",
                }}
            />
        </div>
    );
}
