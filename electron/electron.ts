import { app, BrowserWindow, dialog, ipcMain, globalShortcut } from "electron";
import { Converter } from "./ffmpeg-stream/stream";
import * as path from "path";
import * as fs from "fs";
import * as Stream from "stream";
import { ffprobe as ffprobePath } from "./ffmpeg";
import { execSync } from "child_process";
import { typeGuard } from "./typeGuard";

let mainWindow, renderWindow;
const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const appURL = `file://${__dirname}/html/index.html`;

  mainWindow.loadURL(appURL);

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }
};

app.on("window-all-closed", () => {
  app.quit();
});
let conv: Converter;
let input: Stream.Writable;
let lastPromise = Promise.resolve() as Promise<unknown>;
let json: v1Thread[];
app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on("browser-window-focus", function () {
  globalShortcut.register("CommandOrControl+R", () => {
    console.log("CommandOrControl+R is pressed: Shortcut Disabled");
  });
  globalShortcut.register("F5", () => {
    console.log("F5 is pressed: Shortcut Disabled");
  });
});

app.on("browser-window-blur", function () {
  globalShortcut.unregister("CommandOrControl+R");
  globalShortcut.unregister("F5");
});

let i = 0,
  width,
  height,
  duration,
  targetFileName,
  generatedFrames = 0,
  fps,
  options;
ipcMain.on("request", async (IpcMainEvent, args) => {
  const value = args.data[0];
  if (typeGuard.render.buffer(value)) {
    for (const item of value.data) {
      let base64Image = item.split(";base64,").pop();
      lastPromise = lastPromise.then(() =>
        new Promise<unknown>((fulfill, reject) => {
          const myStream = new Stream.Readable();
          myStream._read = function (size) {
            const u8 = base64ToUint8Array(base64Image);
            myStream.push(u8);
            myStream.push(null);
          };
          i++;
          mainWindow.webContents.send("response", {
            type: "progress",
            target: "main",
            converted: i,
            generated: generatedFrames,
          });
          renderWindow.webContents.send("response", {
            type: "progress",
            target: "render",
            converted: i,
            generated: generatedFrames,
          });
          return myStream
            .on("end", fulfill) // fulfill promise on frame end
            .on("error", reject) // reject promise on error
            .pipe(input, { end: false }); // pipe to converter, but don't end the input yet
        }).catch((e) => {
          console.warn(e);
        })
      );
    }
  } else if (typeGuard.render.end(value)) {
    lastPromise.then(() => input.end());
  } else if (typeGuard.main.selectComment(value)) {
    const path = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [
        { name: "JSON", extensions: ["json"] },
        {
          name: "All Files",
          extensions: ["*"],
        },
      ],
    });
    if (path.canceled) return;
    json = JSON.parse(fs.readFileSync(path.filePaths[0], "utf8"));

    IpcMainEvent.reply("response", {
      type: "selectComment",
      target: "main",
      data: json,
    });
  } else if (typeGuard.main.selectMovie(value)) {
    const path = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [
        {
          name: "Movies",
          extensions: ["mp4", "webm", "avi", "mkv", "wmv", "mov"],
        },
        {
          name: "All Files",
          extensions: ["*"],
        },
      ],
    });
    if (path.canceled) {
      IpcMainEvent.reply("response", {
        type: "selectMovie",
        target: "main",
        message: "cancelled",
      });
      return;
    }
    const ffprobe = execSync(
      `${ffprobePath} ${path.filePaths[0]} -hide_banner -v quiet -print_format json -show_streams`
    );
    let metadata;
    metadata = JSON.parse(ffprobe.toString());
    if (!metadata.streams) {
      IpcMainEvent.reply("response", {
        type: "selectMovie",
        target: "main",
        message: "input file is not movie",
      });
      return;
    }
    for (const key in metadata.streams) {
      const stream = metadata.streams[key];
      if (stream.width) {
        width = stream.width;
      }
      if (stream.height) {
        height = stream.height;
      }
    }
    if (!(height && width)) {
      IpcMainEvent.reply("response", {
        type: "selectMovie",
        target: "main",
        message: "fail to get resolution from input file",
      });
      return;
    }
    duration = execSync(
      `${ffprobePath} ${path.filePaths[0]} -v quiet -show_entries format=duration -of default=noprint_wrappers=1:nokey=1`
    ).toString();
    targetFileName = path.filePaths;
    IpcMainEvent.reply("response", {
      type: "selectMovie",
      target: "main",
      message: `path:${path.filePaths}, width:${width}, height:${height}, duration:${duration}`,
      data: { width, height, duration },
    });
  } else if (typeGuard.main.start(value)) {
    const outputPath = await dialog.showSaveDialog({
      filters: [{ name: "mp4", extensions: ["mp4"] }],
      properties: ["createDirectory"],
    });
    if (outputPath.canceled) return;
    options = value.data;
    fps = value.fps;
    IpcMainEvent.reply("response", {
      type: "start",
      target: "main",
      message: `path:${outputPath.filePath}`,
    });
    renderWindow = new BrowserWindow({
      width: 640,
      height: 360,
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        nodeIntegration: false,
        contextIsolation: true,
      },
    });
    renderWindow.loadURL(`file://${__dirname}/html/index.html?render`);
    conv = new Converter(); // create converter
    conv.createInputFromFile(targetFileName, {});
    input = conv.createInputStream({
      f: "image2pipe",
      r: fps,
      filter_complex: `pad=width=max(iw\\,ih*(16/9)):height=ow/(16/9):x=(ow-iw)/2:y=(oh-ih)/2,scale=1920x1080,overlay=x=0:y=0`,
    });
    conv.output(outputPath.filePath, { vcodec: "libx264", pix_fmt: "yuv420p" }); // output to file

    await conv.run();

    renderWindow.webContents.send("response", {
      type: "end",
      target: "render",
    });
    mainWindow.webContents.send("response", {
      type: "end",
      target: "main",
    });
  } else if (typeGuard.render.progress(value)) {
    generatedFrames = value.data.generated;
  } else if (typeGuard.render.load(value)) {
    IpcMainEvent.reply("response", {
      type: "start",
      target: "render",
      comment: json,
      options: options,
      duration: duration,
      fps: fps,
    });
  } else {
    console.log(args);
  }
});

function base64ToUint8Array(base64Str) {
  const raw = atob(base64Str);
  return Uint8Array.from(
    Array.prototype.map.call(raw, (x) => {
      return x.charCodeAt(0);
    })
  );
}
