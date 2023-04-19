# SqlConditionJson文档

## 简介

### 什么是 SqlConditionJson？

SqlConditionJson （以下简称 SJ）是 Json 的子集，用于生成 Sql 片段语句（case when部分或where部分）。当需要将一个复杂查询条件固化到数据库中，或是想解耦前端复杂查询条件与后端定制解析服务__*__时，引用 SJ 将会是一个很好的选择。

__*__ 注：目前没有节点内容强校验开关，SJ 无法阻止 SQL 注入。



### 与 Sequelize 的区别？

Sequelize 是一个前端 orm 框架，SJ 的语法在一定程度上参考了 Sequelize。但 SJ 对本身的定义是一个语法解析器，对标的是 Sequelize 解析 javascript 对象的功能。以下是两者的差异列表。

| 标准         | SqlConditionJson                                         | Sequelize                    |
| ------------ | -------------------------------------------------------- | ---------------------------- |
| 跨编程语言   | 通过不同语言的SDK实现                                    | 不同语言有其他工具替代       |
| 跨数据库     | 简单差异可通过覆盖Symbol实现，复杂差异需要预设数据库类型 | 预设不同数据库类型           |
| 生成结果     | 只包含CRUD条件部分                                       | 完整的 CRUD 语句             |
| 未知节点推断 | √ 宽松验证，大部分未知的节点都能正确识别                 | × 强校验，只允许出现已知节点 |
| 原样输出     | √ 现有功能不支持的语句都可以用原样输出实现               | × 不支持内嵌 SQL 语句        |
| JSON兼容     | √ 完全兼容                                               | × 只支持 javascript 对象     |
| Join条件处理 | × 非应用场景，较差支持                                   | √ 支持                       |
| 数据库连接   | × 不支持                                                 | √ 完整支持                   |



### 快速上手

```c#
SJNodeParser parser = new SJNodeParser(ParserConfig.Default);

// 输入：
// {"#type": "type1", "#type_id": 1}
var result = parser.Parse("{\"#type\":\"type1\",\"#type_id\":1}");
Console.WriteLine(result.ToSQL());

// 输出：
// "type" = 'type1' and "type_id" = 1
```



## 节点类型

__*__ 注：有名称的节点不区分大小写，为了展示直观的输出结果，后续表格中输出字段名时均__不添加字段边界符号__。



### 字段节点

`#`号开头的节点为字段节点，字段节点的输出将会被 `ColumnBoundarySymbol1` 和 `ColumnBoundarySymbol2` 这两个配置值包裹（参考[#配置项](#配置项)）。

| 输入                          | 输出                      |
| ----------------------------- | ------------------------- |
| {"#name": "SqlConditionJson"} | name = 'SqlConditionJson' |



### 值节点

值节点对应 JSON 中的基本数据类型。字段节点是特殊的值节点。

| 名称      | 输入                    | 输出                |
| --------- | ----------------------- | ------------------- |
| 数值      | {"#id": 100}            | id = 100            |
| 文本      | {"#type": "SQL"}        | type = 'SQL'        |
| 布尔__*__ | {"#enable": true}       | enable = true       |
| 空值__*__ | {"#detail": null}       | detail is null      |
| 数组__*__ | {"#year": [2022, 2023]} | year in (2022,2023) |
| 字段      | {"#parent_id": "#id"}   | parent_id = id      |

__*__ 布尔节点在设置 `BoolToNumber=true` 开关后将会被转换为 0 或 1，如果打开 `BoolToExpression=true` 开关将会被转换为 `(1=1)` 或 `(1=2)`。

__*__ 空值节点本质上隐式声明了 `@is` 关系节点，等效于：` {"@is":null}` 。

__*__ 数组节点成员支持任意值节点以及嵌套函数节点与关系节点。数组节点作为值节点时本质上是一个 `@in` 节点加 `@,` 节点。等效于：`{"@in":{"@,":[1,2]}}`



### 关系节点

#### 概要

*本概要对于初次使用者来说较为晦涩难懂，初次使用可先跳过本段内容，直接按需查看示例，熟悉本工具后再选择性回顾。*

每个值节点都应当依赖一个关系节点，如果没有则会自动添加 `=` 节点。

关系节点有两种使用方式，通用格式为：`{"@<关系名称>":[<多个需要串联的表达式>]}`，支持至少1个参数的全部关系节点。

如果只有两个参数，则可以简写为 `{"<左表达式>":{"@<关系名称>":<右表达式>}}`。

如果只有一个参数，则左表达式必须是另一个关系节点。

通常来说，and/or 节点采用第一种方式，其他情况下采用第二种方式。（字符串连接属于特殊情况，采用第一种格式）

以下是关系节点的详细说明。



#### and/or 节点

标准格式下，一个 Json object 节点只能有 1 个 key 值，如果出现多个 key 值将会被自动转换为使用 And 连接的单 Key 数组节点。

以下为标准格式下的示例，如需使用语法糖请参考[#语法糖](#语法糖)小节。

| 名称 | 输入                                                         | 输出                           |
| ---- | ------------------------------------------------------------ | ------------------------------ |
| and  | {<br/>  "@and": [<br/>    {"#date": "2023-03-10"},<br/>    {"#enable": 1}<br/>  ]<br/>} | date='2023-03-10' and enable=1 |
| or   | {<br/>  "@or": [<br/>    {"#type": "A"},<br/>    {"#type": "B"}<br/>  ]<br/>} | type = 'A' or type = 'B'       |



#### 关系节点（2参数）

以下为2参数关系节点部分示例，可用的关系节点不局限于以下清单，无需任何拓展就可以新增关系类型：

| 名称              | 输入                            | 输出                 |
| ----------------- | ------------------------------- | -------------------- |
| =                 | {"#date": {"@=":"2023-03-10"}}  | date = '2023-03-10'  |
| ne（不等于）__*__ | {"#date": {"@ne":"2023-03-10"}} | date <> '2023-03-10' |
| >                 | {"#date": {"@>":"2023-03-10"}}  | date > '2023-03-10'  |
| >=                | {"#date": {"@>=":"2023-03-10"}} | date >= '2023-03-10' |
| <                 | {"#date": {"@<":"2023-03-10"}}  | date < '2023-03-10'  |
| <=                | {"#date": {"@<=":"2023-03-10"}} | date <= '2023-03-10' |
| like              | {"#name": {"@like": "张%"}}     | name like '张%'      |
| +（加法）         | {"#count": {"#total":{"@+":1}}} | count = total + 1    |
| -（减法）         | {"#count": {"#total":{"@-":1}}} | count = total - 1    |
| *（乘法）         | {"#count": {"#total":{"@*":1}}} | count = total * 1    |
| /（除法）         | {"#count": {"#total":{"@/":1}}} | count = total / 1    |
| %（取模）         | {"#week": {"#day":{"@%":7}}}    | week = day % 7       |
| is                | {"#type": {"@is":null}}         | type is null         |
| is not            | {"#type": {"@is not":null}}     | type is not null     |

__*__ `@ne` 节点是用于兼容不同数据库的“不等于”写法，默认输出为 `<>` ，可以通过修改 `NotEqualSymbol` 配置项来覆盖输出。



#### 关系节点（多参数）

目前只有字符串拼接和between/end会使用此模式，如果直接使用 `+` 节点或 `||` 节点拼接将不会根配置项自动转换拼接输出。

| 名称             | 输入                                                         | 输出                                               |
| ---------------- | ------------------------------------------------------------ | -------------------------------------------------- |
| 字符串拼接__*__  | {"#name": {"@=": {"@Concat": [ "张", "三"]}}}                | name = CONCAT(' 张' ,'三')<br/>name = ' 张' + '三' |
| between/end__*__ | {"#date": { "@between/and": [ "2023-03-01", "2023-03-10" ] }} | date between '2023-03-01' and '2023-03-10'         |

__*__ 

1. 此处“字符串拼接”节点（`@Concat`）会覆盖默认的 `@=` 关系节点，因此需要显式声明 `@=` 节点。

2. `@Concat`节点可通过设置 `ConcatFunctionName` 替换函数名称，也可以通过设置 `ConcatSymbol="+"` 来改用自定义的字符串连接符来拼接。

3. 如果关系节点中出现 `/` 符号，将会拆分后按索引取模作为连接符号。



#### 关系节点 （单参数）

目前只有取负数或个别的数据库的特殊运算符会使用此模式，由于单参数关系节点会覆盖默认的 `@=` 节点，因此需要显示声明“等于”节点。
| 名称 | 输入                               | 输出            |
| ---- | ---------------------------------- | --------------- |
| 负数 | {"#minus": {"@=":{"@-":"#total"}}} | minus = - total |



### 函数节点

函数节点的语法为`{"$<函数名称>":[<参数列表>]}`，支持任意个参数，参数中也可以继续嵌套函数节点。

示例：

| 输入                                      | 输出                                                         |
| ----------------------------------------- | ------------------------------------------------------------ |
| {"#date_time": { "&current_time": [] } }  | date_time = current_time()                                   |
| {"#uid": { "&left": [ "#id_sign", 4 ] }}  | uid = left(id_sign,4)                                        |
| {"#date":{"&left":[{"&now":[]},4]}}       | date = left(now(),4)                                         |
| {"#type":{"&ifnull":["#type1","#type2"]}} | type = ifnull(type1,type2)<br>type = case when type1 is not null then type1 else type2 end |
| {"#code":{"&if":[{"#type":1},1,2]}}       | code = if(type=1,1,2)<br>code = case when type=1 then 1 else 2 end |

__*__ `&current_time` 节点可以通过配置 `CurrentTimeExpression` 来覆盖输出。

__*__ `&ifnull` 节点可以通过配置 `IfNullFuncName` 来修改函数名称，如果指定为 `null` 将会使用 `case` 语句替代。

__*__ `&if` 节点可以通过配置 `EnableIfFunction` 来兼容不支持 if 函数的数据库，禁用后将自动使用 `case` 语句替代。



### 原样输出节点

当默认的功能无法满足时，还可以尝试通过原样输出来解决。当一个字符串值节点以`$=`开头时，将会原样输出后面的内容。

示例：

| 输入                 | 输出         |
| -------------------- | ------------ |
| {"#name": "$=@name"} | name = @name |
| {"$=a.id": "$=b.id"} | a.id = b.id  |

__*__ 原样输出可以兼容“超级简写”（参考[#关系节点语法糖](#关系节点语法糖)小节）



## 关系节点语法糖语法糖

### and/or 节点语法糖

如果所有的 key 值不重复，则可以通过一个多key对象节点来整合原来的数组节点，并且顶级 and 节点可以省略。
| 名称 | 输入                                         | 输出                           |
| ---- | -------------------------------------------- | ------------------------------ |
| and  | {"#date": "2023-03-10","#enable": 1}         | date='2023-03-10' and enable=1 |
| or   | {"@or":{"#date": "2023-03-10","#enable": 1}} | date='2023-03-10' or enable=1  |



### 关系节点语法糖

以下关系节点均可以省略 `@` 符号，并支持直接合并到字符串值节点中。

```c#
List<string> relationSigns = new() { ">", ">=", "=", "<>", "!=", "<=", "<", "+", "-", "*", "/", "||" };
```

__*__ 注：

1.  `<>`, `!=`,`||`等符号不推荐使用，因为无法自动转换适应不同数据库。

2. 字符串拼接请尽可能使用 `@Concat` 节点，否则无法适配不同数据库。

   

示例：

| 写法    | 示例 |  输出|
| ----------- | ---- | -------- |
| 标准写法 | {"#date":{"@>":"2023-03-01"}} | date > '2023-03-01' |
| 符号简写 | {"#date":{">":"2023-03-01"}} | date > '2023-03-01' |
| 超级简写 | {"#date":">2023-03-01"} | date > '2023-03-01' |
| 原样输出+超级简写 | {"#date":">$=@date"} | date > @date |



## 配置项

SJ 内置了一些常见数据库的配置，如果需要自定义配置，也可以通过手动创建配置实例来实现。

```c#
// 自定义配置
SJNodeParser parser = new SJNodeParser(new ParserConfig()
{
    ColumnBoundarySymbol1 = "\"",
    ColumnBoundarySymbol2 = "\"",
    NotEqualSymbol = "<>"
});
```

预设配置清单（todo）：

```c#
SJNodeParser parser = new SJNodeParser(ParserConfig.Default);

SJNodeParser parser = new SJNodeParser(ParserConfig.SqlServer);

SJNodeParser parser = new SJNodeParser(ParserConfig.Mysql);

SJNodeParser parser = new SJNodeParser(ParserConfig.Oracle);

SJNodeParser parser = new SJNodeParser(ParserConfig.PostgreSql);

SJNodeParser parser = new SJNodeParser(ParserConfig.Hive);
```

可配置开关：

```c#
ColumnBoundarySymbol1 // 字段边界符号-左，默认："
ColumnBoundarySymbol1 // 字段边界符号-右，默认："
NotEqualSymbol // 不等关系输出符号，默认：<>
ConcatFunctionName // Concat关系符的输出函数，会被ConcatSymbol覆盖，默认：CONCAT
ConcatSymbol // 配置后 Concat关系符将会改用此符号连接，无默认值
BoolToNumber // 是否将 true/false 字面量转换为 1/0，默认false
BoolToExpression // 是否将 true/false 字面量转换为 1=1/1=2，默认false
CurrentTimeExpression // 指定一个生成当前时间的表达式

```



## 特殊节点清单

| 节点 | 相关配置 |说明 |
| ---- |---- | ---- |
| 布尔值 | BoolToNumber<br/>BoolToExpression | 部分数据库将会被转换为 0/1，没有布尔字面量的数据库将会被转换为 1=1 或 1=2 |
| @eq | 无 | 将会输出为 = |
| @ne | NotEqualSymbol | 部分数据库需要优先输出 != 而不是 <> |
| @concat | ConcatFunctionName<br/>ConcatSymbol | 虽然可能输出为一个Concat函数，但为了兼容 + 号或 \|\| 的连接方式，统一作为关系节点处理。 |
| &current_time | CurrentTimeExpression | 不同数据库将会输出定制化的取当前时间的表达式 |
| &ifnull | IfNullFuncName | 不同数据库将会输出定制化的ifnull函数，不支持的数据库可以自动转换为case语句 |
| &if | EnableIfFunction | 如果不支持if函数，可以自动转换为case语句 |

__*__ `@between/and` 节点是通用规则节点，没有定制化逻辑，并不是特殊节点。



## SJ构造示例

以下示例从需求出发，反向构建SJ对象。

需求：

```sql
(("type" = 'type1' or "type" = 'type2') and "date" > '2023-03-10' and "enable" = 1) or ("year" in (2021 , 2022))
```

分析：

1. 先提取and/or节点，构造骨架

   ```json
   {
       "@or":[
           {
               "@and":[
                   {"@or":[
                       {}, // "type" = 'type1'
                       {}, // "type" = 'type2'
                   ]},
                   {}, // "date" > '2023-03-10'
                   {} // "enable" = 1
               ]
           },
           {} // "year" in (2021 , 2022)
       ]
   }
   ```

2. 判断节点类型，并填充空白

   ```json
   {
       "@or":[
           {
               "@and":[
                   {"@or":[
                       {"#type":"type1"}, // "type" = 'type1'
                       {"#type":"type2"}, // "type" = 'type2'
                   ]},
                   {"#date":{"@>":"2023-03-10"}}, // "date" > '2023-03-10'
                   {"#enable":1} // "enable" = 1
               ]
           },
           {"#year":[2021,2022]} // "year" in (2021 , 2022)
       ]
   }
   ```

   

