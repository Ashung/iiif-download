# IIIF Download

Node.js script for download images from IIIF manifest.

从 IIIF manifest 地址下载图片的 Node.js 脚本。

### 功能：

- 仅适用于开放的 IIIF manifest 地址和图片地址。
- 支持设置保存地址，默认为 “disc” 目录，图片自动命名为序号。
- 支持设置下载线程，默认为 10。
- 支持倒序下载，部分图书馆将古籍从左往右翻页扫描，导致古籍顺序颠倒。
- 支持 IIIF 图片 API 参数，部分网站可能不支持。

### 主要函数：

```javascript
// 下载 IIIF 图片
downloadIIIF (
    manifest: string, // manifest JSON 地址
    output?: string, // 默认为 './disc'
    threads?: number, // 默认为 10
    reverse?: boolean, // 默认为 false
    options?: APIOptions // IIIF 图片 API 参数
); // Promise<void>

// 批量下载图片
batchDownload (
    list: string[], // 图片地址数组
    output?: string, // 默认为 './disc'
    rename?: boolean, // 默认为 false
    threads?: number // 默认为 10
); // Promise<void>

// 获取 manifest 的图片地址
getImages (
    manifest: string, // manifest JSON 地址
    reverse?: boolean, // 默认为 false
    options?: APIOptions // IIIF 图片 API 参数
); // Promise<string[]> 返回所有图片的地址

// APIOptions IIIF 图片 API 参数
region?: string, // full | square | x,y,w,h | pct:x,y,w,h , 默认为 'full'
size?: string, // full | max | ^max | w, | ^w, | ,h | ^,h | pct:n | ^pct:n | w,h | ^w,h | !w,h | ^!w,h , 默认为 '1000,'
rotation?: string, // n | !n , 默认为 '0'
quality?: string, // color | gray | bitonal | default , 默认为 'default'
format?: string, // jpg | tif | png | gif | jp2 | pdf | webp , 默认为 'jpg'
```

### 示例：

一般下载。

```javascript
const { downloadIIIF } = require('iiif-download');
downloadIIIF('https://..../manifest');
```

命令行方运行方式  `node cmd "https:......" "./Books/ABC" 2000`。

```javascript
// cmd.js
const { downloadIIIF } = require('iiif-download');
const manifest = process.argv[2];
const output = process.argv[3] || './disc';
const width = process.argv[4] ? process.argv[4] + ',' : 'full';
downloadIIIF(manifest, output, undefined, true, {
    size: width
});
```

普林斯顿大学图书馆合辑类型图书下载。

```javascript
const { downloadIIIF } = require('iiif-download');
(async () => {
    const url = 'https://figgy.princeton.edu/.../manifest'
    const label = 'BOOKNAME';
    const res = await fetch(url);
    const json = await res.json();
    for (let i = 0; i < json.manifests.length; i++) {
        const manifest = json.manifests[i]['@id'];
        await downloadIIIF(manifest, `../${label}/${i+1}`, undefined, false, {
            size: 'full'
        });
    }
})();
```

