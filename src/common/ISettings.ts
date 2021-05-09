export type MODS = "NONE" | "TOWN_OF_IMPOSTORS" | "TOWN_OF_US";

export interface ISettings {
  compactOverlay: boolean;
  overlayPosition: string;
  meetingOverlay: boolean;
  serverURL: string;
  secretString: string | undefined;
  mod: MODS;
}
