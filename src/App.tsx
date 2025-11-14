import "./App.css";
import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import { Scene } from "@babylonjs/core";
import { theme } from "./theme";
import Editor from "./Editor";
import Menunar from "./layout/Menubar";
import Sidebar from "./layout/Sidebar";
import Divider from "./layout/Divider";
import Viewport from "./layout/Viewport";

export default function App() {
  const editor = new Editor();

  const onSceneReady = (scene: Scene) => {
    editor.onSceneReady(scene);
  };

  const onRender = (scene: Scene) => {
  };

  return (
    <MantineProvider theme={theme} withGlobalClasses>
      <Menunar editor={editor} id="menubar" />
      <Sidebar editor={editor} id="sidebar" />
      <Divider editor={editor} id="divider" />
      <Viewport antialias onSceneReady={onSceneReady} onRender={onRender} id="viewport" />
    </MantineProvider>
  );
}
