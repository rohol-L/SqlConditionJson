import SJNode from "./SJNode.js"

class RelationNode extends SJNode {
    constructor(value) {
        super(value);
        this.Data = [];
    }

    ToSQL() {
        let Text = this.Text;
        if (this.Data.length == 0) {
            throw Error("Data 长度为0");
        }
        if (this.Data.length == 1) {
            if (Text == "not") {
                return `${Text}(${this.Data[0].ToSQL()})`;
            }
            if (Text == "and" || Text == "or") {
                return `${this.Data[0].ToSQL()}`;
            }
            return `${Text} ${this.Data[0].ToSQL()}`;
        }
        else {
            let builder = [];
            for (var item of this.Data) {
                let brackets = false;
                if (item instanceof RelationNode) {
                    for (var item2 of item.Data) {
                        if (item2 instanceof RelationNode) {
                            brackets = true;
                        }
                    }
                }
                if (brackets || item.Text == ",") {
                    builder.push(`(${item.ToSQL()})`);
                }
                else {
                    builder.push(item.ToSQL());
                }
            }
            if (Text == "not" && this.Data[0] instanceof RelationNode) {
                return `not(${builder.join(" and ")})`;
            }
            if (Text == "in") {
                let key = builder[0];
                builder.shift();
                return `${key} in(${builder.join(", ")})`;
            }
            let stringBuilder = "";
            let splitText = Text.length > 1 && Text.includes('/') ? Text.split('/') : [Text];
            stringBuilder += builder[0];
            for (let i = 1; i < builder.length; i++) {
                stringBuilder += ' ';
                stringBuilder += splitText[(i - 1) % splitText.length];
                stringBuilder += ' ';
                stringBuilder += builder[i];
            }
            return stringBuilder;
        }
    }
}

export default RelationNode;