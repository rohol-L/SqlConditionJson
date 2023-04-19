using Newtonsoft.Json.Linq;
using SqlConditionJson;
using System.Text;

var di = new DirectoryInfo("Json");
var parser = new SJNodeParser(ParserConfig.Hive);

foreach (var f1 in di.GetFiles("*.json"))
{
    string json = File.ReadAllText(f1.FullName, Encoding.UTF8);
    var jobj = JObject.Parse(json);
    var result = parser.Parse(jobj);
    Console.WriteLine($"[{f1.Name[..^5]}]");
    Console.WriteLine(result.ToSQL());
    Console.WriteLine();
}