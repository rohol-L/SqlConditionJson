//import SJNodeParser from "./src/SJNodeParser.js"
//import ParserConfig from "./src/ParserConfig.js"
import { SJNodeParser, ParserConfig } from "./dist/json2sql.js"

let json = {
    "@or": [
        {
            "@and": [
                {
                    "@or": [
                        { "#type": "type1" },
                        { "#type": "type2" }
                    ]
                },
                { "#date": { "@>": "2023-03-10" } },
                { "#enable": 1 }
            ]
        },
        { "#year": [2021, 2022] },
        { "a": { "@like": ">123/456%" } }
    ]
}

let config = ParserConfig.getPostgreSqlConfig();
console.log(SJNodeParser.parseJson2Sql(json, config))