import FuncNode from "./FuncNode.js"

class DynamicFuncNode extends FuncNode {
    constructor(text, toString) {
        super(text);
        this.toString = toString;
    }

    ToSQL() {
        return this.toString(super.Param);
    }
}

export default DynamicFuncNode;