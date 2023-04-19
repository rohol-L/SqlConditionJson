using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SqlConditionJson
{
    public class FuncNode : SJNode
    {
        public List<SJNode> Param { get; set; } = new();
        public FuncNode(string value) : base(value) { }

        public override string ToSQL()
        {
            List<string> builder = new();
            foreach (var item in Param)
            {
                builder.Add(item.ToSQL());
            }
            return $"{Text}({string.Join(",", builder)})";
        }
    }
}
