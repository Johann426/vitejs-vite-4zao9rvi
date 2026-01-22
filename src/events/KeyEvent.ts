import Editor from "../Editor";
import { KeyboardEventTypes } from "@babylonjs/core";
import type { Nullable, Observer, KeyboardInfo, } from "@babylonjs/core";

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
        const { editor } = this;
        const { scene, selectMesh, editMesh, sketchInput } = editor;
        const { ctrlKey, metaKey, key, code } = kbInfo.event

        if ((ctrlKey || metaKey) && key.toLowerCase() === "z") {
            kbInfo.event.preventDefault();
            editor.undo();
        }
        if ((ctrlKey || metaKey) && key.toLowerCase() === "y") {
            kbInfo.event.preventDefault();
            editor.redo();
        }

        if (code === "Space" || key === " ") {
            const editing = sketchInput.editing || editMesh.editing;
            if (editing) return;

            const picked = selectMesh.pickedObject;

            if (sketchInput.registered) {
                if (picked) {
                    editMesh.registerMesh(picked);
                }
                // unregister
                editMesh.unregister();
                sketchInput.removeCallbacks(scene);
                // start select mode
                selectMesh.registerCallbacks(scene);
            } else if (editMesh.registered) {
                // unregister
                editMesh.unregister();
                sketchInput.removeCallbacks(scene);
                // start select mode
                selectMesh.registerCallbacks(scene);
            } else {
                editor.repeat();
            }
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

