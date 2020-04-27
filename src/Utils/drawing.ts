
namespace Drawing
{
    export class Point
    {
        x: number;
        y: number;
        constructor(x: number, y: number)
        {
            this.x = x;
            this.y = y;
        }
    }

    export class LineSeg
    {
        p1: Point;
        p2: Point;
        constructor(p1: Point, p2: Point)
        {
            this.p1 = p1; this.p2 = p2;
        }

        checkIntersects(l2: LineSeg)
        {
            return lineSegmentIntersects(this, l2);
        }

        getIntersectingPoint(l2: LineSeg)
        {
            return lineSegIntersectingPoint(this, l2);
        }
    }

    export function lineSegmentIntersects(l1: LineSeg, l2: LineSeg)
    {
        let l1x1: number = l1.p1.x;
        let l1y1: number = l1.p1.y;
        let l1x2: number = l1.p2.x;
        let l1y2: number = l1.p2.x;

        let l2x1: number = l2.p1.x;
        let l2y1: number = l2.p1.y;
        let l2x2: number = l2.p2.x;
        let l2y2: number = l2.p2.x;

        var det, gamma, lambda;
        det = (l1x2 - l1x1) * (l2y2 - l2y1) - (l2x2 - l2x1) * (l1y2 - l1y1);
        if (det === 0)
        {
            return false;
        } else
        {
            lambda = ((l2y2 - l2y1) * (l2x2 - l1x1) + (l2x1 - l2x2) * (l2y2 - l1y1)) / det;
            gamma = ((l1y1 - l1y2) * (l2x2 - l1x1) + (l1x2 - l1x1) * (l2y2 - l1y1)) / det;
            return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
        }
    };

    export function lineSegIntersectingPoint(l1: LineSeg, l2: LineSeg)
    {
        let x1: number = l1.p1.x;
        let y1: number = l1.p1.y;

        let x2: number = l1.p2.x;
        let y2: number = l1.p2.y;

        let x3: number = l2.p1.x;
        let y3: number = l2.p1.y;

        let x4: number = l2.p2.x;
        let y4: number = l2.p2.y;

        var ua, ub, denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
        if (denom == 0)
        {
            return null;
        }
        ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
        ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
        return {
            pt: new Point(x1 + ua * (x2 - x1), y1 + ua * (y2 - y1)),
            seg1: ua >= 0 && ua <= 1,
            seg2: ub >= 0 && ub <= 1
        };
    }

    export function avgPoint(points: Point[])
    {
        let x1 = 0;
        let y1 = 0;
        points.forEach(pt => { x1 += pt.x, y1 += pt.y });
        return new Point(x1 / points.length, y1 / points.length);
    }
}

export default Drawing;