import React, { useState, useRef, useEffect } from "react";

export default function Splitter() {

    const ref = useRef<HTMLDivElement>(null); // parent element of splitter
    const [x, setX] = useState(50); // vertical splitter left position (%)
    const [y, setY] = useState(50); // horizontal splitter top position (%)

    const onPointerMoveV = (e: React.PointerEvent) => {
        const width = ref.current?.clientWidth ?? 1;
        const ratio = (e.clientX / width) * 100;
        setX(Math.max(1, Math.min(99, ratio)));
    };

    const onPointerMoveH = (e: React.PointerEvent) => {
        const height = ref.current?.clientHeight ?? 1
        const ratio = (e.clientY / height) * 100
        setY(Math.max(1, Math.min(99, ratio)));
    };

    return (
        <div id="splitPanel" ref={ref}>
            <div style={{ flex: 1, backgroundColor: "transparent" }}></div>
            <div style={{ flex: 1, backgroundColor: "transparent" }}></div>
            <div style={{ flex: 1, backgroundColor: "transparent" }}></div>
            <div style={{ flex: 1, backgroundColor: "transparent" }}></div>
            <div
                id="vSplitter"
                className="splitter vertical"
                onPointerDown={e => {
                    const move = (ev: MouseEvent) => onPointerMoveV(ev as any);
                    const up = () => {
                        document.removeEventListener("pointermove", move);
                        document.removeEventListener("pointerup", up);
                    };
                    document.addEventListener("pointermove", move);
                    document.addEventListener("pointerup", up);
                }}
                style={{
                    position: "absolute",
                    left: `${x}%`,
                    width: "2px",
                    height: "100%",
                    background: "gray",
                    cursor: "ew-resize",
                    zIndex: 20,
                    pointerEvents: "auto",
                }}
            />
            <div
                id="hSplitter"
                className="splitter horizontal"
                onPointerDown={e => {
                    const move = (ev: MouseEvent) => onPointerMoveH(ev as any);
                    const up = () => {
                        document.removeEventListener("pointermove", move);
                        document.removeEventListener("pointerup", up);
                    };
                    document.addEventListener("pointermove", move);
                    document.addEventListener("pointerup", up);
                }}
                style={{
                    position: "absolute",
                    top: `${y}%`,
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