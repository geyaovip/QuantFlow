import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const sourcePath = join(
  root,
  "assets/brand/source/quantflow-mark-optimized.svg",
);
const svgDir = join(root, "assets/brand/svg");
const pngDir = join(root, "assets/brand/png");
const tempDir = "/tmp/quantflow-brand-assets";

mkdirSync(svgDir, { recursive: true });
mkdirSync(pngDir, { recursive: true });
rmSync(tempDir, { recursive: true, force: true });
mkdirSync(tempDir, { recursive: true });

const source = readFileSync(sourcePath, "utf8");
const markGeometry = source
  .match(/<!-- MARK START -->([\s\S]*?)<!-- MARK END -->/)?.[1]
  ?.trim();
if (!markGeometry) throw new Error("Unable to extract QuantFlow mark geometry");

const geometry = (color) =>
  markGeometry.replace('color="#FFFFFF"', `color="${color}"`);

const mark = (
  fill,
  label,
) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 136 136" role="img" aria-label="${label}">
  <title>${label}</title>
  ${geometry(fill)}
</svg>\n`;

const icon = (maskable = false) => {
  const inset = maskable ? 20 : 0;
  const size = maskable ? 472 : 512;
  const scale = size / 136;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="QuantFlow app icon">
  <title>QuantFlow app icon</title>
  <rect width="512" height="512" fill="#050505"/>
  <g transform="translate(${inset} ${inset}) scale(${scale})">${geometry("#FFFFFF")}</g>
</svg>\n`;
};

const lockup = ({ dark = false, admin = false }) => {
  const foreground = dark ? "#FFFFFF" : "#111827";
  const secondary = dark ? "#D1D5DB" : "#4B5563";
  const width = admin ? 244 : 192;
  const label = admin ? "QuantFlow 管理后台" : "QuantFlow";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 56" role="img" aria-label="${label}">
  <title>${label}</title>
  <g transform="translate(8 8) scale(0.2941176471)">${geometry(foreground)}</g>
  <text x="50" y="35" fill="${foreground}" font-family="ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif" font-size="24" font-weight="600" letter-spacing="-0.4">QuantFlow</text>${
    admin
      ? `
  <text x="174" y="34" fill="${secondary}" font-family="ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif" font-size="13" font-weight="500">管理后台</text>`
      : ""
  }
</svg>\n`;
};

const preview =
  () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720" role="img" aria-label="QuantFlow 品牌资源预览">
  <title>QuantFlow 品牌资源预览</title>
  <rect width="1200" height="720" fill="#F7F8FA"/>
  <text x="64" y="72" fill="#111827" font-family="ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif" font-size="30" font-weight="700">QuantFlow 品牌资源</text>
  <text x="64" y="108" fill="#4B5563" font-family="ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif" font-size="16">浏览器 · 用户端 · 管理端 · 深色表面</text>

  <rect x="64" y="144" width="336" height="224" rx="20" fill="#FFFFFF" stroke="#E5E7EB"/>
  <rect x="96" y="180" width="104" height="104" rx="22" fill="#050505"/>
  <g transform="translate(96 180) scale(0.7647058824)">${geometry("#FFFFFF")}</g>
  <text x="96" y="326" fill="#111827" font-family="ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif" font-size="18" font-weight="600">浏览器 / PWA</text>
  <text x="96" y="350" fill="#4B5563" font-family="ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif" font-size="14">方形应用图标与 favicon</text>

  <rect x="424" y="144" width="712" height="224" rx="20" fill="#FFFFFF" stroke="#E5E7EB"/>
  <g transform="translate(464 213) scale(0.3529411765)">${geometry("#111827")}</g>
  <text x="514" y="249" fill="#111827" font-family="ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif" font-size="30" font-weight="650" letter-spacing="-0.5">QuantFlow</text>
  <text x="464" y="326" fill="#111827" font-family="ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif" font-size="18" font-weight="600">官网 / 用户端</text>
  <text x="464" y="350" fill="#4B5563" font-family="ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif" font-size="14">浅色表面的标准横版组合</text>

  <rect x="64" y="392" width="696" height="264" rx="20" fill="#FFFFFF" stroke="#E5E7EB"/>
  <g transform="translate(104 457) scale(0.3529411765)">${geometry("#111827")}</g>
  <text x="154" y="493" fill="#111827" font-family="ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif" font-size="30" font-weight="650" letter-spacing="-0.5">QuantFlow</text>
  <text x="316" y="492" fill="#4B5563" font-family="ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif" font-size="16" font-weight="500">管理后台</text>
  <text x="104" y="594" fill="#111827" font-family="ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif" font-size="18" font-weight="600">管理端</text>
  <text x="104" y="620" fill="#4B5563" font-family="ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif" font-size="14">“管理后台”仅作产品区域说明，不作为中文品牌名</text>

  <rect x="784" y="392" width="352" height="264" rx="20" fill="#111827"/>
  <g transform="translate(824 455) scale(0.3529411765)">${geometry("#FFFFFF")}</g>
  <text x="874" y="491" fill="#FFFFFF" font-family="ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif" font-size="28" font-weight="650" letter-spacing="-0.5">QuantFlow</text>
  <text x="824" y="594" fill="#FFFFFF" font-family="ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif" font-size="18" font-weight="600">深色表面</text>
  <text x="824" y="620" fill="#D1D5DB" font-family="ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif" font-size="14">仅用于页脚等局部深色区域</text>
</svg>\n`;

const svgAssets = {
  "favicon.svg": icon(false),
  "quantflow-mark.svg": mark("#111827", "QuantFlow logo mark"),
  "quantflow-mark-white.svg": mark("#FFFFFF", "QuantFlow logo mark"),
  "quantflow-lockup-on-light.svg": lockup({ dark: false }),
  "quantflow-lockup-on-dark.svg": lockup({ dark: true }),
  "quantflow-admin-lockup-on-light.svg": lockup({ dark: false, admin: true }),
  "quantflow-brand-preview.svg": preview(),
};

for (const [name, content] of Object.entries(svgAssets)) {
  writeFileSync(join(svgDir, name), content);
}

const rasterSourceDir = join(tempDir, "source");
mkdirSync(rasterSourceDir, { recursive: true });
writeFileSync(join(rasterSourceDir, "app-icon.svg"), icon(false));
writeFileSync(join(rasterSourceDir, "app-icon-maskable.svg"), icon(true));

function rasterize(svgPath, outputName, size) {
  execFileSync("qlmanage", ["-t", "-s", "1024", "-o", tempDir, svgPath], {
    stdio: "ignore",
  });
  const rendered = join(tempDir, `${basename(svgPath)}.png`);
  execFileSync(
    "sips",
    [
      "-z",
      String(size),
      String(size),
      rendered,
      "--out",
      join(pngDir, outputName),
    ],
    { stdio: "ignore" },
  );
  rmSync(rendered, { force: true });
}

const appIconSource = join(rasterSourceDir, "app-icon.svg");
const maskableIconSource = join(rasterSourceDir, "app-icon-maskable.svg");
for (const size of [16, 32, 48])
  rasterize(appIconSource, `favicon-${size}.png`, size);
rasterize(appIconSource, "apple-touch-icon-180.png", 180);
rasterize(appIconSource, "pwa-icon-192.png", 192);
rasterize(appIconSource, "pwa-icon-512.png", 512);
rasterize(maskableIconSource, "pwa-maskable-192.png", 192);
rasterize(maskableIconSource, "pwa-maskable-512.png", 512);

rmSync(tempDir, { recursive: true, force: true });
console.log(
  `Generated ${Object.keys(svgAssets).length} SVG and 8 PNG brand assets.`,
);
