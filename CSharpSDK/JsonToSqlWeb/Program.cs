using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;
using SqlConditionJson;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls("http://0.0.0.0:9000");  //ÐÞ¸ÄÄ¬ÈÏ¶Ë¿Ú

var app = builder.Build();

var handle = new RequestDelegate(async context =>
{
    var sr = new StreamReader(context.Request.Body);
    string json = await sr.ReadToEndAsync();
    var parser = new SJNodeParser(ParserConfig.Mysql);
    var result = parser.Parse(JObject.Parse(json));
    await context.Response.WriteAsJsonAsync(new { sql = result.ToSQL() });
});

app.MapPost("/", handle);

app.Run();