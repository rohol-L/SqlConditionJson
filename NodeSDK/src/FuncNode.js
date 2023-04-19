import SJNode from "./SJNode.js"

class FuncNode extends SJNode {
    constructor(value) {
        super(value);
        this.Param = [];
    }

    ToSQL() {
        let builder = [];
        for (var item of this.Param) {
            builder.push(item.ToSQL());
        }
        return `${super.getText()}(${builder.join(", ")})`;
    }
}

export default FuncNode;