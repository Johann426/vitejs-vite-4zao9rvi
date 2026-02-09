import { Observable } from "./Observable";
import type { GroupData, ItemData } from "../layout/TreeView";

export default class TreeNode extends Observable implements GroupData {

    id: string = crypto.randomUUID();
    obj: object = Object();
    bool: boolean = true;
    group: TreeNode[] = [];
    items: ItemData[] = [];

    constructor(public label: string) {
        super();
    }

    newGroup(name: string): TreeNode {
        const newGroup = new TreeNode(name);
        this.group.push(newGroup);
        this.notify();
        return newGroup;
    }

    removeGroup(i: number): TreeNode {
        const removed = this.group.splice(i, 1);
        console.warn("need to remove sub group & sub items")
        this.notify();
        return removed[0];
    }

    newItem(name: string, object: object): ItemData {
        const newItem = {
            id: crypto.randomUUID(),
            label: name,
            obj: object,
        }
        this.items.push(newItem);
        this.notify();
        return newItem;
    }

    removeItem(i: number): ItemData {
        const removed = this.items.splice(i, 1);
        this.notify();
        return removed[0];
    }

}
