using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SqlConditionJson
{
    /// <summary>
    /// 此节点视为FuncNode，但可以自定义输出
    /// </summary>
    public class DynamicFuncNode : FuncNode
    {
        readonly Func<List<SJNode>, string> toString;

        public DynamicFuncNode(string text, Func<List<SJNode>, string> toString) : base(text)
        {
            this.toString = toString;
        }

        public override string ToSQL()
        {
            return toString.Invoke(Param);
        }
    }
}
