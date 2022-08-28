export interface OverlayState {
	gameState: GameState;
	players: overlayPlayer[];

}

export interface overlayPlayer {
	id: number;
	clientId: number;
	inVent: boolean;
	isDead: boolean;
	name: string;
	colorId: number;
	hatId: string;
	petId: string;
	skinId: string;
	visorId: string;
	disconnected: boolean;
	isLocal: boolean;
	bugged: boolean;
	connected: boolean;
	realColor: string[];
	shiftedColor: number;
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
	mod: ModsType;
}


export type ModsType =
	| 'NONE'
	| 'TOWN_OF_IMPOSTORS'
	| 'TOWN_OF_US'
	| 'THE_OTHER_ROLES'
	| 'EXTRA_ROLES'
	| 'POLUS_GG'
	| 'OTHER';