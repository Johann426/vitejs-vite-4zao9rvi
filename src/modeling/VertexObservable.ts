import { Vector } from "./NurbsLib";

interface IObserver<T> {
    update(model?: T): void;
}

export class Observer<T> implements IObserver<T> {
    constructor(
        private callback: (model?: T) => void
    ) { }

    update(model?: T) {
        this.callback(model);
    }
}

interface IObservable<T> {
    add(callback: (model?: T) => void): Observer<T>;
    remove(observer: Observer<T>): boolean;
    notify(model?: T): void;
}

export class Observable<T> implements IObservable<T> {
    private _observers: Observer<T>[] = [];

    get observers() {
        return this._observers;
    }

    constructor(observer?: Observer<T>) {
        if (observer) {
            this._observers.push(observer);
        }
    }

    add(callback: (model?: T) => void) {
        const observer = new Observer(callback)
        this._observers.push(observer);

        return observer;
    }

    remove(observer: Observer<T>) {
        const index = this._observers.indexOf(observer);

        if (index !== -1) {
            this._observers.splice(index, 1);
            return true;
        } else {
            return false;
        }
    }

    notify(model?: T) {
        for (const obs of this._observers) {
            obs.update(model);
        }
    }
}

export class Vertex<T> extends Observable<T> {
    /**
     * Creates a new vertex observer
     * @param position defines position vector of the vertex
     * @param knuckle defines knuckle
     * @param tangentI defines tangential vector entering the vertex
     * @param tangentO defines tangential vector exiting the vertex
     */
    constructor(
        private model: T,
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
        this.notify(this.model);
    }

    setKnuckle(bool: boolean): void {
        this.knuckle = bool;
        this.notify(this.model);
    }

    setTangentIn(x: Vector | number = 0, y: number = 0, z: number = 0): void {
        this.setVector(this.tangentI, x, y, z);
        this.notify(this.model);
    }

    setTangentOut(x: Vector | number = 0, y: number = 0, z: number = 0): void {
        this.setVector(this.tangentO, x, y, z);
        this.notify(this.model);
    }
}