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
        private _layerUI: SVGGElement;

        private _blocks: FlowBlock[];
        private _arrowsObjCol: FlowArrow[];
        private _mouseMode: MouseMode;

        private _arg: FlowDiagramArg;
        ArrowClass: typeof FlowArrow = FlowArrow;
        private _rect: SVGRectElement;

        constructor(arg: FlowDiagramArg)
        {
            // style selection rect
            this._rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            this._rect.style.fill = '#0061ff14';
            this._rect.style.stroke = '#0061ffcc';
            this._rect.style.strokeWidth = '0.5px';

            this._arg = arg;
            this.rootSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

            if (arg.targetElement)
                arg.targetElement.appendChild(this.rootSVG);

            arg.width ? this.rootSVG.setAttribute('width', arg.width) : null;
            arg.height ? this.rootSVG.setAttribute('height', arg.height) : null;
            this._map_namedLayer = {};
            this._blocks = [];
            this._arrowsObjCol = [];

            // layer side
            this.createLayer('background');
            this._layerWire = this.createLayer('layerWire');
            this._layerBlock = this.createLayer('layerBlock');
            this._layerUI = this.createLayer('layerUI');

            this._mouseMode = MouseMode.moveBlock;

            this.attach_BlockEvents();
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

        private attach_BlockEvents()
        {
            this.rootSVG.onmousedown = e =>
            {
                let eleInQuestion = e.target as any;

                this._mouseX = e.offsetX;
                this._mouseY = e.offsetY;

                if (eleInQuestion.myhandler)
                {
                    let handlerObject = eleInQuestion.myhandler;
                    if (handlerObject instanceof FlowBlock)
                    {
                        if (this._mouseMode === MouseMode.moveBlock)
                        {
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
                    // init selection grid
                    this.setSelection(null);
                    this._layerUI.appendChild(this._rect);

                    this._rect.x.baseVal.value = this._mouseX;
                    this._rect.y.baseVal.value = this._mouseY;
                    this._rect.width.baseVal.value = 0;
                    this._rect.height.baseVal.value = 0;
                }
            }

            this.rootSVG.onmousemove = e =>
            {
                if (this._mouseMode === MouseMode.moveBlock)
                {
                    if (e.buttons === 1 && e.button === 0)
                    {
                        if (this._selectable instanceof FlowBlock)
                        {
                            let dx = e.offsetX - this._mouseX;
                            let dy = e.offsetY - this._mouseY;

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
                        else
                        {
                            // draw select grid
                            let x1 = this._mouseX;
                            let y1 = this._mouseY;
                            let x2 = e.offsetX;
                            let y2 = e.offsetY;

                            if (x1 > x2)
                            {
                                let x = x2;
                                x2 = x1;
                                x1 = x;
                            }

                            if (y1 > y2)
                            {
                                let y = y2;
                                y2 = y1;
                                y1 = y;
                            }

                            this._rect.x.baseVal.value = x1;
                            this._rect.y.baseVal.value = y1;
                            this._rect.width.baseVal.value = x2 - x1;
                            this._rect.height.baseVal.value = y2 - y1;
                        }
                    }
                }
                else if (this._mouseMode === MouseMode.addArrows)
                {

                }
            }

            this.rootSVG.onmouseup = e =>
            {
                // if selection ui was rendered
                if (this._selectable === null)
                {
                    this._layerUI.removeChild(this._rect);
                    let x = this._rect.x.baseVal.value;
                    let y = this._rect.y.baseVal.value;
                    let w = this._rect.width.baseVal.value;
                    let h = this._rect.height.baseVal.value;
                    
                    let selectedBlocks = this._blocks.filter(blk => { return blk.blockInRect(x, y, w, h) });
                    this.setSelection(selectedBlocks[0]);
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


