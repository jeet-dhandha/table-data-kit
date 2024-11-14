// Helper functions

function euclideanDistance(a, b) {
  return Math.sqrt(a.reduce((sum, _, i) => sum + Math.pow(a[i] - b[i], 2), 0));
}

function manhattanDistance(a, b) {
  return a.reduce((sum, _, i) => sum + Math.abs(a[i] - b[i]), 0);
}

function cosineSimilarity(a, b) {
  const dotProduct = a.reduce((sum, _, i) => sum + a[i] * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

function pearsonCorrelation(a, b) {
  const n = a.length;
  const sumA = a.reduce((sum, val) => sum + val, 0);
  const sumB = b.reduce((sum, val) => sum + val, 0);
  const sumAB = a.reduce((sum, _, i) => sum + a[i] * b[i], 0);
  const sumA2 = a.reduce((sum, val) => sum + val * val, 0);
  const sumB2 = b.reduce((sum, val) => sum + val * val, 0);
  const numerator = n * sumAB - sumA * sumB;
  const denominator = Math.sqrt((n * sumA2 - sumA * sumA) * (n * sumB2 - sumB * sumB));
  return numerator / denominator;
}

function levenshteinDistance(a, b) {
  const matrix = Array(b.length + 1)
    .fill()
    .map(() => Array(a.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[j][i] = matrix[j - 1][i - 1];
      } else {
        matrix[j][i] = Math.min(
          matrix[j - 1][i] + 1, // deletion
          matrix[j][i - 1] + 1, // insertion
          matrix[j - 1][i - 1] + 1 // substitution
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function jaccardSimilarity(a, b) {
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

function diceCoefficient(a, b) {
  // Handle null/undefined inputs
  if (!a || !b) return 0;

  // Convert to strings
  a = String(a);
  b = String(b);

  // Handle empty strings
  if (a.length === 0 && b.length === 0) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  // Handle identical strings
  if (a === b) return 1;

  // Handle single character strings
  if (a.length === 1 && b.length === 1) return a === b ? 1 : 0;
  if (a.length === 1 || b.length === 1) return 0;
  const createBigrams = (str) => {
    return new Set([...str.slice(0, -1)].map((_, i) => str.slice(i, i + 2)));
  };
  const bigramsA = createBigrams(a);
  const bigramsB = createBigrams(b);
  const intersection = new Set([...bigramsA].filter((x) => bigramsB.has(x)));
  return (2 * intersection.size) / (bigramsA.size + bigramsB.size);
}

function hammingDistance(a, b) {
  return a.split("").reduce((count, char, i) => count + (char !== b[i] ? 1 : 0), 0);
}

function absoluteTimeDifference(date1, date2) {
  return Math.abs(date1.getTime() - date2.getTime());
}

function relativeTimeDifference(date1, date2) {
  const milliseconds = Math.abs(date1.getTime() - date2.getTime());
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  return { milliseconds, seconds, minutes, hours, days };
}

function categoricalHammingDistance(a, b) {
  return a.reduce((count, val, i) => count + (val !== b[i] ? 1 : 0), 0);
}

function oneHotEncodingCosineSimilarity(a, b) {
  const categories = new Set([...a, ...b]);
  const oneHotA = Array.from(categories, (category) => (a.includes(category) ? 1 : 0));
  const oneHotB = Array.from(categories, (category) => (b.includes(category) ? 1 : 0));
  return cosineSimilarity(oneHotA, oneHotB);
}

// Type detection function
function detectDataType(value) {
  if (
    !/^\d{2,}[-_/\\]\d{2,}$/.test(value) && // Exclude coordinates -
    !/^\d+$/.test(value) && // Exclude numbers
    // Exclude pure text values
    !/^[a-zA-Z\s]+$/.test(value) &&
    /^[A-Za-z0-9]+[-_/\\]?[A-Za-z0-9]+$/.test(value)
  )
    return "id";
  if (
    /^[a-zA-Z\s]+$/.test(value) &&
    // name should have 2-4 words
    value.split(" ").length >= 2 &&
    value.split(" ").length <= 4
  )
    return "name";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return "date";
  if (/^[a-zA-Z]+$/.test(value)) return "category";
  if (/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(value)) return "url";
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "email";
  if (/^[\d\s\+\-$$$$]+$/.test(value) && value.length >= 7 && value.length <= 15) return "phone_number";
  if (
    (() => {
      const number = value.split(",").join("");
      if (isNaN(number)) {
        return false;
      }
      return number.split(".").length - 1 === 1;
    })()
  )
    return "currency";
  if (!isNaN(parseFloat(value)) && isFinite(value)) return "number";
  // if (/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(value)) return "coordinates";
  if (value.length > 50) return "text";
  if (/^[a-zA-Z]+(,[a-zA-Z]+)*$/.test(value)) return "tags";
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(value)) return "time";
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d{3})?Z$/.test(value)) return "timestamp";
  if (/^\d{2}:\d{2}:\d{2}$/.test(value)) return "duration";
  if (value === "true" || value === "false") return "boolean";
  if (/^(.+\/)?(?:\w+\.)+\w+$/.test(value)) return "file_path";
  return "text";
}

// Comparison functions for different data types
function compareId(a, b) {
  if (!a || !b) return 0;

  // Find index of first digit
  const firstNumA = [...a].findIndex((char) => !isNaN(char) && char !== " ");
  const firstNumB = [...b].findIndex((char) => !isNaN(char) && char !== " ");

  // Extract prefix and numeric parts
  const prefixA = a.slice(0, firstNumA).trim();
  const prefixB = b.slice(0, firstNumB).trim();

  // Extract and standardize numeric parts (replace separators with single type)
  const numA = a.slice(firstNumA).replace(/[/_\-\\]/g, "");
  const numB = b.slice(firstNumB).replace(/[/_\-\\]/g, "");

  // Non-matching prefixes
  if (prefixA !== prefixB) {
    return 0;
  }

  // Compare standardized numeric parts
  return jaccardSimilarity(numA, numB);
}

function compareName(a, b) {
  return 1 - levenshteinDistance(a, b) / Math.max(a.length, b.length);
}

function compareDate(a, b) {
  const dateA = new Date(a);
  const dateB = new Date(b);
  const maxDiff = 365 * 24 * 60 * 60 * 1000; // One year in milliseconds
  return 1 - Math.min(absoluteTimeDifference(dateA, dateB), maxDiff) / maxDiff;
}

function compareCategory(a, b) {
  return a === b ? 1 : 0;
}

function compareUrl(a, b) {
  return jaccardSimilarity(a, b);
}

function compareEmail(a, b) {
  return jaccardSimilarity(a.split("@")[0], b.split("@")[0]);
}

function comparePhoneNumber(a, b) {
  const digitsA = a.replace(/\D/g, "");
  const digitsB = b.replace(/\D/g, "");
  return digitsA === digitsB ? 1 : 0;
}

function compareNumber(a, b) {
  const numA = parseFloat(a);
  const numB = parseFloat(b);
  const maxDiff = Math.max(Math.abs(numA), Math.abs(numB));
  return 1 - Math.abs(numA - numB) / maxDiff;
}

function compareCurrency(a, b) {
  return compareNumber(a.slice(1), b.slice(1));
}

// function compareCoordinates(a, b) {
//   const [latA, lonA] = a.split(",").map(parseFloat);
//   const [latB, lonB] = b.split(",").map(parseFloat);
//   return 1 - euclideanDistance([latA, lonA], [latB, lonB]) / Math.sqrt(2 * 180 * 180);
// }

function compareText(a, b) {
  return Math.max(
    jaccardSimilarity(a, b),
    1 - levenshteinDistance(a, b) / Math.max(a.length, b.length),
    diceCoefficient(a, b)
  );
}

function compareTags(a, b) {
  const tagsA = a.split(",");
  const tagsB = b.split(",");
  return oneHotEncodingCosineSimilarity(tagsA, tagsB);
}

function compareTime(a, b) {
  const [hoursA, minutesA, secondsA = "0"] = a.split(":").map(Number);
  const [hoursB, minutesB, secondsB = "0"] = b.split(":").map(Number);
  const totalSecondsA = hoursA * 3600 + minutesA * 60 + secondsA;
  const totalSecondsB = hoursB * 3600 + minutesB * 60 + secondsB;
  return 1 - Math.abs(totalSecondsA - totalSecondsB) / 86400; // Normalize to [0, 1]
}

function compareTimestamp(a, b) {
  return compareDate(a, b);
}

function compareDuration(a, b) {
  return compareTime(a, b);
}

function compareBoolean(a, b) {
  return a === b ? 1 : 0;
}

function compareFilePath(a, b) {
  const partsA = a.split("/");
  const partsB = b.split("/");
  const fileName1 = partsA[partsA.length - 1];
  const fileName2 = partsB[partsB.length - 1];
  return jaccardSimilarity(fileName1, fileName2);
}

// Main comparison function
function compareValues(value1, value2, _type = null) {
  const type = _type ?? detectDataType(value1);

  switch (type) {
    case "id":
      return compareId(value1, value2);
    case "name":
      return true;
    // return compareName(value1, value2);
    case "date":
      return true;
    // return compareDate(value1, value2);
    case "category":
      return compareCategory(value1, value2);
    case "url":
      return compareUrl(value1, value2);
    case "email":
      return true;
    // return compareEmail(value1, value2);
    case "phone_number":
      return comparePhoneNumber(value1, value2);
    case "number":
      return compareNumber(value1, value2);
    case "currency":
      return true;
    // return compareCurrency(value1, value2);
    // case "coordinates":
    //   return compareCoordinates(value1, value2);
    case "text":
      return compareText(value1, value2);
    case "tags":
      return compareTags(value1, value2);
    case "time":
      return compareTime(value1, value2);
    case "timestamp":
      return compareTimestamp(value1, value2);
    case "duration":
      return compareDuration(value1, value2);
    case "boolean":
      return compareBoolean(value1, value2);
    case "file_path":
      return compareFilePath(value1, value2);
    default:
      return compareText(value1, value2);
  }
}

// Weighted similarity function
function weightedSimilarity(data1, data2, weights = {}, _type = null) {
  if (data1.length !== data2.length) {
    throw new Error("Data arrays must have the same length");
  }

  let totalSimilarity = 0;
  let totalWeight = 0;

  for (let i = 0; i < data1.length; i++) {
    const value1 = data1[i];
    const value2 = data2[i];
    const type = _type || detectDataType(value1);
    const weight = weights[type] || 1;

    const similarity = compareValues(value1, value2, type);

    // totalSimilarity += similarity * weight;
    totalSimilarity += similarity;
    // totalWeight += weight;
  }

  // return totalSimilarity / totalWeight;
  return totalSimilarity / data1.length;
}

// Example usage
const data1 = [
  "12346",
  "Jane Doe",
  "jane@example.com",
  "28",
  "1995-03-20",
  "female",
  "165",
  "60",
  "456 Elm St, Another Town, USA",
  "+1 (555) 987-6543",
  "art, travel, cooking",
  "false",
  "2023-05-02T14:45:00Z",
  "34.0522,-118.2437",
  "https://example.com/janedoe",
  "10:00:00",
];
const data2 = [
  "12347",
  "John Smith",
  "john@example.com",
  "32",
  "1991-07-15",
  "male",
  "180",
  "75",
  "789 Oak St, Some City, USA",
  "+1 (555) 123-4567",
  "sports, music, reading",
  "true",
  "2023-05-03T09:30:00Z",
  "40.7128,-74.0060",
  "https://example.com/johnsmith",
  "14:30:00",
];

const weights = {
  // id: 2,
  name: 1.5,
  email: 1.5,
  date: 1,
  category: 1,
  number: 0.5,
  text: 1,
  phone_number: 1,
  tags: 1,
  boolean: 0.5,
  timestamp: 1,
  // coordinates: 1,
  url: 1,
  time: 0.5,
};

// const similarity = weightedSimilarity(data1, data2, weights);
// console.log(`Weighted similarity between the two datasets: ${similarity.toFixed(4)}`);

// Print individual comparisons
for (let i = 0; i < data1.length; i++) {
  const type = detectDataType(data1[i]);
  const comparisonResult = compareValues(data1[i], data2[i]);
  // console.log(`${type}: ${data1[i]} vs ${data2[i]} = ${comparisonResult.toFixed(4)}`);
}

function getMostCommonType(types) {
  return types.reduce(
    (acc, type) => {
      const count = types.filter((t) => t === type).length;
      return count > acc.count ? { type, count } : acc;
    },
    { type: null, count: 0 }
  ).type;
}

const exception = {
  text: ["name"],
  name: ["text"],
};

function comparator(table1, table2) {
  if (table1.length === 0 || table2.length === 0) {
    return false;
  }

  const columnCount = table1[0].length;
  if (columnCount !== table2[0].length) {
    return false;
  }

  const finalTypes = [];
  for (let col = 0; col < columnCount; col++) {
    const column1 = table1.map((row) => row[col]);
    const column2 = table2.map((row) => row[col]);

    // Check data type similarity only
    const type1 = getMostCommonType(column1.map(detectDataType));
    const type2 = getMostCommonType(column2.map(detectDataType));
    // console.log(type1, type2, column1, column2);
    if (type1 !== type2 && !exception[type1].includes(type2)) {
      return false;
    }
    finalTypes.push(type1);
  }

  // Values Comparision if all data types are similar
  // for (let col = 0; col < columnCount; col++) {
  //   const isTable1HasMoreData = table1.length > table2.length;
  //   const isTable2HasMoreData = table1.length < table2.length;

  //   // Remove extra rows from the table

  //   const column1 = isTable1HasMoreData
  //     ? table1.map((row) => row[col]).slice(0, table2.length)
  //     : table1.map((row) => row[col]);
  //   const column2 = isTable2HasMoreData
  //     ? table2.map((row) => row[col]).slice(0, table1.length)
  //     : table2.map((row) => row[col]);

  //   const similarity = weightedSimilarity(column1, column2, weights, finalTypes[col]);
  //   console.log(finalTypes[col], "|", similarity, "|", column1, column2);
  //   if (similarity < 0.6) {
  //     return false;
  //   }
  // }

  return true;
}

// Export functions
// euclideanDistance,
// manhattanDistance,
// cosineSimilarity,
// pearsonCorrelation,
// levenshteinDistance,
// jaccardSimilarity,
// diceCoefficient,
// hammingDistance,
// absoluteTimeDifference,
// relativeTimeDifference,
// categoricalHammingDistance,
// oneHotEncodingCosineSimilarity,
// weightedSimilarity,
// detectDataType,
// compareValues,
export { comparator };
