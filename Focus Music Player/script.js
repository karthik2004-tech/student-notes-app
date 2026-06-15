const audioPlayer = document.getElementById("audioPlayer");
const trackInfo = document.getElementById("trackInfo");
const timerDisplay = document.getElementById("timerDisplay");

let tracks = [
  { name: "Lo-Fi Chill", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { name: "Rain Sounds", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { name: "White Noise", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" }
];

let currentTrackIndex = 0;
let timerInterval;
let remainingSeconds = 0;

function loadTrack(index) {
  currentTrackIndex = index;
  audioPlayer.src = tracks[index].src;
  trackInfo.textContent = `Track: ${tracks[index].name}`;
}

function togglePlay() {
  if (audioPlayer.paused) {
    audioPlayer.play();
  } else {
    audioPlayer.pause();
  }
}

function prevTrack() {
  currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
  loadTrack(currentTrackIndex);
  audioPlayer.play();
}

function nextTrack() {
  currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
  loadTrack(currentTrackIndex);
  audioPlayer.play();
}

function setVolume(value) {
  audioPlayer.volume = value;
}

function startTimer() {
  const minutes = parseInt(document.getElementById("timerInput").value);
  if (!minutes || minutes <= 0) {
    alert("Please enter a valid number of minutes.");
    return;
  }
  remainingSeconds = minutes * 60;
  updateTimerDisplay();
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    remainingSeconds--;
    updateTimerDisplay();
    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      alert("Study session complete!");
    }
  }, 1000);
}

function resetTimer() {
  clearInterval(timerInterval);
  timerDisplay.textContent = "Timer: --";
}

function updateTimerDisplay() {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  timerDisplay.textContent = `Timer: ${minutes}m ${seconds}s`;
}

// Load first track on startup
loadTrack(0);
