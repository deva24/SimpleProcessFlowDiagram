"use strict";
var UI;
(function (UI) {
    let mouseX = 0;
    let mouseY = 0;
    let selectedBlockX = 0;
    let selectedBlockY = 0;
    let selectable;
    let MouseMode;
    (function (MouseMode) {
        MouseMode[MouseMode["moveBlock"] = 0] = "moveBlock";
        MouseMode[MouseMode["addArrows"] = 1] = "addArrows";
    })(MouseMode = UI.MouseMode || (UI.MouseMode = {}));
    let Drawing;
    (function (Drawing) {
        class Point {
            constructor(x, y) {
                this.x = x;
                this.y = y;
            }
        }
        Drawing.Point = Point;
        class LineSeg {
            constructor(p1, p2) {
                this.p1 = p1;
                this.p2 = p2;
            }
            checkIntersects(l2) {
                return lineSegmentIntersects(this, l2);
            }
            getIntersectingPoint(l2) {
                return lineSegIntersectingPoint(this, l2);
            }
        }
        Drawing.LineSeg = LineSeg;
        function lineSegmentIntersects(l1, l2) {
            let l1x1 = l1.p1.x;
            let l1y1 = l1.p1.y;
            let l1x2 = l1.p2.x;
            let l1y2 = l1.p2.x;
            let l2x1 = l2.p1.x;
            let l2y1 = l2.p1.y;
            let l2x2 = l2.p2.x;
            let l2y2 = l2.p2.x;
            var det, gamma, lambda;
            det = (l1x2 - l1x1) * (l2y2 - l2y1) - (l2x2 - l2x1) * (l1y2 - l1y1);
            if (det === 0) {
                return false;
            }
            else {
                lambda = ((l2y2 - l2y1) * (l2x2 - l1x1) + (l2x1 - l2x2) * (l2y2 - l1y1)) / det;
                gamma = ((l1y1 - l1y2) * (l2x2 - l1x1) + (l1x2 - l1x1) * (l2y2 - l1y1)) / det;
                return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
            }
        }
        Drawing.lineSegmentIntersects = lineSegmentIntersects;
        ;
        function lineSegIntersectingPoint(l1, l2) {
            let x1 = l1.p1.x;
            let y1 = l1.p1.y;
            let x2 = l1.p2.x;
            let y2 = l1.p2.y;
            let x3 = l2.p1.x;
            let y3 = l2.p1.y;
            let x4 = l2.p2.x;
            let y4 = l2.p2.y;
            var ua, ub, denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
            if (denom == 0) {
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
        Drawing.lineSegIntersectingPoint = lineSegIntersectingPoint;
        function avgPoint(points) {
            let x1 = 0;
            let y1 = 0;
            points.forEach(pt => { x1 += pt.x, y1 += pt.y; });
            return new Point(x1 / points.length, y1 / points.length);
        }
        Drawing.avgPoint = avgPoint;
    })(Drawing || (Drawing = {}));
    class FlowArrow {
        constructor(from, to) {
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
            [line1, line2, line3].forEach(line => {
                line.style.stroke = 'red';
                line.style.strokeWidth = '2px';
                line.myhandler = this;
            });
            this.graphics = [line1, line2, line3, text];
            this._fromPoint = new Drawing.Point(0, 0);
            this._toPoint = new Drawing.Point(0, 0);
        }
        setPt(point, source) {
            if (source == this.fromBlock) {
                this._fromPoint.x = point.x;
                this._fromPoint.y = point.y;
            }
            else if (source == this.toBlock) {
                this._toPoint.x = point.x;
                this._toPoint.y = point.y;
            }
            this.render();
        }
        render() {
            let fromX = this._fromPoint.x;
            let fromY = this._fromPoint.y;
            let toX = this._toPoint.x;
            let toY = this._toPoint.y;
            let toDirectAngle = Math.atan2(fromY - toY, fromX - toX);
            this._render_draw_arrow(fromX, fromY, toX, toY, toDirectAngle);
            let text = this.text;
            let lineCenter = Drawing.avgPoint([this._fromPoint, this._toPoint]);
            let angleDeg = toDirectAngle / Math.PI * 180;
            if (angleDeg < -90)
                angleDeg += 180;
            else if (angleDeg > 90)
                angleDeg -= 180;
            text.style.transform = `translate(${lineCenter.x}px, ${lineCenter.y}px) rotate(${angleDeg}deg) translate(0,-5px)`;
        }
        _render_draw_arrow(fromX, fromY, toX, toY, toDirectAngle) {
            let line1 = this.line1;
            let line2 = this.line2;
            let line3 = this.line3;
            line1.x1.baseVal.value = fromX;
            line1.y1.baseVal.value = fromY;
            line1.x2.baseVal.value = toX;
            line1.y2.baseVal.value = toY;
            let x2 = 0, y2 = 0, x3 = 0, y3 = 0;
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
        getC2CLine() {
            return new Drawing.LineSeg(this.fromBlock.center, this.toBlock.center);
        }
        onSelect() {
            [this.line1, this.line2, this.line3].forEach(line => { line.style.stroke = 'blue'; });
        }
        onUnselect() {
            [this.line1, this.line2, this.line3].forEach(line => { line.style.stroke = 'black'; });
        }
        getPropertyList() {
            return [{
                    name: "Primary Text",
                    type: 'string',
                    onGet: () => { return this.text.textContent; },
                    onSet: (value) => { this.text.textContent = value; }
                }];
        }
    }
    UI.FlowArrow = FlowArrow;
    class FlowBlock {
        constructor() {
            let x = 0;
            let y = 0;
            let w = 120;
            let h = 120;
            this.origin = new Drawing.Point(x, y);
            this.size = new Drawing.Point(w, h);
            this.borders = this._getBorderLines();
            this.center = this._getCenter();
            this.arrows = [];
            this._props = [];
            let block = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            this.graphic = block;
            this._setGraphic();
        }
        _setGraphic() {
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
            [rect].forEach(ele => {
                let obj = ele;
                obj.myhandler = this;
            });
            this._props = [
                {
                    name: "Primary text",
                    type: 'string',
                    onGet: () => { return txt.textContent; },
                    onSet: (val) => { txt.textContent = val; }
                }
            ];
        }
        pointLiesInBlock(x, y) {
            let block = this;
            return x >= block.origin.x && y >= block.origin.y && x <= block.origin.x + block.size.x && y <= block.origin.y + block.size.y;
        }
        render() {
            this.borders = this._getBorderLines();
            this.center = this._getCenter();
            let block = this.graphic;
            if (block.transform.baseVal.numberOfItems == 0) {
                block.setAttribute('transform', `translate(${this.origin.x},${this.origin.y})`);
            }
            else {
                block.transform.baseVal.getItem(0).setTranslate(this.origin.x, this.origin.y);
            }
            this._renderArrows();
        }
        _getCenter() {
            return new Drawing.Point(this.origin.x + this.size.x / 2, this.origin.y + this.size.y / 2);
        }
        pointTo(block2) {
            let Arrow1 = new FlowArrow(this, block2);
            this.arrows.push(Arrow1);
            block2.arrows.push(Arrow1);
            this._renderArrows();
            block2._renderArrows();
            return Arrow1;
        }
        _renderArrows(sender = this) {
            if (this.arrows.length === 0)
                return;
            let { bottomBank, leftBank, rightBank, topBank } = this._getArrowBanks();
            let seperator = 20;
            let ptindex = [
                { x: this.origin.x },
                { x: this.origin.x + this.size.x },
                { y: this.origin.y },
                { y: this.origin.y + this.size.y },
            ];
            [leftBank, rightBank, topBank, bottomBank].forEach((bank, i) => {
                let halfLength = (bank.length - 1) * seperator / 2;
                let fpti = ptindex[i];
                let pti = 0;
                if (fpti.x)
                    //vertical
                    pti = this.origin.y + this.size.y / 2 - halfLength;
                else
                    //horizontal
                    pti = this.origin.x + this.size.x / 2 - halfLength;
                bank.forEach(iter => {
                    let dpt = new Drawing.Point(0, 0);
                    if (fpti.x) {
                        //vertical
                        dpt.x = fpti.x;
                        dpt.y = pti;
                    }
                    else if (fpti.y) {
                        //horizontal
                        dpt.y = fpti.y;
                        dpt.x = pti;
                    }
                    iter.Arrow.setPt(dpt, this);
                    if (sender === this) {
                        let otherBlock = iter.Arrow.fromBlock;
                        if (otherBlock === this)
                            otherBlock = iter.Arrow.toBlock;
                        otherBlock._renderArrows(this);
                    }
                    pti += seperator;
                });
            });
        }
        _getArrowBanks() {
            let leftBank = [];
            let rightBank = [];
            let topBank = [];
            let bottomBank = [];
            let indexedBanks = [topBank, rightBank, bottomBank, leftBank];
            // determine which side does the arrow
            this.arrows.forEach(arrow => {
                let lineC2C = arrow.getC2CLine();
                for (let i = 0; i < this.borders.length; i++) {
                    let borderLine = this.borders[i];
                    let pt = borderLine.getIntersectingPoint(lineC2C);
                    if (pt && pt.seg1 && pt.seg2) {
                        indexedBanks[i].push({
                            Arrow: arrow,
                            pt: pt.pt
                        });
                        break;
                    }
                }
            });
            //vertical sort
            [leftBank, rightBank].forEach(bank => {
                bank.sort((a, b) => {
                    if (a.pt.y < b.pt.y)
                        return -1;
                    if (a.pt.y > b.pt.y)
                        return 1;
                    return 0;
                });
            });
            //horizontal sort
            [topBank, bottomBank].forEach(bank => {
                bank.sort((a, b) => {
                    if (a.pt.x < b.pt.x)
                        return -1;
                    if (a.pt.x > b.pt.x)
                        return 1;
                    return 0;
                });
            });
            return { leftBank, topBank, rightBank, bottomBank };
        }
        _getBorderLines() {
            let ret = [];
            /**
             *  Ref rect
             *
             *   A---------B
             *   |         |
             *   D---------C
             */
            // line AB
            ret.push(new Drawing.LineSeg(new Drawing.Point(this.origin.x, this.origin.y), new Drawing.Point(this.origin.x + this.size.x, this.origin.y)));
            // line BC
            ret.push(new Drawing.LineSeg(new Drawing.Point(this.origin.x + this.size.x, this.origin.y), new Drawing.Point(this.origin.x + this.size.x, this.origin.y + this.size.y)));
            // line CD
            ret.push(new Drawing.LineSeg(new Drawing.Point(this.origin.x + this.size.x, this.origin.y + this.size.y), new Drawing.Point(this.origin.x, this.origin.y + this.size.y)));
            // line DA
            ret.push(new Drawing.LineSeg(new Drawing.Point(this.origin.x, this.origin.y + this.size.y), new Drawing.Point(this.origin.x, this.origin.y)));
            return ret;
        }
        onSelect() {
        }
        onUnselect() {
        }
        getPropertyList() { return this._props; }
        ;
    }
    UI.FlowBlock = FlowBlock;
    class FlowDiagram {
        constructor(arg) {
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
        createLayer(name, ind = -1) {
            let group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            this._map_namedLayer[name] = group;
            if (ind >= 0 && ind < this.rootSVG.children.length - 1) {
                this.rootSVG.children[ind].insertAdjacentElement("beforebegin", group);
            }
            else {
                this.rootSVG.appendChild(group);
            }
            return group;
        }
        attachBlockEvents() {
            this.rootSVG.onmousedown = e => {
                let eleInQuestion = e.target;
                if (eleInQuestion.myhandler) {
                    let handlerObject = eleInQuestion.myhandler;
                    if (handlerObject instanceof FlowBlock) {
                        if (this._mouseMode === MouseMode.moveBlock) {
                            mouseX = e.x;
                            mouseY = e.y;
                            let blk = handlerObject;
                            this.setSelection(blk);
                            selectedBlockX = blk.origin.x;
                            selectedBlockY = blk.origin.y;
                        }
                        else if (this._mouseMode === MouseMode.addArrows) {
                            let selBlock = handlerObject;
                            if (selectable === null) {
                                this.setSelection(selBlock);
                            }
                            else if (selBlock && selBlock != selectable && selectable instanceof FlowBlock) {
                                this.addArrow(selectable, selBlock);
                                this.setSelection(null);
                            }
                            else {
                                this.setSelection(selBlock);
                            }
                        }
                    }
                    if (handlerObject instanceof FlowArrow) {
                        this.setSelection(eleInQuestion.myhandler);
                    }
                }
                else {
                    this.setSelection(null);
                }
            };
            this.rootSVG.onmousemove = e => {
                if (this._mouseMode === MouseMode.moveBlock) {
                    if (e.buttons === 1 && e.button === 0 && selectable instanceof FlowBlock) {
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
                        if (selectable.origin.x != nx || selectable.origin.y != ny) {
                            selectable.origin.x = nx;
                            selectable.origin.y = ny;
                            selectable.render();
                        }
                    }
                }
                else if (this._mouseMode === MouseMode.addArrows) {
                }
            };
        }
        addArrow(fromBlock, toBlock) {
            let arrow = fromBlock.pointTo(toBlock);
            arrow.graphics.forEach(gEle => {
                this._layerWire.appendChild(gEle);
            });
            this._arrowsObjCol.push(arrow);
        }
        setSelection(newSel) {
            let prevSelected = selectable;
            selectable = newSel;
            if (selectable !== prevSelected) {
                prevSelected === null || prevSelected === void 0 ? void 0 : prevSelected.onUnselect();
                selectable === null || selectable === void 0 ? void 0 : selectable.onSelect();
                if (this._arg.propEditor) {
                    while (this._arg.propEditor.firstElementChild) {
                        this._arg.propEditor.removeChild(this._arg.propEditor.firstElementChild);
                    }
                    let props = selectable === null || selectable === void 0 ? void 0 : selectable.getPropertyList();
                    props === null || props === void 0 ? void 0 : props.forEach((prop, i) => {
                        var _a;
                        let div = document.createElement('div');
                        let label = document.createElement('label');
                        let inp = document.createElement('input');
                        let txt = document.createTextNode(prop.name);
                        if (i === 0) {
                            setTimeout(() => {
                                inp.focus();
                                inp.selectionStart = 0;
                                inp.selectionEnd = inp.value.length;
                            }, 100);
                        }
                        div.appendChild(label);
                        label.appendChild(txt);
                        label.appendChild(inp);
                        inp.onkeyup = () => {
                            prop.onSet(inp.value);
                        };
                        inp.value = prop.onGet();
                        (_a = this._arg.propEditor) === null || _a === void 0 ? void 0 : _a.appendChild(div);
                    });
                }
            }
        }
        setMode(mode) {
            this._mouseMode = mode;
            this.setSelection(null);
        }
        addBlock(block) {
            this._blocks.push(block);
            this._layerBlock.appendChild(block.graphic);
            block.render();
        }
    }
    UI.FlowDiagram = FlowDiagram;
})(UI || (UI = {}));
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
    btn_arrow.onclick = function () {
        fd.setMode(UI.MouseMode.addArrows);
    };
let btn_move = document.getElementById('btn_moveblock');
if (btn_move)
    btn_move.onclick = function () {
        fd.setMode(UI.MouseMode.moveBlock);
    };
let btn_add = document.getElementById('btn_addblock');
if (btn_add)
    btn_add.onclick = function () {
        fd.addBlock(new UI.FlowBlock());
    };
