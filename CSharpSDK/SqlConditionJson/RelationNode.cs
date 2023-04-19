using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SqlConditionJson
{
    /// <summary>
    /// 关系节点，包含 and or +-*/%
    /// </summary>
    public class RelationNode : SJNode
    {
        public List<SJNode> Data { get; set; } = new();

        public RelationNode(string value) : base(value)
        {
        }


        public override string ToSQL()
        {
            if (Data.Count == 0)
            {
                throw new Exception("Data 长度为0");
            }
            if (Data.Count == 1)
            {
                if (Text.Equals("not", StringComparison.OrdinalIgnoreCase))
                {
                    return $"{Text}({Data[0].ToSQL()})";
                }
                if (Text.Equals("and", StringComparison.OrdinalIgnoreCase)
                    || Text.Equals("or", StringComparison.OrdinalIgnoreCase))
                {
                    return $"{Data[0].ToSQL()}";
                }
                return $"{Text} {Data[0].ToSQL()}";
            }
            else
            {
                // 此处 Data.Count > 1
                List<string> builder = new();
                foreach (var item in Data)
                {
                    bool brackets = false;
                    if (item is RelationNode relation)
                    {
                        foreach (var item2 in relation.Data)
                        {
                            if (item2 is RelationNode)
                            {
                                brackets = true;
                            }
                        }
                    }
                    if (brackets || item.Text == ",")
                    {
                        builder.Add($"({item.ToSQL()})");
                    }
                    else
                    {
                        builder.Add(item.ToSQL());
                    }
                }
                if (Text.Equals("not", StringComparison.OrdinalIgnoreCase) && Data[0] is RelationNode)
                {
                    return $"not({string.Join($" and ", builder)})";
                }
                if (Text.Equals("in", StringComparison.OrdinalIgnoreCase))
                {
                    string key = builder[0];
                    builder.RemoveAt(0);
                    return $"{key} in({string.Join($",", builder)})";
                }
                var stringBuilder = new StringBuilder();
                string[] splitText = Text.Length > 1 && Text.Contains('/') ? Text.Split('/') : new string[] { Text };
                stringBuilder.Append(builder[0]);
                for (int i = 1; i < builder.Count; i++)
                {
                    stringBuilder.Append(' ');
                    stringBuilder.Append(splitText[(i - 1) % splitText.Length]);
                    stringBuilder.Append(' ');
                    stringBuilder.Append(builder[i]);
                }
                return stringBuilder.ToString();
            }
        }
    }
}
