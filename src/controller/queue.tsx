import { useEffect, useState } from "react";
import { typeGuard } from "@/typeGuard";
import { Queue } from "@/@types/queue";
import Styles from "./queue.module.scss";
import { QueueItem } from "@/controller/queueItem";

const QueueDisplay = () => {
  const [queue, setQueue] = useState<Queue[]>([]);
  useEffect(() => {
    const callback = (_: unknown, e: unknown) => {
      if (typeGuard.controller.progress(e)) {
        setQueue(e.data);
      }
    };
    window.api.onResponse(callback);
    return () => window.api.remove(callback);
  }, []);
  return (
    <div className={Styles.wrapper}>
      {queue.map((item) => (
        <QueueItem key={item.id} queue={item} />
      ))}
    </div>
  );
};
export { QueueDisplay };
