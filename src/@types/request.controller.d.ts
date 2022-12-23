import { apiRequestLoad } from "@/@types/request.renderer";
import { Queue } from "@/@types/queue";

export type apiRequestFromController = {
  host: "controller";
};
export type apiRequestSelectMovie = {
  type: "selectMovie";
};
export type apiRequestSelectComment = {
  type: "selectComment";
};
export type apiRequestSelectOutput = {
  type: "selectOutput";
};
export type apiRequestSelectFile = {
  type: "selectFile";
  pattern: Electron.FileFilter[];
};
export type apiRequestAppendQueue = {
  type: "appendQueue";
  data: Queue;
};
export type apiRequestsFromController =
  | apiRequestAppendQueue
  | apiRequestSelectComment
  | apiRequestSelectMovie
  | apiRequestSelectOutput
  | apiRequestLoad
  | apiRequestSelectFile;

export {};
