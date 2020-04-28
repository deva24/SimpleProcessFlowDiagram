import DrawingUtils from '../../Utils/drawing';
import FlowArrow from '../DefaultArrows';
import Int from '../interface';


class FlowBlock implements Int.Selectable
{
    origin: DrawingUtils.Point;
    size: DrawingUtils.Point;

    arrows: FlowArrow[];
    graphic: SVGGElement;

    borders: DrawingUtils.LineSeg[];
    center: DrawingUtils.Point;

    private _props: Int.PropertyDescriptor[];
    private _rect : SVGRectElement;

    constructor()
    {
        let x: number = 0;
        let y: number = 0;
        let w: number = 120;
        let h: number = 120;

        this.origin = new DrawingUtils.Point(x, y);
        this.size = new DrawingUtils.Point(w, h);

        this.borders = this._getBorderLines();
        this.center = this._getCenter();

        this.arrows = [];
        this._props = [];

        let block = document.createElementNS('http://www.w3.org/2000/svg', 'g') as SVGGElement;
        this.graphic = block;
        let rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        this._rect = rect;
        this._setGraphic();
    }
    
    private _setGraphic()
    {
        let block = this.graphic;
        
        let rect = this._rect;
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

    private _getCenter()
    {
        return new DrawingUtils.Point(this.origin.x + this.size.x / 2, this.origin.y + this.size.y / 2);
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
                let dpt = new DrawingUtils.Point(0, 0);

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
        let leftBank: { Arrow: FlowArrow, pt: DrawingUtils.Point }[] = [];
        let rightBank: { Arrow: FlowArrow, pt: DrawingUtils.Point }[] = [];
        let topBank: { Arrow: FlowArrow, pt: DrawingUtils.Point }[] = [];
        let bottomBank: { Arrow: FlowArrow, pt: DrawingUtils.Point }[] = [];

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

    private _getBorderLines(): DrawingUtils.LineSeg[]
    {
        let ret: DrawingUtils.LineSeg[] = [];

        /**
         *  Ref rect
         * 
         *   A---------B
         *   |         |
         *   D---------C
         */

        // line AB
        ret.push(new DrawingUtils.LineSeg(
            new DrawingUtils.Point(this.origin.x, this.origin.y),
            new DrawingUtils.Point(this.origin.x + this.size.x, this.origin.y))
        );

        // line BC
        ret.push(new DrawingUtils.LineSeg(
            new DrawingUtils.Point(this.origin.x + this.size.x, this.origin.y),
            new DrawingUtils.Point(this.origin.x + this.size.x, this.origin.y + this.size.y))
        );

        // line CD
        ret.push(new DrawingUtils.LineSeg(
            new DrawingUtils.Point(this.origin.x + this.size.x, this.origin.y + this.size.y),
            new DrawingUtils.Point(this.origin.x, this.origin.y + this.size.y))
        );

        // line DA
        ret.push(new DrawingUtils.LineSeg(
            new DrawingUtils.Point(this.origin.x, this.origin.y + this.size.y),
            new DrawingUtils.Point(this.origin.x, this.origin.y))
        );

        return ret;
    }

    blockInRect(x1: number, y1: number, width: number, height: number)
    {
        let x = this.center.x;
        let y = this.center.y;
        return x >= x1 && y >= y1 && x <= x1 + width && y <= y1 + height;
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

    onSelect()
    {
        this._rect.style.stroke='blue';
    }

    onUnselect()
    {
        this._rect.style.stroke='black';
    }

    getPropertyList() { return this._props };
}

export default FlowBlock