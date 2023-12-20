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
    button.textContent = "タイトルを調べる";
    button.onclick = async () => {
      console.log({ url, m: idMatch[1] });
      button.textContent = "...";
      const res = await fetch(url);
      const data: Response = await res.json();
      const snapshotUrl = data.archived_snapshots.closest.url;
      console.log({ snapshotUrl });

      const snapshot = await (await fetch(snapshotUrl)).text();
      const parser = new DOMParser();
      // Parse the raw HTML text into a new document
      const snapshotDOM = parser.parseFromString(snapshot, "text/html");
      console.log({ snapshotDOM });
      const titleMeta = Array.from(
        snapshotDOM.getElementsByTagName("meta"),
      ).find((meta) => meta.name === "title");
      if (titleMeta === undefined) {
        console.log("titleMeta was not found");
        return;
      }
      button.textContent = titleMeta.content;
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
