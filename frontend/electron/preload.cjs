const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,

  // Lấy các nguồn màn hình từ hệ điều hành
  getDesktopSources: () => ipcRenderer.invoke('get-desktop-sources'),

  // Bật/tắt chế độ Kiosk Lockdown
  setKioskMode: (enable) => ipcRenderer.invoke('set-kiosk-mode', enable),

  // Quét tiến trình gian lận
  scanCheatProcesses: () => ipcRenderer.invoke('scan-cheat-processes'),

  // Lấy thông tin ứng dụng
  getDesktopAppInfo: () => ipcRenderer.invoke('get-desktop-app-info'),

  // Thoát ứng dụng
  exitExamApp: () => ipcRenderer.invoke('exit-exam-app'),

  // Lắng nghe sự kiện bị chặn phím tắt
  onBlockedShortcut: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('blocked-shortcut-detected', handler);
    return () => {
      ipcRenderer.removeListener('blocked-shortcut-detected', handler);
    };
  },
});
