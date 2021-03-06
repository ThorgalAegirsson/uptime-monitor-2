/**
 * Library for storing and editing data
 * 
 */

// Deps
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import helpers from './helpers.js';


// FIX for __dirname non existing in ECMAScript modules
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Container for module
const lib = {};

// Base directory for the data folder
lib.baseDir = path.join(__dirname, '../.data/');

// Write data to a file
lib.create = async (dir, file, data, callback) => {
    // Open the file for writing

    // await fsPromises.open(`lib.baseDir${dir}/${file}.json`, 'wx');
    fs.open(`${lib.baseDir}${dir}/${file}.json`, 'wx', (err, fileDescriptor) => {
        if (!err && fileDescriptor) {
            // Convert data to a string
            const stringData = JSON.stringify(data);

            // Write to the file and close it
            fs.writeFile(fileDescriptor, stringData, err => {
                if (!err) {
                    // Close the file
                    fs.close(fileDescriptor, err => {
                        if (!err) {
                            callback(null);
                        } else {
                            callback('Error closing new file');
                        }
                    })
                } else {
                    callback('Error writing to a new file');
                }
            })

        } else {
            callback('Could not create a new file, it may already exist');
        }
    });
};

// Reading data from a file
lib.read = async (dir, file, callback) => {
    fs.readFile(`${lib.baseDir}${dir}/${file}.json`, 'utf8', (err, data) => {
        callback(err, helpers.parseJsonToObject(data));
    });
};

// Update data in a file
lib.update = async (dir, file, data, callback) => {
    //Open the file for writing
    fs.open(`${lib.baseDir}${dir}/${file}.json`, 'r+', (err, fileDescriptor) => {
        if (!err && fileDescriptor) {
            // Convert data to a string
            const stringData = JSON.stringify(data);

            // Truncate the file
            fs.ftruncate(fileDescriptor, err => {
                if (!err) {
                    fs.writeFile(fileDescriptor, stringData, err => {
                        if (!err) {
                            fs.close(fileDescriptor, err => {
                                if (!err) {
                                    callback(null);
                                } else {
                                    callback('Error closing existing file');
                                }
                            })
                        } else {
                            callback("Couldn't write to the existing file");
                        }
                    });
                } else {
                    callback('Error truncating file');
                }
            });
        } else {
            callback('Could not open the file for updating, it may not exist yet');
        }
    });
};

// Delete a file
lib.delete = async (dir, filename, callback) => {
    fs.unlink(`${lib.baseDir}${dir}/${filename}.json`, err => {
        if (!err) {
            callback(null);
        } else {
            callback('Error deleting file');
        }
    });
};
// get the list of filenames in a directory (monitor IDs)
lib.list = async (dir, callback) => {
    fs.readdir(`${lib.baseDir}${dir}/`, (err, fileNames) => {
        if (!err) {
            const monitors = fileNames.forEach(fileName => fileName.replace('.json', ''));
            callback(null, monitors);
        } else {
            callback("Couldn't get the list of filenames");
       }
    });
}

export default lib;

//===============================
// CONVERT TO ASYNC FUNCTIONS !!!
//===============================