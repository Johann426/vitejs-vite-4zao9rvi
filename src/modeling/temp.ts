interface Observable<T> {
    add(observer: Observer<T>): void;
    remove(observer: Observer<T>): void;
    notify(): void;
}

interface Observer<T> {
    update(subject: Observable<T>): void;
}

class Point implements Observable<Point> {
    private observers: Observer<Line>[] = [];

    constructor(public x: number, public y: number) { }

    add(observer: Observer<Line>): void {
        this.observers.push(observer);
    }

    remove(observer: Observer<Line>): void {
        const index = this.observers.indexOf(observer);
        if (index > -1) {
            this.observers.splice(index, 1);
        }
    }

    notify(): void {
        for (const observer of this.observers) {
            observer.update(this);
        }
    }

    public setPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
        this.notify();
    }
}

class Line implements Observer<Line> {
    // Line은 두 Point 객체를 구독합니다.
    constructor(private startPoint: Point, private endPoint: Point) {
        startPoint.add(this); // 시작점 구독
        endPoint.add(this);   // 끝점 구독
    }

    // 구독 대상(Point)의 상태가 변경될 때 호출됨
    update(subject: Observable<Point>): void {
        if (subject instanceof Point) {
            console.log(`선이 알림을 받았습니다. ${subject === this.startPoint ? '시작점' : '끝점'}이 이동했습니다.`);
            this.redraw();
        }
    }

    private redraw(): void {
        // Line의 새로운 좌표(startPoint.x, startPoint.y, endPoint.x, endPoint.y)를 기반으로
        // 캔버스에 선을 다시 그리는 로직 구현
        console.log(`선을 새로운 위치에 다시 그립니다: (${this.startPoint.x},${this.startPoint.y}) to (${this.endPoint.x},${this.endPoint.y})`);
    }
}