const container = document.getElementById("container");
const prevButton = document.getElementById("prevChapter");
const nextButton = document.getElementById("nextChapter");
const chapterDisplay = document.getElementById("chapterDisplay");

let currentChapter = 0;
let intervalId = null;
let colorIndex = 0;

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

// Initialize
updateChapter();
