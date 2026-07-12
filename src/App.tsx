import "./App.css";
import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import { theme } from "./theme";
import { useRef, useEffect } from "react";
import { Scene } from "@babylonjs/core";
import Editor from "./Editor";
import Menunar from "./layout/Menubar";
import Sidebar from "./layout/Sidebar";
import Divider from "./layout/Divider";
import Viewport from "./layout/Viewport";

const info = {
    // Operating system and browser information
    userAgent: navigator.userAgent,            // Browser/OS identification string

    // Language and locale
    language: navigator.language,              // Default language

    // Network and cookies
    online: navigator.onLine,                  // Online status (true/false)
    cookieEnabled: navigator.cookieEnabled,    // Whether cookies are enabled

    // Screen information
    screenWidth: window.screen.width,          // Screen width in pixels
    screenHeight: window.screen.height,        // Screen height in pixels
    colorDepth: window.screen.colorDepth,      // Color depth (e.g., 24 bit)

    // Date and time
    timestamp: Date.now(),                     // Current time in milliseconds since 1970-01-01 UTC
    currentDate: new Date(),                   // Current date/time object
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,

    // Performance timing
    performanceNow: performance.now(),         // Time elapsed since page load (ms)

    // Browser feature support
    geolocationSupported: 'geolocation' in navigator,      // Whether Geolocation API is supported
    serviceWorkerSupported: 'serviceWorker' in navigator   // Whether Service Worker API is supported
};

export default function App() {
    const editorRef = useRef<Editor | null>(null);

    if (!editorRef.current) editorRef.current = new Editor(info);

    const editor = editorRef.current;

    useEffect(() => {
        return () => {
            editor.dispose();
        };
    }, []);

    const onSceneReady = (scene: Scene) => {
        editor.onSceneReady(scene);
    };

    const onRender = (scene: Scene) => {
        editor.onRender(scene);
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
