class ParserConfig {
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
}
export default ParserConfig;