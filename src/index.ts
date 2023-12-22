import dayjs from "dayjs";
import { RequestMessage, ResponseMessage } from "./Message";

setTimeout(main, 1000);

function main() {
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
    button.textContent = "タイトルを調べる";
    button.onclick = async () => {
      button.textContent = "...";
      const res = await fetch(url, { mode: "cors" });
      const data: Response = await res.json();
      const snapshotUrl = new URL(data.archived_snapshots.closest.url);
      snapshotUrl.protocol = "https";

      const title = await new Promise<string>((resolve) => {
        chrome.runtime.sendMessage<RequestMessage, ResponseMessage>(
          { url: snapshotUrl.toString() },
          (response) => resolve(response.title),
        );
      });
      button.textContent = title;
    };

    video.insertBefore(button, video.lastChild);
  }
}

type Response = {
  archived_snapshots: {
    closest: {
      url: string;
    };
  };
};
