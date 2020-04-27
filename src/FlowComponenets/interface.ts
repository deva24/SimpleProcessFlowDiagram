export namespace Interfaces
{
    export interface PropertyDescriptor
    {
        name: string;
        type: "string" | "number";

        onGet: () => any;
        onSet: (value: any) => void;
    }

    export interface Selectable
    {
        onSelect: Function;
        onUnselect: Function;

        getPropertyList: () => PropertyDescriptor[];
    }
}

export default Interfaces;