import { useEffect, useRef } from "react";
import { Engine, Scene } from "@babylonjs/core";

// Define the props of Babylon.js engine and scene options, as well as lifecycle callbacks.
interface ViewportProps extends React.CanvasHTMLAttributes<HTMLCanvasElement> {
  antialias?: boolean; // Enables antialiasing for smoother rendering
  engineOptions?: object; // Optional configuration for Babylon Engine
  adaptToDevice?: boolean; // Adjusts rendering resolution based on device pixel ratio
  sceneOptions?: object; // Optional configuration for Babylon Scene
  onSceneReady: (scene: Scene) => void; // Callback when the scene is fully initialized
  onRender?: (scene: Scene) => void; // Optional callback for each render frame
  ref?: React.Ref<{ scene: Scene | null }>;
}

// Main component that sets up Babylon.js rendering inside a React canvas
export default function Viewport({
  antialias = true,
  engineOptions,
  adaptToDevice,
  sceneOptions,
  onSceneReady,
  onRender,
  ref,
  ...rest
}: ViewportProps) {
  // Create a ref to access the canvas DOM element
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<Scene | null>(null);

  // Set up Babylon.js engine and scene when the component mounts
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return; // Exit early if canvas is not available

    // Create Babylon.js engine and scene using provided options
    const engine = new Engine(canvas, antialias, engineOptions, adaptToDevice);
    const scene = new Scene(engine, sceneOptions);
    sceneRef.current = scene;

    // Expose scene through ref
    if (typeof ref === "function") {
      ref({ scene });
    } else if (ref) {
      ref.current = { scene };
    }

    // If the scene is ready, call the onSceneReady callback, if not ready yet, wait for the scene to finish initializing
    scene.isReady()
      ? onSceneReady(scene)
      : scene.onReadyObservable.addOnce(onSceneReady);

    // Start the render loop
    engine.runRenderLoop(() => {
      onRender?.(scene); // Call user-defined render logic
      scene.render(); // Render the scene
    });

    // Handle window resize to adjust canvas and engine dimensions
    const onResize = () => {
      engine.resize();
    };

    window.addEventListener("resize", onResize);

    // Cleanup when component unmounts
    return () => {
      scene.dispose(); // Dispose of the scene
      engine.dispose(); // Dispose of the engine
      window.removeEventListener("resize", onResize);
    };
  }, [
    antialias,
    engineOptions,
    adaptToDevice,
    sceneOptions,
    onSceneReady,
    onRender,
    ref,
  ]);

  // Render the canvas element that Babylon.js will use
  return <canvas ref={canvasRef} {...rest} />;
}
