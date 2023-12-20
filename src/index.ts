setTimeout(main, 1000);

function main() {
  console.log("main");
  for (const video of document.getElementsByTagName(
    "ytd-playlist-video-renderer",
  )) {
    console.log("found");
    const button = document.createElement("button");
    button.textContent = "ぼたん";
    video.insertBefore(button, video.lastChild);
  }
}
