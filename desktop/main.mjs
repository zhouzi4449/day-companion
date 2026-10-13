import { app, BrowserWindow, protocol, net, session, shell, Menu, dialog, ipcMain, safeStorage } from 'electron';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { sources } from '../app/knowledge.mjs';
import { createAiService } from './ai.mjs';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../app');
const origin = 'companion://app';
const allowedLinks = new Set([...Object.values(sources).map(s => s.url), 'https://www.nhc.gov.cn/xcs/c100122/202507/4819417642d4432fb9f227e1e10ca616.shtml', 'https://github.com/zhouzi4449/day-companion', 'https://github.com/zhouzi4449/day-companion/blob/main/COMMERCIAL.md']);
protocol.registerSchemesAsPrivileged([{ scheme: 'companion', privileges: { standard: true, secure: true, supportFetchAPI: true } }]);
app.setName('DayCompanion');
if (process.env.DAY_COMPANION_TEST_DATA) app.setPath('userData', path.resolve(process.env.DAY_COMPANION_TEST_DATA));
let window;
let aiService;
function openReference(url) {
  if (allowedLinks.has(url)) shell.openExternal(url).catch(() => dialog.showMessageBox(window, { type: 'info', message: '暂时无法打开浏览器，请稍后重试。' }));
  else if (url === 'tel:12356') dialog.showMessageBox(window, { type: 'info', title: '现实支持', message: '中国大陆心理援助热线：12356', detail: '请使用电话拨打。立即危险请联系所在地急救或附近急诊；热线不替代急救。' });
}
function createWindow() {
  window = new BrowserWindow({ title: '日有回声', icon: path.resolve(appRoot, '../assets/icon.png'), width: 1280, height: 900, minWidth: 900, minHeight: 640, backgroundColor: '#f2f5f3', show: false,
    webPreferences: { preload: path.resolve(appRoot, '../desktop/preload.cjs'), nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true, spellcheck: false } });
  window.webContents.setWindowOpenHandler(({ url }) => { openReference(url); return { action: 'deny' }; });
  window.webContents.on('will-navigate', (event, url) => {
    const destination = new URL(url);
    if (destination.protocol !== 'companion:' || destination.hostname !== 'app' || !['/', '/index.html'].includes(destination.pathname)) { event.preventDefault(); openReference(url); }
  });
  window.webContents.on('will-attach-webview', event => event.preventDefault());
  window.once('ready-to-show', () => window.show());
  window.on('closed', () => { window = null; });
  window.loadURL(origin + '/index.html');
}
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { if (window) { if (window.isMinimized()) window.restore(); window.show(); window.focus(); window.webContents.executeJavaScript("window.dispatchEvent(new Event('day-companion-open'))"); } });
  app.whenReady().then(() => {
    const codexPath=app.isPackaged?path.join(process.resourcesPath,'codex','codex.exe'):path.resolve(appRoot,'../node_modules/@openai/codex-win32-x64/vendor/x86_64-pc-windows-msvc/bin/codex.exe');
    aiService=createAiService({app,safeStorage,net,codexPath,resolveProxy:url=>session.defaultSession.resolveProxy(url)});
    const guard=event=>{const url=new URL(event.senderFrame.url);if(url.protocol!=='companion:'||url.hostname!=='app'||url.pathname!=='/index.html')throw new Error('请求来源不允许。');};
    for(const [channel,handler] of Object.entries({'ai:settings':()=>aiService.publicSettings(),'ai:save':input=>aiService.save(input),'ai:reply':input=>aiService.reply(input),'ai:summarize':input=>aiService.summarize(input),'ai:login':()=>aiService.login()}))ipcMain.handle(channel,(event,input)=>{guard(event);return handler(input);});
    ipcMain.handle('ai:open-login',(event,url)=>{guard(event);if(!['https://auth.openai.com/codex/device','https://chatgpt.com/device'].includes(url))throw new Error('登录地址不允许。');return shell.openExternal(url);});
    session.defaultSession.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));
    session.defaultSession.setPermissionCheckHandler(() => false);
    protocol.handle('companion', async request => {
      try {
        const url = new URL(request.url);
        const file = path.resolve(appRoot, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
        const relative = path.relative(appRoot, file);
        if (url.hostname !== 'app' || request.method !== 'GET' || relative.startsWith('..') || path.isAbsolute(relative) || !['.html', '.css', '.mjs'].includes(path.extname(file)) || path.basename(file) === 'server.mjs') return new Response('Not found', { status: 404 });
        return net.fetch(pathToFileURL(file).toString());
      } catch { return new Response('Not found', { status: 404 }); }
    });
    session.defaultSession.on('will-download', (_event, item) => {
      if (!['.json', '.txt'].includes(path.extname(item.getFilename()))) { item.cancel(); return; }
      item.setSaveDialogOptions({ title: '保存你的记录备份', defaultPath: path.join(app.getPath('downloads'), item.getFilename()) });
    });
    Menu.setApplicationMenu(Menu.buildFromTemplate([
      { label: '日有回声', submenu: [{ label: '回到今天', accelerator: 'Ctrl+1', click: () => window?.webContents.executeJavaScript("location.hash='today'") }, { type: 'separator' }, { role: 'quit', label: '退出' }] },
      { label: '编辑', submenu: [{ role: 'undo', label: '撤销' }, { role: 'redo', label: '重做' }, { type: 'separator' }, { role: 'cut', label: '剪切' }, { role: 'copy', label: '复制' }, { role: 'paste', label: '粘贴' }, { role: 'selectAll', label: '全选' }] },
      { label: '视图', submenu: [{ role: 'zoomIn', label: '放大文字' }, { role: 'zoomOut', label: '缩小文字' }, { role: 'resetZoom', label: '恢复大小' }, { type: 'separator' }, { role: 'togglefullscreen', label: '全屏' }] }
    ]));
    createWindow();
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
  });
  app.on('window-all-closed', () => app.quit());
  app.on('before-quit',()=>aiService?.dispose());
}
