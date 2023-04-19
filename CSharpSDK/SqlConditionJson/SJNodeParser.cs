using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SqlConditionJson
{
    public class SJNodeParser
    {
        readonly ParserConfig config;

        public SJNodeParser(ParserConfig config)
        {
            this.config = config;
        }

        public SJNode Parse(JToken token)
        {
            return ParseToken(token, null);
        }

        private SJNode ParseToken(JToken token, SJNode? overrideNode)
        {
            if (token is JObject obj)
            {
                return ParseObject(obj, overrideNode);
            }
            if (token is JArray array)
            {
                if (overrideNode == null)
                {
                    throw new Exception("暂未支持的格式:" + array);
                }
                var node = new RelationNode("in");
                node.Data.Add(overrideNode);
                var node2 = new RelationNode(",")
                {
                    Data = ParseArray(array, null)
                };
                node.Data.Add(node2);
                return node;
            }
            if (token is JValue value)
            {
                SJNode node;
                if (token.Type == JTokenType.Null)
                {
                    node = ValueNode.NullNode;
                }
                else if (token.Type == JTokenType.String)
                {
                    node = ParseString(value.Value<string>(), overrideNode != null);//有覆盖节点说明没有关系节点
                }
                else if (token.Type == JTokenType.Boolean)
                {
                    //特殊处理bool值
                    bool boolValue = value.Value<bool>();
                    string convertValue = (config.BoolToExpression, config.BoolToNumber, boolValue) switch
                    {
                        (true, _, true) => "(1=1)",
                        (true, _, false) => "(1=2)",
                        (_, true, true) => "1",
                        (_, true, false) => "0",
                        (_, false, true) => "true",
                        (_, false, false) => "false"
                    };
                    node = new ValueNode(convertValue);
                }
                else
                {
                    node = new ValueNode(value.ToString());
                }
                return WrapOverrideNode(node, overrideNode);
            }
            throw new Exception("暂未支持的格式:" + token);
        }

        private SJNode ParseObject(JObject obj, SJNode? overrideNode)
        {
            if (obj.Count == 1)
            {
                var enumer = obj.GetEnumerator();
                enumer.MoveNext();
                return ParseKeyValuePair(enumer.Current.Key, enumer.Current.Value, overrideNode);
            }
            else
            {
                var node = new RelationNode("and")
                {
                    Data = ParseArray(obj, overrideNode)
                };
                return node;
            }
        }

        private SJNode ParseKeyValuePair(string key, JToken? value, SJNode? overrideNode)
        {
            SJNode node = ParseString(key, overrideNode != null);//有覆盖节点说明没有关系节点
            if (value == null)
            {
                throw new Exception($"暂未支持Key:{key} value:{value}");
            }
            if (node is RelationNode relationNode)
            {
                relationNode.Data = ParseArray(value, null);
                return WrapOverrideNode(relationNode, overrideNode);
            }
            if (node is FuncNode funcNode)
            {
                funcNode.Param = ParseArray(value, null);
                return WrapOverrideNode(funcNode, overrideNode);
            }
            if (node is ValueNode)
            {
                var valueNode = ParseToken(value, node);
                //连续出现值节点时自动加上=节点
                if (overrideNode != null)
                {
                    var rNode = new RelationNode("=");
                    rNode.Data.Add(overrideNode);
                    rNode.Data.Add(valueNode);
                    valueNode = rNode;
                }
                return valueNode;
            }
            throw new Exception($"暂未支持Key:{key} value:{value}");
        }

        private List<SJNode> ParseArray(JToken token, SJNode? overrideNode)
        {
            var arrayNode = new List<SJNode>();
            if (token is JArray arr)
            {
                foreach (var item in arr)
                {
                    arrayNode.Add(ParseToken(item, overrideNode));
                }
            }
            else if (token is JObject obj)
            {
                foreach (var item in obj)
                {
                    arrayNode.Add(ParseKeyValuePair(item.Key, item.Value, overrideNode));
                }
            }
            else
            {
                arrayNode.Add(ParseToken(token, overrideNode));
            }
            return arrayNode;
        }

        /// <summary>
        /// 如果一个节点缺少关系节点，自动包裹一层关系节点
        /// </summary>
        /// <param name="node"></param>
        /// <param name="overrideNode">手动指定关系节点，留空不包裹</param>
        /// <returns></returns>
        private static SJNode WrapOverrideNode(SJNode node, SJNode? overrideNode)
        {
            if (overrideNode == null)
            {
                return node;
            }
            if (node is RelationNode relationNode)
            {
                relationNode.Data.Insert(0, overrideNode);
                return relationNode;
            }
            var rNode = new RelationNode("=");
            if (node is ValueNode && node.Text.Equals("null", StringComparison.OrdinalIgnoreCase))
            {
                rNode.Text = "is";
            }
            rNode.Data.Add(overrideNode);
            rNode.Data.Add(node);
            return rNode;
        }

        private SJNode ParseString(string? value, bool quickConvert = true)
        {
            if (value == null)
            {
                return ValueNode.NullNode;
            }
            if (value.Length == 0)
            {
                return new ValueNode("\"\"");
            }
            if (config.RelationSigns.Contains(value))
            {
                return new RelationNode(value);
            }
            if (quickConvert)
            {
                foreach (var sign in config.RelationSigns)
                {
                    //支持 >=1 之类的字符串
                    if (value.StartsWith(sign))
                    {
                        var node = new RelationNode(sign);
                        node.Data.Add(ParseString(value[sign.Length..]));
                        return node;
                    }
                }
            }
            if (value.StartsWith("$="))
            {
                return new ValueNode(value[2..]);
            }
            return value[0] switch
            {
                '@' => ParseRelationNode(value[1..]),
                '&' => ParseFunctionNode(value[1..]),
                '#' => new ValueNode(config.ColumnBoundarySymbol1 + value[1..] + config.ColumnBoundarySymbol2),
                _ => new ValueNode($"'{value}'"),
            };
        }

        private SJNode ParseRelationNode(string value)
        {
            string lowerValue = value.ToLower();
            switch (lowerValue)
            {
                case "eq":
                    value = "=";
                    break;
                case "ne":
                    value = config.NotEqualSymbol;
                    break;
                case "concat":
                    if (config.ConcatSymbol == null)
                    {
                        return new FuncNode(config.ConcatFunctionName);
                    }
                    value = config.ConcatSymbol;
                    break;
                default:
                    break;
            }
            return new RelationNode(value);
        }

        private SJNode ParseFunctionNode(string value)
        {
            string lowerValue = value.ToLower();
            switch (lowerValue)
            {
                case "current_time":
                    value = config.CurrentTimeExpression;
                    return new DynamicFuncNode(value, _ => value);
                case "ifnull":
                    if (config.IfNullFuncName == null)
                    {
                        return new DynamicFuncNode(value, param =>
                        {
                            if (param.Count < 2)
                            {
                                throw new Exception("ifnull 需要至少2个参数");
                            }
                            var sb = new StringBuilder();
                            sb.Append("case");
                            for (int i = 0; i < param.Count - 1; i++)
                            {
                                var item = param[i];
                                sb.Append(" when ");
                                sb.Append(item.ToSQL());
                                sb.Append(" is not null then ");
                                sb.Append(item.ToSQL());
                            }
                            sb.Append(" else ");
                            sb.Append(param[param.Count - 1].ToSQL());
                            sb.Append(" end");
                            return sb.ToString();
                        });
                    }
                    value = config.IfNullFuncName;
                    break;
                case "if":
                    if (!config.EnableIfFunction)
                    {
                        return new DynamicFuncNode(value, param =>
                        {
                            var sb = new StringBuilder();
                            sb.Append("case when ");
                            sb.Append(param[0].ToSQL());
                            sb.Append(" then ");
                            sb.Append(param[1].ToSQL());
                            sb.Append(" else ");
                            sb.Append(param[2].ToSQL());
                            sb.Append(" end");
                            return sb.ToString();
                        });
                    }
                    break;
                default:
                    break;
            }
            return new FuncNode(value);
        }
    }
}
