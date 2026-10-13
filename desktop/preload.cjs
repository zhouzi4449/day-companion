const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('dayAi',Object.freeze({
  settings:()=>ipcRenderer.invoke('ai:settings'),
  save:input=>ipcRenderer.invoke('ai:save',input),
  reply:context=>ipcRenderer.invoke('ai:reply',context),
  summarize:context=>ipcRenderer.invoke('ai:summarize',context),
  login:()=>ipcRenderer.invoke('ai:login'),
  openLogin:url=>ipcRenderer.invoke('ai:open-login',url)
}));
