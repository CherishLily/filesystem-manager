const Koa = require('koa');
const fs = require('fs');
const app = new Koa();


app.use(async (ctx, next) => {
    const path = ctx.path;
    if(path === '/api/subfiles') {
        await next();
    } else {
        ctx.type = 'text/html';
        ctx.body = fs.createReadStream('./views/index.html');
    }
});

app.use(async (ctx) => {
    let res = {
        msg: 'ok',
        content: []
    };
    
    let path = ctx.query.path;
    if(!path.endsWith('/')) {
        path = `${path}/`;
    }
    try {
        const dirents = fs.readdirSync(path, { withFileTypes: true });
        for (const dirent of dirents) {
            const item = {
                name: dirent.name,
                size: 0,
                type: '',
                path: `${path}${dirent.name}`
            }
            if(dirent.isDirectory()) {
                item.type = 'dir';
            } else if(dirent.isFile()) {
                item.type = 'file';
                const states = fs.statSync(`${path}${dirent.name}`);
                item.size = states.size;
            }
            res.content.push(item);
        }
        !res.content.length && (res.msg = '当前目录为空');
    } catch (e) {
        res.msg = '当前目录不存在或没有权限读取';
        console.log(e);
    }
    
    ctx.type = 'application/json;charset=utf-8';
    ctx.body = res;
})

app.listen(3000, () => {
    console.log('正在监听3000端口...')
});