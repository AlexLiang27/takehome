// Alex Liang 
// Workstream Take-home assignment
// October 29th, 2024
// Typescript, Node.js, Postgresql
// Read CSV file of phone numbers, formats them, and stores them in Postgresql database

import * as fs from 'fs'; // node file system allows reading files from system
import csv from 'csv-parser'; // csv parser that reads csv files and outputs each row
import { Client } from 'pg'; // a postgresql client for node to interact with the db 
import { parsePhoneNumber } from 'libphonenumber-js'; // a library to parse and format phone numbers

const connectionString = 'postgres://postgres:alexliang@localhost:5432/postgres';
// format - postgres://username:password@host:port/database

// Creates Postgresql client instance with the connectionSring 
const client = new Client({ 
    connectionString: connectionString,
});

// Function to create the blacklist table in the db
async function createTable() { // sql query: primary key id, not null and unique
    const createTableQuery = `   
        CREATE TABLE IF NOT EXISTS blacklist (
            id SERIAL PRIMARY KEY,
            phone_number VARCHAR(15) NOT NULL UNIQUE
        );
    `;
    await client.query(createTableQuery);
}

// Imports the phone numbers from csv and inserts into db
async function importPhoneNumbers() {
    try {
        await client.connect();

        // Create the table if it does not exist
        await createTable();

        const phoneNumbers: string[] = []; // empty array to store the formatted phone numbers

        fs.createReadStream('phone.csv') // reads the csv file
            .pipe(csv({ headers: false })) // no header in the csv file
            .on('data', (row) => { // for each row in the csv file, 
                const phoneNumberRaw = row[0]; // extracts the phone number from the first col as phoneNumberRaw

                if (phoneNumberRaw) { // if extracted is not empty,
                    try {
                        const phoneNumber = parsePhoneNumber(phoneNumberRaw, 'US'); // parses the phone number using USA as region for the +1
                        const formattedNumber = phoneNumber.format('E.164'); // formats to E.164 as required
                        phoneNumbers.push(formattedNumber); // pushes it into the phoneNumbers array
                    } catch (err) { // if parsing fails, catch the error and print
                        console.error(`Error parsing phone number "${phoneNumberRaw}":`, err);
                    }
                } else {
                    console.warn('Empty phone number found in CSV'); // if phone number is empty, print
                }
            })
            .on('end', async () => { // when all rows are processed,
                try {
                    if (phoneNumbers.length > 0) { // if there are phone numbers in the array to insert,
                        const values = phoneNumbers.map(num => `('${num}')`).join(','); 
                        // map the phone numbers in the array to sql insertion format with parentheses because sql VALUES requires this format to interpret
                        // each entry as a seperate row -> ('+15556335980'), ('+15558794580)
                        await client.query(`INSERT INTO blacklist (phone_number) VALUES ${values}`); // sql query to insert the formatted phone numbers into blacklist table
                        console.log(`Inserted ${phoneNumbers.length} phone numbers`);
                    }
                } catch (error) {
                    console.error('Error inserting phone numbers:', error); // catches errors during insertion
                } finally {
                    await client.end(); // close db connection
                }
            });
    } catch (error) { // catches any errors during the function
        console.error('Error importing phone numbers:', error);
    }
}

importPhoneNumbers(); // calls the importPhoneNumbers function