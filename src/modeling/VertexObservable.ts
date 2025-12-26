import { Vertex } from "./Vertex";
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
        observer && this._observers.push(observer);
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

    private _vertex: Vertex

    constructor(
        point: Vector
    ) {
        super();
        this._vertex = new Vertex(point);
        this._vertex.reference = this;
    }

    get vertex() {
        return this._vertex;
    }

    setPosition(v: Vector): void {
        this._vertex.point = new Vector(v.x, v.y, v.z);;
        this.notify();
    }

    setKnuckle(bool: boolean): void {
        this._vertex.knuckle = bool;
        this.notify();
    }

    setTangentIn(v: Vector): void {
        this._vertex.tangentIn = new Vector(v.x, v.y, v.z);;
        this.notify();
    }

    setTangentOut(v: Vector): void {
        this._vertex.tangentOut = new Vector(v.x, v.y, v.z);;
        this.notify();
    }
}