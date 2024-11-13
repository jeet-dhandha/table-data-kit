// Reference Result
const result = {
  rowCount: { table1: 0, table2: 0 },
  columnCount: { table1: 0, table2: 0 },
  dataTypes: { table1: [], table2: [] },
  commonPatterns: [],
  uniquePatterns: { table1: [], table2: [] },
  dateRanges: { table1: [], table2: [] },
  numberRanges: { table1: [], table2: [] },
  emailDomains: { table1: [], table2: [] },
  booleanDistribution: { table1: [], table2: [] },
  codePatterns: { table1: [], table2: [] },
  percentageRanges: { table1: [], table2: [] },
  stringLengths: { table1: [], table2: [] },
  matchPercentage: 0,
  isContinued: false,
  headerInTable2: false,
};

import chalk from "chalk";
import moment from "moment";

function printyfy(res, indent = 0) {
  if (
    res === null ||
    res === undefined ||
    (typeof res === "object" && Object.values(res).length === 0 && !moment.isMoment(res) && !moment.isDate(res))
  ) {
    return;
  }

  if (
    typeof res === "boolean" ||
    typeof res === "number" ||
    typeof res === "string" ||
    res instanceof Date ||
    moment.isMoment(res) ||
    moment.isDate(res)
  ) {
    console.log(" ".repeat(indent) + chalk.green(moment.isMoment(res) || moment.isDate(res) ? res.toISOString() : res));
  } else if (Array.isArray(res)) {
    const isEveryStringBooleanNumberNullUndefined = Object.values(res).every(
      (val) =>
        typeof val === "string" ||
        typeof val === "boolean" ||
        typeof val === "number" ||
        val === null ||
        val === undefined
    );

    const omitNullORUndefined = res.filter((val) => val !== null && val !== undefined);

    if (isEveryStringBooleanNumberNullUndefined) {
      console.log(" ".repeat(indent) + chalk.green(omitNullORUndefined.join(" | ")));
    } else if (omitNullORUndefined.length > 0) {
      omitNullORUndefined.forEach((item) => {
        printyfy(item, indent + 2);
      });
    }
  } else if (typeof res === "object" && res !== null) {
    const isEveryStringBooleanNumberNullUndefined = Object.values(res).every(
      (val) =>
        typeof val === "string" ||
        typeof val === "boolean" ||
        typeof val === "number" ||
        val === null ||
        val === undefined
    );

    const omitNullORUndefined = Object.entries(res)
      .filter(([key, value]) => value !== null && value !== undefined)
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});

    if (Object.keys(omitNullORUndefined).length > 0) {
      if (isEveryStringBooleanNumberNullUndefined) {
        console.log(" ".repeat(indent) + chalk.green(JSON.stringify(omitNullORUndefined).replace(/,"/g, ', "')));
      } else {
        for (const key in omitNullORUndefined) {
          console.log(" ".repeat(indent) + chalk.blue(key));
          printyfy(res[key], indent + 2);
        }
      }
    }
  }
}

export { printyfy };
