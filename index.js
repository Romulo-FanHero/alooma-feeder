/*****************************************************
 *
 * DATA LOADING SCRIPT FROM COMPRESSED FILES TO ALOOMA
 *
 * @Author: oakromulo (Romulo-FanHero)
 * @Date: 2017-11-21T14:33:19-02:00
 * @Email: romulo@fanhero.com
 * @Last modified by: oakromulo
 * @Last modified time: 2017-10-31T16:07:21-02:00
 * @License: MIT
 *
/*****************************************************/

// Dependencies
const promise = require('bluebird');

const fs = require('fs');
const mkdir = promise.promisify(fs.mkdir);
const readdir = promise.promisify(fs.readdir);
const readFile = promise.promisify(fs.readFile);
const open = promise.promisify(fs.open);
const close = promise.promisify(fs.close);

const zlib = require('zlib');
const unzip = promise.promisify(zlib.unzip);

const errHdl = require('./error.js');

const reqRetry = require('requestretry');
const post = promise.promisify(
    reqRetry.defaults({
        url: process.env.DESTINATION, // <-- ATTENTION
        headers: { 'Content-Type': 'application/json', accept: 'application/json' },
        timeout: 30000,
        pool: {
            maxSockets: Infinity
        },
        time: true,
        maxAttempts: 5, // try up to 5 times
        retryDelay: 5000, // wait for 5s before trying again
    }).post
);

// Constants
const MAX_CONCURRENCY = 10;

// Helpers
// non-blocking wait method
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

// Decompress binary file to string
const extractPayload = async file => {
    const bin = await readFile(`./data/dump/${file}`);
    return await unzip(bin);
};

// Write a payload to a POST request and return the timing achieved
// after the response was received
const postPackage = async payload => {
    const response = await post({ body: payload });
    return {
        attempts: response.attempts,
        startTime: new Date(response.timingStart).toISOString(),
        endTime: new Date(response.responseStartTime).toISOString(),
        elapsedSeconds: response.elapsedTime / 1000.0
    };
};

// Write an empty file to `path` to indicate success/fail
const writeEmptyFile = async path => (await close(await open(path, 'w')));

// Function to sequentially execute all steps above for a given `file`
const deliver = async file => {
    try {
        // Extract payload from file
        const payload = await extractPayload(file);

        // Send package and wait for response
        const response = await postPackage(payload);

        // Check response
        if (!response || !response.elapsedSeconds) {
            throw new Error('broken response');
        }

        // Signal success
        console.log(`${file} uploaded in ${response.elapsedSeconds}s at ${response.endTime}`)
        await writeEmptyFile(`./data/success/${file}`);
    }
    catch (err) {
        // Signal failure
        errHdl(err);
        await writeEmptyFile(`./data/success/${fail}`);
    }
};

// Create folders (if they don't exist) to store empty files
// in order to signal success/failure
const mkdirs = async () => {
    try { await mkdir('./data/success'); }
    catch (err) {}
    try { await mkdir('./data/fail'); }
    catch (err) {}
};

// Execute async main
const main = async () => {
    // Create folders for empty success/failure files
    await mkdirs();

    // Load list with all available files to be loaded
    const dumpFiles = await readdir('./data/dump');

    // Load list with all files that have already been written
    const successFiles = await readdir('./data/success');

    // List of files that still need to be loaded
    const files = dumpFiles.filter(f => successFiles.indexOf(f) < 0);

    // Wait 30s before trying to deliver files
    await wait(30000);

    // Try to deliver all files
    await promise.map(files, deliver, { concurrency:  MAX_CONCURRENCY });

    // End of execution message
    console.log('Execution finished gracefully');
};
main().catch(errHdl);
