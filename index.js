// Dependencies
const promise = require('bluebird');
const readdir = promise.promisify(require('fs').readdir);
const errHdl = require('./error.js');

// Constants
const CONCURRENCY = 10;

// #10 Carregar lista de arquivos que estão em ./data/dump mas não estão em ./data/success
// #20 Efetuar um request por arquivo da lista #1 para o endpoint migration_batch no Alooma (p.s. max. ~10reqs/s de 100 rows cada)
// #25 Em caso de erro no request escrever arquivo em branco em ./data/fail
// #30 Para cada arquivo escrito com sucesso escrever um arquivo em branco com o mesmo nome em ./data/success
// #40 Após o final da execução verificar se o número de arquivos em .data/dump é o mesmo que .data/success

const main = async () => {

    // Load list with all available files to be loaded
    const dumpFiles = await readdir('./data/dump');

    // Load list with awll files that have already been written
    const successFiles = await readdir('./data/success');

    // List of files that still need to be loaded
    const files = dumpFiles.filter(x => successFiles.indexOf(x) < 0);

    await promise.map(files, async f => {

    }, { concurrency: CONCURRENCY });

main().catch(errHdl);
