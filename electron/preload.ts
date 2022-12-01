import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  request: (...data) =>
    ipcRenderer.send("request", {
      data,
    }),
  onResponse: (fn: (...args) => void) => {
    ipcRenderer.on("response", (event, ...args) => fn(...(args as unknown[])));
  },
});
