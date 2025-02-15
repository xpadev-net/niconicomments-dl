import { StopOutlined } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import type { FC } from "react";

import type { Queue, Status } from "@/@types/queue";
import Styles from "@/controller/queue/convert-item.module.scss";
import { ProgressDisplay } from "@/controller/queue/progress-display";

const labels: { [key in Status]: string } = {
  queued: "他のキューの終了を待っています",
  processing: "処理中...",
  completed: "完了しました",
  fail: "失敗しました",
  interrupted: "中断されました",
};

type Props = {
  queue: Queue;
};

const StatusDisplay: FC<Props> = ({ queue }) => {
  const progress = (() => {
    if (queue.status !== "processing") return undefined;
    return queue.progress.percent;
  })();
  if (queue.status === "processing") {
    return (
      <div className={Styles.col}>
        <div className={Styles.row}>
          <div className={Styles.progressWrapper}>
            <ProgressDisplay progress={progress} />
          </div>
          {queue.status === "processing" && (
            <IconButton
              onClick={() => {
                void window.api.request({
                  host: "controller",
                  type: "interruptQueue",
                  queueId: queue.id,
                });
              }}
            >
              <StopOutlined />
            </IconButton>
          )}
        </div>
        {queue.progress.message && <div>{queue.progress.message}</div>}
      </div>
    );
  }
  return (
    <div>
      <span>{labels[queue.status]}</span>
    </div>
  );
};

export { StatusDisplay };
