import express, { json } from "express";
import cors from "cors";

const app = express();

app.get("/", (_, res) => {
  return res.status(200).json({ message: "Hello from root!" });
});

// ミドルウェア設定
app.use(json());
app.use(cors());

app.get<{ url: string }>("/snapshot/:url", async (req, res) => {
  const snapshot = await (await fetch(req.params.url)).text();
  const parser = new DOMParser();
  // Parse the raw HTML text into a new document
  const snapshotDOM = parser.parseFromString(snapshot, "text/html");
  const titleMeta = Array.from(snapshotDOM.getElementsByTagName("meta")).find(
    (meta) => meta.name === "title",
  );
  if (titleMeta === undefined)
    return res.status(400).send({ message: "title meta was not found" });
  res.send({ title: titleMeta.textContent });
});

app.use((_, res) => {
  return res.status(404).json({ error: "Not Found" });
});

export { app };
