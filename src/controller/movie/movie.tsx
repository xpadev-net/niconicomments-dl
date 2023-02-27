import { ChangeEvent, useContext, useState } from "react";
import { MenuItem, Select, TextField } from "@mui/material";
import Styles from "./movie.module.scss";
import Button from "@mui/material/Button";
import { generateUuid } from "@/util/uuid";
import { messageContext } from "@/controller/context/Message";
import { loadingContext } from "@/controller/context/Loading";
import { ytdlpFormat } from "@/@types/ytdlp";

const isCorrectUrl = (url: string) => {
  return !!url.match(
    /^(?:https?:\/\/)?(?:nico\.ms|(?:www\.)?nicovideo\.jp\/watch)\/((?:sm|nm|so)?[1-9][0-9]*)(?:.*)?$/
  );
};

const Movie = () => {
  const [url, setUrl] = useState("");
  const [formats, setFormats] = useState<ytdlpFormat[]>([]);
  const [targetFormat, setTargetFormat] = useState<string>("");
  const { setMessage } = useContext(messageContext);
  const { setIsLoading } = useContext(loadingContext);
  if (!setMessage || !setIsLoading) return <></>;
  const onUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormats([]);
    setUrl(e.target.value);
  };
  const getFormats = async () => {
    if (!isCorrectUrl(url) || formats.length > 0) return;
    setIsLoading(true);
    const targetFormats = (await window.api.request({
      type: "getMovieFormat",
      url: url,
      host: "controller",
    })) as ytdlpFormat[];
    setIsLoading(false);
    if (!targetFormats) return;
    setFormats(targetFormats);
  };
  const download = () => {
    void (async () => {
      if (!isCorrectUrl(url)) {
        setMessage({
          title: "URLが正しくありません",
          content:
            "以下のような形式のURLを入力してください\nhttps://www.nicovideo.jp/watch/sm9\nhttps://nico.ms/sm9",
        });
        return;
      }
      if (!targetFormat) {
        setMessage({
          title: "フォーマットを選択してください",
          content: "",
        });
        return;
      }
      setIsLoading(true);
      const output = await window.api.request({
        type: "selectOutput",
        host: "controller",
        options: {
          filters: [{ name: "mp4", extensions: ["mp4"] }],
          properties: ["createDirectory"],
        },
      });
      if (typeof output !== "string") {
        setIsLoading(false);
        return;
      }
      await window.api.request({
        type: "appendQueue",
        host: "controller",
        data: {
          type: "movie",
          id: generateUuid(),
          status: "queued",
          progress: 0,
          url: url,
          format: targetFormat,
          path: output,
        },
      });
      setUrl("");
      setFormats([]);
      setTargetFormat("");
      setIsLoading(false);
    })();
  };
  return (
    <div className={Styles.wrapper}>
      <TextField
        className={Styles.input}
        label="URL"
        placeholder={"https://www.nicovideo.jp/watch/sm9"}
        variant="standard"
        value={url}
        onChange={onUrlChange}
        onBlur={getFormats}
        fullWidth={true}
      />
      {formats.length > 0 && (
        <Select
          label={"フォーマット"}
          variant={"standard"}
          className={Styles.input}
          value={targetFormat}
          onChange={(e) => setTargetFormat(e.target.value)}
        >
          <MenuItem disabled value="">
            <em>ダウンロードフォーマットを選択してください</em>
          </MenuItem>
          {formats.map((val) => {
            return (
              <MenuItem key={val.id} value={val.id}>
                {val.id}
              </MenuItem>
            );
          })}
        </Select>
      )}
      <Button
        variant={"outlined"}
        onClick={download}
        disabled={!targetFormat}
        className={Styles.input}
      >
        ダウンロード
      </Button>
    </div>
  );
};
export { Movie };
