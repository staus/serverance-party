const container = document.getElementById("container");
const prevButton = document.getElementById("prevChapter");
const nextButton = document.getElementById("nextChapter");
const chapterDisplay = document.getElementById("chapterDisplay");

let currentChapter = 0;
let intervalId = null;
let colorIndex = 0;
let peer = null;
let connections = new Set();
let localIP = null;

const chapters = [
  {
    colors: ["white"],
    interval: 1000,
  },
  {
    colors: ["red", "white"],
    interval: 1000,
  },
  {
    colors: ["red", "blue", "white"],
    interval: 500,
  },
  {
    colors: ["red", "blue"],
    interval: 250,
  },
];

// Get local IP address
async function getLocalIP() {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error("Error getting IP:", error);
    return "unknown";
  }
}

// Generate a network-aware peer ID
function generatePeerId(ip) {
  const random = Math.random().toString(36).substring(2, 8);
  return `${ip}-${random}`;
}

// Initialize PeerJS
async function initializePeer() {
  localIP = await getLocalIP();
  const peerId = generatePeerId(localIP);

  peer = new Peer(peerId, {
    host: "0.peerjs.com",
    port: 443,
    secure: true,
    debug: 3,
  });

  peer.on("open", (id) => {
    console.log("My peer ID is: " + id);
    // Display the ID somewhere visible for users to share
    const peerIdDisplay = document.createElement("div");
    peerIdDisplay.id = "peerIdDisplay";
    peerIdDisplay.style.position = "fixed";
    peerIdDisplay.style.top = "10px";
    peerIdDisplay.style.left = "10px";
    peerIdDisplay.style.padding = "10px";
    peerIdDisplay.style.background = "rgba(0,0,0,0.7)";
    peerIdDisplay.style.color = "white";
    peerIdDisplay.style.borderRadius = "5px";
    peerIdDisplay.textContent = `Your ID: ${id}`;
    document.body.appendChild(peerIdDisplay);

    // Try to connect to other peers on the same network
    tryConnectToNetworkPeers();
  });

  peer.on("connection", (conn) => {
    connections.add(conn);
    console.log("Connected to peer:", conn.peer);

    conn.on("data", (data) => {
      if (data.type === "chapter") {
        currentChapter = data.chapter;
        updateChapter();
      }
    });

    conn.on("close", () => {
      connections.delete(conn);
      console.log("Disconnected from peer:", conn.peer);
    });
  });
}

// Try to connect to other peers on the same network
async function tryConnectToNetworkPeers() {
  try {
    // Get the network prefix (first three octets of IP)
    const networkPrefix = localIP.split(".").slice(0, 3).join(".");

    // Try to connect to potential peers on the same network
    for (let i = 1; i < 255; i++) {
      const potentialPeerId = `${networkPrefix}.${i}-`;
      if (potentialPeerId !== peer.id) {
        try {
          const conn = peer.connect(potentialPeerId);
          connections.add(conn);

          conn.on("open", () => {
            console.log("Connected to peer:", potentialPeerId);
          });

          conn.on("data", (data) => {
            if (data.type === "chapter") {
              currentChapter = data.chapter;
              updateChapter();
            }
          });

          conn.on("close", () => {
            connections.delete(conn);
            console.log("Disconnected from peer:", potentialPeerId);
          });
        } catch (error) {
          // Ignore connection errors - they're expected for non-existent peers
        }
      }
    }
  } catch (error) {
    console.error("Error trying to connect to network peers:", error);
  }
}

function connectToPeer(peerId) {
  const conn = peer.connect(peerId);
  connections.add(conn);

  conn.on("open", () => {
    console.log("Connected to peer:", peerId);
  });

  conn.on("data", (data) => {
    if (data.type === "chapter") {
      currentChapter = data.chapter;
      updateChapter();
    }
  });

  conn.on("close", () => {
    connections.delete(conn);
    console.log("Disconnected from peer:", peerId);
  });
}

function updateChapter() {
  // Clear existing interval
  if (intervalId) {
    clearInterval(intervalId);
  }

  // Reset color index
  colorIndex = 0;

  // Update display
  chapterDisplay.textContent = `lvl ${currentChapter + 1}`;

  // Update button states
  prevButton.disabled = currentChapter === 0;
  nextButton.disabled = currentChapter === chapters.length - 1;

  // Set initial color
  container.style.backgroundColor = chapters[currentChapter].colors[0];

  // Start new interval
  intervalId = setInterval(() => {
    colorIndex = (colorIndex + 1) % chapters[currentChapter].colors.length;
    container.style.backgroundColor =
      chapters[currentChapter].colors[colorIndex];
  }, chapters[currentChapter].interval);

  // Broadcast the chapter change to all connected peers
  const data = { type: "chapter", chapter: currentChapter };
  connections.forEach((conn) => {
    if (conn.open) {
      conn.send(data);
    }
  });
}

function changeChapter(direction) {
  if (direction === "next" && currentChapter < chapters.length - 1) {
    currentChapter++;
  } else if (direction === "prev" && currentChapter > 0) {
    currentChapter--;
  }
  updateChapter();
}

// Event listeners
prevButton.addEventListener("click", () => changeChapter("prev"));
nextButton.addEventListener("click", () => changeChapter("next"));

// Add connection form
const connectionForm = document.createElement("div");
connectionForm.style.position = "fixed";
connectionForm.style.top = "10px";
connectionForm.style.right = "10px";
connectionForm.style.padding = "10px";
connectionForm.style.background = "rgba(0,0,0,0.7)";
connectionForm.style.color = "white";
connectionForm.style.borderRadius = "5px";

const input = document.createElement("input");
input.type = "text";
input.placeholder = "Enter peer ID";
input.style.marginRight = "5px";

const connectButton = document.createElement("button");
connectButton.textContent = "Connect";
connectButton.onclick = () => {
  if (input.value) {
    connectToPeer(input.value);
    input.value = "";
  }
};

connectionForm.appendChild(input);
connectionForm.appendChild(connectButton);
document.body.appendChild(connectionForm);

// Initialize
initializePeer();
updateChapter();
