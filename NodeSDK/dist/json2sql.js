var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// src/SJNode.js
var SJNode = class {
  constructor(text) {
    this.Text = text;
  }
  ToString() {
    return this.Text;
  }
  ToSQL() {
    return this.Text;
  }
};
var SJNode_default = SJNode;

// src/RelationNode.js
var RelationNode = class extends SJNode_default {
  constructor(value) {
    super(value);
    this.Data = [];
  }
  ToSQL() {
    let Text = this.Text;
    if (this.Data.length == 0) {
      throw Error("Data \u957F\u5EA6\u4E3A0");
    }
    if (this.Data.length == 1) {
      if (Text == "not") {
        return `${Text}(${this.Data[0].ToSQL()})`;
      }
      if (Text == "and" || Text == "or") {
        return `${this.Data[0].ToSQL()}`;
      }
      return `${Text} ${this.Data[0].ToSQL()}`;
    } else {
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
        } else {
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
      let splitText = Text.length > 1 && Text.includes("/") ? Text.split("/") : [Text];
      stringBuilder += builder[0];
      for (let i = 1; i < builder.length; i++) {
        stringBuilder += " ";
        stringBuilder += splitText[(i - 1) % splitText.length];
        stringBuilder += " ";
        stringBuilder += builder[i];
      }
      return stringBuilder;
    }
  }
};
var RelationNode_default = RelationNode;

// src/ValueNode.js
var _ValueNode = class extends SJNode_default {
  constructor(value) {
    super(value);
  }
};
var ValueNode = _ValueNode;
__publicField(ValueNode, "NullNode", new _ValueNode("null"));
var ValueNode_default = ValueNode;

// src/FuncNode.js
var FuncNode = class extends SJNode_default {
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
};
var FuncNode_default = FuncNode;

// src/DynamicFuncNode.js
var DynamicFuncNode = class extends FuncNode_default {
  constructor(text, toString) {
    super(text);
    this.toString = toString;
  }
  ToSQL() {
    return this.toString(super.Param);
  }
};
var DynamicFuncNode_default = DynamicFuncNode;

// src/SJNodeParser.js
var SJNodeParser = class {
  constructor(config) {
    this.config = config;
  }
  parse(token) {
    return this.#ParseToken(token, null);
  }
  static parseJson2Sql(json, config) {
    let parser = new SJNodeParser(config);
    let result = parser.parse(json);
    return result.ToSQL();
  }
  #ParseToken(token, overrideNode) {
    if (Array.isArray(token)) {
      if (overrideNode == null) {
        throw Error("\u6682\u672A\u652F\u6301\u7684\u683C\u5F0F:" + token);
      }
      let node2 = new RelationNode_default("in");
      node2.Data.push(overrideNode);
      let node22 = new RelationNode_default(",");
      node22.Data = this.#ParseArray(token, null);
      node2.Data.push(node22);
      return node2;
    }
    if (typeof token === "object") {
      return this.#ParseObject(token, overrideNode);
    }
    let node;
    if (token == null) {
      node = ValueNode_default.NullNode;
    } else if (typeof token === "string") {
      node = this.#ParseString(token, overrideNode != null);
    } else if (typeof token === "boolean") {
      let convertValue;
      if (this.config.BoolToExpression) {
        convertValue = token ? "(1=1)" : "(1=2)";
      }
      if (this.config.BoolToNumber) {
        convertValue = token ? "1" : "0";
      } else {
        convertValue = token ? "true" : "false";
      }
      node = new ValueNode_default(convertValue);
    } else {
      node = new ValueNode_default(token.toString());
    }
    return this.#WrapOverrideNode(node, overrideNode);
  }
  #ParseObject(obj, overrideNode) {
    if (Object.keys(obj).length == 1) {
      var pair = Object.entries(obj)[0];
      return this.#ParseKeyValuePair(pair[0], pair[1], overrideNode);
    } else {
      var node = new RelationNode_default("and");
      node.Data = this.#ParseArray(obj, overrideNode);
      return node;
    }
  }
  #ParseKeyValuePair(key, value, overrideNode) {
    let node = this.#ParseString(key, overrideNode != null);
    if (value == null) {
      throw Error(`\u6682\u672A\u652F\u6301Key:${key} value:${value}`);
    }
    if (node instanceof RelationNode_default) {
      node.Data = this.#ParseArray(value, null);
      return this.#WrapOverrideNode(node, overrideNode);
    }
    if (node instanceof FuncNode_default) {
      node.Param = this.#ParseArray(value, null);
      return this.#WrapOverrideNode(node, overrideNode);
    }
    if (node instanceof ValueNode_default) {
      var valueNode = this.#ParseToken(value, node);
      if (overrideNode != null) {
        var rNode = new RelationNode_default("=");
        rNode.Data.push(overrideNode);
        rNode.Data.push(valueNode);
        valueNode = rNode;
      }
      return valueNode;
    }
    throw Error(`\u6682\u672A\u652F\u6301Key:${key} value:${value}`);
  }
  #ParseArray(token, overrideNode) {
    var arrayNode = [];
    if (Array.isArray(token)) {
      for (let item of token) {
        arrayNode.push(this.#ParseToken(item, overrideNode));
      }
    } else if (typeof token === "object") {
      for (let key in token) {
        arrayNode.push(this.#ParseKeyValuePair(key, token[key], overrideNode));
      }
    } else {
      arrayNode.push(this.#ParseToken(token, overrideNode));
    }
    return arrayNode;
  }
  #ParseString(value, quickConvert) {
    if (value == null) {
      return ValueNode_default.NullNode;
    }
    if (value.length == 0) {
      return new ValueNode_default('""');
    }
    if (this.config.RelationSigns.includes(value)) {
      return new RelationNode_default(value);
    }
    if (quickConvert) {
      for (var sign of this.config.RelationSigns) {
        if (value.indexOf(sign) == 0) {
          var node = new RelationNode_default(sign);
          node.Data.push(this.#ParseString(value.substring(sign.length)));
          return node;
        }
      }
    }
    if (value.substring(0, 2) == "$=") {
      return new ValueNode_default(value.substring(2));
    }
    switch (value[0]) {
      case "@":
        return this.#ParseRelationNode(value.substring(1));
      case "&":
        return this.#ParseFunctionNode(value.substring(1));
      case "#":
        return new ValueNode_default(this.config.ColumnBoundarySymbol1 + value.substring(1) + this.config.ColumnBoundarySymbol2);
      default:
        return new ValueNode_default(`'${value}'`);
    }
  }
  #WrapOverrideNode(node, overrideNode) {
    if (overrideNode == null) {
      return node;
    }
    if (node instanceof RelationNode_default) {
      node.Data.unshift(overrideNode);
      return node;
    }
    var rNode = new RelationNode_default("=");
    if (node instanceof ValueNode_default && node.Text.toLowerCase() == "null") {
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
          return new FuncNode_default(this.config.ConcatFunctionName);
        }
        value = this.config.ConcatSymbol;
        break;
      default:
        break;
    }
    return new RelationNode_default(value);
  }
  #ParseFunctionNode(value) {
    let lowerValue = value.toLowerCase();
    switch (lowerValue) {
      case "current_time":
        value = this.config.CurrentTimeExpression;
        return new DynamicFuncNode_default(value, (_) => value);
      case "ifnull":
        if (this.config.IfNullFuncName == null) {
          return new DynamicFuncNode_default(value, (param) => {
            if (param.length < 2) {
              throw Error("ifnull \u9700\u8981\u81F3\u5C112\u4E2A\u53C2\u6570");
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
          return new DynamicFuncNode_default(value, (param) => {
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
    return new FuncNode_default(value);
  }
};
var SJNodeParser_default = SJNodeParser;

// src/ParserConfig.js
var ParserConfig = class {
  constructor() {
    this.RelationSigns = [">", ">=", "=", "<>", "!=", "<=", "<", "+", "-", "*", "/", "||"];
    this.ColumnBoundarySymbol1 = '"';
    this.ColumnBoundarySymbol2 = '"';
    this.NotEqualSymbol = "<>";
    this.ConcatFunctionName = "CONCAT";
    this.CurrentTimeExpression = "now()";
    this.IfNullFuncName = "ifnull";
    this.ConcatSymbol = null;
    this.BoolToNumber = false;
    this.BoolToExpression = false;
    this.IgnoreConvertTypeRelationNode = true;
    this.EnableIfFunction = true;
  }
  static getSqlServerConfig() {
    let config = new ParserConfig();
    config.ColumnBoundarySymbol1 = '"';
    config.ColumnBoundarySymbol2 = '"';
    config.NotEqualSymbol = "<>";
    config.ConcatSymbol = "+";
    config.BoolToExpression = true;
    config.CurrentTimeExpression = "GETDATE()";
    config.IfNullFuncName = "isnull";
    config.EnableIfFunction = false;
    return config;
  }
  static getMysqlConfig() {
    let config = new ParserConfig();
    config.ColumnBoundarySymbol1 = "`";
    config.ColumnBoundarySymbol2 = "`";
    config.NotEqualSymbol = "!=";
    config.ConcatFunctionName = "CONCAT";
    config.BoolToNumber = false;
    config.CurrentTimeExpression = "now()";
    config.IfNullFuncName = "ifnull";
    config.EnableIfFunction = true;
    return config;
  }
  static getOracleConfig() {
    let config = new ParserConfig();
    config.ColumnBoundarySymbol1 = "";
    config.ColumnBoundarySymbol2 = "";
    config.NotEqualSymbol = "!=";
    config.ConcatSymbol = "||";
    config.BoolToExpression = true;
    config.CurrentTimeExpression = "sysdate";
    config.IfNullFuncName = "nvl";
    config.EnableIfFunction = false;
    return config;
  }
  static getPostgreSqlConfig() {
    let config = new ParserConfig();
    config.ColumnBoundarySymbol1 = '"';
    config.ColumnBoundarySymbol2 = '"';
    config.NotEqualSymbol = "!=";
    config.ConcatSymbol = "+";
    config.BoolToNumber = false;
    config.CurrentTimeExpression = "current_timestamp";
    config.IfNullFuncName = "COALESCE";
    config.EnableIfFunction = true;
    return config;
  }
  static getHiveConfig() {
    let config = new ParserConfig();
    config.ColumnBoundarySymbol1 = "`";
    config.ColumnBoundarySymbol2 = "`";
    config.NotEqualSymbol = "!=";
    config.ConcatFunctionName = "CONCAT";
    config.BoolToNumber = false;
    config.CurrentTimeExpression = "from_unixtime(unix_timestamp(),'yyyy-MM-dd HH:mm:ss')";
    config.IfNullFuncName = null;
    config.EnableIfFunction = true;
    return config;
  }
  static getSqliteConfig() {
    let config = new ParserConfig();
    config.ColumnBoundarySymbol1 = "`";
    config.ColumnBoundarySymbol2 = "`";
    config.NotEqualSymbol = "!=";
    config.ConcatSymbol = "||";
    config.BoolToNumber = false;
    config.CurrentTimeExpression = "datetime(CURRENT_TIMESTAMP,'localtime')";
    config.IfNullFuncName = "ifnull";
    config.EnableIfFunction = false;
    return config;
  }
};
var ParserConfig_default = ParserConfig;
export {
  ParserConfig_default as ParserConfig,
  SJNodeParser_default as SJNodeParser
};
