namespace UI
{
    let mouseX: number = 0;
    let mouseY: number = 0;
    let selectedBlockX: number = 0;
    let selectedBlockY: number = 0;
    let selectable: FlowBlock | FlowArrow | null;

    export enum MouseMode
    {
        moveBlock,
        addArrows
    }

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

    interface IPropertyDescriptor
    {
        name: string;
        type: "string" | "number";

        onGet: () => any;
        onSet: (value: any) => void;
    }

    interface ISelectable
    {
        onSelect: Function;
        onUnselect: Function;

        getPropertyList: () => IPropertyDescriptor[];
    }

    export interface FlowDiagramArg 
    {
        width: string;
        height: string;
        targetElement?: HTMLElement;
        propEditor?: HTMLElement;
    }

    export class FlowArrow implements ISelectable
    {
        fromBlock: FlowBlock;
        toBlock: FlowBlock;
        graphics: any[];

        private _fromPoint: Drawing.Point;
        private _toPoint: Drawing.Point;

        private line1: SVGLineElement;
        private line2: SVGLineElement;
        private line3: SVGLineElement;
        private text: SVGTextElement;

        constructor(from: FlowBlock, to: FlowBlock)
        {
            this.fromBlock = from;
            this.toBlock = to;
            let line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            let line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            let line3 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            let text = document.createElementNS('http://www.w3.org/2000/svg', 'text');

            text.style.textAnchor = 'middle';

            this.line1 = line1;
            this.line2 = line2;
            this.line3 = line3;
            this.text = text;

            [line1, line2, line3].forEach(line =>
            {
                line.style.stroke = 'red';
                line.style.strokeWidth = '2px';
                (line as any).myhandler = this;
            });

            this.graphics = [line1, line2, line3, text];
            this._fromPoint = new Drawing.Point(0, 0);
            this._toPoint = new Drawing.Point(0, 0);
        }

        setPt(point: Drawing.Point, source: FlowBlock)
        {
            if (source == this.fromBlock)
            {
                this._fromPoint.x = point.x;
                this._fromPoint.y = point.y;
            }
            else if (source == this.toBlock)
            {
                this._toPoint.x = point.x;
                this._toPoint.y = point.y;
            }
            this.render();
        }

        render()
        {
            let fromX: number = this._fromPoint.x;
            let fromY: number = this._fromPoint.y;
            let toX: number = this._toPoint.x;
            let toY: number = this._toPoint.y;
            let toDirectAngle: number = Math.atan2(fromY - toY, fromX - toX);

            this._render_draw_arrow(fromX, fromY, toX, toY, toDirectAngle);

            let text = this.text;
            let lineCenter = Drawing.avgPoint([this._fromPoint, this._toPoint]);

            let angleDeg = toDirectAngle / Math.PI * 180;
            if (angleDeg < -90) angleDeg += 180;
            else if (angleDeg > 90) angleDeg -= 180;
            text.style.transform = `translate(${lineCenter.x}px, ${lineCenter.y}px) rotate(${angleDeg}deg) translate(0,-5px)`;
        }

        private _render_draw_arrow(fromX: number, fromY: number, toX: number, toY: number, toDirectAngle: number)
        {
            let line1 = this.line1;
            let line2 = this.line2;
            let line3 = this.line3;
            line1.x1.baseVal.value = fromX;
            line1.y1.baseVal.value = fromY;
            line1.x2.baseVal.value = toX;
            line1.y2.baseVal.value = toY;
            let x2: number = 0, y2: number = 0, x3: number = 0, y3: number = 0;
            let delAngle = 30 / 180 * Math.PI;
            x2 = Math.cos(toDirectAngle - delAngle) * 10;
            y2 = Math.sin(toDirectAngle - delAngle) * 10;
            x3 = Math.cos(toDirectAngle + delAngle) * 10;
            y3 = Math.sin(toDirectAngle + delAngle) * 10;
            line2.x1.baseVal.value = x2 + toX;
            line2.y1.baseVal.value = y2 + toY;
            line2.x2.baseVal.value = toX;
            line2.y2.baseVal.value = toY;
            line3.x1.baseVal.value = x3 + toX;
            line3.y1.baseVal.value = y3 + toY;
            line3.x2.baseVal.value = toX;
            line3.y2.baseVal.value = toY;
        }

        getC2CLine()
        {
            return new Drawing.LineSeg(this.fromBlock.center, this.toBlock.center);
        }

        onSelect()
        {
            [this.line1, this.line2, this.line3].forEach(line => { line.style.stroke = 'blue'; });
        }

        onUnselect()
        {
            [this.line1, this.line2, this.line3].forEach(line => { line.style.stroke = 'black'; });
        }

        getPropertyList(): IPropertyDescriptor[]
        {
            return [{
                name: "Primary Text",
                type: 'string',
                onGet: () => { return this.text.textContent },
                onSet: (value: any) => { this.text.textContent = value }
            }];
        }
    }

    export class FlowBlock implements ISelectable
    {
        origin: Drawing.Point;
        size: Drawing.Point;

        arrows: FlowArrow[];
        graphic: SVGGElement;

        borders: Drawing.LineSeg[];
        center: Drawing.Point;

        private _props: IPropertyDescriptor[];

        constructor()
        {
            let x: number = 0;
            let y: number = 0;
            let w: number = 120;
            let h: number = 120;

            this.origin = new Drawing.Point(x, y);
            this.size = new Drawing.Point(w, h);

            this.borders = this._getBorderLines();
            this.center = this._getCenter();

            this.arrows = [];
            this._props = [];

            let block = document.createElementNS('http://www.w3.org/2000/svg', 'g') as SVGGElement;
            this.graphic = block;
            this._setGraphic();
        }

        private _setGraphic()
        {
            let block = this.graphic;
            let rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            block.appendChild(rect);

            rect.width.baseVal.value = 100;
            rect.height.baseVal.value = 100;

            rect.style.fill = '#FFFFFF';
            rect.style.stroke = 'black';
            rect.style.strokeWidth = '1';
            rect.x.baseVal.value = 10;
            rect.y.baseVal.value = 10;

            let txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            block.appendChild(txt);
            txt.setAttribute('x', '60px');
            txt.setAttribute('y', '60px');
            txt.style.textAnchor = 'middle';
            txt.style.dominantBaseline = 'middle';

            //set clickable
            [rect].forEach(ele =>
            {
                let obj = ele as any;
                obj.myhandler = this;
            })

            this._props = [
                {
                    name: "Primary text",
                    type: 'string',
                    onGet: () => { return txt.textContent },
                    onSet: (val: any) => { txt.textContent = val; }
                }
            ]
        }

        pointLiesInBlock(x: number, y: number)
        {
            let block = this;
            return x >= block.origin.x && y >= block.origin.y && x <= block.origin.x + block.size.x && y <= block.origin.y + block.size.y;
        }

        render()
        {
            this.borders = this._getBorderLines();
            this.center = this._getCenter();
            let block = this.graphic;
            if (block.transform.baseVal.numberOfItems == 0)
            {
                block.setAttribute('transform', `translate(${this.origin.x},${this.origin.y})`)

            }
            else
            {
                block.transform.baseVal.getItem(0).setTranslate(this.origin.x, this.origin.y);
            }

            this._renderArrows();
        }

        private _getCenter()
        {
            return new Drawing.Point(this.origin.x + this.size.x / 2, this.origin.y + this.size.y / 2);
        }

        pointTo(block2: FlowBlock, typeArrow: typeof FlowArrow)
        {
            debugger;
            let Arrow1 = new typeArrow(this, block2);
            this.arrows.push(Arrow1);
            block2.arrows.push(Arrow1);

            this._renderArrows();
            block2._renderArrows();
            return Arrow1
        }

        private _renderArrows(sender: FlowBlock = this)
        {
            if (this.arrows.length === 0) return;
            let { bottomBank, leftBank, rightBank, topBank } = this._getArrowBanks();
            let seperator = 20;

            let ptindex = [
                { x: this.origin.x },
                { x: this.origin.x + this.size.x },
                { y: this.origin.y },
                { y: this.origin.y + this.size.y },
            ];

            [leftBank, rightBank, topBank, bottomBank].forEach((bank, i) =>
            {
                let halfLength = (bank.length - 1) * seperator / 2;
                let fpti = ptindex[i];
                let pti = 0;

                if (fpti.x)
                    //vertical
                    pti = this.origin.y + this.size.y / 2 - halfLength;
                else
                    //horizontal
                    pti = this.origin.x + this.size.x / 2 - halfLength;

                bank.forEach(iter =>
                {
                    let dpt = new Drawing.Point(0, 0);

                    if (fpti.x)
                    {
                        //vertical
                        dpt.x = fpti.x;
                        dpt.y = pti;
                    }
                    else if (fpti.y)
                    {
                        //horizontal
                        dpt.y = fpti.y
                        dpt.x = pti;
                    }

                    iter.Arrow.setPt(dpt, this);

                    if (sender === this)
                    {
                        let otherBlock = iter.Arrow.fromBlock;
                        if (otherBlock === this) otherBlock = iter.Arrow.toBlock;
                        otherBlock._renderArrows(this);
                    }

                    pti += seperator;
                });
            });
        }

        private _getArrowBanks()
        {
            let leftBank: { Arrow: FlowArrow, pt: Drawing.Point }[] = [];
            let rightBank: { Arrow: FlowArrow, pt: Drawing.Point }[] = [];
            let topBank: { Arrow: FlowArrow, pt: Drawing.Point }[] = [];
            let bottomBank: { Arrow: FlowArrow, pt: Drawing.Point }[] = [];

            let indexedBanks = [topBank, rightBank, bottomBank, leftBank];

            // determine which side does the arrow
            this.arrows.forEach(arrow =>
            {
                let lineC2C = arrow.getC2CLine();

                for (let i = 0; i < this.borders.length; i++)
                {
                    let borderLine = this.borders[i];
                    let pt = borderLine.getIntersectingPoint(lineC2C);
                    if (pt && pt.seg1 && pt.seg2)
                    {
                        indexedBanks[i].push({
                            Arrow: arrow,
                            pt: pt.pt
                        });
                        break;
                    }
                }
            });

            //vertical sort
            [leftBank, rightBank].forEach(bank =>
            {
                bank.sort((a, b) =>
                {
                    if (a.pt.y < b.pt.y) return -1;
                    if (a.pt.y > b.pt.y) return 1;
                    return 0;
                });
            });

            //horizontal sort
            [topBank, bottomBank].forEach(bank =>
            {
                bank.sort((a, b) =>
                {
                    if (a.pt.x < b.pt.x) return -1;
                    if (a.pt.x > b.pt.x) return 1;
                    return 0;
                });
            });

            return { leftBank, topBank, rightBank, bottomBank };
        }

        private _getBorderLines(): Drawing.LineSeg[]
        {
            let ret: Drawing.LineSeg[] = [];

            /**
             *  Ref rect
             * 
             *   A---------B
             *   |         |
             *   D---------C
             */

            // line AB
            ret.push(new Drawing.LineSeg(
                new Drawing.Point(this.origin.x, this.origin.y),
                new Drawing.Point(this.origin.x + this.size.x, this.origin.y))
            );

            // line BC
            ret.push(new Drawing.LineSeg(
                new Drawing.Point(this.origin.x + this.size.x, this.origin.y),
                new Drawing.Point(this.origin.x + this.size.x, this.origin.y + this.size.y))
            );

            // line CD
            ret.push(new Drawing.LineSeg(
                new Drawing.Point(this.origin.x + this.size.x, this.origin.y + this.size.y),
                new Drawing.Point(this.origin.x, this.origin.y + this.size.y))
            );

            // line DA
            ret.push(new Drawing.LineSeg(
                new Drawing.Point(this.origin.x, this.origin.y + this.size.y),
                new Drawing.Point(this.origin.x, this.origin.y))
            );

            return ret;
        }

        onSelect()
        {

        }

        onUnselect()
        {

        }

        getPropertyList() { return this._props };
    }

    export class FlowDiagram
    {
        rootSVG: SVGElement;
        private _map_namedLayer: { [name: string]: SVGGElement };

        private _layerBlock: SVGGElement;
        private _layerWire: SVGGElement;

        private _blocks: FlowBlock[];
        private _arrowsObjCol: FlowArrow[];
        private _mouseMode: MouseMode;

        private _arg: FlowDiagramArg;
        ArrowClass: typeof FlowArrow = FlowArrow;

        constructor(arg: FlowDiagramArg)
        {
            this._arg = arg;
            this.rootSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

            if (arg.targetElement)
                arg.targetElement.appendChild(this.rootSVG);

            arg.width ? this.rootSVG.setAttribute('width', arg.width) : null;
            arg.height ? this.rootSVG.setAttribute('height', arg.height) : null;
            this._map_namedLayer = {};
            this._blocks = [];
            this._arrowsObjCol = [];

            this.createLayer('background');

            this._layerWire = this.createLayer('layerWire');
            this._layerBlock = this.createLayer('layerBlock');
            this._mouseMode = MouseMode.moveBlock;

            this.attachBlockEvents();
        }

        private createLayer(name: string, ind: number = -1): SVGGElement
        {
            let group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            this._map_namedLayer[name] = group;

            if (ind >= 0 && ind < this.rootSVG.children.length - 1)
            {
                this.rootSVG.children[ind].insertAdjacentElement("beforebegin", group);
            }
            else
            {
                this.rootSVG.appendChild(group);
            }
            return group;
        }

        private attachBlockEvents()
        {
            this.rootSVG.onmousedown = e =>
            {
                let eleInQuestion = e.target as any;

                if (eleInQuestion.myhandler)
                {
                    let handlerObject = eleInQuestion.myhandler;
                    if (handlerObject instanceof FlowBlock)
                    {
                        if (this._mouseMode === MouseMode.moveBlock)
                        {
                            mouseX = e.x;
                            mouseY = e.y;
                            let blk = handlerObject;
                            this.setSelection(blk);
                            selectedBlockX = blk.origin.x;
                            selectedBlockY = blk.origin.y;
                        }
                        else if (this._mouseMode === MouseMode.addArrows)
                        {
                            let selBlock: FlowBlock = handlerObject;

                            if (selectable === null)
                            {
                                this.setSelection(selBlock);
                            }
                            else if (selBlock && selBlock != selectable && selectable instanceof FlowBlock)
                            {
                                this.addArrow(selectable, selBlock, this.ArrowClass);
                                this.setSelection(null);
                            }
                            else
                            {
                                this.setSelection(selBlock);
                            }
                        }
                    }

                    if (handlerObject instanceof FlowArrow)
                    {
                        this.setSelection(eleInQuestion.myhandler);
                    }
                }
                else
                {
                    this.setSelection(null);
                }

            }

            this.rootSVG.onmousemove = e =>
            {
                if (this._mouseMode === MouseMode.moveBlock)
                {
                    if (e.buttons === 1 && e.button === 0 && selectable instanceof FlowBlock)
                    {
                        let dx = e.x - mouseX;
                        let dy = e.y - mouseY;

                        let nx = selectedBlockX + dx;
                        let ny = selectedBlockY + dy;

                        let hx = selectable.size.x / 2;
                        let hy = selectable.size.y / 2;

                        let cx = nx + hx;
                        let cy = ny + hy;

                        let rounding = 10;

                        let rx = cx - Math.round(cx / rounding) * rounding;
                        let ry = cy - Math.round(cy / rounding) * rounding;

                        nx -= rx;
                        ny -= ry;

                        if (selectable.origin.x != nx || selectable.origin.y != ny)
                        {
                            selectable.origin.x = nx;
                            selectable.origin.y = ny;
                            selectable.render();
                        }

                    }
                }
                else if (this._mouseMode === MouseMode.addArrows)
                {

                }

            }
        }

        private addArrow(fromBlock: FlowBlock, toBlock: FlowBlock, typeArrow: typeof FlowArrow)
        {
            let arrow = fromBlock.pointTo(toBlock, typeArrow);
            arrow.graphics.forEach(gEle =>
            {
                this._layerWire.appendChild(gEle);
            });

            this._arrowsObjCol.push(arrow);
        }

        private setSelection(newSel: FlowArrow | FlowBlock | null)
        {
            let prevSelected = selectable;
            selectable = newSel;
            if (selectable !== prevSelected)
            {
                prevSelected?.onUnselect();
                selectable?.onSelect();

                if (this._arg.propEditor)
                {
                    while (this._arg.propEditor.firstElementChild)
                    {
                        this._arg.propEditor.removeChild(this._arg.propEditor.firstElementChild);
                    }

                    let props = selectable?.getPropertyList();
                    props?.forEach((prop, i) =>
                    {
                        let div = document.createElement('div');
                        let label = document.createElement('label');
                        let inp = document.createElement('input');
                        let txt = document.createTextNode(prop.name);

                        if (i === 0)
                        {
                            setTimeout(() =>
                            {
                                inp.focus();
                                inp.selectionStart = 0;
                                inp.selectionEnd = inp.value.length;
                            }, 100);
                        }

                        div.appendChild(label);
                        label.appendChild(txt);
                        label.appendChild(inp);

                        inp.onkeyup = () =>
                        {
                            prop.onSet(inp.value);
                        }
                        inp.value = prop.onGet();

                        this._arg.propEditor?.appendChild(div);
                    });
                }
            }
        }

        setMode(mode: MouseMode)
        {
            this._mouseMode = mode;
            this.setSelection(null);
        }

        addBlock(block: FlowBlock)
        {
            this._blocks.push(block);
            this._layerBlock.appendChild(block.graphic);
            block.render();
        }
    }

    export class TestArrow extends UI.FlowArrow
    {
        fromBlock: FlowBlock;
        toBlock: FlowBlock;
        graphics: any[];

        private _fromPoint2: Drawing.Point;
        private _toPoint2: Drawing.Point;

        private line12: SVGLineElement;
        private line22: SVGLineElement;
        private line32: SVGLineElement;
        private text2: SVGTextElement;

        constructor(from: FlowBlock, to: FlowBlock)
        {
            super(from, to);
            this.graphics=[];
            this.fromBlock = from;
            this.toBlock = to;
            let line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            let line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            let line3 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            let text = document.createElementNS('http://www.w3.org/2000/svg', 'text');

            text.style.textAnchor = 'middle';
            text.style.dominantBaseline = 'hanging';
            this.line12 = line1;
            this.line22 = line2;
            this.line32 = line3;
            this.text2 = text;

            [line1, line2, line3].forEach(line =>
            {
                line.style.stroke = 'yellow';
                line.style.strokeWidth = '2px';
                (line as any).myhandler = this;
            });

            this.graphics = [line1, line2, line3, text];
            this._fromPoint2 = new Drawing.Point(0, 0);
            this._toPoint2 = new Drawing.Point(0, 0);
        }

        setPt(point: Drawing.Point, source: FlowBlock)
        {
            if (source == this.fromBlock)
            {
                this._fromPoint2.x = point.x;
                this._fromPoint2.y = point.y;
            }
            else if (source == this.toBlock)
            {
                this._toPoint2.x = point.x;
                this._toPoint2.y = point.y;
            }
            this.render();
        }

        render()
        {
            let fromX: number = this._fromPoint2.x;
            let fromY: number = this._fromPoint2.y;
            let toX: number = this._toPoint2.x;
            let toY: number = this._toPoint2.y;
            let toDirectAngle: number = Math.atan2(fromY - toY, fromX - toX);

            this._render_draw_arrow2(fromX, fromY, toX, toY, toDirectAngle);

            let text = this.text2;
            let lineCenter = Drawing.avgPoint([this._fromPoint2, this._toPoint2]);

            let angleDeg = toDirectAngle / Math.PI * 180;
            if (angleDeg < -90) angleDeg += 180;
            else if (angleDeg > 90) angleDeg -= 180;
            text.style.transform = `translate(${lineCenter.x}px, ${lineCenter.y}px) rotate(${angleDeg}deg) translate(0, 5px)`;
        }

        private _render_draw_arrow2(fromX: number, fromY: number, toX: number, toY: number, toDirectAngle: number)
        {
            let line1 = this.line12;
            let line2 = this.line22;
            let line3 = this.line32;
            line1.x1.baseVal.value = fromX;
            line1.y1.baseVal.value = fromY;
            line1.x2.baseVal.value = toX;
            line1.y2.baseVal.value = toY;
            let x2: number = 0, y2: number = 0, x3: number = 0, y3: number = 0;
            let delAngle = 30 / 180 * Math.PI;
            x2 = Math.cos(toDirectAngle - delAngle) * 10;
            y2 = Math.sin(toDirectAngle - delAngle) * 10;
            x3 = Math.cos(toDirectAngle + delAngle) * 10;
            y3 = Math.sin(toDirectAngle + delAngle) * 10;
            line2.x1.baseVal.value = x2 + toX;
            line2.y1.baseVal.value = y2 + toY;
            line2.x2.baseVal.value = toX;
            line2.y2.baseVal.value = toY;
            line3.x1.baseVal.value = x3 + toX;
            line3.y1.baseVal.value = y3 + toY;
            line3.x2.baseVal.value = toX;
            line3.y2.baseVal.value = toY;
        }

        getC2CLine()
        {
            return new Drawing.LineSeg(this.fromBlock.center, this.toBlock.center);
        }

        onSelect()
        {
            [this.line12, this.line22, this.line32].forEach(line => { line.style.stroke = 'blue'; });
        }

        onUnselect()
        {
            [this.line12, this.line22, this.line32].forEach(line => { line.style.stroke = 'black'; });
        }

        getPropertyList(): IPropertyDescriptor[]
        {
            return [{
                name: "Primary Text",
                type: 'string',
                onGet: () => { return this.text2.textContent },
                onSet: (value: any) => { this.text2.textContent = value }
            }];
        }
    }

}



let fd = new UI.FlowDiagram({
    width: '100%',
    height: '100%',
    targetElement: document.getElementById('target') || undefined,
    propEditor: document.getElementById('propeditor') || undefined
});

fd.rootSVG.style.border = '1px solid black';
fd.rootSVG.style.width = '100%';
fd.rootSVG.style.height = '100%';

let btn_arrow = document.getElementById('btn_arrow');
if (btn_arrow)
    btn_arrow.onclick = function ()
    {
        fd.setMode(UI.MouseMode.addArrows)
    }

let btn_move = document.getElementById('btn_moveblock');
if (btn_move)
    btn_move.onclick = function ()
    {
        fd.setMode(UI.MouseMode.moveBlock)
    }

let btn_add = document.getElementById('btn_addblock');
if (btn_add)
    btn_add.onclick = function ()
    {
        fd.addBlock(new UI.FlowBlock());
    }

let btn_cnga = document.getElementById('btn_cngarrow');
if (btn_cnga)
    btn_cnga.onclick = function ()
    {
        fd.ArrowClass = UI.TestArrow;
    }


