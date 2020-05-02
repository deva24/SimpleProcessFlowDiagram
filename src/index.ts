import DrawingUtils from './Utils/drawing';
import FlowArrow from './FlowComponenets/DefaultArrows';
import FlowBlock from './FlowComponenets/DefaultBlocks';
import Int, { Interfaces } from './FlowComponenets/interface'
import renderSVG from './Utils/svg';

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
        private _selectable: Interfaces.Selectable[] = [];
        private _map_namedLayer: { [name: string]: SVGGElement };

        private _layerBlock: SVGGElement;
        private _layerWire: SVGGElement;
        private _layerUI: SVGGElement;

        private _blocks: FlowBlock[];
        private _arrows: FlowArrow[];
        private _mouseMode: MouseMode;

        private _arg: FlowDiagramArg;
        private _rect: SVGRectElement;

        rootSVG: SVGSVGElement;
        ArrowClass: typeof FlowArrow = FlowArrow;

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
            this.rootSVG.style.userSelect = 'none';
            this._map_namedLayer = {};
            this._blocks = [];
            this._arrows = [];

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
                        let selectedBlockAlreadySelected = this._selectable.indexOf(handlerObject) >= 0;

                        if (this._mouseMode === MouseMode.moveBlock && !selectedBlockAlreadySelected)
                        {
                            let blk = handlerObject;
                            this.setSelection([blk]);
                        }
                        else if (this._mouseMode === MouseMode.addArrows)
                        {
                            let selBlock: FlowBlock = handlerObject;

                            let primarySelected = this._selectable[0];

                            if (primarySelected === null)
                            {
                                this.setSelection([selBlock]);
                            }
                            else if (selBlock && selBlock != primarySelected && primarySelected instanceof FlowBlock)
                            {
                                this.addArrow(primarySelected, selBlock, this.ArrowClass);
                                this.setSelection([]);
                            }
                            else
                            {
                                this.setSelection([selBlock]);
                            }
                        }
                    }

                    if (handlerObject instanceof FlowArrow)
                    {
                        this.setSelection([eleInQuestion.myhandler]);
                    }
                }
                else
                {
                    // init selection grid
                    this.setSelection([]);
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
                        if (this._selectable.length > 0)
                        {
                            let dx = e.offsetX - this._mouseX;
                            let dy = e.offsetY - this._mouseY;

                            let factor = 20;

                            dx = Math.floor(dx / factor) * factor;
                            dy = Math.floor(dy / factor) * factor;

                            if (dx !== 0 || dy !== 0)
                            {
                                this._mouseX += dx;
                                this._mouseY += dy;
                                this._selectable.forEach(sel =>
                                {
                                    if (sel instanceof FlowBlock)
                                    {
                                        sel.origin.x += dx;
                                        sel.origin.y += dy;

                                        sel.render();
                                    }
                                });
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
                if (this._selectable.length === 0)
                {
                    if (this._rect.parentElement)
                        this._layerUI.removeChild(this._rect);
                    let x = this._rect.x.baseVal.value;
                    let y = this._rect.y.baseVal.value;
                    let w = this._rect.width.baseVal.value;
                    let h = this._rect.height.baseVal.value;

                    let selectedBlocks = this._blocks.filter(blk => { return blk.blockInRect(x, y, w, h) });
                    this.setSelection(selectedBlocks);
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

            this._arrows.push(arrow);
            return arrow;
        }

        private setSelection(newSel: Interfaces.Selectable[])
        {
            let propsDescribed: Interfaces.PropertyDescriptor[][] = [];
            this._selectable.forEach(sel => { sel.onUnselect() });
            this._selectable = newSel;
            this._selectable.forEach((sel, i) => { sel.onSelect(); propsDescribed[i] = sel.getPropertyList() });

            if (this._arg.propEditor)
            {
                let propNameMap: { [key: string]: Interfaces.PropertyDescriptor[] } = {};
                let commonProps: Interfaces.PropertyDescriptor[] = [];

                propsDescribed.forEach(props =>
                {
                    props.forEach(prop =>
                    {
                        if (propNameMap[prop.name] === undefined) propNameMap[prop.name] = [];
                        propNameMap[prop.name].push(prop);
                    })
                });

                Object.keys(propNameMap).forEach(name =>
                {
                    commonProps.push({
                        name: name,
                        onGet: () => { return propNameMap[name][0].onGet() },
                        type: 'string',
                        onSet: (val) => { propNameMap[name].forEach(prop => { prop.onSet(val); }) },
                    })
                });


                while (this._arg.propEditor.firstElementChild)
                {
                    this._arg.propEditor.removeChild(this._arg.propEditor.firstElementChild);
                }

                let props = commonProps;
                props.forEach((prop, i) =>
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

        getJSON()
        {
            let blocks = this._blocks.map(blk =>
            {
                return blk.getSaveObj();
            });

            let arrows = this._arrows.map(arrow =>
            {
                return arrow.getSaveObj();
            });

            return { type: "FlowDiagram", v: "0.1", "0.1": { blocks, arrows } }
        }

        setJSON(obj: any)
        {
            let instructions = obj['0.1'];

            let blockMap: { [id: number]: FlowBlock } = {};

            instructions.blocks.forEach((blockJSON: any) =>
            {
                let blockObj = new FlowBlock();
                this.addBlock(blockObj);
                blockObj.setSaveObj(blockJSON);

                blockMap[blockJSON.id] = blockObj;
            });

            instructions.arrows.forEach((arrowJSON: any) =>
            {
                let fromBlockId = arrowJSON.source;
                let toBlockId = arrowJSON.target;

                let fromBlock = blockMap[arrowJSON.source];
                let toBlock = blockMap[arrowJSON.target];


                if(fromBlock && toBlock)
                {
                    let arrowObj = this.addArrow(fromBlock,toBlock,this.ArrowClass);
                    arrowObj.setSaveObj(arrowJSON);
                }
                
            })
        }

        setMode(mode: MouseMode)
        {
            this._mouseMode = mode;
            this.setSelection([]);
        }

        addBlock(block: FlowBlock)
        {
            block.id = this._blocks.length;
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

let a = document.createElement('a');
let btn_save = document.getElementById('btn_save');
if (btn_save)
    btn_save.onclick = function ()
    {
        debugger;
        let mainJSON = JSON.stringify(fd.getJSON());
        let blob1 = new Blob([mainJSON], { type: 'application/json' });

        let url1 = URL.createObjectURL(blob1);
        a.href = url1;
        a.download = 'flow_diagram.json';
        a.click();
    }

let btn_export = document.getElementById('btn_export');
if (btn_export)
    btn_export.onclick = function ()
    {   
        
        fd.rootSVG.setAttribute('width',fd.rootSVG.clientWidth + 'px');
        fd.rootSVG.setAttribute('height',fd.rootSVG.clientHeight + 'px');

        renderSVG(fd.rootSVG,(url1)=>{
            a.href = url1;
            a.download = 'flow_diagram.png';
            a.click();

            fd.rootSVG.removeAttribute('width');
            fd.rootSVG.removeAttribute('height');
        })

    }



let btn_load = document.getElementById('btn_load');
if (btn_load)
    btn_load.onclick = function ()
    {
        let file_inp = document.createElement('input');
        file_inp.type = 'file';
        file_inp.click();
        file_inp.onchange = function ()
        {
            if (file_inp.files && file_inp.files.length > 0)
            {
                let fr = new FileReader();
                fr.onload = function ()
                {
                    if (typeof fr.result === 'string')
                    {
                        let obj = JSON.parse(fr.result);
                        debugger;
                        fd.setJSON(obj);
                    }
                }
                fr.readAsText(file_inp.files[0]);
            }
        }
    }

