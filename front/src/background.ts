/* eslint-disable @typescript-eslint/no-unused-vars */
import { RequestMessage, ResponseMessage } from "./Message";

chrome.runtime.onMessage.addListener(
  (
    req: RequestMessage,
    _sender,
    sendResponse: (responce: ResponseMessage) => void,
  ) => {
    (async () => {
      try {
        const snapshot = await (await fetch(req.url)).text();
        sendResponse({ title: snapshot });
      } catch (error) {
        console.error(error);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        sendResponse({ title: error["message"] });
      }

      //   const parser = new DOMParser();
      //   // Parse the raw HTML text into a new document
      //   const snapshotDOM = parser.parseFromString(snapshot, "text/html");
      //   const titleMeta = Array.from(
      //     snapshotDOM.getElementsByTagName("meta"),
      //   ).find((meta) => meta.name === "title");
      //   if (titleMeta === undefined) return sendResponse({ title: "NotFound" });
      //   sendResponse({ title: titleMeta.content });
    })();
    return true;
  },
);
