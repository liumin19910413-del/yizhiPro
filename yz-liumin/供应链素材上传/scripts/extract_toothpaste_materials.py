import json
import re
from pathlib import Path

from docx import Document


ROOT = Path("牙膏朋友圈（文案+配图）")
DOCX = ROOT / "牙膏朋友圈文案内容.docx"
PRODUCT_NAME = "持证美白+16小时清新口气，清新牙膏/美白牙膏可选"
PRODUCT_SEARCH = "清新牙膏 美白牙膏"

CN_NUM = {
    "一": 1,
    "二": 2,
    "三": 3,
    "四": 4,
    "五": 5,
    "六": 6,
    "七": 7,
    "八": 8,
    "九": 9,
    "十": 10,
}


def natural_key(path: Path):
    name = path.stem
    parts = re.split(r"(\d+)", name)
    return [int(p) if p.isdigit() else p.lower() for p in parts] + [path.suffix.lower()]


def infer_tags(text: str):
    tags = {
        "适用时机": ["日常"],
        "内容形式": [],
        "语气风格": [],
        "核心卖点": [],
        "目标人群": ["泛人群"],
    }
    reasons = []

    if any(k in text for k in ["200万", "爆品", "好评", "口碑", "复购"]):
        tags["内容形式"].append("品牌宣传")
        tags["核心卖点"].append("品质")
        reasons.append("文案强调销量、口碑和复购，适合品牌宣传与品质背书。")
    if any(k in text for k in ["对比", "市面", "性价比", "大品牌", "价格"]):
        tags["内容形式"].append("效果对比")
        tags["核心卖点"].extend(["省钱", "大牌平替"])
        reasons.append("文案出现市面品牌对比和价格优势，匹配效果对比、省钱、大牌平替。")
    if any(k in text for k in ["认证", "证书", "成分", "酵素", "烟酰胺", "植酸钠", "益生菌", "溶菌酶", "菌群"]):
        tags["语气风格"].append("专业测评")
        tags["核心卖点"].append("安全")
        reasons.append("文案包含认证、成分或功效机制，适合专业测评和安全卖点。")
    if any(k in text for k in ["姐妹", "帅哥美女", "冲", "放心安心", "咱就是说"]):
        tags["语气风格"].append("闺蜜种草")
        reasons.append("表达偏种草口吻，适合闺蜜种草。")
    if any(k in text for k in ["自信", "微笑", "见客户", "人缘", "早晚", "口气", "大白牙"]):
        tags["内容形式"].append("场景展示")
        tags["核心卖点"].append("便捷")
        reasons.append("文案围绕日常刷牙、微笑、口气清新等使用场景，匹配场景展示和便捷。")
    if any(k in text for k in ["不容质疑", "真效果", "真实力", "值得信赖", "准没错"]):
        tags["语气风格"].append("促销强逼")
        reasons.append("表达带有强推荐和转化导向，可用于促销强逼风格。")

    for key, values in tags.items():
        deduped = []
        for value in values:
            if value not in deduped:
                deduped.append(value)
        tags[key] = deduped

    for key in ["内容形式", "语气风格", "核心卖点"]:
        if not tags[key]:
            tags[key] = ["场景展示"] if key == "内容形式" else ["闺蜜种草"] if key == "语气风格" else ["品质"]

    return tags, "；".join(reasons[:3])


def parse_docx():
    document = Document(DOCX)
    items = []
    current = None

    for para in document.paragraphs:
        text = para.text.strip()
        if not text:
            continue
        match = re.match(r"牙膏朋友圈([一二三四五六七八九十]+)：?$", text)
        if match:
            if current:
                items.append(current)
            cn = match.group(1)
            current = {
                "朋友圈编号": f"牙膏朋友圈{cn}",
                "序号": CN_NUM.get(cn, len(items) + 1),
                "文案行": [],
                "文档标注文件夹": "",
            }
            continue
        folder_match = re.match(r"[（(]文件夹：(.+?)[）)]$", text)
        if folder_match and current:
            current["文档标注文件夹"] = folder_match.group(1)
            continue
        if current:
            current["文案行"].append(text)

    if current:
        items.append(current)

    return items


def inspect_images(folder: Path):
    allowed = {".jpg", ".jpeg", ".png", ".webp"}
    files = sorted(
        [p for p in folder.iterdir() if p.is_file() and p.suffix.lower() in allowed],
        key=natural_key,
    )
    reference = [p for p in files if p.name.startswith("0") or "效果图" in p.name]
    upload = [p for p in files if p not in reference]
    sizes = {p: p.stat().st_size for p in files}

    numeric_stems = {}
    for p in upload:
        m = re.match(r"(\d+)", p.stem)
        if m:
            numeric_stems.setdefault(m.group(1), []).append(p.name)

    issues = []
    if not folder.exists():
        issues.append("图片文件夹不存在")
    if len(upload) == 0:
        issues.append("无可上传图片")
    if len(upload) > 9:
        issues.append(f"上传图片{len(upload)}张，超过后台最多9张")
    oversized = [p.name for p in upload if sizes[p] > 20 * 1024 * 1024]
    if oversized:
        issues.append("单图超过20MB：" + "、".join(oversized))
    duplicates = [f"{k}({','.join(v)})" for k, v in numeric_stems.items() if len(v) > 1]
    if duplicates:
        issues.append("同序号重复：" + "；".join(duplicates))
    if reference and len(files) > 9 and len(upload) <= 9:
        issues.append("已将0效果图归为参考图，不计入上传图片")

    return {
        "folder": folder,
        "all_files": files,
        "upload": upload,
        "reference": reference,
        "size_mb": round(sum(sizes[p] for p in upload) / 1024 / 1024, 2),
        "issues": issues,
    }


def main():
    rows = []
    for item in parse_docx():
        folder_name = item["文档标注文件夹"] or item["朋友圈编号"]
        folder = ROOT / folder_name
        image_info = inspect_images(folder)
        copy_text = "\n".join(item["文案行"]).strip()
        tags, reason = infer_tags(copy_text)

        status = "可上传"
        if any(issue.startswith(("图片文件夹不存在", "无可上传图片", "上传图片", "单图超过20MB")) for issue in image_info["issues"]):
            status = "需处理"
        elif image_info["issues"]:
            status = "可上传-需确认"

        rows.append(
            {
                "朋友圈编号": item["朋友圈编号"],
                "排序": item["序号"],
                "SPU名称": PRODUCT_NAME,
                "商品搜索词": PRODUCT_SEARCH,
                "朋友圈文案": copy_text,
                "图片文件夹": str(folder),
                "上传图片数": len(image_info["upload"]),
                "上传图片列表": "\n".join(str(p) for p in image_info["upload"]),
                "参考图": "\n".join(str(p) for p in image_info["reference"]),
                "上传图片总大小MB": image_info["size_mb"],
                "推荐发布时间": "",
                "适用时机": "，".join(tags["适用时机"]),
                "内容形式": "，".join(tags["内容形式"]),
                "语气风格": "，".join(tags["语气风格"]),
                "核心卖点": "，".join(tags["核心卖点"]),
                "目标人群": "，".join(tags["目标人群"]),
                "AI标签理由": reason,
                "校验状态": status,
                "校验说明": "；".join(image_info["issues"]) if image_info["issues"] else "图片数量、格式、大小均通过",
                "上传状态": "待上传",
                "后台素材ID": "",
                "失败原因": "",
                "上传时间": "",
                "备注": "",
            }
        )

    output = {
        "source": {
            "root": str(ROOT),
            "docx": str(DOCX),
            "product_name": PRODUCT_NAME,
            "product_search": PRODUCT_SEARCH,
        },
        "rows": rows,
        "tag_library": {
            "适用时机": ["日常", "活动", "节日", "新品", "清仓"],
            "内容形式": ["品牌宣传", "买家秀", "效果对比", "场景展示", "促销"],
            "语气风格": ["闺蜜种草", "促销强逼", "温情生活", "专业测评"],
            "核心卖点": ["省钱", "品质", "安全", "便捷", "大牌平替"],
            "目标人群": ["宝妈", "上班族", "家庭主妇", "泛人群"],
        },
    }

    out_path = Path("outputs/20260701-toothpaste-materials/toothpaste_materials.json")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(out_path)


if __name__ == "__main__":
    main()
