// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, Menu, dialog, MenuItem } = require('electron');
const RPC = require("discord-rpc");
const path = require('path');
const fs = require("fs");
const menu = new Menu();
const archivo = new Menu();
const edicion = new Menu();
const ayuda = new Menu();
const package = require("./package.json");
let recientes = require("./recent.json");
let locale;
let archivoActual;
let cambiado = false;
let fecha = new Date();
//Primero de abril
let diaDeLosInocentes = fecha.getDate() === 1 && fecha.getMonth() === 3;
let cantidadAs = 20;
let opcionRecientes;
let mainWindow;
let idDiscord = "979190206848729128";
let cliente = new RPC.Client({ transport: "ipc" });
let plataformas = {
    "win32": "Windows",
    "linux": "Linux",
    "darwin": "MacOS"
};
let rpcListo = false;
let nuevoProyecto;

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        icon: path.join(__dirname, 'icono.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true
        }
    });
    try {
        locale = require(`./locale/${app.getLocale().split("-")[0]}.json`);
    }
    catch {
        try {
            locale = require("./locale/en.json");
        }
        catch(err) {
            errorFatal(err);
            return;
        }
    }
    archivo.append(new MenuItem({
        label: locale.menuBarFileNew,
        click: (menuItem, browserWindow, event) => {
            archivoActual = undefined;
            abrirArchivoActual(true);
        }
    }));
    archivo.append(new MenuItem({
        label: locale.menuBarFileOpen,
        click: (menuItem, browserWindow, event) => {
            abrir(mainWindow);
        }
    }));
    opcionRecientes = new MenuItem({
        label: locale.menuBarFileOpenRecent,
        submenu: Menu.buildFromTemplate(obtenerMenuItemsDeRecientes(mainWindow))
    });
    archivo.append(opcionRecientes);
    archivo.append(new MenuItem({
        label: locale.menuBarFileSaveAs,
        click: (menuItem, browserWindow, event) => {
            guardarComo(mainWindow);
        }
    }));
    archivo.append(new MenuItem({
        label: locale.menuBarFileSave,
        click: (menuItem, browserWindow, event) => {
            if(archivoActual) {
                guardar(archivoActual, mainWindow);
            }
            else {
                guardarComo(mainWindow);
            }
        }
    }));
    archivo.append(new MenuItem({
        label: locale.importImage,
        click: (menuItem, browserWindow, event) => {
            let imagenes = dialog.showOpenDialogSync({ title: locale.importImage });
            mainWindow.webContents.send("importarImagen", imagenes);
        }
    }));
    archivo.append(new MenuItem({
        label: locale.menuBarFileExit,
        click: () => {
            app.quit();
        }
    }));

    edicion.append(new MenuItem({
        label: locale.undo,
        click: () => {
            mainWindow.webContents.send("deshacer");
        }
    }));
    edicion.append(new MenuItem({
        label: locale.redo,
        click: () => {
            mainWindow.webContents.send("rehacer");
        }
    }));

    edicion.append(new MenuItem({
        label: locale.createBackgroundLayer,
        click: (menuItem, browserWindow, event) => {
            browserWindow.webContents.send("crearFondo");
        }
    }));
    edicion.append(new MenuItem({
        label: locale.clearHistory,
        click: (menuItem, browserWindow, event) => {
            dialog.showMessageBox({
                title: locale.clearHistory,
                message: locale.clearHistoryConfirmation,
                type: "question",
                buttons: ["OK", "Cancel"]
            }).then(v => {
                if(v.response === 0) mainWindow.webContents.send("limpiarHistorial");
            });
        }
    }));
    edicion.append(new MenuItem({
        label: locale.moveUp,
    }));
    edicion.append(new MenuItem({
        label: locale.moveDown,
    }));
    edicion.append(new MenuItem({
        label: locale.moveToTheFront,
        click: (menuItem, browserWindow, event) => {
            mainWindow.webContents.send("moverAlFrente")
        }
    }));
    edicion.append(new MenuItem({
        label: locale.moveToTheBack,
        click: (menuItem, browserWindow, event) => {
            mainWindow.webContents.send("moverAlFondo")
        }
    }));
    let opcionBlending = new MenuItem({
        label: locale.enableBlending,
        type: "checkbox",
        click: (menuItem, browserWindow, event) => {
            mainWindow.webContents.send("cambiarBlending", menuItem.checked)
        }
    });
    edicion.append(opcionBlending);
    edicion.append(new MenuItem({
        label: locale.visuallyDisableBlending,
        type: "checkbox",
        click: (menuItem, browserWindow, event) => {
            mainWindow.webContents.send("deshabilitarBlending", menuItem.checked)
        }
    }));
    ayuda.append(new MenuItem({
        label: locale.menuBarHelpAbout,
        click: (menuItem, browserWindow) => {
            /*dialog.showMessageBox(browserWindow, {
                title: "Acerca de Papa productions Vector",
                type: "info",
                message: `Papa productions Vector v${package.version}
Licenciado bajo licencia ${package.license}
Corriendo en: ${plataformas[os.platform()]} ${os.release()}
Creado por: Kamil Alejandro`
            })*/
            if(browserWindow.title === locale.about.replace(/{appname}/g, locale.appname)) {
                dialog.showMessageBox(browserWindow, {
                    title: "...",
                    message: locale.why,
                    type: "error"
                });
                return;
            }
            let window = new BrowserWindow({
                width: 600,
                height: 400,
                webPreferences: {
                    preload: path.join(__dirname, 'preload.js'),
                    contextIsolation: true
                },
                icon: path.join(__dirname, 'icono.png')
            });
            window.loadFile("./app/about.html");
        }
    }));

    menu.append(new MenuItem({
        label: locale.menuBarFile,
        submenu: archivo
    }));
    menu.append(new MenuItem({
        label: locale.menuBarEdit,
        submenu: edicion
    }));
    menu.append(new MenuItem({
        label: locale.menuBarHelp,
        submenu: ayuda
    }));
    if(diaDeLosInocentes) {
        let m = new Menu();
        for(let i = 0; i < 100; i++) m.append(new MenuItem({ label: "A".repeat(cantidadAs) }));
        menu.append(new MenuItem({ label: "A".repeat(cantidadAs), submenu: m }))
    }

    Menu.setApplicationMenu(menu);
    // and load the index.html of the app.
    let archivoEnArgumentos = process.argv[process.argv.length - 1];
    if(path.extname(archivoEnArgumentos) === ".ppv") {
        try {
            fs.statSync(archivoEnArgumentos);
            archivoActual = archivoEnArgumentos;
            abrirArchivoActual();
        }
        catch {}
    }
    else {
        mainWindow.loadFile('./app/index.html').then(() => mainWindow.webContents.openDevTools()).catch(err => errorFatal(err));
    }
    
    mainWindow.on('closed', () => {
        if (process.platform !== 'darwin') app.quit();
    });
    ipcMain.handle("guardarImagen", (event, args) => {
        mainWindow.webContents.send("obtenerPNG", args);
    });
    ipcMain.handle("actualizarBlending", (event, args) => opcionBlending.checked = args);
    mainWindow.on("close", event => {
        if(!cambiado) return;
        event.preventDefault();
        dialog.showMessageBox(mainWindow, {
            title: locale.beforeExitTitle,
            message: locale.beforeExit,
            type: "question",
            buttons: [
                "Yes",
                "No",
                "Cancel"
            ]
        }).then(v => {
            switch(v.response) {
                case 0 :
                    cambiado = false;
                    mainWindow.close();
                break;
                case 1 :
                    guardarComo(mainWindow);
                break;
            }
        });
    });
}

function cambiarRPC() {
    if(!rpcListo) return;
    cliente.setActivity({
        details: `v${package.version}, ${plataformas[process.platform]}`,
        state: archivoActual ? locale.editing.replace(/{file}/, path.basename(archivoActual)) : locale.editing.replace(/{file}/, `${locale.untitled}.ppv`),
        largeImageKey: "icon",
        startTimestamp: Date.now()
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle("obtenerPlataforma", (event, args) => {
    return process.platform;
});

ipcMain.handle("mostrarDialogo", (event, args) => {
    return dialog.showMessageBoxSync(BrowserWindow.getFocusedWindow(), args);
});

ipcMain.handle("mostrarError", (event, args) => {
    return dialog.showErrorBox(args.title, args.message);
});

ipcMain.handle("nuevoProyecto", (event, args) => {
    nuevoProyecto = args;
    abrirArchivoActual();
});

ipcMain.handle("obtenerRecientes", (event, args) => {
    return recientes.map(f => {
        let archivo = JSON.parse(JSON.stringify(f));
        let jumpscare = JSON.parse(fs.readFileSync(path.join(__dirname, "jumpscare.ppv")).toString());
        try {
            archivo.data = diaDeLosInocentes ? jumpscare : JSON.parse(fs.readFileSync(f.path).toString());
            archivo.exists = true;
        }
        catch(err) {
            archivo.data = JSON.parse(fs.readFileSync(path.join(__dirname, "pregunta.ppv")).toString());
            archivo.exists = false;
        }
        return archivo;
    });
});

ipcMain.handle("obtenerInformacionDelProyecto", (event, args) => {
    return { version: package.version, license: package.license, author: package.author };
});

ipcMain.handle("obtenerLocale", (event, args) => {
    return locale;
});

ipcMain.handle("obtenerArchivoActual", (event, args) => {
    let f;
    if(nuevoProyecto) {
        let proyecto = nuevoProyecto;
        nuevoProyecto = undefined;
        let capas = [
            {
                nombre: `${locale.layer} 1`,
                identificador: 0,
                visible: true,
                bloqueada: false
            }
        ];
        if(proyecto.fondo) {
            capas.push({
                nombre: locale.backgroundLayer,
                identificador: 1,
                visible: true,
                bloqueada: true
            });
        }
        return {
            datos: {
                res: [proyecto.w, proyecto.h],
                capas: capas,
                trazos: proyecto.fondo ? [
                    {
                        capa: 1,
                        color: proyecto.fondo,
                        grosor: proyecto.h,
                        puntos: [
                            {
                                x: 0,
                                y: proyecto.h / 2
                            },
                            {
                                x: proyecto.w,
                                y: proyecto.h / 2
                            }
                        ],
                        tipo: "trazo"
                    }
                ] : []
            }
        };
    }
    else { 
        try {
            f = fs.readFileSync(archivoActual);
        }
        catch(err) {
            dialog.showErrorBox(locale.loadFailureTitle, locale.loadFailure);
            return;
        }
        try {
            return {
                datos: JSON.parse(f),
                archivo: archivoActual,
            };
        }
        catch(err) {
            dialog.showErrorBox(locale.parseFailureTitle, locale.parseFailure);
            return;
        }
    }
});

ipcMain.handle("abrir", (event, args) => {
    abrir(BrowserWindow.getFocusedWindow(), args); 
});

ipcMain.handle("guardarComo", (event, args) => {
    guardarComo(BrowserWindow.getFocusedWindow()); 
});

ipcMain.handle("cambiarRPC", (event, args) => cambiarRPC());

ipcMain.handle("guardar", (event, args) => {
    if(archivoActual) {
        guardar(archivoActual, BrowserWindow.getFocusedWindow());
    }
    else {
        guardarComo(BrowserWindow.getFocusedWindow());
    } 
});
function abrirVentana(w, h, archivo) {
    let window = new BrowserWindow({
        width: w,
        height: h,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true
        },
        icon: path.join(__dirname, 'icono.png')
    });
    window.loadFile(archivo);
}

ipcMain.handle("abrirConfiguracionPNG", (event, args) => {
    abrirVentana(600, 400, "app/png.html");
});

ipcMain.handle("registrarCambio", (event, args) => {
    cambiado = args;
});

ipcMain.handle("nuevo", () => abrirArchivoActual(true));

function errorFatal(err) {
    BrowserWindow.getAllWindows()[0].setTitle("Papa productions Vector but it's broken.");
        dialog.showErrorBox("Fatal error", `Your Papa productions Vector installation is broken. Please reinstall Vector completely.

Tu instalación de Papa productions Vector está dañada. Por favor vuelve a instalar Vector por completo.

${err.stack}`)
    app.exit(1);
}

function guardar(f, browserWindow) {
    let extension = f.split(".");
    browserWindow.webContents.send("obtenerDatos", {
        archivo: f,
        tipo: extension[extension.length - 1]
    });
    ipcMain.once("datos", (event, args) => {
        try {
            let datos = args;
            switch(extension[extension.length - 1]) {
                case "png" :
                    fs.writeFileSync(f, datos);
                break;
                default:
                    fs.writeFileSync(f, JSON.stringify(datos));
                    ponerEnRecientes(f);
                break;
            }
            archivoActual = f;
            cambiarRPC();
        }
        catch(err) {
            dialog.showErrorBox(locale.error, `${locale.saveFailure}
${err.stack}`);
        }
    });
    browserWindow.webContents.send("guardar");
}

function obtenerMenuItemsDeRecientes(b) {
    return recientes.map(r => { return new MenuItem({ label: r.path, click: (menuItem, browserWindow, event) => abrir(b || browserWindow, menuItem.menu.items.filter(i => i.visible).indexOf(menuItem)) }) });
}

function ponerEnRecientes(archivo) {
    let actual = recientes.findIndex(r => r.path === archivo);
    let itemsVisibles = opcionRecientes.submenu.items.filter(i => i.visible);
    if(actual !== -1) {
        recientes.splice(actual, 1);
        itemsVisibles[actual].visible = false;
        itemsVisibles = opcionRecientes.submenu.items.filter(i => i.visible);
    }
    recientes.unshift({
        path: archivo,
        lastUse: Date.now()
    });
    while(recientes.length > 10) {
        recientes.pop();
        itemsVisibles[itemsVisibles.length - 1].visible = false;
        itemsVisibles = opcionRecientes.submenu.items.filter(i => i.visible);
    }
    opcionRecientes.submenu.insert(0, obtenerMenuItemsDeRecientes(mainWindow)[0]);
    Menu.setApplicationMenu(menu);
    fs.writeFileSync("recent.json", JSON.stringify(recientes));
}

function guardarComo(browserWindow) {
    let directorio = dialog.showSaveDialogSync(browserWindow, {
        title: locale.menuBarFileSaveAs,
        defaultPath: archivoActual || `${locale.untitled}.ppv`,
        filters: [
            {
                name: locale.projectFileExtensionName.replace(/{appname}/g, locale.appname),
                extensions: ["ppv"]
            },
            {
                name: locale.pngExtensionName,
                extensions: ["png"]
            }
        ]
    });
    if(!directorio) return;
    guardar(directorio, browserWindow);
}

async function abrir(browserWindow, index) {
    if(index >= 0) {
        archivoActual = recientes[index].path;
    }
    else {
        let f = dialog.showOpenDialogSync(browserWindow, {
            title: locale.menuBarFileOpen,
            filters: [
                {
                    name: locale.projectFileExtensionName.replace(/{appname}/g, locale.appname),
                    extensions: ["ppv"]
                }
            ]
        });
        if(!f) return;
        archivoActual = f[0];
    }
    ponerEnRecientes(archivoActual);
    abrirArchivoActual();
}

async function abrirArchivoActual(nuevo = false) {
    if(nuevo) {
        archivoActual = undefined;
        abrirVentana(600, 400, "app/project-config.html");
    }
    else {
        cambiarRPC();
        mainWindow.loadFile("app/dibujo.html");
    }
}

cliente.login({ clientId: idDiscord }).catch(() => console.log("Failed to connect with Discord."));

cliente.on("ready", () => rpcListo = true);

