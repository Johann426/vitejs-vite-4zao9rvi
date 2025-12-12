import type Editor from "../Editor";

export default interface Command {
    editor: Editor;
    execute(): void;
    undo(): void;
}
