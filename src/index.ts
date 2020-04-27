import DrawingUtils from './Utils/drawing';
import FlowArrow from './FlowComponenets/DefaultArrows';
import FlowBlock from './FlowComponenets/DefaultBlocks';
import Int from './FlowComponenets/interface'

namespace UI.Flow
{
    export enum MouseMode
    {
        moveBlock,
        addArrows
    }

    export interface FlowDiagramArg 
    {
        width: string;
        height: string;
        targetElement?: HTMLElement;
        propEditor?: HTMLElement;
    }

    export class FlowDiagram
    {
        private _mouseX: number = 0;
        private _mouseY: number = 0;
        private _selectedBlockX: number = 0;
        private _selectedBlockY: number = 0;
        private _selectable: FlowBlock | FlowArrow | null = null;

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
                            this._mouseX = e.x;
                            this._mouseY = e.y;
                            let blk = handlerObject;
                            this.setSelection(blk);
                            this._selectedBlockX = blk.origin.x;
                            this._selectedBlockY = blk.origin.y;
                        }
                        else if (this._mouseMode === MouseMode.addArrows)
                        {
                            let selBlock: FlowBlock = handlerObject;

                            if (this._selectable === null)
                            {
                                this.setSelection(selBlock);
                            }
                            else if (selBlock && selBlock != this._selectable && this._selectable instanceof FlowBlock)
                            {
                                this.addArrow(this._selectable, selBlock, this.ArrowClass);
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
                    if (e.buttons === 1 && e.button === 0 && this._selectable instanceof FlowBlock)
                    {
                        let dx = e.x - this._mouseX;
                        let dy = e.y - this._mouseY;

                        let nx = this._selectedBlockX + dx;
                        let ny = this._selectedBlockY + dy;

                        let hx = this._selectable.size.x / 2;
                        let hy = this._selectable.size.y / 2;

                        let cx = nx + hx;
                        let cy = ny + hy;

                        let rounding = 10;

                        let rx = cx - Math.round(cx / rounding) * rounding;
                        let ry = cy - Math.round(cy / rounding) * rounding;

                        nx -= rx;
                        ny -= ry;

                        if (this._selectable.origin.x != nx || this._selectable.origin.y != ny)
                        {
                            this._selectable.origin.x = nx;
                            this._selectable.origin.y = ny;
                            this._selectable.render();
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
            let prevSelected = this._selectable;
            this._selectable = newSel;
            if (this._selectable !== prevSelected)
            {
                prevSelected?.onUnselect();
                this._selectable?.onSelect();

                if (this._arg.propEditor)
                {
                    while (this._arg.propEditor.firstElementChild)
                    {
                        this._arg.propEditor.removeChild(this._arg.propEditor.firstElementChild);
                    }

                    let props = this._selectable?.getPropertyList();
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

    export class TestArrow extends FlowArrow
    {
        fromBlock: FlowBlock;
        toBlock: FlowBlock;
        graphics: any[];

        private _fromPoint2: DrawingUtils.Point;
        private _toPoint2: DrawingUtils.Point;

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
            this._fromPoint2 = new DrawingUtils.Point(0, 0);
            this._toPoint2 = new DrawingUtils.Point(0, 0);
        }

        setPt(point: DrawingUtils.Point, source: FlowBlock)
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
            let lineCenter = DrawingUtils.avgPoint([this._fromPoint2, this._toPoint2]);

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
            return new DrawingUtils.LineSeg(this.fromBlock.center, this.toBlock.center);
        }

        onSelect()
        {
            [this.line12, this.line22, this.line32].forEach(line => { line.style.stroke = 'blue'; });
        }

        onUnselect()
        {
            [this.line12, this.line22, this.line32].forEach(line => { line.style.stroke = 'black'; });
        }

        getPropertyList(): Int.PropertyDescriptor[]
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

let fd = new UI.Flow.FlowDiagram({
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
        fd.setMode(UI.Flow.MouseMode.addArrows)
    }

let btn_move = document.getElementById('btn_moveblock');
if (btn_move)
    btn_move.onclick = function ()
    {
        fd.setMode(UI.Flow.MouseMode.moveBlock)
    }

let btn_add = document.getElementById('btn_addblock');
if (btn_add)
    btn_add.onclick = function ()
    {
        fd.addBlock(new FlowBlock());
    }

let btn_cnga = document.getElementById('btn_cngarrow');
if (btn_cnga)
    btn_cnga.onclick = function ()
    {
        fd.ArrowClass = UI.Flow.TestArrow;
    }


