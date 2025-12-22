import { Vector } from "./NurbsLib";

interface IObserver {
    update(): void;
}

export class Observer implements IObserver {
    constructor(
        private callback: () => void
    ) { }

    update() {
        this.callback();
    }
}

interface IObservable {
    add(callback: () => void): Observer;
    remove(observer: Observer): boolean;
    notify(): void;
}

export class Observable implements IObservable {
    private _observers: Observer[] = [];

    get observers() {
        return this._observers;
    }

    constructor(observer?: Observer) {
        if (observer) {
            this._observers.push(observer);
        }
    }

    add(callback: () => void) {
        const observer = new Observer(callback)
        this._observers.push(observer);

        return observer;
    }

    remove(observer: Observer) {
        const index = this._observers.indexOf(observer);

        if (index !== -1) {
            this._observers.splice(index, 1);
            return true;
        } else {
            return false;
        }
    }

    // call update() on registered Observers
    notify() {
        for (const obs of this._observers) {
            obs.update();
        }
    }
}

export class VertexObservable extends Observable {
    /**
     * Creates a new vertex observer
     * @param position defines position vector of the vertex
     * @param knuckle defines knuckle
     * @param tangentI defines tangential vector entering the vertex
     * @param tangentO defines tangential vector exiting the vertex
     */
    constructor(
        public position: Vector,
        public knuckle: boolean = false,
        public tangentI: Vector = new Vector(),
        public tangentO: Vector = new Vector(),
    ) {
        super();
    }

    private setVector(v: Vector, x: Vector | number = 0, y: number = 0, z: number = 0): void {
        if (x instanceof Vector) {
            v.x = x.x;
            v.y = x.y;
            v.z = x.z;
        } else {
            v.x = x;
            v.y = y;
            v.z = z;
        }
    }

    setPosition(x: Vector | number = 0, y: number = 0, z: number = 0): void {
        this.setVector(this.position, x, y, z);
        this.notify();
    }

    setKnuckle(bool: boolean): void {
        this.knuckle = bool;
        this.notify();
    }

    setTangentIn(x: Vector | number = 0, y: number = 0, z: number = 0): void {
        this.setVector(this.tangentI, x, y, z);
        this.notify();
    }

    setTangentOut(x: Vector | number = 0, y: number = 0, z: number = 0): void {
        this.setVector(this.tangentO, x, y, z);
        this.notify();
    }
}