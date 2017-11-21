// Dependencies
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const errHdl = require('./error.js');

// non-blocking wait method
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

// register global error handler
process.on('uncaughtException', errHdl);

new Koa()
    .use(bodyParser())
    .use(async (ctx, next) => {
        console.log('request received');
        console.log(JSON.stringify(ctx.request.body));
        ctx.body = { status: 'ok' };
        await wait(5000);
        console.log('response sent');
        next();
    })
    .listen(8088);
