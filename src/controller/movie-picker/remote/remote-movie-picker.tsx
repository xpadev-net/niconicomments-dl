import { FormControlLabel, Radio, RadioGroup, TextField } from "@mui/material";
import Button from "@mui/material/Button";
import { useSetAtom } from "jotai";
import type { ChangeEvent, FC, KeyboardEvent } from "react";
import { useRef, useState } from "react";

import type { TWatchV3Metadata, V3MetadataBody } from "@/@types/niconico";
import type {
  TMovieItemRemote,
  TRemoteMovieItemFormat,
  TRemoteServerType,
} from "@/@types/queue";
import { isLoadingAtom, messageAtom } from "@/controller/atoms";
import { DMCMoviePicker } from "@/controller/movie-picker/remote/dmc";
import { DMSMoviePicker } from "@/controller/movie-picker/remote/dms";
import Styles from "@/controller/movie/movie.module.scss";
import { typeGuard } from "@/type-guard";
import { getNicoId, isNicovideoUrl } from "@/util/niconico";
import { uuid } from "@/util/uuid";

type Props = {
  onChange: (val: TMovieItemRemote | undefined) => void;
};

const RemoteMoviePicker: FC<Props> = ({ onChange }) => {
  const [url, setUrl] = useState("");
  const [metadata, setMetadata] = useState<V3MetadataBody | undefined>();
  const [mediaServer, setMediaServer] = useState<TRemoteServerType>("dmc");
  const [format, setFormat] = useState<TRemoteMovieItemFormat | undefined>();
  const setMessage = useSetAtom(messageAtom);
  const setIsLoading = useSetAtom(isLoadingAtom);
  const lastUrl = useRef<string>("");
  const onUrlChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setMetadata(undefined);
    setUrl(e.target.value);
  };
  const getFormats = (): void => {
    void (async () => {
      const nicoId = getNicoId(url);
      if (!isNicovideoUrl(url) || metadata || !nicoId) {
        if (!url || lastUrl.current === nicoId) return;
        setMessage({
          title: "URLが正しくありません",
          content:
            "以下のような形式のURLを入力してください\nhttps://www.nicovideo.jp/watch/sm9\nhttps://nico.ms/sm9\ncontroller/movie-picker/remote/remote-movie-picker.tsx / getFormats",
        });
        return;
      }
      setIsLoading(true);
      const targetMetadata = (await window.api.request({
        type: "getNiconicoMovieMetadata",
        nicoId: nicoId,
        host: "controller",
      })) as V3MetadataBody;
      setIsLoading(false);
      if (!targetMetadata) {
        setMessage({
          title: "動画情報の取得に失敗しました",
          content: "動画が削除などされていないか確認してください",
        });
        return;
      }
      if (!targetMetadata.media.delivery && !targetMetadata.media.domand) {
        setMessage({
          title: "動画情報の取得に失敗しました",
          content: "未購入の有料動画などの可能性があります",
        });
        return;
      }
      setMediaServer(targetMetadata.media.domand ? "dms" : "dmc");
      setMetadata(targetMetadata);
      lastUrl.current = nicoId;
    })();
  };
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key !== "Enter") return;
    getFormats();
  };
  const onClick = (): void => {
    void (async () => {
      const nicoId = getNicoId(url);
      if (!nicoId) {
        setMessage({
          title: "URLが正しくありません",
          content:
            "以下のような形式のURLを入力してください\nhttps://www.nicovideo.jp/watch/sm9\nhttps://nico.ms/sm9\ncontroller/movie-picker/remote/remote-movie-picker.tsx / onClick",
        });
        return;
      }
      if (!format || !metadata) {
        return;
      }
      setIsLoading(true);
      const output = await window.api.request({
        type: "selectOutput",
        host: "controller",
        options: {
          filters: [{ name: "mp4", extensions: ["mp4"] }],
          properties: ["createDirectory"],
          defaultPath: `${nicoId}.mp4`,
        },
      });
      setIsLoading(false);
      if (typeof output !== "string") {
        return;
      }
      setMessage(undefined);
      onChange({
        type: "remote",
        path: output,
        duration: metadata.video.duration,
        ref: {
          id: uuid(),
          status: "queued",
          type: "movie",
          url: nicoId,
          format: format,
          path: output,
          progress: { percent: 0, total: 0, processed: 0 },
        },
      });
    })();
  };
  return (
    <div>
      <TextField
        className={Styles.input}
        label="URL"
        placeholder={"https://www.nicovideo.jp/watch/sm9"}
        variant="standard"
        value={url}
        onChange={onUrlChange}
        onBlur={getFormats}
        onKeyDown={onKeyDown}
        fullWidth={true}
      />
      {metadata && (
        <>
          <RadioGroup
            value={mediaServer}
            onChange={(e) =>
              setMediaServer(e.target.value as TRemoteServerType)
            }
            row
          >
            <FormControlLabel
              value={"dmc"}
              control={<Radio />}
              label={"DMC"}
              disabled={!metadata.media.delivery}
            />
            <FormControlLabel
              value={"dms"}
              control={<Radio />}
              disabled={!metadata.media.domand}
              label={"DMS"}
            />
          </RadioGroup>
          {mediaServer === "dmc" && typeGuard.controller.v3DMC(metadata) && (
            <DMCMoviePicker metadata={metadata} onChange={setFormat} />
          )}
          {mediaServer === "dms" && typeGuard.controller.v3DMS(metadata) && (
            <DMSMoviePicker metadata={metadata} onChange={setFormat} />
          )}
          <Button variant={"outlined"} onClick={onClick}>
            確定
          </Button>
        </>
      )}
    </div>
  );
};

export { RemoteMoviePicker };
