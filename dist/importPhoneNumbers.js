"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const pg_1 = require("pg");
const libphonenumber_js_1 = require("libphonenumber-js");
const connectionString = 'postgres://postgres:alexliang@localhost:5432/postgres'; // Update this with your database credentials
const client = new pg_1.Client({
    connectionString: connectionString,
});
// Function to create the blacklist table
function createTable() {
    return __awaiter(this, void 0, void 0, function* () {
        const createTableQuery = `
        CREATE TABLE IF NOT EXISTS blacklist (
            id SERIAL PRIMARY KEY,
            phone_number VARCHAR(15) NOT NULL UNIQUE
        );
    `;
        yield client.query(createTableQuery);
    });
}
function importPhoneNumbers() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield client.connect();
            // Create the table if it does not exist
            yield createTable();
            const phoneNumbers = [];
            fs.createReadStream('phone.csv')
                .pipe((0, csv_parser_1.default)({ headers: false }))
                .on('data', (row) => {
                const phoneNumberRaw = row[0];
                if (phoneNumberRaw) {
                    try {
                        const phoneNumber = (0, libphonenumber_js_1.parsePhoneNumber)(phoneNumberRaw, 'US'); // Adjust the region as necessary
                        const formattedNumber = phoneNumber.format('E.164');
                        phoneNumbers.push(formattedNumber);
                    }
                    catch (err) {
                        console.error(`Error parsing phone number "${phoneNumberRaw}":`, err);
                    }
                }
                else {
                    console.warn('Empty phone number found in CSV');
                }
            })
                .on('end', () => __awaiter(this, void 0, void 0, function* () {
                try {
                    if (phoneNumbers.length > 0) {
                        const values = phoneNumbers.map(num => `('${num}')`).join(',');
                        yield client.query(`INSERT INTO blacklist (phone_number) VALUES ${values}`);
                        console.log(`Inserted ${phoneNumbers.length} phone numbers.`);
                    }
                }
                catch (error) {
                    console.error('Error inserting phone numbers:', error);
                }
                finally {
                    yield client.end();
                }
            }));
        }
        catch (error) {
            console.error('Error importing phone numbers:', error);
        }
    });
}
importPhoneNumbers();
