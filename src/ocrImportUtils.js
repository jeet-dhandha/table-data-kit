import cloneDeep from "lodash/cloneDeep.js";
import omit from "lodash/omit.js";
import chalk from "chalk";
import moment from "moment";

function comparator(table1, table2, { matchThreshold = 60 } = {}) {
  // Helper function to determine the data type of a value
  function getDataType(value) {
    // Convert value to string and trim whitespace
    const strValue = String(value).trim();

    // Check for number types (including currency)
    const numericValue = strValue.replace(/[^-\d.]/g, "");
    if (
      typeof value === "number" ||
      /^-?\d+(\.\d+)?$/.test(numericValue) ||
      /^-?\d{1,3}(,\d{3})*(\.\d+)?$/.test(numericValue) ||
      (strValue.length - numericValue.length <= 10 && /^\d+(\.\d{1,2})?$/.test(numericValue))
    ) {
      return "number";
    }

    // Check for date types
    const dateFormats = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}[/-]\d{2}[/-]\d{4}$/, // DD/MM/YYYY or DD-MM-YYYY or MM/DD/YYYY or MM-DD-YYYY
      /^\d{4}-\d{2}-\d{2}$/, // YYYY/MM/DD or YYYY-MM-DD
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/, // ISO 8601
      /^\d{1,2}:\d{2}(:\d{2})?$/, // HH:MM or HH:MM:SS
    ];
    if (value instanceof Date || dateFormats.some((format) => format.test(strValue))) {
      return "date";
    }

    // Check for email
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strValue)) {
      return "email";
    }

    // Check for percentage
    if (/^\d+(\.\d+)?%$/.test(strValue)) {
      return "percentage";
    }

    // Check for boolean
    if (/^(yes|no|true|false)$/i.test(strValue)) {
      return "boolean";
    }

    // Check for code (alphanumeric with possible special characters)
    if (/^[A-Za-z0-9-_/]+$/.test(strValue)) {
      return "code";
    }

    // If none of the above, return string
    return "string";
  }

  // Helper function to get string patterns
  function getStringPattern(str) {
    return str
      .replace(/[A-Z]/g, "A")
      .replace(/[a-z]/g, "a")
      .replace(/[0-9]/g, "9")
      .replace(/[^A-Za-z0-9]/g, "x");
  }

  function isLikelyHeader(row, otherRows) {
    if (row.length === 0 || otherRows.length === 0) return false;

    const headerScore = row.reduce((score, cell, index) => {
      cell = String(cell).trim();
      if (cell.length === 0) return score;
      if (cell.length < 30) {
        score += 1;
      }
      if (/^[A-Z][a-z]*([ _][A-Z][a-z]*)*$/.test(cell) || cell === cell.toUpperCase()) {
        score += 1;
      }
      const isUnique = otherRows.every((row) => String(row[index]).trim() !== cell);
      if (isUnique) score += 1;
      const cellType = getDataType(cell);
      const otherTypes = otherRows.map((row) => getDataType(row[index]));
      if (otherTypes.every((type) => type !== cellType)) score += 1;
      if (!/^\d+$/.test(cell) && !/^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(cell) && !/^[^@]+@[^@]+\.[^@]+$/.test(cell)) {
        score += 1;
      }
      return score;
    }, 0);

    const similarityResult = compareTables([row], otherRows, {
      skipHeaderCheck: true,
    });
    const similarityScore = Math.round(similarityResult.matchPercentage);
    // console.log("similarityResult:", similarityResult);
    if (Math.round(similarityScore) > matchThreshold) {
      return false;
    }

    const averageScore = headerScore / row.length;
    // console.log("headerScore", headerScore, averageScore);
    return averageScore > 2;
  }

  // Main function to compare two tables
  function compareTables(table1, table2, options = { skipHeaderCheck: false }) {
    const result = {
      rowCount: { table1: table1.length, table2: table2.length },
      columnCount: { table1: table1[0].length, table2: table2[0].length },
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
      headerInTable2: false,
    };

    const isTable2FirstRowHeader = options.skipHeaderCheck ? false : isLikelyHeader(table2[0], table2.slice(1));

    if (isTable2FirstRowHeader) {
      result.headerInTable2 = true;
      return result;
    }

    for (let i = 0; i < Math.max(table1[0].length, table2[0].length); i++) {
      const column1 = table1.map((row) => row[i]);
      const column2 = table2.map((row) => row[i]);

      result.dataTypes.table1.push(column1.map(getDataType));
      result.dataTypes.table2.push(column2.map(getDataType));

      const patterns1 = new Set(column1.map(getStringPattern));
      const patterns2 = new Set(column2.map(getStringPattern));

      result.commonPatterns.push([...patterns1].filter((pattern) => patterns2.has(pattern)));
      result.uniquePatterns.table1.push([...patterns1].filter((pattern) => !patterns2.has(pattern)));
      result.uniquePatterns.table2.push([...patterns2].filter((pattern) => !patterns1.has(pattern)));

      result.dateRanges.table1.push(analyzeDateRange(column1));
      result.dateRanges.table2.push(analyzeDateRange(column2));

      result.numberRanges.table1.push(analyzeNumberRange(column1));
      result.numberRanges.table2.push(analyzeNumberRange(column2));

      result.emailDomains.table1.push(analyzeEmailDomains(column1));
      result.emailDomains.table2.push(analyzeEmailDomains(column2));

      result.booleanDistribution.table1.push(analyzeBooleanDistribution(column1));
      result.booleanDistribution.table2.push(analyzeBooleanDistribution(column2));

      result.codePatterns.table1.push(analyzeCodePatterns(column1));
      result.codePatterns.table2.push(analyzeCodePatterns(column2));

      result.percentageRanges.table1.push(analyzePercentageRange(column1));
      result.percentageRanges.table2.push(analyzePercentageRange(column2));

      result.stringLengths.table1.push(analyzeStringLengths(column1));
      result.stringLengths.table2.push(analyzeStringLengths(column2));
    }

    let totalFactors = 0;
    let matchingFactors = 0;

    // Compare data types
    for (let i = 0; i < result.dataTypes.table1.length; i++) {
      totalFactors += result.dataTypes.table1[i].length;
      for (let j = 0; j < result.dataTypes.table1[i].length; j++) {
        if (result.dataTypes.table1[i][j] === result.dataTypes.table2[i][j]) {
          matchingFactors++;
        }
      }
    }

    // Compare common patterns
    totalFactors += result.commonPatterns.length;
    matchingFactors += result.commonPatterns.filter((patterns) => patterns.length > 0).length;

    // Compare date ranges
    for (let i = 0; i < result.dateRanges.table1.length; i++) {
      if (result.dateRanges.table1[i] && result.dateRanges.table2[i]) {
        totalFactors += 2;
        const daysDiffMin = Math.abs(
          (result.dateRanges.table1[i].min - result.dateRanges.table2[i].min) / (1000 * 60 * 60 * 24)
        );
        const daysDiffMax = Math.abs(
          (result.dateRanges.table1[i].max - result.dateRanges.table2[i].max) / (1000 * 60 * 60 * 24)
        );
        if (daysDiffMin <= 30) matchingFactors++;
        if (daysDiffMax <= 30) matchingFactors++;
      }
    }

    // Compare number ranges, email domains, boolean distributions, code patterns, percentage ranges, and string lengths
    compareRanges(result.numberRanges, totalFactors, matchingFactors);
    compareArrays(result.emailDomains, totalFactors, matchingFactors);
    compareDistributions(result.booleanDistribution, totalFactors, matchingFactors);
    compareArrays(result.codePatterns, totalFactors, matchingFactors);
    compareRanges(result.percentageRanges, totalFactors, matchingFactors);
    compareRanges(result.stringLengths, totalFactors, matchingFactors);

    result.matchPercentage = Math.round((matchingFactors / totalFactors) * 100);
    return result;
  }

  const DATE_PATTERNS = {
    DATE: {
      patterns: [
        "DD/MM/YYYY",
        "MM/DD/YYYY",
        "YYYY/MM/DD",
        "DD-MM-YYYY",
        "MM-DD-YYYY",
        "YYYY-MM-DD",
        "DD.MM.YYYY",
        "MM.DD.YYYY",
        "YYYY.MM.DD",
      ],
      type: "date",
    },
    DATETIME: {
      patterns: [
        "DD/MM/YYYY HH:mm:ss",
        "MM/DD/YYYY HH:mm:ss",
        "YYYY/MM/DD HH:mm:ss",
        "DD-MM-YYYY HH:mm:ss",
        "MM-DD-YYYY HH:mm:ss",
        "YYYY-MM-DD HH:mm:ss",
      ],
      type: "datetime",
    },
    TIME: {
      patterns: ["HH:mm:ss", "HH:mm", "h:mm A", "h:mm:ss A"],
      type: "time",
    },
  };

  function detectDatePattern(value) {
    for (const [key, formatGroup] of Object.entries(DATE_PATTERNS)) {
      for (const pattern of formatGroup.patterns) {
        if (moment(value, pattern, true).isValid()) {
          return { pattern, type: formatGroup.type };
        }
      }
    }
    return null;
  }

  function analyzeDateRange(column) {
    // Skip empty values
    const validValues = column.filter((d) => d && d.toString().trim());
    if (!validValues.length) return null;

    // Detect pattern from first valid value
    const patternInfo = detectDatePattern(validValues[0]);
    if (!patternInfo) return null;

    // Parse all dates using detected pattern
    const dates = validValues.map((d) => moment(d, patternInfo.pattern, true)).filter((d) => d.isValid());

    if (dates.length === 0) return null;

    return {
      min: moment.min(dates).toDate(),
      max: moment.max(dates).toDate(),
      pattern: patternInfo.pattern,
      type: patternInfo.type,
    };
  }

  function analyzeNumberRange(column) {
    const numbers = column.map(Number).filter((n) => !isNaN(n));
    return numbers.length > 0
      ? {
          min: Math.min(...numbers),
          max: Math.max(...numbers),
          avg: numbers.reduce((a, b) => a + b, 0) / numbers.length,
        }
      : null;
  }

  function analyzeEmailDomains(column) {
    return [...new Set(column.map((email) => email.split("@")[1]).filter(Boolean))];
  }

  function analyzeBooleanDistribution(column) {
    return column.reduce((acc, val) => {
      acc[val.toLowerCase()] = (acc[val.toLowerCase()] || 0) + 1;
      return acc;
    }, {});
  }

  function analyzeCodePatterns(column) {
    return [...new Set(column.map(getStringPattern))];
  }

  function analyzePercentageRange(column) {
    const percentages = column.map((p) => parseFloat(p)).filter((n) => !isNaN(n));
    return percentages.length > 0
      ? {
          min: Math.min(...percentages),
          max: Math.max(...percentages),
          avg: percentages.reduce((a, b) => a + b, 0) / percentages.length,
        }
      : null;
  }

  function analyzeStringLengths(column) {
    const lengths = column.map(String).map((s) => s.length);
    return lengths.length > 0
      ? {
          min: Math.min(...lengths),
          max: Math.max(...lengths),
          avg: lengths.reduce((a, b) => a + b, 0) / lengths.length,
        }
      : null;
  }

  function compareRanges(ranges, totalFactors, matchingFactors) {
    for (let i = 0; i < ranges.table1.length; i++) {
      if (ranges.table1[i] && ranges.table2[i]) {
        totalFactors += 3;
        const range1 = ranges.table1[i].max - ranges.table1[i].min;
        if (Math.abs(ranges.table1[i].min - ranges.table2[i].min) <= range1 * 0.1) {
          matchingFactors++;
        }
        if (Math.abs(ranges.table1[i].max - ranges.table2[i].max) <= range1 * 0.1) {
          matchingFactors++;
        }
        if (Math.abs(ranges.table1[i].avg - ranges.table2[i].avg) <= range1 * 0.1) {
          matchingFactors++;
        }
      }
    }
  }

  function compareArrays(arrays, totalFactors, matchingFactors) {
    for (let i = 0; i < arrays.table1.length; i++) {
      if (arrays.table1[i] && arrays.table2[i]) {
        totalFactors++;
        const common = arrays.table1[i].filter((item) => arrays.table2[i].includes(item));
        if (common.length > 0) matchingFactors++;
      }
    }
  }

  function compareDistributions(distributions, totalFactors, matchingFactors) {
    for (let i = 0; i < distributions.table1.length; i++) {
      if (distributions.table1[i] && distributions.table2[i]) {
        totalFactors++;
        const dist1 = distributions.table1[i];
        const dist2 = distributions.table2[i];
        const total1 = Object.values(dist1).reduce((a, b) => a + b, 0);
        const total2 = Object.values(dist2).reduce((a, b) => a + b, 0);
        const ratioTrue1 = (dist1.true || 0) / total1;
        const ratioTrue2 = (dist2.true || 0) / total2;
        if (Math.abs(ratioTrue1 - ratioTrue2) <= 0.1) matchingFactors++;
      }
    }
  }

  function finalAnalysis(res) {
    const output = res;
    // Find common output for better analysis and comparison
    // Enhanced analysis results
    const {
      columns: columnsAfterComparision,
      hasFullMatch: hasFullMatchDataType,
      overallSimilarity: overallSimilarityDataType,
    } = compareDataTypesWithSimilarity(output.dataTypes.table1, output.dataTypes.table2);
    const dataTypeMissMatchPercentage = Math.round(
      (columnsAfterComparision.filter((col) => !col.matches).length / output.dataTypes.table1.length) * 100
    );
    const dataTypeMatches = columnsAfterComparision.filter((col) => col.matches).length;
    const dataTypeMissMatchCount = columnsAfterComparision.length;
    const analysis = {
      tableComparison: {
        totalColumns: output.columnCount.table1,
        rowDifference: Math.abs(output.rowCount.table2 - output.rowCount.table1),
        columnMatch: output.columnCount.table1 === output.columnCount.table2,
        columnDifference: output.columnCount.table2 - output.columnCount.table1,
        headerMismatch: output.headerInTable2,
        dataTypeMatches,
        hasFullMatchDataType,
        overallSimilarityDataType,
        dataTypeMissMatchCount,
        dataTypeMissMatchPercentage: isNaN(dataTypeMissMatchPercentage) ? null : dataTypeMissMatchPercentage + "%",
        dataTypeMissMatchInfo: columnsAfterComparision.filter((col) => !col.matches),
      },
      patternMatching: {
        common: analyzeCommonPatterns(output.commonPatterns),
        differences: comparePatterns(output.uniquePatterns.table1, output.uniquePatterns.table2),
      },
      dateAnalysis: analyzeDateRanges(output.dateRanges),
      numericalAnalysis: analyzeNumberRanges(output.numberRanges),
      distributionAnalysis: analyzeDistributions(output.booleanDistribution),
    };

    // const table1Types = [
    //   [ 'string', 'string', 'string', 'string' ],
    //   [ 'code', 'number', 'number', 'number' ],
    //   [ 'code', 'date', 'date', 'date' ],
    //   [ 'code', 'email', 'email', 'email' ],
    //   [ 'code', 'number', 'number', 'number' ]
    // ]

    // const table2Types = [
    //   [ 'string', 'string', 'string' ],
    //   [ 'number', 'number', 'number' ],
    //   [ 'date', 'date', 'date' ],
    //   [ 'email', 'email', 'email' ],
    //   [ 'number', 'number', 'number' ]
    // ]
    function compareDataTypesWithSimilarity(table1Types, table2Types) {
      const columnResults = table1Types.map((col, idx) => {
        // Count matching types
        const matches = col.reduce((acc, type, i) => {
          return acc + (type === table2Types[idx][i] ? 1 : 0);
        }, 0);

        // Calculate similarity percentage
        const similarity = (matches / col.length) * 100;

        return {
          colNo: idx + 1,
          similarityPercentage: Math.round(similarity),
          matches: similarity >= 50, // Keep original boolean for compatibility
          details: {
            totalTypes: col.length,
            matchingTypes: matches,
          },
        };
      });

      // Calculate overall similarity
      const overallSimilarity = Math.round(
        columnResults.reduce((acc, col) => acc + col.similarityPercentage, 0) / columnResults.length
      );

      return {
        overallSimilarity,
        columns: columnResults,
        hasFullMatch: overallSimilarity === 100,
      };
    }

    function analyzeCommonPatterns(patterns) {
      return patterns.map((pattern, idx) => ({
        colNo: idx + 1,
        hasPattern: pattern.length > 0,
        patterns: pattern,
      }));
    }

    function comparePatterns(table1Patterns, table2Patterns) {
      return table1Patterns
        .map((pattern, idx) => ({
          colNo: idx + 1,
          noPatters: !pattern.length && !table2Patterns[idx].length,
          table1Only: pattern.filter((p) => !table2Patterns[idx].includes(p)),
          table2Only: table2Patterns[idx].filter((p) => !pattern.includes(p)),
        }))
        .filter((col) => !col.noPatters)
        .map((col) => ({
          colNo: col.colNo,
          table1Only: col.table1Only,
          table2Only: col.table2Only,
        }));
    }

    function analyzeDateRanges(dateRanges) {
      const analysis = {};
      for (let table in dateRanges) {
        analysis[table] = dateRanges[table]
          .map((range, idx) => ({
            colNo: idx + 1,
            hasDate: range !== null,
            dateInfo: range,
          }))
          .filter((col) => col.hasDate);
      }
      return analysis;
    }

    function analyzeNumberRanges(ranges) {
      return {
        rangeComparison: ranges.table1
          .map((val, idx) => ({
            colNo: idx + 1,
            table1Range: ranges.table1[idx],
            table2Range: ranges.table2[idx],
            difference:
              ranges.table1[idx] && ranges.table2[idx]
                ? {
                    min: ranges.table2[idx].min - ranges.table1[idx].min,
                    max: ranges.table2[idx].max - ranges.table1[idx].max,
                    avg: ranges.table2[idx].avg - ranges.table1[idx].avg,
                  }
                : null,
          }))
          .filter((col) => col.table1Range || col.table2Range || col.difference),
      };
    }

    function analyzeDistributions(distributions) {
      return {
        uniqueValues: {
          table1: Object.keys(distributions.table1).map((col, idx) => ({
            colNo: idx + 1,
            distinctCount: Object.keys(distributions.table1[col]).length,
          })),
          table2: Object.keys(distributions.table2).map((col, idx) => ({
            colNo: idx + 1,
            distinctCount: Object.keys(distributions.table2[col]).length,
          })),
        },
      };
    }

    return analysis;
  }

  function tabularizeAnalysisPrint(analysis) {
    const output = analysis;

    const rd = (a = []) =>
      a.reduce((acc, val) => {
        acc["Col " + val.Column] = omit({ ...val }, "Column");
        return acc;
      }, {});

    // chalk imported above
    console.log(chalk.bold.blue("\n=== Table Comparison Overview ==="));
    console.table({
      "Tables Match": output.tablesMatch,
      "Total Columns": output.tableComparison.totalColumns,
      "Header Mismatch": output.tableComparison.headerMismatch,
      "Row Difference": output.tableComparison.rowDifference,
      "Column Match": output.tableComparison.columnMatch,
      "Data Type Mismatch %": output.tableComparison.dataTypeMissMatchPercentage,
      "Data Type Matches": output.tableComparison.dataTypeMatches,
      "Full Match Data Type": output.tableComparison.hasFullMatchDataType,
      "Overall Similarity Data Type": output.tableComparison.overallSimilarityDataType,
      "Data Type Mismatch Count": output.tableComparison.dataTypeMissMatchCount,
    });

    console.log(chalk.bold.red("\n=== Data Type Mismatches ==="));
    const mismatches = rd(
      output.tableComparison.dataTypeMissMatchInfo.map((m) => ({
        Column: m.colNo,
        Matches: m.matches,
      }))
    );
    console.table(mismatches);

    console.log(chalk.bold.yellow("\n=== Pattern Differences ==="));
    const patternDiffs = rd(
      output.patternMatching.differences.map((d) => ({
        Column: d.colNo,
        "Table 1 Patterns": d.table1Only.join(", ") || null,
        "Table 2 Patterns": d.table2Only.join(", ") || null,
      }))
    );
    console.table(patternDiffs);

    console.log(chalk.bold.green("\n=== Date Analysis ==="));
    const dateAnalysis = rd(
      output.dateAnalysis.table1.map((t1, idx) => ({
        Column: t1.colNo,
        "Table 1 Date": new Date(t1.dateInfo.min).toLocaleDateString(),
        "Table 2 Date": new Date(output.dateAnalysis.table2[idx].dateInfo.min).toLocaleDateString(),
        Pattern: t1.dateInfo.pattern,
      }))
    );
    console.table(dateAnalysis);

    console.log(chalk.bold.magenta("\n=== Numerical Range Comparison ==="));
    const rangeComparison = rd(
      output.numericalAnalysis.rangeComparison.map((r) => ({
        Column: r.colNo,
        "Table 1 Range": r.table1Range ? `${r.table1Range.min} - ${r.table1Range.max}` : null,
        "Table 2 Range": r.table2Range ? `${r.table2Range.min} - ${r.table2Range.max}` : null,
        "Avg Difference": r.difference ? r.difference.avg.toFixed(2) : null,
      }))
    );
    console.table(rangeComparison);
  }

  const result = compareTables(table1, table2);
  if (result.headerInTable2) {
    return {
      matches: false,
      comparatorResult: result,
      analysis: { headerMismatch: true },
      logTabularizeAnalysisPrint: () => console.log("Header mismatch in table 2"),
    };
  }

  const tablesMatch = result.matchPercentage >= matchThreshold;

  //
  tabularizeAnalysisPrint({
    tablesMatch,
    ...finalAnalysis(cloneDeep(result)),
  });

  return {
    matches: tablesMatch,
    comparatorResult: result,
    analysis: finalAnalysis(cloneDeep(result)),
    logTabularizeAnalysisPrint: () => tabularizeAnalysisPrint(finalAnalysis(cloneDeep(result))),
  };
}

// Example usage
// const table1 = [
// ['Patient Name', 'Age', 'DOB', 'Contact', 'ID'],
//     ['John Doe', '30', '1993-05-15', 'john@example.com', 'ID123/123'],
//     ['Jane Smith', '25', '1998-09-22', 'jane@example.com', 'ID123/124'],
//     ['Bob Johnson', '40', '1983-12-01', 'bob@example.com', 'ID123/125']
// ];

// const table2 = [
//     ['Full Name', 'Years', 'DOB', 'Contact', 'ID'],
//     ['Alice Brown', '28', '1995-07-10', 'alice@example.com', 'ID123/126'],
//     ['Charlie Davis', '35', '1988-03-18', 'charlie@example.com', 'ID123/127'],
//     ['Eva Wilson', '22', '2001-11-30', 'eva@example.com', 'ID123/128']
// ];

// const table1 = [
//   ["11", "Fire", "0307051124P101014688/0", "TOP IN TOWN", "15/04/2025", "16,965.00", "11,196.00", "3,393.00", "Corporate"],
//   ["11", "Fire", "0307051124P101014697/0", "TOP IN TOWN", "15/04/2025", "10,500.00", "00.00", "525.00", "Corporate"]
// ]
// const table2 = [
//   ["12", "Property Insurance", "0307051224P100918995/0", "LAXMI SWAYAMVAR GROUP", "11/04/2025", "399.00", "72.00", "59.85", "Corporate"],
//   ["12", "Property Insurance", "0307051224P100919201/0", "LAXMI SWAYAMVAR GROUP", "11/04/2025", "1,000.00", "180.00", "150.00", "Corporate"],
//   ["12", "Property Insurance", "0307051224P100920363/0", "LAXMI SWAYAMVAR GROUP", "11/04/2025", "18,198.00", "3,276.00", "2,729.70", "Corporate"]
// ]

// const comparisonResult = comparator(table1, table2);
// printComparisonResult(comparisonResult);

export { comparator };
