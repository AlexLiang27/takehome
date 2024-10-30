**Alex Liang**

**Workstream Take-Home Assignment**

October 29th, 2024

Typescript, Node.js, Postgresql

Reads the CSV file of phone numbers, formats them, and stores them in a Postgresql database table

Utilizes the libphonenumber-js library to parse and format phone numbers


**SETUP:**

REQUIRED PACKAGES: pg for Postgresql client, csv-parser for reading CSV files, libphonenumber-js for formatting phone numbers

npm install pg csv-parser libphonenumber-js

npm install typescript @types/node --save-dev

npx tsc --init


**Run the code with:**

npx tsc

node dist/importPhoneNumbers.js


**Notes**

Remember to change the connectionString and the parse region

If you want to drop (delete) the blacklist table, run this query in your pgAdmin sql terminal: DROP TABLE IF EXISTS blacklist

If you want to view the table on pgAdmin, run this query: SELECT * FROM blacklist
