import dayjs from "dayjs";

setInterval(main, 100);

function main() {
  for (const video of document.getElementsByTagName(
    "ytd-playlist-video-renderer",
  )) {
    if (video.children.length >= 4) return;
    const button = document.createElement("button");
    button.textContent = "Get title";
    button.onclick = async () => {
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
      button.textContent = "...";
      const res = await fetch(url, { mode: "cors" });
      const data: Response = await res.json();
      const snapshots = data.archived_snapshots;
      if (!("closest" in snapshots)) {
        showResult("Archive unavailable");
        button.textContent = "Get title";
        return;
      }
      const snapshotUrl = new URL(snapshots.closest.url);
      snapshotUrl.protocol = "https";
      const { title, message } = await (
        await fetch(
          `https://ior285nerb.execute-api.ap-northeast-1.amazonaws.com/snapshot?url=${snapshotUrl.toString()}`,
          { mode: "cors" },
        )
      ).json();
      showResult(title ?? message);
      button.textContent = "Get title";
    };
    video.insertBefore(button, video.lastChild);
  }
}

function showResult(text: string) {
  alert(text);
}

type Response = {
  archived_snapshots: {
    closest: {
      url: string;
    };
  };
};
