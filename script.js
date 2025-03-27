const container = document.getElementById("container");
const prevButton = document.getElementById("prevChapter");
const nextButton = document.getElementById("nextChapter");
const chapterDisplay = document.getElementById("chapterDisplay");
const peerIdDisplay = document.getElementById("peerId");
const copyButton = document.getElementById("copyButton");
const connectionStatus = document.getElementById("connectionStatus");

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
    console.log("Got IP address:", data.ip);
    return data.ip;
  } catch (error) {
    console.error("Error getting IP:", error);
    return "unknown";
  }
}

// Generate a network-aware peer ID
function generatePeerId(ip) {
  // Convert IP to a valid format by removing dots and adding a random suffix
  const ipPart = ip.replace(/\./g, "");
  const random = Math.random().toString(36).substring(2, 8);
  const peerId = `peer${ipPart}${random}`;
  console.log("Generated peer ID:", peerId);
  return peerId;
}

// Initialize PeerJS
async function initializePeer() {
  console.log("Initializing peer...");
  localIP = await getLocalIP();
  const peerId = generatePeerId(localIP);

  peer = new Peer(peerId, {
    host: "0.peerjs.com",
    port: 443,
    secure: true,
    debug: 3,
    config: {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    },
  });

  peer.on("open", (id) => {
    console.log("Peer connection opened with ID:", id);
    // Set the peer ID display immediately
    peerIdDisplay.textContent = id;

    // Set up copy button functionality
    copyButton.onclick = () => {
      navigator.clipboard.writeText(id);
      copyButton.textContent = "Copied!";
      copyButton.style.background = "#45a049";
      setTimeout(() => {
        copyButton.textContent = "Copy ID";
        copyButton.style.background = "#4CAF50";
      }, 2000);
    };

    // Try to connect to other peers on the same network
    tryConnectToNetworkPeers();
  });

  // Add error handling
  peer.on("error", (error) => {
    console.error("PeerJS error:", error);
    peerIdDisplay.textContent = "Connection error";
  });

  peer.on("connection", (conn) => {
    connections.add(conn);
    console.log("Connected to peer:", conn.peer);
    updateConnectionStatus(connections.size);

    conn.on("data", (data) => {
      if (data.type === "chapter") {
        currentChapter = data.chapter;
        updateChapter();
      }
    });

    conn.on("close", () => {
      connections.delete(conn);
      console.log("Disconnected from peer:", conn.peer);
      updateConnectionStatus(connections.size);
    });
  });
}

// Try to connect to other peers on the same network
async function tryConnectToNetworkPeers() {
  try {
    // Get the network prefix (first three octets of IP)
    const networkPrefix = localIP.split(".").slice(0, 3).join("");

    // Try to connect to potential peers on the same network
    for (let i = 1; i < 255; i++) {
      const potentialPeerId = `peer${networkPrefix}${i}`;
      if (potentialPeerId !== peer.id) {
        try {
          const conn = peer.connect(potentialPeerId);
          connections.add(conn);

          conn.on("open", () => {
            console.log("Connected to peer:", potentialPeerId);
            updateConnectionStatus(connections.size);
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
            updateConnectionStatus(connections.size);
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

// Update the connection status display
function updateConnectionStatus(connectedPeers) {
  if (connectedPeers > 0) {
    connectionStatus.textContent = `Connected to ${connectedPeers} peer${
      connectedPeers > 1 ? "s" : ""
    }`;
    connectionStatus.style.color = "#4CAF50";
  } else {
    connectionStatus.textContent = "Searching for peers...";
    connectionStatus.style.color = "white";
  }
}

// Initialize
initializePeer();
updateChapter();
