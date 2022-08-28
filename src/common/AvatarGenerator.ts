import Color from 'color';
import jimp from 'jimp';

export const DEFAULT_PLAYERCOLORS = [
    ['#C51111', '#7A0838'],
    ['#132ED1', '#09158E'],
    ['#117F2D', '#0A4D2E'],
    ['#ED54BA', '#AB2BAD'],
    ['#EF7D0D', '#B33E15'],
    ['#F5F557', '#C38823'],
    ['#3F474E', '#1E1F26'],
    ['#FFFFFF', '#8394BF'],
    ['#6B2FBB', '#3B177C'],
    ['#71491E', '#5E2615'],
    ['#38FEDC', '#24A8BE'],
    ['#50EF39', '#15A742'],
];

export function pathToHash(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}

export function numberToColorHex(colour: number): string {
    return (
        '#' +
        (colour & 0x00ffffff)
            .toString(16)
            .padStart(6, '0')
            .match(/.{1,2}/g)
            ?.reverse()
            .join('')
    );
}

function rgb2hsv(r: number, g: number, b: number) {
    let v = Math.max(r, g, b), c = v - Math.min(r, g, b);
    let h = c && ((v == r) ? (g - b) / c : ((v == g) ? 2 + (b - r) / c : 4 + (r - g) / c));
    return [60 * (h < 0 ? h + 6 : h), v && c / v, v];
}

function isBetween(h: number, h1: number, maxdiffrence: number) {
    return 180 - Math.abs(Math.abs(h - h1) - 180) < maxdiffrence;
}

async function colorImage(img: jimp, originalData: Uint8Array, color: string, shadow: string) {
    img.bitmap.data = new Uint8Array(originalData) as Buffer;
    for (let i = 0, l = img.bitmap.data.length; i < l; i += 4) {
        const data = img.bitmap.data;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        //   let alpha = data[i + 3];
        const h = rgb2hsv(r, g, b);

        if ((h[1] > 0.4) && (isBetween(h[0], 240, 30) || isBetween(h[0], 0, 100) || isBetween(h[0], 120, 20))) { //  )

            const pixelColor = Color('#000000')
                .mix(Color(shadow), b / 255)
                .mix(Color(color), r / 255)
                .mix(Color('#9acad5'), g / 255);
            data[i] = pixelColor.red();
            data[i + 1] = pixelColor.green();
            data[i + 2] = pixelColor.blue();
        }
    }
    return await img.getBase64Async("image/png");
}

export async function GenerateResource(imagePath: string, realColor: string[]): Promise<string> {
    try {
        if (realColor.length < 2) {
            realColor = ["#000", "#000"];
        }
        const img = await jimp.read(imagePath);
        const originalData = new Uint8Array(img.bitmap.data);
        const color = realColor[0];
        const shadow = realColor[1];
        console.log("Generating hat: ", imagePath);
        return await colorImage(img, originalData, color, shadow);
        // }
        // return temp;
    } catch (exception) {
        console.log('error while generating the avatars..', exception);
        return '';
    }
}
