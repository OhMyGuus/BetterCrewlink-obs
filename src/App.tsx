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
  height: number;
  width: number;
  oldHud: boolean;
}

interface signalData {
  to: string;
  data: VoiceState;
}

const useStyles = makeStyles(() => ({
  meetingHud: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: ({ width }: UseStylesProps) => width,
    height: ({ height }: UseStylesProps) => height,
    transform: 'translate(-50%, -50%)',
  },
  tabletContainer: {
    width: ({ oldHud }: UseStylesProps) => (oldHud ? '88.45%' : '100%'),
    height: '10.5%',
    left: ({ oldHud }: UseStylesProps) => (oldHud ? '4.7%' : '0.4%'),
    top: ({ oldHud }: UseStylesProps) => (oldHud ? '18.4703%' : '15%'),
    position: 'absolute',
    display: 'flex',
    flexWrap: 'wrap',
  },
  playerContainer: {
    width: ({ oldHud }: UseStylesProps) => (oldHud ? '46.41%' : '30%'),
    height: ({ oldHud }: UseStylesProps) => (oldHud ? '100%' : '109%'),
    borderRadius: ({ height }: UseStylesProps) => height / 100,
    transition: 'opacity .1s linear',
    marginBottom: ({ oldHud }: UseStylesProps) => (oldHud ? '2%' : '1.9%'),
    marginRight: ({ oldHud }: UseStylesProps) => (oldHud ? '2.34%' : '0.23%'),
    marginLeft: ({ oldHud }: UseStylesProps) => (oldHud ? '0%' : '2.4%'),
    boxSizing: 'border-box',
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
    mod: "NONE"
  });

  const [settings, setSettings] = useState<ISettings>({
    compactOverlay: false,
    overlayPosition: "right",
    meetingOverlay: true,
    serverURL: "",
    secretString: undefined
  });

  const supportedmods = ["NONE", "TOWN_OF_IMPOSTORS", "TOWN_OF_US", "OTHER_ROLES"];
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
    return playerColors[voiceState.mod];
  }, [voiceState.mod]);

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
          mod={voiceState.mod}
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
            key={player.id}
            // connectionState={!connected ? 'disconnected' : audio ? 'connected' : 'novoice'}
            player={player}
            showborder={isOnSide && !compactOverlay}
            muted={player.isLocal}
            deafened={player.isLocal}
            connectionState={'connected'}
            talking={talking}
            borderColor="#2ecc71"
            isAlive={!voiceState.otherDead[player.clientId] || (player.isLocal && !player.isDead)}
            size={100}
            lookLeft={!(positionParse === 'left' || positionParse === 'bottom_left')}
            overflow={isOnSide && !showName}
            showHat={true}
            mod={voiceState.mod}
          />
        </div>
        {showName && (
          <span
            className="playername"
            style={{
              opacity: (position === 'right1' || position === 'left1') && !talking ? 0 : 1,
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
  const [windowWidth, windowheight] = useWindowSize();
	const [width, height] = useMemo(() => {
		let resultW;
		let ratio_diff = Math.abs(windowWidth / windowheight - 1.7);

		if (ratio_diff < 0.25) {
			resultW = windowWidth / 1.192
		} else if (ratio_diff < 0.5) {
			resultW = windowWidth / 1.146
		} else {
			resultW = windowWidth / 1.591;
		}

		let resultH = resultW / 1.72;
		// console.log("Ratio: ", windowWidth, windowheight, ratio.toFixed(1), ratio, Math.round(ratio * 10) / 10, Math.abs(ratio - 1.7))
		return [resultW, resultH];
	}, [windowWidth, windowheight]);

	const classes = useStyles({
		width: width,
		height: height,
		oldHud: false
	});
  
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
    const color = colors[player.colorId] ? colors[player.colorId][0] : '#C51111';

    return (
      <div
        key={player.id}
        className={classes.playerContainer}
        style={{
          opacity: voiceState.otherTalking[player.clientId] || (player.isLocal && voiceState.localTalking) ? 1 : 0,
          border: 'solid',
          borderWidth: '2px',
          borderColor: '#00000037',
          boxShadow: `0 0 ${height / 100}px ${height / 100}px ${color}`,
          transition: 'opacity 400ms',
        }}
      />
    );
  });

  return (
    <div className={classes.meetingHud}>
      <div className={classes.tabletContainer}>{overlays}</div>
    </div>
  ); 

};

export default App;
