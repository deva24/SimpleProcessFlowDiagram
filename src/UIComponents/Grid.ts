function reGrid(elem: HTMLElement, arg: { rows: number[], cols: number[], col_seperator: number, row_seperator: number })
{
    elem.style.display = 'grid';
    elem.style.gridTemplateRows = arg.rows.map(e =>
    {
        if (e >= 0)
            return e + 'px';
        else
            return 'auto';
    }).join(' ' + arg.row_seperator + 'px ');

    elem.style.gridTemplateColumns = arg.cols.map(e =>
    {
        if (e >= 0)
            return e + 'px';
        else
            return 'auto';
    }).join(' ' + arg.col_seperator + 'px ');


    for (var i = 0; i < elem.children.length; i++)
    {
        var elemtarget = elem.children[i];
        if (elemtarget instanceof HTMLElement)
        {
            var col: number | undefined = parseInt(elemtarget.getAttribute('col') as any);
            var row: number | undefined = parseInt(elemtarget.getAttribute('row') as any);

            if (isNaN(col)) col = undefined;
            if (isNaN(row)) row = undefined;

            //place the element in appropriate place
            if (col === undefined && row === undefined)
            {
                //hide the element if 
                elemtarget.style.display = 'none';
            }
            else
            {
                //set defaults
                if (col == undefined) col = 1;
                if (row == undefined) row = 1;

                //transform rows and columns
                col = (col - 1) * 2 + 1;
                row = (row - 1) * 2 + 1;

                elemtarget.style.gridRow = row.toString();
                elemtarget.style.gridColumn = col.toString();
            }
        }

    }

    //create horizontal seperators
    for (var j = 0; j < arg.cols.length; j++)
    {
        for (var i = 0; i < arg.rows.length - 1; i++)
        {
            var sep = document.createElement('div') as any;
            sep.className = 'seperator h-seperator';
            sep.style.gridRow = (2 * (i + 1)).toString();
            sep.style.gridColumn = (2 * j + 1).toString();
            sep.y = i;
            elem.appendChild(sep);
            _sep_event(sep);
        }
    }

    //create vertical seperators
    for (var j = 0; j < arg.rows.length; j++)
    {
        for (var i = 0; i < arg.cols.length - 1; i++)
        {
            var sep = document.createElement('div') as any;
            sep.className = 'seperator v-seperator';
            sep.style.gridRow = (2 * j + 1).toString();
            sep.style.gridColumn = (2 * (i + 1)).toString();
            sep.x = i;
            elem.appendChild(sep);
            _sep_event(sep);
        }
    }

    var doEval = false;
    var ensep: HTMLElement | null;
    var px: number;
    var py: number;
    var verticalSizes: any, horizontalSizes: any;
    function _sep_event(sep: HTMLElement)
    {
        sep.onmousedown = e =>
        {
            px = e.x;
            py = e.y;
            doEval = true;
            ensep = e.target as HTMLElement;
            var parentPanel = ensep.parentElement;
            if (parentPanel === null)
            {
                throw { message: "Unexpected null" };
            }
            verticalSizes = parentPanel.style.gridTemplateRows.split(" ");
            horizontalSizes = parentPanel.style.gridTemplateColumns.split(" ");
        }

        document.onmouseup = e =>
        {
            doEval = false;
            ensep = null;
        }

        document.onmousemove = e =>
        {
            if (doEval && e.buttons > 0)
            {

                var nx = e.x;
                var ny = e.y;

                var del_x = nx - px;
                var del_y = ny - py;

                if (ensep === null)
                    throw { message: "Unexpected error" };

                var parentPanel = ensep.parentElement;
                var target: any = ensep;

                if (parentPanel === null)
                    throw { message: "Unexpected error" };

                if (target.y !== undefined)
                {
                    var allSizes = [].concat(verticalSizes) as string[];
                    var prevSize = allSizes[target.y * 2] as string;
                    var nextSize = allSizes[target.y * 2 + 2];

                    if (prevSize != 'auto')
                    {
                        prevSize = parseInt(prevSize) + del_y + 'px';
                    }
                    if (nextSize != 'auto')
                    {
                        nextSize = parseInt(nextSize) - del_y + 'px';
                    }

                    allSizes.splice(target.y * 2, 1, prevSize);
                    allSizes.splice(target.y * 2 + 2, 1, nextSize);
                    parentPanel.style.gridTemplateRows = allSizes.join(" ");
                }
                if (target.x !== undefined)
                {
                    var allSizes = [].concat(horizontalSizes) as string[];
                    var prevSize = allSizes[target.x * 2];
                    var nextSize = allSizes[target.x * 2 + 2];

                    if (prevSize != 'auto')
                    {
                        prevSize = parseInt(prevSize) + del_x + 'px';
                    }
                    if (nextSize != 'auto')
                    {
                        nextSize = parseInt(nextSize) - del_x + 'px';
                    }

                    allSizes.splice(target.x * 2, 1, prevSize);
                    allSizes.splice(target.x * 2 + 2, 1, nextSize);
                    parentPanel.style.gridTemplateColumns = allSizes.join(" ");
                }

            }
        }
    }
}


export default reGrid;

// var tar = document.getElementById('tar');
// if (tar)
// {
//     reGrid(tar,
//         {
//             rows: [100, 100, 500],
//             cols: [100, -1],
//             col_seperator: 3,
//             row_seperator: 3
//         });
// }