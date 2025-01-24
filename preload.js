const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // API greier
});
