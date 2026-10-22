import axios, { isAxiosError } from "axios";
import cors from "cors";
import express, { json } from "express";
import { JSDOM } from "jsdom";

const app = express();

app.get("/", (_, res) => {
  return res.status(200).json({ message: "Hello from root!" });
});

// ミドルウェア設定
app.use(json());
app.use(cors());

// meta タグから指定された content を取り出す(name / property 両対応)
function metaContent(document: Document, attribute: string, name: string) {
  const content = Array.from(document.getElementsByTagName("meta"))
    .filter((meta) => meta.getAttribute(attribute) === name)
    .map((meta) => meta.getAttribute("content") ?? "")
    .find((value) => value.trim() !== "");
  return content?.trim();
}

// <script> の文字列内で、start の { から釣り合う } までの JSON を切り出す
// タイトル文字列中に { } が含まれることがあるため、文字列リテラルはスキップする
function extractBalancedJson(text: string, start: number) {
  if (start === -1) throw new Error("object start not found");
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const char = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === "{") depth++;
    else if (char === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  throw new Error("unbalanced braces");
}

type YtInitialData = {
  contents?: {
    twoColumnWatchNextResults?: {
      results?: {
        results?: {
          contents?: Array<{
            videoPrimaryInfoRenderer?: {
              title?: { runs?: Array<{ text?: string }> };
            };
          }>;
        };
      };
    };
  };
};

// meta タグが空のスナップショット用に、動画ページ埋め込みの ytInitialData からタイトルを復元する
function extractInitialDataTitle(document: Document) {
  for (const script of document.querySelectorAll("script")) {
    const text = script.textContent ?? "";
    const marker = text.indexOf("ytInitialData");
    if (marker === -1) continue;
    try {
      const jsonStart = text.indexOf("{", marker);
      const data = JSON.parse(
        extractBalancedJson(text, jsonStart),
      ) as YtInitialData;
      const entries =
        data.contents?.twoColumnWatchNextResults?.results?.results?.contents ??
        [];
      for (const entry of entries) {
        const runs = entry.videoPrimaryInfoRenderer?.title?.runs;
        const title = runs
          ?.map((run) => run.text ?? "")
          .join("")
          .trim();
        if (title !== undefined && title !== "") return title;
      }
    } catch {
      // パースできない script は読み飛ばす
    }
  }
  return undefined;
}

// <title> タグから " - YouTube" の接尾辞を除いて取り出す
function extractHtmlTitle(document: Document) {
  const text = document.querySelector("title")?.textContent ?? "";
  const title = text.replace(/\s*- YouTube$/, "").trim();
  return title === "" ? undefined : title;
}

app.get<object, object, object, { url: string }>(
  "/snapshot",
  async (req, res) => {
    if (req.query.url === undefined || req.query.url === "") {
      return res.status(400).json({ message: "url query is required" });
    }

    try {
      const response = await axios.get<string>(req.query.url);
      const snapshotDOM = new JSDOM(response.data).window.document;

      // 優先順にタイトルを探す:
      // 1. meta タグ(旧スナップショット)
      // 2. ytInitialData(meta が空の新しめのスナップショット)
      // 3. <title> タグ
      const title =
        metaContent(snapshotDOM, "name", "title") ??
        metaContent(snapshotDOM, "property", "og:title") ??
        extractInitialDataTitle(snapshotDOM) ??
        extractHtmlTitle(snapshotDOM);

      if (title === undefined) {
        return res
          .status(404)
          .json({ message: "title was not found in snapshot" });
      }
      return res.send({ title });
    } catch (error) {
      if (isAxiosError(error)) {
        const status = error.response?.status;
        console.error(
          `failed to fetch snapshot: status=${status ?? "n/a"} url=${req.query.url}`,
        );
        if (status === 404) {
          return res.status(404).json({ message: "snapshot was not found" });
        }
        return res
          .status(502)
          .json({
            message: `failed to fetch snapshot (status: ${status ?? error.code})`,
          });
      }
      console.error(error);
      return res.status(500).json({ message: "failed to parse snapshot" });
    }
  },
);

app.use((_, res) => {
  return res.status(404).json({ error: "Not Found" });
});

export { app };
