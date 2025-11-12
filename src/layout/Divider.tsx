import React, { useState, useRef, useEffect } from "react";
import { Viewport, ArcRotateCamera } from "@babylonjs/core";
import { Editor } from "../Editor";

interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
    editor: Editor;
}

export default function Divider({ editor, ...rest }: DividerProps) {

    const ref = useRef<HTMLDivElement>(null); // parent element of splitter
    const [x, setX] = useState(0.5); // vertical splitter left position
    const [y, setY] = useState(0.5); // horizontal splitter top position (%)

    const setPositionX = (e: PointerEvent) => {
        const width = ref.current?.clientWidth ?? 100;
        const ratio = (e.clientX / width);
        setX(Math.max(0.01, Math.min(0.99, ratio)));
        setViewport(ratio, y)
    };

    const setPositionY = (e: PointerEvent) => {
        const height = ref.current?.clientHeight ?? 100;
        const ratio = (e.clientY / height);
        setY(Math.max(0.01, Math.min(0.99, ratio)));
        setViewport(x, ratio)
    };


    const setViewport = (x: number, y: number) => {
        const { scene, cameras } = editor;

        // camera[3] | camera[2]
        // ----------|------------
        // camera[0] | camera[1]
        cameras.map((e: ArcRotateCamera, i: number) => {
            if (i == 0) e.viewport = new Viewport(0.0, 0.0, x, 1.0 - y);
            if (i == 1) {
                e.viewport = new Viewport(x, 0.0, 1.0 - x, 1.0 - y);
            }
            if (i == 2) {
                e.viewport = new Viewport(x, 1.0 - y, 1.0 - x, y);
            }
            if (i == 3) {
                e.viewport = new Viewport(0.0, 1.0 - y, x, y);
            }
        })
    }

    const onPointerDown = (i: number) => {

        const cameras = editor.cameras;
        cameras[i].attachControl(true);
        console.log("hello")

    }

    const onPointerUp = (i: number) => {

        const cameras = editor.cameras;
        cameras[i].detachControl();

    }

    return (
        <div ref={ref} {...rest}>
            <div onPointerDown={() => onPointerDown(3)} onPointerUp={() => onPointerUp(3)} style={{ flex: 1, backgroundColor: "gray" }}></div>
            <div onPointerDown={() => onPointerDown(2)} style={{ flex: 1, backgroundColor: "transparent" }}></div>
            <div onPointerDown={() => onPointerDown(0)} style={{ flex: 1, backgroundColor: "transparent" }}></div>
            <div onPointerDown={() => onPointerDown(1)} style={{ flex: 1, backgroundColor: "transparent" }}></div>
            <div
                // className="splitter vertical"
                onPointerDown={() => {
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
                    zIndex: 20,
                    pointerEvents: "auto",
                }}
            />
            <div
                // className="splitter horizontal"
                onPointerDown={() => {
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
                    zIndex: 20,
                    pointerEvents: "auto",
                }}
            />
        </div>
    )

}