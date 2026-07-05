import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const workbookPath = "outputs/20260701-toothpaste-materials/牙膏朋友圈素材上传清单.xlsx";
const input = await FileBlob.load(workbookPath);
const workbook = await SpreadsheetFile.importXlsx(input);
const sheet = workbook.worksheets.getItem("上传清单");

const rowCount = 6;
const values = [];

for (let i = 0; i < rowCount; i += 1) {
  const date = new Date(Date.UTC(2026, 6, 1 + i, 12, 0, 0));
  values.push([date]);
}

const range = sheet.getRange(`K2:K${rowCount + 1}`);
range.values = values;
range.format.numberFormat = "yyyy-mm-dd hh:mm";

const inspect = await workbook.inspect({
  kind: "table",
  range: `上传清单!A1:K${rowCount + 1}`,
  include: "values",
  tableMaxRows: 8,
  tableMaxCols: 11,
  tableMaxCellChars: 80,
});
console.log(inspect.ndjson);

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(workbookPath);
console.log(workbookPath);
