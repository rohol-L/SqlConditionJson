using Newtonsoft.Json.Linq;

namespace SqlConditionJson
{
    public abstract class SJNode
    {
        public string Text { get; set; }

        public SJNode(string text) { Text = text; }

        public override string ToString()
        {
            return Text;
        }

        public virtual string ToSQL()
        {
            return Text;
        }
    }
}