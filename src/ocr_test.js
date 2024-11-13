import { comparator } from "./ocrImportUtils.js";

console.log(
  "--------------------------------------------------------------------------------------------------------------"
);

// prettier-ignore
const test_1 = {
  table1:  [
    ["11", "Fire", "123123123123123/0", "Group of John", "15/04/2025", "16,965.00", "11,196.00", "3,393.00", "Corporate"],
    ["11", "Car", "312312331231231/0", "Group of John", "15/04/2025", "10,500.00", "00.00", "525.00", "Corporate"]
  ],
  table2: [
    ["12", "Property", "312212331231231/0", "Town Industries", "11/04/2025", "399.00", "72.00", "59.85", "Industry"],
    ["12", "Property", "312412331231231/0", "Town Industries", "11/04/2025", "1,000.00", "180.00", "150.00", "Industry"],
    ["12", "Property", "312512331231231/0", "Town Industries", "11/04/2025", "18,198.00", "3,276.00", "2,729.70", "Industry"]
  ],
}

// Test 1
comparator(test_1.table1, test_1.table2);
console.log(
  "--------------------------------------------------------------------------------------------------------------"
);

// prettier-ignore
const test_2 = {
  table1: [
    ["1", "John Doe", "EM1", "Engineer", "12/04/2022", "12 Lacs"],
    ["2", "Doe Adam", "EM2", "Software", "16/04/2023", "34 Lacs"],
  ],
  table2: [
    ["1", "Adam Eve", "EM1111", "Engineer", "12/04/2022", "14 Lacs"],
    ["2", "Smith John", "EM22", "Software", "16/04/2023", "1 Crore"],
  ],
};

// Test 2
comparator(test_2.table1, test_2.table2);
console.log(
  "--------------------------------------------------------------------------------------------------------------"
);

// prettier-ignore
const test_3 = {
  table1: [
    // ['Patient Name', 'Age', 'DOB', 'Contact', 'ID'],
    ['John Doe', '30', '1993-05-15', 'john@example.com', 'ID123/123'],
    ['Jane Smith', '25', '1998-09-22', 'jane@example.com', 'ID123/124'],
    ['Bob Johnson', '40', '1983-12-01', 'bob@example.com', 'ID123/125']
  ],
  table2: [
    // ['Full Name', 'Years', 'DOB', 'Contact', 'ID'],
    ['Alice Brown', '28', '1995-07-10', 'alice@example.com', 'ID123/126'],
    ['Charlie Davis', '35', '1988-03-18', 'charlie@example.com', 'ID123/127'],
    ['Eva Wilson', '22', '2001-11-30', 'eva@example.com', 'ID123/128']
  ],
};

// Test 2
const res = comparator(test_3.table1, test_3.table2);

console.log(JSON.stringify(res));

console.log(
  "--------------------------------------------------------------------------------------------------------------"
);
