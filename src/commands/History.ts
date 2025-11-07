export class History {

    constructor() {

        this.undos = [];
        this.redos = [];

    }

    excute(cmd) {

        this.undos.push(cmd);
        this.redos = [];
        cmd.execute();

    }

    undo() {

        var cmd = undefined;

        if (this.undos.length > 0) {

            cmd = this.undos.pop();

        }


        if (cmd !== undefined) {

            cmd.undo();
            this.redos.push(cmd);

        }

    }

    redo() {

        var cmd = undefined;

        if (this.redos.length > 0) {

            cmd = this.redos.pop();

        }

        if (cmd !== undefined) {

            cmd.execute();
            this.undos.push(cmd);

        }

    }

    clear() {

        this.undos = [];
        this.redos = [];

    }

}
