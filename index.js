const Koa = require('koa');
const fs = require('fs');
const pt = require('path');
const app = new Koa();


app.use(async (ctx, next) => {
    let reg = /\/fileSystem(\S)*/g;
    if(reg.test(ctx.path)) {
        ctx.type = 'text/html';
        ctx.body = fs.createReadStream('./views/index.html');
    } else if(ctx.path === '/api/subfiles') {
        await next();
    }
});

app.use(async (ctx) => {
    const completePath = pt.resolve(__dirname, '..') + ctx.query.path;
    let res = {
        msg: 'ok',
        content: []
    };
    
    const content = await getSubFiles(completePath, ctx.query.path);
    content.length && (res.content = content);
    ctx.type = 'application/json;charset=utf-8';
    ctx.body = res;
})


async function getSubFiles(completePath, path){
    return new Promise((resolve, reject) => {
        fs.readdir(completePath, { withFileTypes: true }, (err, dirents) => {
            if(err) {
                reject(err);
            } else {
                const result = [];
                dirents.forEach((dirent) => {
                    const item = {
                        name: dirent.name,
                        size: 0,
                        type: '',
                        path: `${path}/${dirent.name}`
                    }
                    if(dirent.isDirectory()) {
                        item.type = 'dir';
                    } else if(dirent.isFile()) {
                        item.type = 'file';
                        const states = fs.statSync(`${completePath}/${dirent.name}`);
                        item.size = states.size;
                    }
                    result.push(item);
                });
                resolve(result);
            }
        });
        
    })
}

app.listen(3000, () => {
    console.log('正在监听3000端口...')
});