import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const csvPath = "/Users/liuminmac/Documents/工作/gitlab/yizhiPro/yz-liumin/伊站项目数据/exports/yz-service-materials-2026-06-22T11-22-04-206Z.csv";
const jsonPath = "/Users/liuminmac/Documents/工作/gitlab/yizhiPro/yz-liumin/伊站项目数据/exports/yz-service-materials-2026-06-22T11-22-04-206Z.json";
const outputPath = "/Users/liuminmac/Documents/工作/gitlab/yizhiPro/yz-liumin/伊站项目数据/exports/伊站项目耗材汇总-含商品编码-2026-06-22.xlsx";
const previewPath = "/Users/liuminmac/Documents/工作/gitlab/yizhiPro/yz-liumin/伊站项目数据/exports/伊站项目耗材汇总-含商品编码-预览.png";

const csvText = await fs.readFile(csvPath, "utf8");
const payload = JSON.parse(await fs.readFile(jsonPath, "utf8"));
const workbook = await Workbook.fromCSV(csvText, { sheetName: "项目耗材明细" });
const detail = workbook.worksheets.getItem("项目耗材明细");
const summary = workbook.worksheets.add("汇总");

detail.freezePanes.freezeRows(1);
detail.showGridLines = false;
const rowCount = payload.rows.length + 1;
const colCount = 15;
const header = detail.getRangeByIndexes(0, 0, 1, colCount);
header.format.fill.color = "#1F4E79";
header.format.font.color = "#FFFFFF";
header.format.font.bold = true;
header.format.wrapText = true;
header.format.horizontalAlignment = "center";

const used = detail.getRangeByIndexes(0, 0, rowCount, colCount);
used.format.font.name = "Arial";
used.format.font.size = 10;
used.format.borders = { preset: "inside", style: "thin", color: "#D9E2F3" };

detail.getRange("A:A").format.columnWidth = 12;
detail.getRange("B:B").format.columnWidth = 12;
detail.getRange("C:C").format.columnWidth = 10;
detail.getRange("D:D").format.columnWidth = 30;
detail.getRange("E:E").format.columnWidth = 22;
detail.getRange("F:F").format.columnWidth = 16;
detail.getRange("G:G").format.columnWidth = 24;
detail.getRange("H:H").format.columnWidth = 12;
detail.getRange("I:I").format.columnWidth = 22;
detail.getRange("J:J").format.columnWidth = 44;
detail.getRange("K:K").format.columnWidth = 10;
detail.getRange("L:L").format.columnWidth = 12;
detail.getRange("M:M").format.columnWidth = 14;
detail.getRange("N:N").format.columnWidth = 10;
detail.getRange("O:O").format.columnWidth = 18;
detail.getRange("D:D").format.wrapText = true;
detail.getRange("G:G").format.wrapText = true;
detail.getRange("J:J").format.wrapText = true;
detail.getRange("O:O").format.wrapText = true;

summary.showGridLines = false;
summary.getRange("A1:D1").merge();
summary.getRange("A1").values = [["伊站项目耗材汇总"]];
summary.getRange("A1").format.font.bold = true;
summary.getRange("A1").format.font.size = 18;
summary.getRange("A1").format.fill.color = "#EAF2F8";
summary.getRange("A1").format.rowHeight = 32;

const missingGoodsNumCount = payload.rows.filter((row) => row.goods_id && !row.goods_num).length;
summary.getRange("A3:B10").values = [
  ["导出时间", new Date(payload.generatedAt)],
  ["项目数", payload.projects.length],
  ["商品列表数", payload.goods.length],
  ["明细行数", payload.rows.length],
  ["商品编码未匹配行数", missingGoodsNumCount],
  ["耗材详情失败数", payload.rows.filter((row) => String(row.material_raw_json || "").includes('"error"')).length],
  ["数据源 CSV", path.basename(csvPath)],
  ["明细说明", "一个项目多个耗材时，明细页按多行展示，项目字段重复。"],
];
summary.getRange("A3:A10").format.font.bold = true;
summary.getRange("A3:A10").format.fill.color = "#F4F6F7";
summary.getRange("A3:B10").format.borders = { preset: "all", style: "thin", color: "#D6DBDF" };
summary.getRange("A:A").format.columnWidth = 18;
summary.getRange("B:B").format.columnWidth = 80;
summary.getRange("B3").setNumberFormat("yyyy-mm-dd hh:mm");
summary.getRange("B10").format.wrapText = true;

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 50 },
  summary: "formula error scan",
});
console.log(errors.ndjson);

const preview = await workbook.render({ sheetName: "项目耗材明细", range: "A1:O20", scale: 1, format: "png" });
await fs.writeFile(previewPath, new Uint8Array(await preview.arrayBuffer()));

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(JSON.stringify({ outputPath, previewPath, rowCount: payload.rows.length }, null, 2));
