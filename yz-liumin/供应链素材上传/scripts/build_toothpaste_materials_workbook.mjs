import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "outputs/20260701-toothpaste-materials";
const jsonPath = path.join(outputDir, "toothpaste_materials.json");
const data = JSON.parse(await fs.readFile(jsonPath, "utf8"));

const workbook = Workbook.create();
const uploadSheet = workbook.worksheets.add("上传清单");
const tagSheet = workbook.worksheets.add("标签库");
const productSheet = workbook.worksheets.add("商品映射");

const headers = [
  "朋友圈编号",
  "排序",
  "SPU名称",
  "商品搜索词",
  "朋友圈文案",
  "图片文件夹",
  "上传图片数",
  "上传图片列表",
  "参考图",
  "上传图片总大小MB",
  "推荐发布时间",
  "适用时机",
  "内容形式",
  "语气风格",
  "核心卖点",
  "目标人群",
  "AI标签理由",
  "校验状态",
  "校验说明",
  "上传状态",
  "后台素材ID",
  "失败原因",
  "上传时间",
  "备注",
];

const rows = data.rows.map((row) => headers.map((header) => row[header] ?? ""));
uploadSheet.getRangeByIndexes(0, 0, rows.length + 1, headers.length).values = [headers, ...rows];

uploadSheet.showGridLines = false;
uploadSheet.freezePanes.freezeRows(1);
const uploadRange = uploadSheet.getRangeByIndexes(0, 0, rows.length + 1, headers.length);
uploadRange.format.font = { name: "Arial", size: 10, color: "#1F2937" };
uploadRange.format.borders = {
  insideHorizontal: { style: "thin", color: "#E5E7EB" },
  top: { style: "thin", color: "#CBD5E1" },
  bottom: { style: "thin", color: "#CBD5E1" },
};
uploadSheet.getRangeByIndexes(0, 0, 1, headers.length).format = {
  fill: "#1F4E78",
  font: { bold: true, color: "#FFFFFF" },
};
uploadSheet.getRangeByIndexes(1, 0, rows.length, headers.length).format.wrapText = true;
uploadSheet.getRangeByIndexes(1, 1, rows.length, 1).format.horizontalAlignment = "center";
uploadSheet.getRangeByIndexes(1, 6, rows.length, 1).format.horizontalAlignment = "center";
uploadSheet.getRangeByIndexes(1, 9, rows.length, 1).format.numberFormat = "0.00";

const widths = [16, 8, 44, 18, 42, 34, 12, 48, 32, 16, 18, 14, 16, 16, 22, 16, 44, 16, 36, 14, 16, 22, 18, 20];
widths.forEach((width, index) => {
  uploadSheet.getRangeByIndexes(0, index, rows.length + 1, 1).format.columnWidth = width;
});
uploadSheet.getRangeByIndexes(1, 0, rows.length, headers.length).format.rowHeight = 86;
uploadSheet.getRangeByIndexes(1, 4, rows.length, 1).format.rowHeight = 132;
uploadSheet.getRangeByIndexes(1, 7, rows.length, 1).format.rowHeight = 132;

const table = uploadSheet.tables.add(
  `A1:X${rows.length + 1}`,
  true,
  "ToothpasteUploadList",
);
table.style = "TableStyleMedium2";
table.showFilterButton = true;

uploadSheet.getRange(`R2:R${rows.length + 1}`).conditionalFormats.add("containsText", {
  text: "可上传-需确认",
  format: { fill: "#FFF7ED", font: { color: "#9A3412" } },
});
uploadSheet.getRange(`R2:R${rows.length + 1}`).conditionalFormats.add("containsText", {
  text: "需处理",
  format: { fill: "#FEF2F2", font: { color: "#B91C1C", bold: true } },
});
uploadSheet.getRange(`R2:R${rows.length + 1}`).conditionalFormats.add("containsText", {
  text: "可上传",
  format: { fill: "#ECFDF5", font: { color: "#047857" } },
});
uploadSheet.getRange(`T2:T${rows.length + 1}`).dataValidation = {
  rule: { type: "list", values: ["待上传", "已上传", "上传失败", "跳过"] },
};

const tagHeaders = ["标签组", "可选标签"];
const tagRows = Object.entries(data.tag_library).flatMap(([group, tags]) =>
  tags.map((tag) => [group, tag]),
);
tagSheet.getRangeByIndexes(0, 0, tagRows.length + 1, 2).values = [tagHeaders, ...tagRows];
tagSheet.showGridLines = false;
tagSheet.freezePanes.freezeRows(1);
tagSheet.getRangeByIndexes(0, 0, 1, 2).format = {
  fill: "#0F766E",
  font: { bold: true, color: "#FFFFFF" },
};
tagSheet.getRangeByIndexes(0, 0, tagRows.length + 1, 2).format.borders = {
  insideHorizontal: { style: "thin", color: "#E5E7EB" },
  top: { style: "thin", color: "#CBD5E1" },
  bottom: { style: "thin", color: "#CBD5E1" },
};
tagSheet.getRange("A:B").format.columnWidth = 18;
tagSheet.tables.add(`A1:B${tagRows.length + 1}`, true, "MaterialTagLibrary").style = "TableStyleMedium4";

const productRows = [
  ["素材库名称", "SPU名称", "商品搜索词", "后台商品ID", "默认素材类型", "说明"],
  [
    "牙膏朋友圈",
    data.source.product_name,
    data.source.product_search,
    "",
    "朋友圈图片素材",
    "后台商品ID待接口/页面确认后回填；自动上传时优先用商品ID，其次用SPU名称精确匹配。",
  ],
];
productSheet.getRangeByIndexes(0, 0, productRows.length, productRows[0].length).values = productRows;
productSheet.showGridLines = false;
productSheet.freezePanes.freezeRows(1);
productSheet.getRange("A1:F1").format = {
  fill: "#7C2D12",
  font: { bold: true, color: "#FFFFFF" },
};
productSheet.getRange("A1:F2").format.borders = {
  insideHorizontal: { style: "thin", color: "#E5E7EB" },
  top: { style: "thin", color: "#CBD5E1" },
  bottom: { style: "thin", color: "#CBD5E1" },
};
[18, 48, 22, 16, 18, 72].forEach((width, index) => {
  productSheet.getRangeByIndexes(0, index, 2, 1).format.columnWidth = width;
});
productSheet.getRange("A2:F2").format.wrapText = true;
productSheet.getRange("A2:F2").format.rowHeight = 58;
productSheet.tables.add("A1:F2", true, "ProductMapping").style = "TableStyleMedium3";

await fs.mkdir(outputDir, { recursive: true });

const preview = await workbook.render({
  sheetName: "上传清单",
  range: `A1:X${rows.length + 1}`,
  scale: 1,
  format: "png",
});
await fs.writeFile(
  path.join(outputDir, "toothpaste_upload_list_preview.png"),
  new Uint8Array(await preview.arrayBuffer()),
);

const inspect = await workbook.inspect({
  kind: "table",
  range: `上传清单!A1:X${rows.length + 1}`,
  include: "values",
  tableMaxRows: 10,
  tableMaxCols: 24,
  tableMaxCellChars: 80,
});
await fs.writeFile(path.join(outputDir, "toothpaste_workbook_inspect.ndjson"), inspect.ndjson);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "final formula error scan",
});
await fs.writeFile(path.join(outputDir, "toothpaste_workbook_errors.ndjson"), errors.ndjson);

const output = await SpreadsheetFile.exportXlsx(workbook);
const xlsxPath = path.join(outputDir, "牙膏朋友圈素材上传清单.xlsx");
await output.save(xlsxPath);
console.log(xlsxPath);
