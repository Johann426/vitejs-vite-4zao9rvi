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
            console.log(`선이 알림을 받았습니다. ${subject === this.startPoint ? '시작점' : '끝점'}이 이동했습니다. 업데이트 합니다.`);
        }
    }

}