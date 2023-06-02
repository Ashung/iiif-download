const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const https = require('node:https');

module.exports.downloadIIIF = async (manifest, output, options) => {
    const images = await this.getImages(manifest, options);  
    const length = String(images.length).length;
    const threads = 10;
    const groups = [];
    const groupsCount = Math.ceil(images.length / threads);
    output = output || './disc';
    const task = async (image) => {
        const out = path.join(output, formatNumber(image.id, length) + '.jpg');
        if (!fs.existsSync(out)) {
            let f = await this.download(image.url, out);
            console.log(f);
        }
    };
    for (let i = 0; i < images.length; i += threads) {
        groups.push(images.slice(i, i + threads));
    }
    for (let i = 0; i < groupsCount; i++) {
        const tasks = groups[i].map(t => {
            return task(t);
        });
        await Promise.all(tasks);
    }
}

/*
    https://iiif.io/api/image/3.0/#21-image-request-uri-syntax
    region: full | square | x,y,w,h | pct:x,y,w,h
    size: max | ^max | w, | ^w, | ,h | ^,h | pct:n | ^pct:n | w,h | ^w,h | !w,h | ^!w,h
    rotation: n | !n
    quality: color | gray | bitonal | default
    format: jpg | tif | png | gif | jp2 | pdf | webp
*/

module.exports.getImages = async (manifest, options) => {
    const region = options.region || 'full';
    const size = options.size || '1000,';
    const rotation = options.rotation || '0';
    const quality = options.quality || 'default';
    const format = options.format || 'jpg';
    const images = [];
    const data = await getJSON(manifest);
    data.sequences[0].canvases.forEach((item, index) => {
        images.push({
            url: item.images[0].resource.service['@id'] + `/${region}/${size}/${rotation}/${quality}.${format}`,
            id: index + 1
        });
    });
    return images;
}

module.exports.download = (url, output) => {
    return new Promise ((resolve, reject) => {
        const protocol = url.charAt(4) === 's' ? https : http;
        protocol.get(url, data => {
            let buffer = [];
            data.on('data', chunk => {
                buffer.push(chunk);
            });
            data.on('end', () => {
                let _data = Buffer.from(buffer[0]);
                if (buffer.length > 1) {
                    for (let i = 1; i < buffer.length; i++) {
                        _data = Buffer.concat([_data, buffer[i]]);
                    }
                }
                let folder = path.dirname(output);
                if (!fs.existsSync(folder)) {
                    mkdir(folder);
                }
                fs.writeFile(output, _data, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(output);
                    }
                });
            });
        });
    });
}

function getJSON (url) {
    const protocol = url.charAt(4) === 's' ? https : http;
    return new Promise ((resolve, reject) => {
        protocol.get(url, res => {
            res.setEncoding('utf8');
            let rawData = '';
            res.on('data', (chunk) => {
                rawData += chunk;
            }).on('end', () => {
                try {
                    resolve(JSON.parse(rawData));
                } catch (e) {
                    reject(e);
                }
            });
        });
    });
}

function mkdir (dirname) {
    if (fs.existsSync(dirname)) {
        return true;
    } else {
        if (mkdir(path.dirname(dirname))) {
            fs.mkdirSync(dirname);
            return true;
        }
    }
}

function formatNumber (number, length) {
    let count = Math.max(0, length - String(number).length);
    return '0'.repeat(count) + number;
}
