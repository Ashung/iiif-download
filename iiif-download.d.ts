interface APIOptions {
    region?: string, // full | square | x,y,w,h | pct:x,y,w,h , Defaults to 'full'
    size?: string, // full | max | ^max | w, | ^w, | ,h | ^,h | pct:n | ^pct:n | w,h | ^w,h | !w,h | ^!w,h , Defaults to '1000,'
    rotation?: string, // n | !n , Defaults to '0'
    quality?: string, // color | gray | bitonal | default , Defaults to 'default'
    format?: string, // jpg | tif | png | gif | jp2 | pdf | webp , Defaults to 'jpg'
}

declare function getImages (
    manifest: string,
    reverse?: boolean, // defaults to false
    options?: APIOptions
): Promise<string[]>;

declare function batchDownload (
    list: string[],
    output?: string, // Defaults to './disc'
    rename?: boolean, // Defaults to false
    threads?: number // Defaults to 10
): Promise<void>;

declare function downloadIIIF (
    manifest: string,
    output?: string, // Defaults to './disc'
    threads?: number, // Defaults to 10
    reverse?: boolean, // Defaults to false
    options?: APIOptions
): Promise<void>;

export {}