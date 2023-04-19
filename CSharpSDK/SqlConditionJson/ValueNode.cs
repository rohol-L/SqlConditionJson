using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SqlConditionJson
{
    public class ValueNode : SJNode
    {
        public ValueNode(string value) : base(value) { }

        public static ValueNode NullNode => new("null");
    }
}
