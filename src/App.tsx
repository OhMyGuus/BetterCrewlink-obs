import React, { useEffect, useMemo, useRef, useState } from "react";
import { GameState, VoiceState, OverlayState } from "./common/AmongUsState";
import makeStyles from "@material-ui/core/styles/makeStyles";
import "./App.css";
import Avatar from "./Avatar";
import { ISettings, MODS } from "./common/ISettings";
import io from "socket.io-client";
import { Console } from "console";
import { playerColors } from "./common/cosmetics";

interface UseStylesProps {
  hudHeight: number;
}

interface signalData {
  to: string;
  data: VoiceState;
}

const useStyles = makeStyles(() => ({
  meetingHud: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
  },
  playerIcons: {
    width: "83.45%",
    height: "63.2%",
    left: "5%",
    top: "18.4703%",
    position: "absolute",
    display: "flex",
    "&>*:nth-child(odd)": {
      marginRight: "1.4885%",
    },
    "&>*:nth-child(even)": {
      marginLeft: "1.4885%",
    },
    flexWrap: "wrap",
  },
  icon: {
    width: "48.51%",
    height: "16.49%",
    borderRadius: ({ hudHeight }: UseStylesProps) => hudHeight / 100,
    transition: "opacity .1s linear",
    marginBottom: "2.25%",
    boxSizing: "border-box",
  },
}));

function useWindowSize() {
  const [windowSize, setWindowSize] = useState<[number, number]>([0, 0]);

  useEffect(() => {
    const onResize = () => {
      setWindowSize([window.innerWidth, window.innerHeight]);
    };
    window.addEventListener("resize", onResize);
    onResize();

    return () => window.removeEventListener("resize", onResize);
  }, []);
  return windowSize;
}

const iPadRatio = 854 / 579;
const query = new URLSearchParams(window.location.search.substring(1));
let loaded = false;
const App: React.FC = function () {
  const [voiceState, setVoiceState] = useState<VoiceState>({
    overlayState: {
      gameState: 0,
      players: [],
    },
    otherTalking: {},
    otherDead: {},
    localTalking: false,
    localIsAlive: false,
  });

  const [settings, setSettings] = useState<ISettings>({
    compactOverlay: false,
    overlayPosition: "right",
    meetingOverlay: true,
    serverURL: "",
    secretString: undefined,
    mod: "NONE",
  });

  const supportedmods = ["NONE", "TOWN_OF_IMPOSTORS", "TOWN_OF_US"];
  //   const socketRef = useRef<Socket | undefined>(undefined);
  useEffect(() => {
    let server = query.get("server");
    if (query.get("server")?.includes("://crewl.ink")) {
      server = "https://proxy.bettercrewl.ink";
    }
    const settings = {
      compactOverlay: query.get("compact") === "1",
      overlayPosition: query.get("position") || "right",
      meetingOverlay: query.get("meeting") === "1",
      serverURL: server || "https://bettercrewl.ink",
      secretString: query.get("secret") || undefined,
      mod: supportedmods.includes(query.get("mod") ?? "")
        ? (query.get("mod") as "NONE" | "TOWN_OF_IMPOSTORS" | "TOWN_OF_US")
        : "NONE",
    };
    setSettings(settings);
    if (!settings.secretString || settings.secretString?.length != 9) {
      loaded = true;
      return;
    }
    console.log("GOT SETTINGS: ", settings, settings.secretString.length);

    console.log("called useffect..");
    const socket = io(settings.serverURL, {
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("[socketIO] connect");
      socket.emit(
        "join",
        settings.secretString,
        Math.floor(Math.random() * 20 + 0),
        Math.floor(Math.random() * 396 + 59000)
      );
    });
    socket.on("disconnect", () => {
      console.log("[socketIO] disconnect");
    });

    socket.on("signal", (data: signalData) => {
      setVoiceState(data.data);
    });
    loaded = true;
  }, []);

  const colors = useMemo(() => {
    return playerColors[settings.mod];
  }, [settings.mod]);

  // console.log("update??", voiceState, loaded);
  if ((!settings.secretString || settings.secretString.length != 9) && loaded) {
    return (
      <>
        <h2 style={{ color: "black" }}>
          Hey, it seems that u didn't use the url from Bettercrewlink
        </h2>
      </>
    );
  }

  if (
    !loaded ||
    !settings ||
    !settings.secretString ||
    !voiceState ||
    !voiceState.overlayState ||
    voiceState.overlayState.gameState === GameState.MENU
  ) {
    // console.log(
    //   "error",
    //   settings,
    //   voiceState,
    //   voiceState.overlayState,
    //   voiceState.overlayState.gameState,
    //   voiceState.overlayState.gameState === GameState.MENU
    // );
    return null;
  }
  return (
    <>
      {settings.meetingOverlay &&
        voiceState.overlayState.gameState === GameState.DISCUSSION && (
          <MeetingHud
            gameState={voiceState.overlayState}
            voiceState={voiceState}
            colors={colors}
          />
        )}
      {settings.overlayPosition !== "hidden" && (
        <AvatarOverlay
          mod={settings.mod}
          voiceState={voiceState}
          gameState={voiceState.overlayState}
          position={settings.overlayPosition}
          compactOverlay={settings.compactOverlay}
        />
      )}
    </>
  );
};

interface AvatarOverlayProps {
  voiceState: VoiceState;
  gameState: OverlayState;
  position: ISettings["overlayPosition"];
  compactOverlay: boolean;
  mod: MODS;
}

const AvatarOverlay: React.FC<AvatarOverlayProps> = ({
  voiceState,
  gameState,
  position,
  compactOverlay,
  mod,
}: AvatarOverlayProps) => {
  const avatars: JSX.Element[] = [];
  const positionParse = position.replace("1", "");
  const isOnSide = positionParse == "right" || positionParse == "left";
  const showName =
    isOnSide &&
    (!compactOverlay || position === "right1" || position === "left1");
  const classnames: string[] = ["overlay-wrapper"];

  if (
    gameState.gameState == GameState.UNKNOWN ||
    gameState.gameState == GameState.MENU
  ) {
    classnames.push("gamestate_menu");
  } else {
    classnames.push("gamestate_game");
    classnames.push("overlay_postion_" + positionParse);
    if (compactOverlay || position === "right1" || position === "left1") {
      classnames.push("compactoverlay");
    }
    if (position === "left1" || position === "right1") {
      classnames.push("overlay_postion_" + position);
    }
  }
  const players = useMemo(() => {
    // console.log("updating players");
    if (!gameState.players) return null;
    const playerss = gameState.players
      .filter(
        (o) => !voiceState.localIsAlive || !voiceState.otherDead[o.clientId]
      )
      .slice()
      .sort((a, b) => {
        if (
          (a.disconnected || voiceState.otherDead[a.clientId]) &&
          (b.disconnected || voiceState.otherDead[a.clientId])
        ) {
          return a.id - b.id;
        } else if (a.disconnected || voiceState.otherDead[a.clientId]) {
          return 1000;
        } else if (b.disconnected || voiceState.otherDead[b.clientId]) {
          return -1000;
        }
        return a.id - b.id;
      });
    return playerss;
  }, [gameState.players]);
  // console.log(gameState.players);
  players?.forEach((player) => {
    if (
      !voiceState.otherTalking[player.clientId] &&
      !(player.isLocal && voiceState.localTalking) &&
      compactOverlay
    )
      return;
    // const peer = voiceState.playerSocketIds[player.clientId];

    if (!player.connected && !player.isLocal) return;
    const talking =
      !player.inVent &&
      (voiceState.otherTalking[player.clientId] ||
        (player.isLocal && voiceState.localTalking));

    // const audio = voiceState.audioConnected[peer];
    avatars.push(
      <div key={player.id} className="player_wrapper">
        <div>
          <Avatar
            mod={mod}
            key={player.id}
            // connectionState={!connected ? 'disconnected' : audio ? 'connected' : 'novoice'}
            player={player}
            showborder={isOnSide && !compactOverlay}
            connectionState={"connected"}
            talking={talking}
            borderColor="#2ecc71"
            isAlive={
              !voiceState.otherDead[player.clientId] ||
              (player.isLocal && !player.isDead)
            }
            size={100}
            lookLeft={
              !(positionParse === "left" || positionParse === "bottom_left")
            }
            overflow={isOnSide && !showName}
            showHat={true}
          />
        </div>
        {showName && (
          <span
            className="playername"
            style={{
              opacity:
                (position === "right1" || position === "left1") && !talking
                  ? 0
                  : 1,
            }}
          >
            <small>{player.name}</small>
          </span>
        )}
      </div>
    );
  });
  if (avatars.length === 0) return null;
  return (
    <div>
      <div className={classnames.join(" ")}>
        <div className="otherplayers">
          <div className="players_container playerContainerBack">{avatars}</div>
        </div>
      </div>
    </div>
  );
};

interface MeetingHudProps {
  gameState: OverlayState;
  voiceState: VoiceState;
  colors: string[][];
}

const MeetingHud: React.FC<MeetingHudProps> = ({
  voiceState,
  gameState,
  colors,
}: MeetingHudProps) => {
  const [width, height] = useWindowSize();

  let hudWidth = 0,
    hudHeight = 0;
  if (width / (height * 0.96) > iPadRatio) {
    hudHeight = height * 0.96;
    hudWidth = hudHeight * iPadRatio;
  } else {
    hudWidth = width;
    hudHeight = width * (1 / iPadRatio);
  }
  const classes = useStyles({ hudHeight });
  const players = useMemo(() => {
    if (!gameState.players) return null;
    return gameState.players.slice().sort((a, b) => {
      if ((a.disconnected || a.isDead) && (b.disconnected || b.isDead)) {
        return a.id - b.id;
      } else if (a.disconnected || a.isDead) {
        return 1000;
      } else if (b.disconnected || b.isDead) {
        return -1000;
      }
      return a.id - b.id;
    });
  }, [gameState.gameState]);
  if (!players || gameState.gameState !== GameState.DISCUSSION) return null;
  const overlays = players.map((player) => {
    return (
      <div
        key={player.id}
        className={classes.icon}
        style={{
          opacity:
            voiceState.otherTalking[player.clientId] ||
            (player.isLocal && voiceState.localTalking)
              ? 1
              : 0,
          boxShadow: `0 0 ${hudHeight / 100}px ${hudHeight / 100}px ${
            colors[player.colorId] ? colors[player.colorId][0] : "#C51111"
          }`,
        }}
      />
    );
  });

  while (overlays.length < 10) {
    overlays.push(
      <div
        key={`spacer-${overlays.length}`}
        className={classes.icon}
        style={{
          opacity: 0,
        }}
      />
    );
  }

  return (
    <div
      className={classes.meetingHud}
      style={{ width: hudWidth, height: hudHeight }}
    >
      <div className={classes.playerIcons}>{overlays}</div>
    </div>
  );
};

export default App;
