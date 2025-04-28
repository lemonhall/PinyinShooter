# 汉字音调大作战 (Pinyin Shooter)

一个简单的网页游戏，玩家需要根据飞来的汉字选择正确的拼音音调。

## 技术栈

*   HTML5
*   CSS3
*   JavaScript (ES6+)
*   PixiJS (用于 2D 渲染)
*   Web Audio API (用于音效)
*   Web Speech API (用于语音合成)

## 开发设置

项目代码已被拆分到 `js/` 目录下的多个模块文件中，便于维护。

1.  **运行开发环境**:
    直接在浏览器中打开 `index.html` 文件即可运行。该文件会按顺序加载 `js/` 目录下的各个 JavaScript 文件。

2.  **推荐开发服务器 (使用 esbuild)**:
    为了获得更好的开发体验（如自动刷新），可以使用 `esbuild` 提供的开发服务器。
    *   首先确保你安装了 [Node.js](https://nodejs.org/) 和 npm (或 yarn)。
    *   在项目根目录下运行以下命令安装 `esbuild` (如果尚未安装):
        ```bash
        npm install esbuild --save-dev
        # 或者使用 yarn:
        # yarn add esbuild --dev
        ```
    *   将以下脚本添加到你的 `package.json` 文件中:
        ```json
        {
          "scripts": {
            "dev": "esbuild js/main.js --bundle --outfile=dist/bundle.js --servedir=. --watch"
          }
        }
        ```
    *   运行开发服务器:
        ```bash
        npm run dev
        ```
        这会启动一个本地服务器，并在文件更改时自动重新打包 `dist/bundle.js`。访问服务器提供的地址（通常是 `http://localhost:8000`）即可看到游戏，并且文件修改后页面会自动刷新。
        **注意**: `dev` 脚本生成的 `dist/bundle.js` 主要用于 `esbuild` 的开发服务器。直接打开 `index.html` 仍然加载的是 `js/` 目录下的源文件。

## 生产环境打包

为了优化性能，部署前应将所有 JavaScript 文件打包并压缩成一个文件。

1.  **安装 esbuild**:
    如果尚未安装，请参照"推荐开发服务器"部分的说明安装 `esbuild`。

2.  **配置打包脚本**:
    将以下脚本添加到 `package.json` 的 `scripts` 部分:
    ```json
    {
      "scripts": {
        "build": "esbuild js/main.js --bundle --outfile=dist/bundle.js --minify --sourcemap"
      }
    }
    ```
    *   `esbuild js/main.js`: 以 `js/main.js` 为入口。
    *   `--bundle`: 打包所有依赖。
    *   `--outfile=dist/bundle.js`: 输出到 `dist/bundle.js`。
    *   `--minify`: 压缩代码。
    *   `--sourcemap`: 生成 Source Map 用于调试。

3.  **运行打包命令**:
    ```bash
    npm run build
    ```
    这会在 `dist/` 目录下生成 `bundle.js` 和 `bundle.js.map`。

4.  **部署**:
    *   创建一个 `index.html` 的生产版本 (或修改现有版本)，将 `<script>` 标签替换为仅引用打包后的文件：
        ```html
        <!-- ... 其他 HTML ... -->
        <script src="dist/bundle.js"></script>
        <!-- ... 其他 HTML ... -->
        ```
    *   将修改后的 `index.html` 和 `dist/` 目录部署到你的服务器。

## 代码结构

*   `index.html`: 游戏主页面结构和样式。
*   `js/`: 存放 JavaScript 模块。
    *   `data.js`: 存放汉字数据。
    *   `audio.js`: 音频播放相关函数。
    *   `effects.js`: 视觉效果函数（震动、闪烁）。
    *   `speech.js`: 语音合成函数。
    *   `ui.js`: UI 元素创建、更新和布局。
    *   `gameLogic.js`: 核心游戏逻辑（目标、碰撞、状态）。
    *   `main.js`: PIXI 应用初始化、主循环、事件监听。
*   `dist/` (生成): 存放打包后的生产文件。
*   `package.json`: 项目元数据和脚本。
*   `README.md`: 本文档。

## 玩法

1.  在浏览器中打开 `index.html` 文件。
2.  屏幕上方会随机出现一个移动的汉字目标，同时会朗读该汉字。
3.  根据你听到的或根据汉字判断出的声调，点击屏幕下方对应的声调按钮（一声、二声、三声、四声）进行攻击。
4.  每次正确点击会减少目标的生命值。
5.  生命值降为零时，目标会被击毁，并出现新的目标。

## 功能

*   随机生成的飞行汉字目标（同时朗读）。
*   底部可选的声调按钮。
*   基于声调匹配的攻击机制。
*   攻击命中/失误的视觉与听觉反馈。
*   目标生命值和击毁效果。

## 如何运行

直接用网页浏览器打开 `