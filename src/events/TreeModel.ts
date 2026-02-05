import { Observable } from "./Observable";

// interface Group {
//     id: string;
//     name: string;
//     opened: boolean;
//     groups: Group[];
//     items: Item[];
//     object: object;
// }

interface Item {
    id: string;
    name: string;
    object: object;
}

const id = crypto.randomUUID();

export default class TreeModel extends Observable {

    id: string = crypto.randomUUID();
    opened: boolean = true;
    groups: TreeModel[] = [];
    items: Item[] = [];
    object = new Object();

    constructor(name: string) {
        super();
    }

    newGroup() {
        const newGroup = this.constructor("new group");
        this.groups.push(newGroup);
        this.notify();
    }

    removeGroup(i: number) {
        this.groups.splice(i, 1);
        // need to remove sub items
        this.notify();
    }

    addItem(v: Item) {
        this.items.push(v);
        this.notify();
    }

    removeItem(i: number) {
        this.items.splice(i, 1);
        this.notify();
    }
}
