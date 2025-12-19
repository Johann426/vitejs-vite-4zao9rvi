import { Vector3, KeyboardEventTypes } from "@babylonjs/core";
import type { Nullable, Observer, KeyboardInfo, } from "@babylonjs/core";
import Editor from "../Editor";

export class KeyEventHandler {
    editor: Editor;
    keyDownObserver: Nullable<Observer<KeyboardInfo>> = null;

    constructor(editor: Editor) {
        this.editor = editor;
        const scene = editor.scene;
        this.keyDownObserver = scene.onKeyboardObservable.add(this.onKeyDown, KeyboardEventTypes.KEYDOWN);
    }

    // Handle keyboard down events
    onKeyDown = (kbInfo: KeyboardInfo) => {
        const { ctrlKey, metaKey, key } = kbInfo.event
        const { scene, history } = this.editor;

        if ((ctrlKey || metaKey) && key.toLowerCase() === "z") {
            kbInfo.event.preventDefault();
            console.log(history);
            history.undo();
        }
        if ((ctrlKey || metaKey) && key.toLowerCase() === "y") {
            kbInfo.event.preventDefault();
            console.log(history);
            history.redo();
        }

        const camera = scene.activeCamera;

        // if (camera) {
        //     const dist = camera.position.length();
        //     if (key === "x") {
        //         camera.position = new Vector3(dist, 0, 0);
        //     }
        //     if (key === "y") {
        //         camera.position = new Vector3(0, dist, 0);
        //     }
        //     if (key === "z") {
        //         camera.position = new Vector3(0, 0, dist);
        //     }
        // }
    };

    // Clean up observers when disposing of the SelectMesh instance
    dispose() {
        const scene = this.editor.scene;
        if (this.keyDownObserver) {
            scene.onKeyboardObservable.remove(this.keyDownObserver);
            this.keyDownObserver = null;
        }
    }
}

