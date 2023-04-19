import SJNode from "./SJNode.js"

class ValueNode extends SJNode {
    static NullNode = new ValueNode('null')

    constructor(value) {
        super(value);
    }
}

export default ValueNode;