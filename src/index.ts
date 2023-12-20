import dayjs from "dayjs";

setTimeout(main, 1000);

function main() {
  console.log("main");
  for (const video of document.getElementsByTagName(
    "ytd-playlist-video-renderer",
  )) {
    const link = video.getElementsByTagName("a").item(0);
    if (link === null) return;
    // /watch?v=AOeY-nDp7hI&list=PLWJXk4kYouBSBs073FXlFcRwmd60Bubck&index=21&pp=gAQBiAQB8AUB
    const idMatch = link.toString().match(/\/watch\?v=(.*?)&/);
    if (idMatch === null) {
      console.error("failed to extract id");
      return;
    }
    const url = `https://archive.org/wayback/available?url=https://www.youtube.com/watch?v=${
      idMatch[1]
    }&timestamp=${dayjs().add(-1, "year").format("YYYYMMDD")}`;

    const button = document.createElement("button");
    button.textContent = "ぼたん";
    button.onclick = async () => {
      console.log({ url, m: idMatch[1] });
      try {
        const res = await fetch(url);
        console.log({ res });
      } catch (error) {
        console.log({ error });
      }
    };
    video.insertBefore(button, video.lastChild);
  }
}
