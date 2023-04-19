import RelationNode from "./RelationNode.js"
import ValueNode from "./ValueNode.js"
import FuncNode from "./FuncNode.js"
import DynamicFuncNode from "./DynamicFuncNode.js"

class SJNodeParser {
    constructor(config) {
        this.config = config;
    }

    parse(token) {
        return this.#ParseToken(token, null);
    }

    static parseJson2Sql(json, config) {
        let parser = new SJNodeParser(config)
        let result = parser.parse(json);
        return result.ToSQL();
    }

    #ParseToken(token, overrideNode) {
        if (Array.isArray(token)) {
            if (overrideNode == null) {
                throw Error("暂未支持的格式:" + token);
            }
            let node = new RelationNode("in");
            node.Data.push(overrideNode);
            let node2 = new RelationNode(",")
            node2.Data = this.#ParseArray(token, null);
            node.Data.push(node2);
            return node;
        }
        if (typeof (token) === 'object') {
            return this.#ParseObject(token, overrideNode);
        }

        let node;
        if (token == null) {
            node = ValueNode.NullNode;
        }
        else if (typeof (token) === 'string') {
            node = this.#ParseString(token, overrideNode != null);//有覆盖节点说明没有关系节点
        }
        else if (typeof (token) === 'boolean') {
            let convertValue;
            if (this.config.BoolToExpression) {
                convertValue = token ? "(1=1)" : "(1=2)";
            }
            if (this.config.BoolToNumber) {
                convertValue = token ? "1" : "0";
            }
            else {
                convertValue = token ? "true" : "false";
            }
            node = new ValueNode(convertValue);
        }
        else {
            node = new ValueNode(token.toString());
        }
        return this.#WrapOverrideNode(node, overrideNode);
    }

    #ParseObject(obj, overrideNode) {
        if (Object.keys(obj).length == 1) {
            var pair = Object.entries(obj)[0];
            return this.#ParseKeyValuePair(pair[0], pair[1], overrideNode);
        }
        else {
            var node = new RelationNode("and");
            node.Data = this.#ParseArray(obj, overrideNode);
            return node;
        }
    }

    #ParseKeyValuePair(key, value, overrideNode) {
        let node = this.#ParseString(key, overrideNode != null);//有覆盖节点说明没有关系节点
        if (value == null) {
            throw Error(`暂未支持Key:${key} value:${value}`);
        }
        if (node instanceof RelationNode) {
            node.Data = this.#ParseArray(value, null);
            return this.#WrapOverrideNode(node, overrideNode);
        }
        if (node instanceof FuncNode) {
            node.Param = this.#ParseArray(value, null);
            return this.#WrapOverrideNode(node, overrideNode);
        }
        if (node instanceof ValueNode) {
            var valueNode = this.#ParseToken(value, node);
            //连续出现值节点时自动加上=节点
            if (overrideNode != null) {
                var rNode = new RelationNode("=");
                rNode.Data.push(overrideNode);
                rNode.Data.push(valueNode);
                valueNode = rNode;
            }
            return valueNode;
        }
        throw Error(`暂未支持Key:${key} value:${value}`);
    }

    #ParseArray(token, overrideNode) {
        var arrayNode = [];
        if (Array.isArray(token)) {
            for (let item of token) {
                arrayNode.push(this.#ParseToken(item, overrideNode));
            }
        }
        else if (typeof (token) === 'object') {
            for (let key in token) {
                arrayNode.push(this.#ParseKeyValuePair(key, token[key], overrideNode));
            }
        }
        else {
            arrayNode.push(this.#ParseToken(token, overrideNode));
        }
        return arrayNode;
    }

    #ParseString(value, quickConvert) {
        if (value == null) {
            return ValueNode.NullNode;
        }
        if (value.length == 0) {
            return new ValueNode("\"\"");
        }
        if (this.config.RelationSigns.includes(value)) {
            return new RelationNode(value);
        }
        if (quickConvert) {
            for (var sign of this.config.RelationSigns) {
                //支持 >=1 之类的字符串
                if (value.indexOf(sign) == 0) {
                    var node = new RelationNode(sign);
                    node.Data.push(this.#ParseString(value.substring(sign.length)));
                    return node;
                }
            }
        }
        if (value.substring(0, 2) == "$=") {
            return new ValueNode(value.substring(2));
        }
        switch (value[0]) {
            case '@':
                return this.#ParseRelationNode(value.substring(1));
            case '&':
                return this.#ParseFunctionNode(value.substring(1));
            case '#':
                return new ValueNode(this.config.ColumnBoundarySymbol1 + value.substring(1) + this.config.ColumnBoundarySymbol2);
            default:
                return new ValueNode(`'${value}'`);
        }

    }

    #WrapOverrideNode(node, overrideNode) {
        if (overrideNode == null) {
            return node;
        }
        if (node instanceof RelationNode) {
            node.Data.unshift(overrideNode);
            return node;
        }
        var rNode = new RelationNode("=");
        if (node instanceof ValueNode && node.Text.toLowerCase() == "null") {
            rNode.Text = "is";
        }
        rNode.Data.push(overrideNode);
        rNode.Data.push(node);
        return rNode;
    }

    #ParseRelationNode(value) {
        let lowerValue = value.toLowerCase();
        switch (lowerValue) {
            case "eq":
                value = "=";
                break;
            case "ne":
                value = this.config.NotEqualSymbol;
                break;
            case "concat":
                if (this.config.ConcatSymbol == null) {
                    return new FuncNode(this.config.ConcatFunctionName);
                }
                value = this.config.ConcatSymbol;
                break;
            default:
                break;
        }
        return new RelationNode(value);
    }

    #ParseFunctionNode(value) {
        let lowerValue = value.toLowerCase();
        switch (lowerValue) {
            case "current_time":
                value = this.config.CurrentTimeExpression;
                return new DynamicFuncNode(value, _ => value);
            case "ifnull":
                if (this.config.IfNullFuncName == null) {
                    return new DynamicFuncNode(value, param => {
                        if (param.length < 2) {
                            throw Error("ifnull 需要至少2个参数");
                        }
                        var sb = "case";
                        for (let i = 0; i < param.length - 1; i++) {
                            var item = param[i];
                            sb += " when ";
                            sb += item.ToSQL();
                            sb += " is not null then ";
                            sb += item.ToSQL();
                        }
                        sb += " else ";
                        sb += param[param.length - 1].ToSQL();
                        sb += " end";
                        return sb;
                    });
                }
                value = this.config.IfNullFuncName;
                break;
            case "if":
                if (!this.config.EnableIfFunction) {
                    return new DynamicFuncNode(value, param => {
                        var sb = "case when ";
                        sb += param[0].ToSQL();
                        sb += " then ";
                        sb += param[1].ToSQL();
                        sb += " else ";
                        sb += param[2].ToSQL();
                        sb += " end";
                        return sb;
                    });
                }
                break;
            default:
                break;
        }
        return new FuncNode(value);
    }
}

export default SJNodeParser;