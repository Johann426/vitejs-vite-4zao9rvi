import React, { useState, useRef, useEffect } from "react";
import { Viewport, ArcRotateCamera } from "@babylonjs/core";
import { Editor } from "../Editor";

interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
    editor: Editor;
}

export default function Divider({ editor, ...rest }: DividerProps) {

    const parentRef = useRef<HTMLDivElement>(null); // ref to the root container
    const cameraRef = useRef<number>(0); // ref to camera
    const [x, setX] = useState(0.5); // left position of vertical splitter
    const [y, setY] = useState(0.5); // top position of horizontal splitter

    const getPosX = (e: PointerEvent) => { // left position (normalized from 0 to 1)
        const width = parentRef.current?.clientWidth ?? 100;
        const coorx = e.clientX / width;
        return Math.max(0, Math.min(1, coorx));
    }

    const getPosY = (e: PointerEvent) => { // top position (normalized from 0 to 1)
        const height = parentRef.current?.clientHeight ?? 100;
        const offset = getComputedStyle(document.body).getPropertyValue("--menuH");
        const coory = (e.clientY - parseFloat(offset)) / height;
        return Math.max(0, Math.min(1, coory));
    }

    // Set up event listener when the component mounts
    useEffect(() => {
        const onPointerMove = (e: PointerEvent) => {
            const { cameras } = editor;
            const n = cameraRef.current;
            const posX = getPosX(e);
            const posY = getPosY(e);

            if (posX < x) {
                if (posY < y) {
                    if (n == 0) return
                    cameras[n].detachControl();
                    cameras[0].attachControl(true);
                    cameraRef.current = 0;
                    console.log(n, 'detached');
                    console.log('0 attached')
                } else {
                    if (n == 2) return
                    cameras[n].detachControl();
                    cameras[2].attachControl(true);
                    cameraRef.current = 2;
                    console.log(n, 'detached');
                    console.log('2 attached')
                }
            } else {
                if (posY < y) {
                    if (n == 1) return
                    cameras[n].detachControl();
                    cameras[1].attachControl(true);
                    cameraRef.current = 1;
                    console.log(n, 'detached');
                    console.log('1 attached')
                } else {
                    if (n == 3) return
                    cameras[n].detachControl();
                    cameras[3].attachControl(true);
                    cameraRef.current = 3;
                    console.log(n, 'detached');
                    console.log('3 attached')
                }
            }
        }

        document.addEventListener('pointermove', onPointerMove);

        // Cleanup when component unmounts
        return () => {
            document.removeEventListener('pointermove', onPointerMove);
        };
    }, [x, y]);

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
        const { cameras } = editor;
        // viewport[0] | viewport[1]
        // ----------|------------
        // viewport[2] | viewport[3]
        const viewport = [
            new Viewport(0, 1 - y, x, y),
            new Viewport(x, 1 - y, 1 - x, y),
            new Viewport(0, 0, x, 1 - y),
            new Viewport(x, 0, 1 - x, 1 - y)
        ];

        cameras.map((camera: ArcRotateCamera, i: number) => {
            camera.viewport = viewport[i];
        })
    }

    return (
        <div
            ref={parentRef}
            {...rest}
        >
            {/* <div
                // className="panel"
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: `${x * 100}%`,
                    height: `${y * 100}%`,
                    backgroundColor: "transparent", //"rgba(255, 0, 0, 0.2)",
                }}
            />
            <div
                // className="panel"
                style={{
                    position: "absolute",
                    left: `${x * 100}%`,
                    top: 0,
                    width: `${(1 - x) * 100}%`,
                    height: `${y * 100}%`,
                    backgroundColor: "transparent", //"rgba(0, 255, 0, 0.2)",
                }}
            />
            <div
                // className="panel"
                style={{
                    position: "absolute",
                    left: 0,
                    top: `${y * 100}%`,
                    width: `${x * 100}%`,
                    height: `${(1 - y) * 100}%`,
                    backgroundColor: "transparent", //"rgba(0, 0, 255, 0.2)",
                }}
            />
            <div
                // className="panel"
                style={{
                    position: "absolute",
                    left: `${x * 100}%`,
                    top: `${y * 100}%`,
                    width: `${(1 - x) * 100}%`,
                    height: `${(1 - y) * 100}%`,
                    backgroundColor: "transparent", //"rgba(255, 0, 255, 0.2)",
                }}
            /> */}
            <div
                // className="splitter vertical"
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
            <div
                // className="splitter horizontal"
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
    )
}
