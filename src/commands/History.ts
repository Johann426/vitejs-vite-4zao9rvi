import type Command from "./Command";

export default class History {
    private undos: Command[] = [];
    private redos: Command[] = [];

    constructor() { }

    excute(cmd: Command) {
        this.undos.push(cmd);
        this.redos = [];
        cmd.execute();
    }

    undo() {
        let cmd = undefined;

        if (this.undos.length > 0) {
            cmd = this.undos.pop();
        }

        if (cmd !== undefined) {
            cmd.undo();
            this.redos.push(cmd);
        }
    }

    redo() {
        let cmd = undefined;

        if (this.redos.length > 0) {
            cmd = this.redos.pop();
        }

        if (cmd !== undefined) {
            cmd.redo();
            this.undos.push(cmd);
        }
    }

    clear() {
        this.undos = [];
        this.redos = [];
    }
}
