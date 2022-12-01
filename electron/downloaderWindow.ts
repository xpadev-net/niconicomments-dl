import { app, BrowserWindow } from "electron";
import * as path from "path";

let downloaderWindow: BrowserWindow;
const createDownloaderWindow = async () => {
  downloaderWindow = new BrowserWindow({
    width: 400,
    height: 150,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  downloaderWindow.removeMenu();

  const appURL = `file://${__dirname}/html/index.html?downloader`;

  await downloaderWindow.loadURL(appURL);

  if (!app.isPackaged) {
    downloaderWindow.webContents.openDevTools();
  }
};

export { createDownloaderWindow, downloaderWindow };
