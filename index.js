"use strict";
var UI;
(function (UI) {
    var mouseX = 0;
    var mouseY = 0;
    var selectedBlockX = 0;
    var selectedBlockY = 0;
    var selectedBlock;
    var MouseMode;
    (function (MouseMode) {
        MouseMode[MouseMode["moveBlock"] = 0] = "moveBlock";
        MouseMode[MouseMode["addArrows"] = 1] = "addArrows";
    })(MouseMode = UI.MouseMode || (UI.MouseMode = {}));
    var Drawing;
    (function (Drawing) {
        var Point = /** @class */ (function () {
            function Point(x, y) {
                this.x = x;
                this.y = y;
            }
            return Point;
        }());
        Drawing.Point = Point;
        var LineSeg = /** @class */ (function () {
            function LineSeg(p1, p2) {
                this.p1 = p1;
                this.p2 = p2;
            }
            LineSeg.prototype.checkIntersects = function (l2) {
                return lineSegmentIntersects(this, l2);
            };
            LineSeg.prototype.getIntersectingPoint = function (l2) {
                return lineSegIntersectingPoint(this, l2);
            };
            return LineSeg;
        }());
        Drawing.LineSeg = LineSeg;
        function lineSegmentIntersects(l1, l2) {
            var l1x1 = l1.p1.x;
            var l1y1 = l1.p1.y;
            var l1x2 = l1.p2.x;
            var l1y2 = l1.p2.x;
            var l2x1 = l2.p1.x;
            var l2y1 = l2.p1.y;
            var l2x2 = l2.p2.x;
            var l2y2 = l2.p2.x;
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
            var x1 = l1.p1.x;
            var y1 = l1.p1.y;
            var x2 = l1.p2.x;
            var y2 = l1.p2.y;
            var x3 = l2.p1.x;
            var y3 = l2.p1.y;
            var x4 = l2.p2.x;
            var y4 = l2.p2.y;
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
    })(Drawing || (Drawing = {}));
    var FlowArrow = /** @class */ (function () {
        function FlowArrow(from, to) {
            this.fromBlock = from;
            this.toBlock = to;
            var line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            var line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            var line3 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            this.graphics = [line1, line2, line3];
            this.graphics.forEach(function (line) {
                line.style.stroke = 'red';
                line.style.strokeWidth = '2px';
            });
            this._fromPoint = new Drawing.Point(0, 0);
            this._toPoint = new Drawing.Point(0, 0);
        }
        FlowArrow.prototype.setPt = function (point, source) {
            if (source == this.fromBlock) {
                this._fromPoint.x = point.x;
                this._fromPoint.y = point.y;
            }
            else if (source == this.toBlock) {
                this._toPoint.x = point.x;
                this._toPoint.y = point.y;
            }
            this.render();
        };
        FlowArrow.prototype.render = function () {
            var fromX = this._fromPoint.x;
            var fromY = this._fromPoint.y;
            var toX = this._toPoint.x;
            var toY = this._toPoint.y;
            var toDirectAngle = Math.atan2(fromY - toY, fromX - toX);
            var line1 = this.graphics[0];
            var line2 = this.graphics[1];
            var line3 = this.graphics[2];
            line1.x1.baseVal.value = fromX;
            line1.y1.baseVal.value = fromY;
            line1.x2.baseVal.value = toX;
            line1.y2.baseVal.value = toY;
            var x2 = 0, y2 = 0, x3 = 0, y3 = 0;
            var delAngle = 30 / 180 * Math.PI;
            x2 = Math.cos(toDirectAngle - delAngle) * 5;
            y2 = Math.sin(toDirectAngle - delAngle) * 5;
            x3 = Math.cos(toDirectAngle + delAngle) * 5;
            y3 = Math.sin(toDirectAngle + delAngle) * 5;
            line2.x1.baseVal.value = x2 + toX;
            line2.y1.baseVal.value = y2 + toY;
            line2.x2.baseVal.value = toX;
            line2.y2.baseVal.value = toY;
            line3.x1.baseVal.value = x3 + toX;
            line3.y1.baseVal.value = y3 + toY;
            line3.x2.baseVal.value = toX;
            line3.y2.baseVal.value = toY;
        };
        FlowArrow.prototype.getC2CLine = function () {
            return new Drawing.LineSeg(this.fromBlock.center, this.toBlock.center);
        };
        return FlowArrow;
    }());
    UI.FlowArrow = FlowArrow;
    var FlowBlock = /** @class */ (function () {
        function FlowBlock(x, y, w, h, graphic) {
            this.origin = new Drawing.Point(x, y);
            this.size = new Drawing.Point(w, h);
            this.borders = this._getBorderLines();
            this.center = this._getCenter();
            this.arrows = [];
            this.graphic = graphic;
        }
        FlowBlock.prototype.pointLiesInBlock = function (x, y) {
            var block = this;
            return x >= block.origin.x && y >= block.origin.y && x <= block.origin.x + block.size.x && y <= block.origin.y + block.size.y;
        };
        FlowBlock.prototype.render = function () {
            this.borders = this._getBorderLines();
            this.center = this._getCenter();
            var block = this.graphic;
            if (block.transform.baseVal.numberOfItems == 0) {
                block.setAttribute('transform', "translate(" + this.origin.x + "," + this.origin.y + ")");
            }
            else {
                block.transform.baseVal.getItem(0).setTranslate(this.origin.x, this.origin.y);
            }
            this._renderArrows();
        };
        FlowBlock.prototype._getCenter = function () {
            return new Drawing.Point(this.origin.x + this.size.x / 2, this.origin.y + this.size.y / 2);
        };
        FlowBlock.prototype.pointTo = function (block2) {
            var Arrow1 = new FlowArrow(this, block2);
            this.arrows.push(Arrow1);
            block2.arrows.push(Arrow1);
            this._renderArrows();
            block2._renderArrows();
            return Arrow1;
        };
        FlowBlock.prototype._renderArrows = function () {
            var _this = this;
            if (this.arrows.length === 0)
                return;
            var _a = this._getArrowBanks(), bottomBank = _a.bottomBank, leftBank = _a.leftBank, rightBank = _a.rightBank, topBank = _a.topBank;
            var seperator = 20;
            var ptindex = [
                { x: this.origin.x },
                { x: this.origin.x + this.size.x },
                { y: this.origin.y },
                { y: this.origin.y + this.size.y },
            ];
            [leftBank, rightBank, topBank, bottomBank].forEach(function (bank, i) {
                var halfLength = (bank.length - 1) * seperator / 2;
                var fpti = ptindex[i];
                var pti = 0;
                if (fpti.x)
                    //vertical
                    pti = _this.origin.y + _this.size.y / 2 - halfLength;
                else
                    //horizontal
                    pti = _this.origin.x + _this.size.x / 2 - halfLength;
                bank.forEach(function (iter) {
                    var dpt = new Drawing.Point(0, 0);
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
                    iter.Arrow.setPt(dpt, _this);
                    pti += seperator;
                });
            });
        };
        FlowBlock.prototype._getArrowBanks = function () {
            var _this = this;
            var leftBank = [];
            var rightBank = [];
            var topBank = [];
            var bottomBank = [];
            var indexedBanks = [topBank, rightBank, bottomBank, leftBank];
            // determine which side does the arrow
            this.arrows.forEach(function (arrow) {
                var lineC2C = arrow.getC2CLine();
                for (var i = 0; i < _this.borders.length; i++) {
                    var borderLine = _this.borders[i];
                    var pt = borderLine.getIntersectingPoint(lineC2C);
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
            [leftBank, rightBank].forEach(function (bank) {
                bank.sort(function (a, b) {
                    if (a.pt.y < b.pt.y)
                        return -1;
                    if (a.pt.y > b.pt.y)
                        return 1;
                    return 0;
                });
            });
            //horizontal sort
            [leftBank, rightBank].forEach(function (bank) {
                bank.sort(function (a, b) {
                    if (a.pt.x < b.pt.x)
                        return -1;
                    if (a.pt.x > b.pt.x)
                        return 1;
                    return 0;
                });
            });
            return { leftBank: leftBank, topBank: topBank, rightBank: rightBank, bottomBank: bottomBank };
        };
        FlowBlock.prototype._getBorderLines = function () {
            var ret = [];
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
        };
        return FlowBlock;
    }());
    UI.FlowBlock = FlowBlock;
    var FlowDiagram = /** @class */ (function () {
        function FlowDiagram(arg) {
            this.rootSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            if (arg.targetElement)
                arg.targetElement.appendChild(this.rootSVG);
            this.rootSVG.setAttribute('width', arg.width + 'px');
            this.rootSVG.setAttribute('height', arg.height + 'px');
            this._map_namedLayer = {};
            this._blocks = [];
            this._arrowsObjCol = [];
            this.createLayer('background');
            this._layerBlock = this.createLayer('layerBlock');
            this._layerWire = this.createLayer('layerWire');
            this._mouseMode = MouseMode.moveBlock;
            this.attachBlockEvents();
        }
        FlowDiagram.prototype.createLayer = function (name, ind) {
            if (ind === void 0) { ind = -1; }
            var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            this._map_namedLayer[name] = group;
            if (ind >= 0 && ind < this.rootSVG.children.length - 1) {
                this.rootSVG.children[ind].insertAdjacentElement("beforebegin", group);
            }
            else {
                this.rootSVG.appendChild(group);
            }
            return group;
        };
        FlowDiagram.prototype.addBlock = function (block) {
            this._blocks.push(block);
            this._layerBlock.appendChild(block.graphic);
            block.render();
        };
        FlowDiagram.prototype.attachBlockEvents = function () {
            var _this = this;
            this.rootSVG.onmousedown = function (e) {
                if (_this._mouseMode === MouseMode.moveBlock) {
                    mouseX = e.x;
                    mouseY = e.y;
                    selectedBlock = null;
                    _this._blocks.forEach(function (blk) {
                        if (blk.pointLiesInBlock(mouseX, mouseY)) {
                            selectedBlock = blk;
                            selectedBlockX = blk.origin.x;
                            selectedBlockY = blk.origin.y;
                        }
                    });
                }
                else if (_this._mouseMode === MouseMode.addArrows) {
                    var selBlock_1 = null;
                    _this._blocks.forEach(function (blk) {
                        if (blk.pointLiesInBlock(e.x, e.y)) {
                            selBlock_1 = blk;
                        }
                    });
                    if (selectedBlock === null) {
                        selectedBlock = selBlock_1;
                    }
                    else if (selBlock_1 && selBlock_1 != selectedBlock) {
                        _this.addArrow(selectedBlock, selBlock_1);
                        selectedBlock = null;
                    }
                    else {
                        selectedBlock = selBlock_1;
                    }
                }
            };
            this.rootSVG.onmousemove = function (e) {
                if (_this._mouseMode === MouseMode.moveBlock) {
                    if (e.buttons === 1 && e.button === 0 && selectedBlock) {
                        var dx = e.x - mouseX;
                        var dy = e.y - mouseY;
                        selectedBlock.origin.x = selectedBlockX + dx;
                        selectedBlock.origin.y = selectedBlockY + dy;
                        selectedBlock.render();
                    }
                }
                else if (_this._mouseMode === MouseMode.addArrows) {
                }
            };
        };
        FlowDiagram.prototype.addArrow = function (fromBlock, toBlock) {
            var _this = this;
            var arrow = fromBlock.pointTo(toBlock);
            arrow.graphics.forEach(function (gEle) {
                _this._layerWire.appendChild(gEle);
            });
            this._arrowsObjCol.push(arrow);
        };
        return FlowDiagram;
    }());
    UI.FlowDiagram = FlowDiagram;
})(UI || (UI = {}));
var fd = new UI.FlowDiagram({
    width: 1000,
    height: 1000,
    targetElement: document.getElementById('target')
});
fd.rootSVG.style.border = '1px solid black';
var button1 = document.getElementById('sw');
if (button1) {
    button1.onclick = function () {
        if (fd._mouseMode != UI.MouseMode.addArrows) {
            fd._mouseMode = UI.MouseMode.addArrows;
        }
        else {
            fd._mouseMode = UI.MouseMode.moveBlock;
        }
    };
}
function getBlock(color) {
    if (color === void 0) { color = 'red'; }
    var block = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    block.appendChild(rect);
    rect.width.baseVal.value = 100;
    rect.height.baseVal.value = 100;
    rect.style.fill = color;
    rect.style.stroke = 'black';
    rect.style.strokeWidth = '1';
    rect.x.baseVal.value = 10;
    rect.y.baseVal.value = 10;
    return new UI.FlowBlock(0, 0, 120, 120, block);
}
fd.addBlock(getBlock());
fd.addBlock(getBlock('yellow'));
