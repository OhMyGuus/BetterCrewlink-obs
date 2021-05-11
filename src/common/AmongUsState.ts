import { MODS } from "./ISettings";

export interface OverlayState {
	gameState: GameState;
	players: overlayPlayer[];

}

export interface overlayPlayer {
	id: number;
	clientId: number;
	inVent: boolean;
	isDead:boolean;
	name: string;
	colorId: number;
	hatId: number;
	petId: number;
	skinId: number;
	disconnected: boolean;
	isLocal: boolean;
	bugged: boolean;
	connected: boolean;
}

export enum GameState {
	LOBBY,
	TASKS,
	DISCUSSION,
	MENU,
	UNKNOWN,
}

export interface OtherTalking {
	[playerId: number]: boolean; // isTalking
}


export interface VoiceState {
	overlayState: OverlayState
	otherTalking: OtherTalking;
	otherDead: OtherTalking;
	localTalking: boolean;
	localIsAlive: boolean;
	mod: MODS;
}
