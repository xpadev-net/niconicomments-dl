import { fill } from "@/util/zerofill";

/**
 * 文字列を秒数に変換
 * 厳密な数値のチェックは行っていないため、2分90秒とかの指定もできる
 * 変更したければmatch関数内のregex
 * @param date {string}
 */
const str2time = (date: string): number | undefined => {
  const match = date.match(/^(?:(\d+):)?(\d+)(?:\.(\d+))?$/);
  if (match) {
    let time = 0;
    if (match[1] !== undefined) time += Number(match[1]) * 60;
    if (match[2] !== undefined) time += Number(match[2]);
    if (match[3] !== undefined)
      time += Number(match[3]) / 10 ** match[3].length;
    if (time < 0) {
      return undefined;
    }
    return time;
  }
  return undefined;
};
/**
 * 秒数を文字列に
 * フォーマット：分：秒.小数点以下2桁
 * @param time
 */
const time2str = (time: number | undefined): string => {
  if (!time) return "";
  return `${String(Math.floor(time / 60)).padStart(2, "0")}:${String(
    (time % 60).toFixed(2).padStart(5, "0"),
  )}`;
};

const formatDate = (_date: Date): string => {
  return `${_date.getFullYear()}-${fill(_date.getMonth() + 1, 2)}-${fill(
    _date.getDate(),
    2,
  )}T${fill(_date.getHours(), 2)}:${fill(_date.getMinutes(), 2)}:${fill(
    _date.getSeconds(),
    2,
  )}`;
};
export { formatDate, str2time, time2str };
