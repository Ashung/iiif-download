// (c) 2023 Ashung.hung@foxmail.com
// Distributed under MIT License

const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const https = require('node:https');
const url = require('node:url');

const defaultOutput = './disc';
const defaultDowloadThreads = 10;
const defaultAPIOptions = {
    region: 'full',
    size: '1000,',
    rotation: '0',
    quality: 'default',
    format: 'jpg',
}

/**
 * 
 * @param {string} manifest 
 * @param {string} output // Defaults to './disc'
 * @param {number} threads // Defaults to 10
 * @param {boolean} reverse // Defaults to false
 * @param {APIOptions} options { region:'full', size:'1000,', rotation:'0', quality:'default', format:'jpg' } 
 */
module.exports.downloadIIIF = async (manifest, output = defaultOutput, threads = defaultDowloadThreads, reverse = false, options = undefined) => {
    const images = await this.getImages(manifest, reverse, options);
    console.log('count: ' + images.length);
    await this.batchDownload(images, output, true, threads);
}

/**
 * 
 * @param {Array} list [string]
 * @param {string} output // Defaults to './disc'
 * @param {boolean} rename // Defaults to false
 * @param {number} threads // Defaults to 10
 */
module.exports.batchDownload = async (list, output = defaultOutput, rename = false, threads = defaultDowloadThreads) => {
    const length = String(list.length).length;
    const images = list.map((item, index) => {
        let extname = item.substring(item.lastIndexOf('.')).toLowerCase();
        let filename = item.substring(item.lastIndexOf('/') + 1, item.lastIndexOf('.'));
        if (extname.startsWith('.jpeg')) {
            extname = '.jpeg';
        } else if (extname.startsWith('.png')) {
            extname = '.png';
        } else if (extname.startsWith('.webp')) {
            extname = '.webp';
        } else {
            extname = '.jpg';
        }
        let imageOutput = path.join(output, filename + extname);
        if (rename) {
            imageOutput = path.join(output, formatNumber(index + 1, length) + extname);
        }
        return {
            url: item,
            output: imageOutput
        }
    });
    if (threads > 1) {
        const groups = [];
        const groupsCount = Math.ceil(list.length / threads);
        const task = async (image) => {
            await download(image.url, image.output);
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
    } else {
        for (let i = 0; i < images.length; i ++) {
            const image = images[i];
            await download(image.url, image.output);
        }
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
/**
 * 
 * @param {string} manifest IIIF manifest url
 * @param {boolean} reverse Defaults to false
 * @param {APIOptions} options { region:'full', size:'1000,', rotation:'0', quality:'default', format:'jpg' }
 * @returns {Promise} [string]
 */
module.exports.getImages = async (manifest, reverse = false, options = undefined) => {
    const res = await fetch(manifest);
    if (res.status !== 200) {
        console.error(`Request Failed. Status Code: ${res.status}.`);
        return;
    }
    const data = await res.json();
    const images = [];
    data.sequences[0].canvases.forEach(item => {
        let url = item.images[0].resource['@id'];
        if (typeof options === 'object') {
            const { region, size, rotation, quality, format } = Object.assign(defaultAPIOptions, options);
            url = item.images[0].resource.service['@id'] + `/${region}/${size}/${rotation}/${quality}.${format}`;
        }
        images.push(url);
    });
    if (reverse) {
        images.reverse();
    }
    return images;
}

/**
 * 
 * @param {string} url 
 * @param {string} output 
 * @returns {Promise} string
 */
function download (url, output) {
    if (fs.existsSync(output)) {
        return;
    }
    return new Promise ((resolve, reject) => {
        const client = url.charAt(4) === 's' ? https : http;
        client.get(url, (res) => {
            if (res.statusCode === 200) {
                let folder = path.dirname(output);
                if (!fs.existsSync(folder)) {
                    mkdir(folder);
                }
                res.pipe(fs.createWriteStream(output))
                    .on('error', reject)
                    .once('close', () => {
                        resolve(output);
                        console.log(output);
                    });
            } else {
                // Consume response data to free up memory
                res.resume();
                reject(new Error(`Request Failed With a Status Code: ${res.statusCode}`));
            }
        });
    });
}

/**
 * 
 * @param {string} dirname 
 * @returns {boolean}
 */
function mkdir (dirname) {
    if (fs.existsSync(dirname)) {
        return true;
    } else {
        if (mkdir(path.dirname(dirname))) {
            fs.mkdirSync(dirname);
            return true;
        }
        return false;
    }
}

/**
 * 
 * @param {number} number 
 * @param {number} length 
 * @returns {string}
 */
function formatNumber (number, length) {
    let count = Math.max(0, length - String(number).length);
    return '0'.repeat(count) + number;
}
