import "./App.css";
import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import { theme } from "./theme";
import { useEffect } from "react";
import { Scene } from "@babylonjs/core";
import Editor from "./Editor";
import Menunar from "./layout/Menubar";
import Sidebar from "./layout/Sidebar";
import Divider from "./layout/Divider";
import Viewport from "./layout/Viewport";

const editor = new Editor();

export default function App() {
    useEffect(() => {
        return () => {
            editor.dispose();
        };
    }, []);

    const onSceneReady = (scene: Scene) => {
        editor.onSceneReady(scene);
    };

    const onRender = (scene: Scene) => {
        // editor.onRender(scene);
    };

    return (
        <MantineProvider defaultColorScheme="auto" theme={theme} withGlobalClasses>
            <Menunar editor={editor} id="menubar" />
            <Sidebar editor={editor} id="sidebar" />
            <Divider editor={editor} id="divider" />
            <Viewport antialias onSceneReady={onSceneReady} onRender={onRender} id="viewport" />
        </MantineProvider>
    );
}
