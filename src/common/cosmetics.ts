// @ts-ignore
import redAliveimg from '../static/images/avatar/placeholder.png'; // @ts-ignore
//import rainbowAliveimg from '../static/images/avatar/rainbow-alive.png'; // @ts-ignore
//import rainbowDeadeimg from '../static/images/avatar/rainbow-dead.png';
import playerEmpty from '../static/images/generate/player.png';
import ghostEmpty from '../static/images/generate/ghost.png';

import { ModsType } from './AmongUsState';
import { GenerateResource } from './AvatarGenerator';

export const redAlive = redAliveimg;

export enum cosmeticType {
	base,
	hat,
	hat_back,
}

interface hatData {
	image: string;
	back_image: string;
	top: string | undefined;
	width: string | undefined;
	left: string | undefined;
	multi_color: boolean | undefined;
	mod: ModsType | undefined;
}
let hatCollection: {
	[mod: string]: {
		defaultWidth: string;
		defaultTop: string;
		defaultLeft: string;
		hats: {
			[id: string]: hatData;
		};
	};
} = {};

export interface HatDementions {
	top: string;
	left: string;
	width: string;
}

let requestingHats = false;
export var initializedHats = false;

export function initializeHats() {
	if (initializedHats || requestingHats) {
		return;
	}
	requestingHats = true;
	fetch(`${HAT_COLLECTION_URL}/hats.json`)
		.then((response) => response.json())
		.then((data) => {
			hatCollection = data;
			initializedHats = true;
		});
	return undefined;
}

const HAT_COLLECTION_URL = 'https://raw.githubusercontent.com/OhMyGuus/BetterCrewlink-Hats/master';
async function getModHat(color: string[], id = '', mod: ModsType, back = false) {
	if (!initializedHats) {
		return '';
	}
	const hatBase = getHat(id, mod);
	const hat = back ? hatBase?.back_image : hatBase?.image;
	const multiColor = hatBase?.multi_color;
	if (hat && hatBase) {
		if (!multiColor) return `${HAT_COLLECTION_URL}/${hatBase.mod}/${hat}`;
		else return await GenerateResource(`${HAT_COLLECTION_URL}/${hatBase.mod}/${hat}`, color);
	}
	return undefined;
}

function getHat(id: string, modType: ModsType): hatData | undefined {
	if (!initializedHats) {
		return undefined;
	}
	for (const mod of ['NONE' as ModsType, modType]) {
		const modHatList = hatCollection[mod];
		const hat = modHatList?.hats[id];
		if (hat) {
			hat.top = hat?.top ?? modHatList?.defaultTop;
			hat.width = hat?.width ?? modHatList?.defaultWidth;
			hat.left = hat?.left ?? modHatList?.defaultLeft;
			hat.mod = mod;
			return hat;
		}
	}
	return undefined;
}

export function getHatDementions(id: string, mod: ModsType): HatDementions {
	const hat = getHat(id, mod);
	return {
		top: hat?.top ?? '0',
		width: hat?.width ?? '0',
		left: hat?.left ?? '0',
	};
}
export async function getCosmetic(
	realColor: string[],
	isAlive: boolean,
	type: cosmeticType,
	id = '',
	mod: ModsType = 'NONE'
): Promise<string> {
	if (type === cosmeticType.base) {
		return await GenerateResource(isAlive ? playerEmpty : ghostEmpty, realColor);
	} else {
		const modHat = await getModHat(realColor, id, mod, type === cosmeticType.hat_back);
		if (modHat) return modHat;
	}
	return '';
}
