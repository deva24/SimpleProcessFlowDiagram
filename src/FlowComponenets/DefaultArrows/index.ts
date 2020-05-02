import FlowBlock from '../DefaultBlocks';
import DrawingUtils from '../../Utils/drawing';
import Interfaces from '../interface';

class FlowArrow implements Interfaces.Selectable
{
    fromBlock: FlowBlock;
    toBlock: FlowBlock;
    graphics: any[];
    
    private _fromPoint: DrawingUtils.Point;
    private _toPoint: DrawingUtils.Point;

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
        this._fromPoint = new DrawingUtils.Point(0, 0);
    this._toPoint = new DrawingUtils.Point(0, 0);
    }

    setPt(point: DrawingUtils.Point, source: FlowBlock)
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
        let lineCenter = DrawingUtils.avgPoint([this._fromPoint, this._toPoint]);

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
        return new DrawingUtils.LineSeg(this.fromBlock.center, this.toBlock.center);
    }

    onSelect()
    {
        [this.line1, this.line2, this.line3].forEach(line => { line.style.stroke = 'blue'; });
    }

    onUnselect()
    {
        [this.line1, this.line2, this.line3].forEach(line => { line.style.stroke = 'black'; });
    }

    getPropertyList(): Interfaces.PropertyDescriptor[]
    {
        return [{
            name: "Primary Text",
            type: 'string',
            onGet: () => { return this.text.textContent },
            onSet: (value: any) => { this.text.textContent = value }
        }];
    }

    getSaveObj()
    {
        let ret = {
            source:this.fromBlock.id,
            target:this.toBlock.id
        } as any;

        let props = this.getPropertyList().map(prop => ({ key: prop.name, value: prop.onGet() })).filter(prop => { return typeof prop.value === 'string' && prop.value.trim() !== '' })
        if (props.length > 0)
            ret.props = props;

            return ret;
    }

    setSaveObj(val:any)
    {
        if (val.props)
        {
            let propIDMap : {[key:string]:Interfaces.PropertyDescriptor} = {}

            this.getPropertyList().forEach(prop=>{
                propIDMap[prop.name] = prop;
            });

            val.props.forEach((prop:{key:string,value:string}) =>
            {
                propIDMap[prop.key].onSet(prop.value);
            });
        }
    }
}

export default FlowArrow