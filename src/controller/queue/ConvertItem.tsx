import type { ConvertQueue } from "@/@types/queue";
import { LinearProgress } from "@mui/material";
import { useMemo } from "react";
import Styles from "./ConvertItem.module.scss";

type props = {
  queue: ConvertQueue;
  className: string;
};
const ConvertItem = ({ queue, className }: props) => {
  return useMemo(() => {
    const movieName = queue.movie.path.split(/\/|\\/g).reverse()[0];
    const outputName = queue.output.path.split(/\/|\\/g).reverse()[0];
    if (queue.status !== "processing") {
      return (
        <div className={`${Styles.queue} ${className}`}>
          <p>input: {movieName}</p>
          <p>output: {outputName}</p>
          <p>status: {queue.status}</p>
        </div>
      );
    }
    const pg = queue.progress;

    return (
      <div className={`${Styles.queue} ${className}`}>
        <p>input: {movieName}</p>
        <p>output: {outputName}</p>
        <p>status: processing</p>
        <div className={Styles.progressWrapper}>
          <LinearProgress
            variant="buffer"
            value={(pg.converted / pg.total) * 100}
            valueBuffer={(pg.generated / pg.total) * 100}
            className={Styles.progress}
          />
          <span className={Styles.text}>
            {Math.floor((pg.converted / pg.total) * 100)}%
          </span>
        </div>
      </div>
    );
  }, [queue]);
};
export { ConvertItem };
