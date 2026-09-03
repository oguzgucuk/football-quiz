import fs from "fs";
import path from "path";

function scanDir(dir: string, fileList: { path: string; lines: number }[] = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === "node_modules" || file === ".next" || file === ".git" || file === "public") continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath, fileList);
    } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
      const content = fs.readFileSync(fullPath, "utf-8");
      const lines = content.split("\n").length;
      if (lines > 250) {
        fileList.push({ path: path.relative(process.cwd(), fullPath), lines });
      }
    }
  }
  return fileList;
}

const largeFiles = scanDir(process.cwd()).sort((a, b) => b.lines - a.lines);
console.log("250+ Satırlı Dosyalar:");
largeFiles.forEach(f => console.log(`${f.lines.toString().padStart(4)} satır: ${f.path}`));
