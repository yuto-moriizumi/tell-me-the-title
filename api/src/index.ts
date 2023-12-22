import express, { json } from "express";
import cors from "cors";
import { JSDOM } from "jsdom";

const app = express();

app.get("/", (_, res) => {
  return res.status(200).json({ message: "Hello from root!" });
});

// ミドルウェア設定
app.use(json());
app.use(cors());

app.get<object, object, object, { url: string }>(
  "/snapshot",
  async (req, res) => {
    const snapshot = await (await fetch(req.query.url)).text();
    const snapshotDOM = new JSDOM(snapshot).window.document;
    const titleMeta = Array.from(snapshotDOM.getElementsByTagName("meta")).find(
      (meta) => meta.name === "title",
    );
    if (titleMeta === undefined)
      return res.status(400).send({ message: "title meta was not found" });
    res.send({ title: titleMeta.content });
  },
);

app.use((_, res) => {
  return res.status(404).json({ error: "Not Found" });
});

export { app };
