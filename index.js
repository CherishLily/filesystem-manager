#!/usr/bin/env node

const Koa = require('koa');
const fs = require('fs');
const pt = require('path');
const send = require('koa-send');
const koaBody = require('koa-body');
const child_process = require('child_process');
const app = new Koa();


console.log('当前执行的node路径:', process.execPath)
console.log('代码存放的位置:', __dirname)
console.log('当前执行程序的路径:', process.cwd())

app.use(koaBody({
    multipart: true,
    formidable: {
        maxFieldsSize: 200*1024*1024  // 200MB (该字段默认是2MB)
    }

}))

app.use(async (ctx, next) => {
    const path = ctx.path;
    if(path === '/api/subfiles') {
        await next();
    }
    else if(path === '/api/upload') {
        // TODO文件上传
        console.log('files:', ctx.request.files);
        const file = ctx.request.files.file;
        console.log('file path:', file.path);
        const readStream = fs.createReadStream(file.path);
        const splitNames = file.name.split('.');
        const ext = splitNames.pop();
        const fileName = `${splitNames.join('.')}_${Math.ceil((Math.random() * 10000)).toString()}.${ext}`;

        const writeableStream = fs.createWriteStream(`upload/${fileName}`);
        readStream.pipe(writeableStream);
        ctx.body = {
            msg: '上传成功'
        };
    }
    else {
        try {
            if(fs.statSync(path).isFile()) {
                await send(ctx, pt.resolve(__dirname, path), {
                    root: '/',
                    hidden: false
                });
            } else {
                ctx.type = 'text/html';
                ctx.body = fs.createReadStream(__dirname + '/views/index.html');
            }
            
        } catch (err) {
            ctx.body = '没有该文件或目录';
        }
    }
});

app.use(async (ctx) => {
    let res = {
        msg: 'ok',
        content: []
    };
    
    let path = ctx.query.path;
    try {
        const stat = fs.statSync(path);
        if(stat.isFile()) {
            // 传输文件
            await send(ctx, pt.resolve(__dirname, path), {
                root: '/',
                hidden: true
            });
            return;
        } else if(stat.isDirectory()) {
            // 返回该目录下的文件信息
            if(!path.endsWith('/')) {
                path = `${path}/`;
            }
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

        }
    } catch (e) {
        res.msg = '当前目录不存在或没有权限读取';
        console.log(e);
    }
    
    ctx.type = 'application/json;charset=utf-8';
    ctx.body = res;
})

app.listen(3000, () => {
    child_process.exec(`open http://localhost:3000/`)
    console.log('正在监听3000端口...')
});