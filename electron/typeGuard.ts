import type {
  apiRequestSelectMovie,
  apiRequestFromController,
  apiRequestSelectComment,
  apiRequestSelectOutput,
} from "@/@types/request.controller";
import type {
  apiRequestLoad,
  apiRequestProgress,
  apiRequestFromRenderer,
  apiRequestBuffer,
  apiRequestEnd,
} from "@/@types/request.renderer";
import { apiRequestAppendQueue } from "@/@types/request.controller";

const typeGuard = {
  controller: {
    selectMovie: (i: unknown): i is apiRequestSelectMovie =>
      typeof i === "object" &&
      (i as apiRequestFromController).host === "controller" &&
      (i as apiRequestSelectMovie).type === "selectMovie",
    selectComment: (i: unknown): i is apiRequestSelectComment =>
      typeof i === "object" &&
      (i as apiRequestFromController).host === "controller" &&
      (i as apiRequestSelectComment).type === "selectComment",
    selectOutput: (i: unknown): i is apiRequestSelectOutput =>
      typeof i === "object" &&
      (i as apiRequestFromController).host === "controller" &&
      (i as apiRequestSelectOutput).type === "selectOutput",
    appendQueue: (i: unknown): i is apiRequestAppendQueue =>
      typeof i === "object" &&
      (i as apiRequestFromController).host === "controller" &&
      (i as apiRequestAppendQueue).type === "appendQueue",
    load: (i: unknown): i is apiRequestLoad =>
      typeof i === "object" &&
      (i as apiRequestFromController).host === "controller" &&
      (i as apiRequestLoad).type === "load",
  },
  renderer: {
    progress: (i: unknown): i is apiRequestProgress =>
      typeof i === "object" &&
      (i as apiRequestFromRenderer).host === "renderer" &&
      (i as apiRequestProgress).type === "progress",
    buffer: (i: unknown): i is apiRequestBuffer =>
      typeof i === "object" &&
      (i as apiRequestFromRenderer).host === "renderer" &&
      (i as apiRequestBuffer).type === "buffer",
    end: (i: unknown): i is apiRequestEnd =>
      typeof i === "object" &&
      (i as apiRequestFromRenderer).host === "renderer" &&
      (i as apiRequestEnd).type === "end",
    load: (i: unknown): i is apiRequestLoad =>
      typeof i === "object" &&
      (i as apiRequestFromRenderer).host === "renderer" &&
      (i as apiRequestLoad).type === "load",
  },
};
export { typeGuard };
