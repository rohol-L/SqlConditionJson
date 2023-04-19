using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SqlConditionJson
{
    public class ParserConfig
    {
        /// <summary>
        /// 默认关系符
        /// </summary>
        public List<string> RelationSigns = new() { ">", ">=", "=", "<>", "!=", "<=", "<", "+", "-", "*", "/", "||" };

        /// <summary>
        /// 字段边界的符号（前）
        /// </summary>
        public string ColumnBoundarySymbol1 { get; set; } = "\"";

        /// <summary>
        /// 字段边界的符号（后）
        /// </summary>
        public string ColumnBoundarySymbol2 { get; set; } = "\"";

        /// <summary>
        /// @ne 覆盖节点输出
        /// </summary>
        public string NotEqualSymbol { get; set; } = "<>";

        /// <summary>
        /// 转换Concat连接符为一个函数，默认值：CONCAT
        /// </summary>
        public string ConcatFunctionName { get; set; } = "CONCAT";

        /// <summary>
        /// 取当前时间的函数名称，默认值：now()
        /// </summary>
        public string CurrentTimeExpression { get; set; } = "now()";

        /// <summary>
        /// 替换IfNull的函数名称，覆盖为null将使用case语句替代
        /// </summary>
        public string? IfNullFuncName { get; set; } = "ifnull";

        /// <summary>
        /// 转换Concat连接符，赋值后
        /// </summary>
        public string? ConcatSymbol { get; set; }

        /// <summary>
        /// 是否将bool转换为数字 true:1 false:0
        /// </summary>
        public bool BoolToNumber { get; set; } = false;

        /// <summary>
        /// 是否将布尔值转换为表达式，打开此配置将会覆盖 BoolToNumber
        /// </summary>
        public bool BoolToExpression { get; set; } = false;

        /// <summary>
        /// 是否忽略 @: 关系节点，兼容pg数据库时需要关闭此配置
        /// </summary>
        public bool IgnoreConvertTypeRelationNode = true;

        /// <summary>
        /// 是否启用If函数，关闭后将使用case替代
        /// </summary>
        public bool EnableIfFunction = true;

        public static ParserConfig Default { get; set; } = new();

        public static ParserConfig SqlServer { get; set; } = new()
        {
            ColumnBoundarySymbol1 = "\"",
            ColumnBoundarySymbol2 = "\"",
            NotEqualSymbol = "<>",
            ConcatSymbol = "+",
            BoolToExpression = true,
            CurrentTimeExpression = "GETDATE()",
            IfNullFuncName = "isnull",
            EnableIfFunction = false,
        };

        public static ParserConfig Mysql { get; set; } = new()
        {
            ColumnBoundarySymbol1 = "`", // 兼容支持 "
            ColumnBoundarySymbol2 = "`", // 兼容支持 "
            NotEqualSymbol = "!=", // 兼容支持 <> !=
            ConcatFunctionName = "CONCAT",
            BoolToNumber = false, // 兼容支持
            CurrentTimeExpression = "now()",
            IfNullFuncName = "ifnull",
            EnableIfFunction = true,
        };

        public static ParserConfig Oracle { get; set; } = new()
        {
            ColumnBoundarySymbol1 = "", // 设置为 " 后区分大小写
            ColumnBoundarySymbol2 = "", // 设置为 " 后区分大小写
            NotEqualSymbol = "!=", // 兼容支持 <> !=
            ConcatSymbol = "||",
            BoolToExpression = true, // 0/1 支持情况未知
            CurrentTimeExpression = "sysdate",
            IfNullFuncName = "nvl",
            EnableIfFunction = false,
        };

        public static ParserConfig PostgreSql { get; set; } = new()
        {
            ColumnBoundarySymbol1 = "\"",
            ColumnBoundarySymbol2 = "\"",
            NotEqualSymbol = "!=", // 同时支持 <> !=
            ConcatSymbol = "+",
            BoolToNumber = false,
            CurrentTimeExpression = "current_timestamp",
            IfNullFuncName = "COALESCE",
            EnableIfFunction = true,
        };

        public static ParserConfig Hive { get; set; } = new()
        {
            ColumnBoundarySymbol1 = "`", // 兼容支持 "
            ColumnBoundarySymbol2 = "`", // 兼容支持 "
            NotEqualSymbol = "!=", // 同时支持 <> !=
            ConcatFunctionName = "CONCAT",
            BoolToNumber = false, // 兼容支持
            CurrentTimeExpression = "from_unixtime(unix_timestamp(),'yyyy-MM-dd HH:mm:ss')",
            IfNullFuncName = null,
            EnableIfFunction = true,
        };

        public static ParserConfig Sqlite { get; set; } = new()
        {
            ColumnBoundarySymbol1 = "`", // 兼容支持 "
            ColumnBoundarySymbol2 = "`", // 兼容支持 "
            NotEqualSymbol = "!=", // 同时支持 <> !=
            ConcatSymbol = "||",
            BoolToNumber = false, // 兼容支持
            CurrentTimeExpression = "datetime(CURRENT_TIMESTAMP,'localtime')",
            IfNullFuncName = "ifnull",
            EnableIfFunction = false,
        };
    }
}
