export type MODS = "NONE" | "TOWN_OF_IMPOSTORS" | "TOWN_OF_US" | "THE_OTHER_ROLES";

export interface ISettings {
  compactOverlay: boolean;
  overlayPosition: string;
  meetingOverlay: boolean;
  serverURL: string;
  secretString: string | undefined;
}
