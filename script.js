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

function calculateNextStartTime(interval) {
  const now = Date.now();
  const nextStart = Math.ceil(now / interval) * interval;
  return nextStart;
}

function calculateCurrentColorIndex(interval, colors) {
  const now = Date.now();
  const startTime = Math.floor(now / interval) * interval;
  const elapsed = now - startTime;
  const step = Math.floor(elapsed / interval);
  return step % colors.length;
}

function updateChapter() {
  // Clear existing interval
  if (intervalId) {
    clearInterval(intervalId);
  }

  // Update display
  chapterDisplay.textContent = `lvl ${currentChapter + 1}`;

  // Update button states
  prevButton.disabled = currentChapter === 0;
  nextButton.disabled = currentChapter === chapters.length - 1;

  const currentChapterConfig = chapters[currentChapter];
  const nextStartTime = calculateNextStartTime(currentChapterConfig.interval);

  // Calculate current color index based on time
  colorIndex = calculateCurrentColorIndex(
    currentChapterConfig.interval,
    currentChapterConfig.colors
  );

  // Set initial color based on current time
  container.style.backgroundColor = currentChapterConfig.colors[colorIndex];

  // Calculate delay until next start time
  const delay = nextStartTime - Date.now();

  // Start new interval after the delay
  setTimeout(() => {
    // Set initial color at start time
    container.style.backgroundColor = currentChapterConfig.colors[0];

    // Start the regular interval
    intervalId = setInterval(() => {
      colorIndex = (colorIndex + 1) % currentChapterConfig.colors.length;
      container.style.backgroundColor = currentChapterConfig.colors[colorIndex];
    }, currentChapterConfig.interval);
  }, delay);
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
