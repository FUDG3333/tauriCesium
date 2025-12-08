// 简单 Node.js 后端，自动获取 public/3DTiles 目录下所有 JSON 文件
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 解决 __dirname 和 __filename 在 ES Module 中不可用的问题
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
const PORT = 3001;

// 指向 public/3DTiles 目录
const tilesDir = path.join(__dirname, 'public', '3DTiles');

// 递归查找所有 .json 文件
function findTilesets(dir) {
  let results = [];
  
  if (!fs.existsSync(dir)) {
    console.error(`Error: Directory not found: ${dir}`);
    return results;
  }
  
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      // 递归查找子目录
      results = results.concat(findTilesets(filePath));
    } else if (path.extname(file) === '.json') { // *** 核心修改点 ***
      // 检查文件扩展名是否为 .json
      
      // 返回相对路径，方便前端访问
      // 从项目根路径开始计算相对路径，即去掉 __dirname
      const relativePath = filePath.replace(__dirname + path.sep, '').replace(/\\/g, '/');
      results.push(relativePath);
    }
  });
  return results;
}

// 允许跨域访问
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// 提供静态文件服务
app.use('/public', express.static(path.join(__dirname, 'public')));
// 注意：这里我们将整个 'public' 目录映射到 URL 的 '/public'
// 这样前端就可以用 http://localhost:3001/public/3DTiles/... 访问文件

app.get('/api/tilesets', (req, res) => {
  const tilesets = findTilesets(tilesDir);
  res.json(tilesets);
});

app.listen(PORT, () => {
  console.log(`Tiles API server running at http://localhost:${PORT}`);
  console.log(`静态文件服务根目录: http://localhost:${PORT}/public`);
});