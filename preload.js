const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("vector", {
    obtenerPlataforma: () => ipcRenderer.invoke("obtenerPlataforma"),
    mostrarDialogo: args => ipcRenderer.invoke("mostrarDialogo", args),
    mostrarError: args => ipcRenderer.invoke("mostrarError", args),
    obtenerRecientes: () => ipcRenderer.invoke("obtenerRecientes"),
    obtenerInformacionDelProyecto: () => ipcRenderer.invoke("obtenerInformacionDelProyecto"),
    obtenerLocale: () => ipcRenderer.invoke("obtenerLocale"),
    alDeshacer: callback => ipcRenderer.on("deshacer", callback),
    alRehacer: callback => ipcRenderer.on("rehacer", callback),
    alObtenerDatos: callback => ipcRenderer.on("obtenerDatos", callback),
    obtenerArchivoActual: () => ipcRenderer.invoke("obtenerArchivoActual"),
    abrir: (index = -1) => ipcRenderer.invoke("abrir", index),
    alCrearFondo: callback => ipcRenderer.on("crearFondo", callback),
    abrirConfiguracionPNG: () => ipcRenderer.invoke("abrirConfiguracionPNG"),
    guardarImagen: (width, height) => ipcRenderer.invoke("guardarImagen", { width: width, height: height }),
    alObtenerPNG: callback => ipcRenderer.on("obtenerPNG", callback),
    alGuardar: callback => ipcRenderer.on("guardar", callback),
    registrarCambio: cambio => ipcRenderer.invoke("registrarCambio", cambio),
    alLimpiarHistorial: callback => ipcRenderer.on("limpiarHistorial", callback),
    guardar: () => ipcRenderer.invoke("guardar"),
    guardarComo: () => ipcRenderer.invoke("guardarComo"),
    alMoverAlFrente: callback => ipcRenderer.on("moverAlFrente", callback),
    alMoverAlFondo: callback => ipcRenderer.on("moverAlFondo", callback),
    cambiarRPC: () => ipcRenderer.invoke("cambiarRPC"),
    alImportarImagen: callback => ipcRenderer.on("importarImagen", callback)
});
