// Esta es la vieja implementacion del motor de papa productions vector. Fue reescrito por que es un desastre.
// EDIT 11/4/22: Lo revertire a esta version por que ala madre la otra implementacion es mas confusa.

let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
let datos = {};
let elementos = ["bloqueada", "visible", "seleccion", "pincel", "borrador", "canvas", "capas", "nombreCapa", "arribaCapa", "abajoCapa", "quitarCapaB", "ponerCapaB", "color", "grosor", "deshacerB", "rehacerB"];
let e = {};
let plataforma = "";
let shiftPresionado = false;
let archivoActual;
let modo = "pincel";
let locale = {};
let tiposHistorial = {
    "subirCapa": "Subir capa",
    "bajarCapa": "Bajar capa",
    "trazo": "Trazo"
};
let plataformas = {
    "win32": "Windows",
    "linux": "Linux",
    "darwin": "MacOS"
};
let herramientas = {};
let cambiado = false;
let traduccionesBotones = [
    {
        id: "nombreCapa",
        locale: "layerNamePlaceholder",
        propiedad: "placeholder"
    },
    {
        id: "grosor",
        locale: "lineWidthPlaceholder",
        propiedad: "placeholder"
    },
    {
        id: "txtVisible",
        locale: "visible",
        propiedad: "innerHTML"
    },
    {
        id: "txtBloqueado",
        locale: "locked",
        propiedad: "innerHTML"
    }
];
let dibujando = false;
let moviendo = false;
let historial = {
    deshecho: 0,
    acciones: []
};
let inicioSeleccion = { x: 0, y: 0 };
let seleccion = { x: 0, y: 0 };
let ultimaPosicion = { x: 0, y: 0 };
let posicionInicial = { x: 0, y: 0 };
let seleccionado = [];
let modos = [
    "pincel",
    "borrador",
    "seleccion"
];
let botonPresionado = -1;
let ultimaCaptura;
let posicionesBorrador = [];
let fecha = new Date();
//Primero de abril
let diaDeLosInocentes = fecha.getDate() === 1 && fecha.getMonth() === 3;

if(diaDeLosInocentes) {
    canvas.style.backgroundImage = "url(\"../vector.png\")";
    canvas.style.backgroundSize = "contain";
}

vector.obtenerLocale().then(l => {
    document.title = `${locale.appname}, ${locale.description}`;
    locale = l;
    herramientas = {
        "pincel": locale.pencil,
        "borrador": locale.eraser,
        "seleccion": locale.select
    };
    for(let b of traduccionesBotones) {
        document.getElementById(b.id)[b.propiedad] = locale[b.locale];
    }
    archivoActual = `${locale.untitled}.ppv`;
    vector.obtenerPlataforma().then(args => {
        plataforma = args;
        actualizarTitulo();
    });

    modos.forEach(m => {
        window[m].addEventListener("click", () => {
            modo = m;
            actualizarTitulo();
        });
    });

    canvas.setAttribute("width", 1280);
    canvas.setAttribute("height", 720);
    //canvas.style.width = `${window.innerWidth - 130}px`;
    //canvas.style.height = `${parseInt(canvas.style.width) * 720 / 1280}px`;

    elementos.forEach(el => window[el] = document.getElementById(el));

    nombreCapa.addEventListener("change", ev => {
        if(capas.selectedIndex < 0) return;
        datos.capas[capas.selectedIndex].nombre = nombreCapa.value;
        actualizarCapas();
    });
    

    document.addEventListener("mousemove", ev => {
        if(dibujando) {
            let rect = canvas.getBoundingClientRect();
            var posicion = { x: ev.clientX * parseFloat(canvas.width) / rect.width - rect.left, y: ev.clientY * parseFloat(canvas.height) / rect.height - rect.top };
            switch(modo) {
                case "pincel" :
                    ctx.fillStyle = color.value;
                    ctx.beginPath();
                    ctx.arc(posicion.x, posicion.y, grosor.value / 2, 0, Math.PI * 2);
                    datos.trazos[datos.trazos.length - 1].puntos.push({
                        x: posicion.x,
                        y: posicion.y
                    });
                    ctx.fill();
                break;
                case "borrador" :
                    posicionesBorrador.push(posicion);
                    actualizarPantalla(ctx, datos, seleccionado);
                    ctx.strokeStyle = "white";    
                    ctx.lineWidth = grosor.value;
                    ctx.beginPath();
                    posicionesBorrador.forEach((p, i) => {
                        if(i === 0) {
                            ctx.moveTo(p.x, p.y);
                        }
                        else {
                            ctx.lineTo(p.x, p.y);
                        }
                    });
                    ctx.stroke();
                break;
                case "seleccion" :
                    seleccion = posicion;
                    if(botonPresionado !== -1) {
                        let escalarX = 1;
                        let escalarY = 1;
                        switch(botonPresionado) {
                            case 0 :
                                escalarX = -1;
                                escalarY = -1;
                            break;
                            case 1 :
                                escalarX = 0;
                                escalarY = -1;
                            break;
                            case 2 :
                                escalarY = -1;
                            break;
                            case 3 :
                                escalarX = -1;
                                escalarY = 0;
                            break;
                            case 4 :
                                escalarY = 0;
                            break;
                            case 5 :
                                escalarX = -1;
                            break;
                            case 6 :
                                escalarX = 0;
                            break;
                        }
                        escalarTrazos(seleccionado, posicion, ultimaPosicion, escalarX, escalarY, shiftPresionado);
                        actualizarPantalla(ctx, datos, seleccionado);
                        ultimaPosicion = posicion;
                    }
                    else if(moviendo) {
                        moverTrazo(posicion, ultimaPosicion);
                        ultimaPosicion = posicion;
                        actualizarSeleccion();
                    }
                    else {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.putImageData(ultimaCaptura, 0, 0);
                        ctx.fillStyle = `rgba(${colorSeleccion.join(", ")}, 0.4)`;
                        ctx.strokeStyle = `rgba(${colorSeleccion.join(", ")}, 1)`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.rect(inicioSeleccion.x, inicioSeleccion.y, seleccion.x - inicioSeleccion.x, seleccion.y - inicioSeleccion.y);
                        ctx.fill();
                        ctx.stroke();
                    }
                break;
            }
        }
    });

    canvas.addEventListener("mousedown", ev => {
        let capa = capas.selectedIndex < 0 ? datos.capas[0].identificador : datos.capas[capas.selectedIndex].identificador;
        let rect = canvas.getBoundingClientRect();
        let posicionMouse = { x: ev.clientX * parseFloat(canvas.width) / rect.width - rect.left, y: ev.clientY * parseFloat(canvas.height) / rect.height - rect.top };
        if(!datos.capas.find(c => c.identificador === capa).visible || datos.capas.find(c => c.identificador === capa).bloqueada) {
            vector.mostrarError({
                title: locale.lockedLayerErrorTitle, 
                message: locale.lockedLayerError
            });
            return;
        }
        dibujando = true;
        switch(modo) {
            case "pincel" :
                seleccionado = [];
                datos.trazos.push({
                    capa: capa,
                    puntos: [],
                    grosor: parseFloat(grosor.value),
                    color: color.value,
                    posHistorial: datos.trazos.length,
                    tipo: "trazo"
                });
            break;
            case "borrador" :
                posicionesBorrador = [];
            break;
            case "seleccion" :
                ultimaPosicion = posicionMouse;
                let bounds = obtenerExtremos(seleccionado);
                let boton = obtenerBotonPresionado(bounds.puntosX[0], bounds.puntosY[0], bounds.puntosX[bounds.puntosX.length - 1], bounds.puntosY[bounds.puntosY.length - 1], posicionMouse.x, posicionMouse.y);
                if(boton !== -1) {
                    botonPresionado = boton;
                }
                else if(seleccionado.findIndex(s => {
                    switch(s.tipo) {
                        case "trazo" :
                            let x = s.puntos.map(p => p.x).sort((a, b) => a - b);
                            let y = s.puntos.map(p => p.y).sort((a, b) => a - b);
                            return posicionMouse.x > x[0] && posicionMouse.y > y[0] && posicionMouse.x < x[x.length - 1] && posicionMouse.y < y[y.length - 1];
                        break;
                        case "imagen" :
                            let imagen = cache.find(i => i.archivo === s.imagen).imagen;
                            return posicionMouse.x > s.x && posicionMouse.y > s.y && posicionMouse.x < (s.x + (s.w || imagen.width)) && posicionMouse.y < (s.y + (s.h || imagen.height));
                        break;
                    }
                }) !== -1) {
                    posicionInicial = posicionMouse;
                    moviendo = true;
                    registrarCambio();
                    ultimaPosicion = posicionMouse;
                    let datosFiltrados = JSON.parse(JSON.stringify(datos))
                    datosFiltrados.trazos = datos.trazos.filter(t => seleccionado.indexOf(t) === -1)
                    actualizarPantalla(ctx, datosFiltrados, []);
                    ultimaCaptura = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    actualizarSeleccion();
                }
                else {
                    inicioSeleccion = posicionMouse;
                    seleccion = posicionMouse;
                    ultimaCaptura = ctx.getImageData(0, 0, canvas.width, canvas.height);
                }
            break;
        }
    });

    document.addEventListener("mouseup", ev => {
        if(!dibujando) return;
        dibujando = false;
        let rect = canvas.getBoundingClientRect();
        let posicionMouse = { x: ev.clientX * parseFloat(canvas.width) / rect.width - rect.left, y: ev.clientY * parseFloat(canvas.height) / rect.height - rect.top };
        actualizarPantalla(ctx, datos, seleccionado);
        switch(modo) {
            case "borrador" :
                vector.mostrarError({ title: locale.eraserWIPTitle, message: locale.eraserWIP});
            break;
            case "pincel" :
                registrarCambio();
                ponerEnHistorial({
                    tipo: "trazo",
                    index: datos.trazos.length - 1,
                    trazos: [ datos.trazos[datos.trazos.length - 1] ]
                });
            break;
            case "seleccion" :
                if(!moviendo) {
                    if(!shiftPresionado) seleccionado = [];
                    if(inicioSeleccion.x > seleccion.x) {
                        let valorAnterior = inicioSeleccion.x;
                        inicioSeleccion.x = seleccion.x;
                        seleccion.x = valorAnterior;
                    }
                    if(inicioSeleccion.y > seleccion.y) {
                        let valorAnterior = inicioSeleccion.y;
                        inicioSeleccion.y = seleccion.y;
                        seleccion.y = valorAnterior;
                    }
                    seleccionado = seleccionado.concat(datos.trazos.filter(t => {
                        if(datos.capas.find(c => t.capa === c.identificador).bloqueada) return false;
                        switch(t.tipo) {
                            case "trazo" :
                                return t.puntos.findIndex(p => p.x > inicioSeleccion.x && p.y > inicioSeleccion.y && p.x < seleccion.x && p.y < seleccion.y) !== -1 && !seleccionado.includes(t) && datos.capas.find(c => t.capa === c.identificador).visible; 
                            break;
                            case "imagen" :
                                let imagen = cache.find(i => i.archivo === t.imagen).imagen;
                                return inicioSeleccion.x < (t.x + (t.w || imagen.width)) && inicioSeleccion.y < (t.y + (t.h || imagen.height)) && seleccion.x > t.x && seleccion.y > t.y;
                            break;
                        }
                    }));
                    actualizarPantalla(ctx, datos, seleccionado);
                }
                else {
                    ponerEnHistorial({
                        tipo: "moverTrazo",
                        seleccionado: seleccionado.map(s => datos.trazos.indexOf(s)),
                        x: posicionMouse.x - posicionInicial.x,
                        y: posicionMouse.y - posicionInicial.y
                    });
                }
            break;
        }
        moviendo = false;
        botonPresionado = -1;
        vector.actualizarBlending(seleccionado.length > 0 && seleccionado.filter(t => t.blending).length === seleccionado.length);
    });

    configurar();

    arribaCapa.addEventListener("click", () => {
        if(capas.selectedIndex === -1) {
            errorCapas();
            return;
        }
        subirCapa(datos.capas[capas.selectedIndex].identificador);
    });

    abajoCapa.addEventListener("click", () => {
        if(capas.selectedIndex === -1) {
            errorCapas();
            return;
        }
        bajarCapa(datos.capas[capas.selectedIndex].identificador);
    });

    ponerCapaB.addEventListener("click", () => ponerCapa());

    quitarCapaB.addEventListener("click", () => quitarCapa(capas.selectedIndex));

    /*function trasladarDibujos(index, direccion) {
        datos.trazos.forEach((trazo, i) => {
            if(trazo.capa === index) {
                if(direccion > 0) {
                    datos.trazos[i].capa++;
                }
                else {
                    datos.trazos[i].capa--;
                }
            }
            else if(trazo.capa === index - 1 || trazo.capa === index + 1) {
                datos.trazos[i].capa = index;
            }
        });
    }*/

    deshacerB.addEventListener("click", deshacer);
    rehacerB.addEventListener("click", rehacer);

    document.addEventListener("keydown", ev => {
        let ctrl = plataforma === "darwin" ? ev.metaKey : ev.ctrlKey;
        if(ctrl) {
            ev.preventDefault();
            switch(ev.key.toLowerCase()) {
                case "z" :
                    deshacer();
                break;
                case "y" :
                    rehacer();
                break;
                case "a" :
                    seleccionado = datos.trazos.filter(t => !datos.capas.find(c => c.identificador === t.capa).bloqueada);
                    modo = "seleccion";
                    actualizarTitulo();
                    actualizarPantalla(ctx, datos, seleccionado);
                break;
                case "t" :
                    grosor.value++;
                break;
                case "c" :
                    copiar();
                break;
                case "x" :
                    cortar();
                break;
                case "v" :
                    pegar();
                    modo = "seleccion";
                    actualizarTitulo();
                break;
            }
        }
        else {
            switch(ev.key.toLowerCase()) {
                case "t" :
                    grosor.value--;
                break;
            }
        }
        if(ev.shiftKey) shiftPresionado = true;
    });
    document.addEventListener("keyup", async ev => {
        if(!ev.shiftKey) shiftPresionado = false;
        let ctrl = plataforma === "darwin" ? ev.metaKey : ev.ctrlKey;
        if(ctrl) {
            switch(ev.key.toLowerCase()) {
                case "s" :
                    if(shiftPresionado) {
                        vector.guardarComo();
                    }
                    else {
                        vector.guardar();
                    }
                break;
            }
        }
        else {
            switch(ev.key.toLowerCase()) {
                case "delete" :
                    registrarCambio();
                    ponerEnHistorial({
                        tipo: "borrarTrazos",
                        trazos: seleccionado
                    });
                    seleccionado.forEach(s => datos.trazos.splice(datos.trazos.indexOf(s), 1))
                    seleccionado = [];
                    actualizarPantalla(ctx, datos, seleccionado);
                break;
                case "s" :
                    modo = "seleccion";
                    actualizarTitulo();
                break;
                case "p" :
                    modo = "pincel";
                    actualizarTitulo();
                break;
                case "e" :
                    modo = "borrador";
                    actualizarTitulo();
                break;
            }
        }
    });
    color.addEventListener("change", ev => {
        ponerEnHistorial({
            tipo: "cambiarColor",
            anteriores: seleccionado.map(t => { return { color: t.color, index: datos.trazos.indexOf(t) } }),
            color: ev.target.value
        });
        seleccionado.forEach(s => s.color = ev.target.value);
        actualizarPantalla(ctx, datos, seleccionado);
    });

    visible.addEventListener("change", ev => {
        ponerEnHistorial({
            tipo: "cambiarVisibilidad",
            cambiadoA: ev.target.checked,
            capa: datos.capas[capas.selectedIndex].identificador
        });
        datos.capas[capas.selectedIndex].visible = ev.target.checked;
        actualizarPantalla(ctx, datos, seleccionado);
        actualizarCapas();
    });

    bloqueada.addEventListener("change", ev => {
        ponerEnHistorial({
            tipo: "cambiarBloqueo",
            cambiadoA: ev.target.checked,
            capa: datos.capas[capas.selectedIndex].identificador
        });
        datos.capas[capas.selectedIndex].bloqueada = ev.target.checked;
        actualizarCapas();
    });

    capas.addEventListener("change", ev => {
        visible.checked = datos.capas[ev.target.selectedIndex].visible;
        bloqueada.checked = datos.capas[ev.target.selectedIndex].bloqueada;
    });
});
function configurar() {
    vector.obtenerArchivoActual().then(d => {
        datos = d.datos;
        for(let c of datos.capas) {
            if(!Object.keys(c).includes("visible")) {
                c.visible = true;
            }
            if(!Object.keys(c).includes("bloqueada")) {
                c.bloqueada = false;
            }
        }
        for(let t of datos.trazos) {
            if(!Object.keys(t).includes("tipo")) {
                t.tipo = "trazo";
            }
        }
        if(d.archivo) archivoActual = d.archivo;
        canvas.width = datos.res[0];
        canvas.height = datos.res[1];
        actualizarPantalla(ctx, datos, seleccionado);
        actualizarCapas();
        actualizarTitulo();
    });
}

function actualizarCapas() {
    capas.innerText = "";
    datos.capas.forEach(c => {
        var o = document.createElement("option");
        o.value = c.identificador;
        o.innerText = c.nombre;
        capas.appendChild(o);
    });
}

function subirCapa(identificador, registrar = true) {
    var capa = datos.capas.findIndex(c => c.identificador === identificador);
    if(capa === -1) {
        errorCapas();
        return;
    }
    if(capa === 0) return;
    var capaAnterior = datos.capas[capa - 1];
    datos.capas[capa - 1] = datos.capas[capa];
    datos.capas[capa] = capaAnterior;
    //trasladarDibujos(index, -1);  Trasladar dibujos ya no es necesario ya que las capas ya no funcionan por el index del array.
    actualizarCapas();
    actualizarPantalla(ctx, datos, seleccionado);
    if(registrar) {
        ponerEnHistorial({
            tipo: "subirCapa",
            index: identificador
        });
    }
    registrarCambio();
}

function bajarCapa(identificador, registrar = true) {
    var capa = datos.capas.findIndex(c => c.identificador === identificador);
    if(capa === -1) {
        errorCapas();
        return;
    }
    if(capa === datos.capas.length - 1) return;
    console.log(datos.capas);
    var capaAnterior = datos.capas[capa + 1];
    datos.capas[capa + 1] = datos.capas[capa];
    datos.capas[capa] = capaAnterior;
    console.log(datos.capas);
    actualizarCapas();
    actualizarPantalla(ctx, datos, seleccionado);
    if(registrar) {
        ponerEnHistorial({
            tipo: "bajarCapa",
            index: identificador
        });
    }
    registrarCambio();
}

function ponerCapa() {
    let i;
    for(i = 1; i <= datos.capas.length; i++) {
        if(datos.capas.findIndex(c => c.nombre === `${locale.layer} ${i}`) === -1) break;
    }
    datos.capas.push({
        nombre: `${locale.layer} ${i}`,
        identificador: JSON.parse(JSON.stringify(datos.capas)).sort((a, b) => b.identificador - a.identificador)[0].identificador + 1,
        visible: true,
        bloqueada: false
    });
    actualizarCapas();
    registrarCambio();
}
function quitarCapa(capa) {
    if(datos.capas.length < 2) {
        vector.mostrarError({
            title: locale.onlyLayerTitle,
            message: locale.onlyLayer
        });
        return;
    }
    if(capas.selectedIndex === -1) {
        vector.mostrarError({
            title: locale.addDeleteLayerErrorTitle,
            message: locale.addDeleteLayerError
        });
        return;
    }
    //Reescribi esta parte ya que este codigo fue escrito cuando los identificadores eran el index de la capa. Lo cambie por que este codigo ahora es un desastre pwjropiaeshfasdkfhasilwrehweuirk
    /*var organizado = datos.trazos.sort((a, b) => a.capa - b.capa);
    var lTrazos = organizado.filter(t => t.capa === capa).length;
    var inicio = organizado.findIndex(t => t.capa === capa);
    organizado.splice(inicio, lTrazos);
    datos.trazos = organizado;
    datos.capas.splice(datos.capas.findIndex(c => c.identificador === capa), 1);
    //trasladarDibujos(index, 1);  Trasladar dibujos ya no es necesario ya que las capas ya no funcionan por el index del array.
    actualizarCapas();*/
    datos.trazos = datos.trazos.filter(t => datos.capas.findIndex(c => c.identificador === t.capa) !== capas.selectedIndex);
    datos.capas.splice(capas.selectedIndex, 1);
    actualizarCapas();
    actualizarPantalla(ctx, datos, seleccionado);
    registrarCambio();
}

async function copiar() { 
    let datosModificados = JSON.parse(JSON.stringify(seleccionado));
    for(let t of datosModificados) {
        delete t.posHistorial;
        t.orden = datos.capas.findIndex(c => c.identificador === t.capa);
    }
    console.log(datosModificados);
    await navigator.clipboard.writeText(JSON.stringify(datosModificados));
}

async function cortar() {
    ponerEnHistorial({
        tipo: "borrarTrazos",
        trazos: seleccionado
    });
    await copiar();
    seleccionado.forEach(s => datos.trazos.splice(datos.trazos.indexOf(s), 1))
    seleccionado = [];
    actualizarPantalla(ctx, datos, seleccionado);
}

async function pegar() {
    seleccionado = [];
    let pegado;
    try {
        pegado = JSON.parse(await navigator.clipboard.readText()).sort((a, b) => b.orden - a.orden);
    }
    catch { return; }
    for(let t of pegado) {
        delete t.orden;
        t.capa = datos.capas[capas.selectedIndex !== -1 ? capas.selectedIndex : 0].identificador;
    }
    datos.trazos = datos.trazos.concat(pegado);
    seleccionado = pegado;
    ponerEnHistorial({
        tipo: "trazo",
        trazos: pegado
    });
    actualizarPantalla(ctx, datos, seleccionado);
}

function deshacer() {
    let accion = historial.acciones[historial.acciones.length - 1 - historial.deshecho];
    if(historial.acciones.length < 1) return;
    if(historial.deshecho >= historial.acciones.length) return;
    switch(accion.tipo) {
        case "subirCapa" :
            bajarCapa(accion.index, false);
        break;
        case "bajarCapa" :
            subirCapa(accion.index, false);
        break;
        case "borrarTrazos" :
            datos.trazos = datos.trazos.concat(accion.trazos);
        break;
        case "cambiarVisibilidad" :
            datos.capas.find(c => c.identificador === accion.capa).visible = !accion.cambiadoA;
        break;
        case "cambiarBloqueo" :
            datos.capas.find(c => c.identificador === accion.capa).bloqueada = !accion.cambiadoA;
        break;
        case "cambiarColor" :
            accion.anteriores.forEach(t => datos.trazos[t.index].color = t.color);
        break;
        case "moverTrazo" :
            accion.seleccionado.forEach(s => {
                datos.trazos[s].puntos.forEach(p => {
                    p.x -= accion.x;
                    p.y -= accion.y;
                });
            });
        break;
        case "trazo" :
            for(let t of accion.trazos) {
                seleccionado.splice(seleccionado.indexOf(t), 1);
                datos.trazos.splice(datos.trazos.indexOf(t), 1);
            }
        break;
    }
    actualizarPantalla(ctx, datos, seleccionado);
    actualizarCapas();
    historial.deshecho++;
}

function rehacer() {
    if(historial.deshecho <= 0) return;
    historial.deshecho--;
    let accion = historial.acciones[historial.acciones.length - 1 - historial.deshecho];
    if(historial.acciones.length < 1) return;
    switch(accion.tipo) {
        case "subirCapa" :
            subirCapa(accion.index, false);
        break;
        case "bajarCapa" :
            bajarCapa(accion.index, false);
        break;
        case "borrarTrazos" :
            accion.trazos.forEach(t => datos.trazos.splice(datos.trazos.indexOf(t), 1));
        break;
        case "cambiarColor" :
            accion.anteriores.forEach(t => datos.trazos[t.index].color = accion.color);
        break;
        case "cambiarVisibilidad" :
            datos.capas.find(c => c.identificador === accion.capa).visible = accion.cambiadoA;
        break;
        case "cambiarVisibilidad" :
            datos.capas.find(c => c.identificador === accion.capa).bloqueada = accion.cambiadoA;
        break;
        case "moverTrazo" :
            accion.seleccionado.forEach(s => {
                datos.trazos[s].puntos.forEach(p => {
                    p.x += accion.x;
                    p.y += accion.y;
                });
            });
        break;
        case "trazo" :
            datos.trazos = datos.trazos.concat(accion.trazos);
        break;
    }
    actualizarPantalla(ctx, datos, seleccionado);
    actualizarCapas();
}

function errorCapas() {
    vector.mostrarError({
        title: locale.layerMoveFailureTitle,
        message: locale.layerMoveFailure
    });
}

vector.alDeshacer(deshacer);
vector.alRehacer(rehacer);
vector.alObtenerDatos((event, args) => {
    switch(args.tipo) {
        case "png" :
            vector.abrirConfiguracionPNG();
            //event.sender.send("datos", new Uint8Array(await imagen.arrayBuffer()));
        break;
        default :
            archivoActual = args.archivo;
            actualizarTitulo();
            let datosPurificados = JSON.parse(JSON.stringify(datos));
            datosPurificados.trazos = datosPurificados.trazos.map(d => {
                delete d.posHistorial;
                return d;
            });
            event.sender.send("datos", datosPurificados);
        break;
    }
});

vector.alObtenerPNG((event, args) => {
    let anterior = { width: canvas.width, height: canvas.height };
    let datosEscalados = JSON.parse(JSON.stringify(datos));
    canvas.width = args.height * canvas.width / canvas.height;
    canvas.height = args.height;
    datosEscalados.trazos = datosEscalados.trazos.map(t => {
        switch(t.tipo) {
            case "trazo":
                t.grosor *= args.height / anterior.height;
                //No quiero complicarme cambiando el grosor, asi que se aguantan.
                t.puntos.forEach(p => {
                    let escalado = args.height * (anterior.width / anterior.height);
                    p.x *= escalado / anterior.width;
                    p.y *= args.height / anterior.height;
                });
                return t;
            break;
            case "imagen" :
                let imagen = cache.find(i => i.archivo === t.imagen).imagen;
                t.w = (t.w || imagen.width) * (args.height * (anterior.width / anterior.height) / anterior.width);
                t.h = (t.h || imagen.height) * args.height / anterior.height;
                t.x *= args.width / anterior.width;
                t.y *= args.height / anterior.height;
                return t;
            break;
        }
    });
    actualizarPantalla(ctx, datosEscalados, []);
    canvas.toBlob(async imagen => {
        event.sender.send("datos", new Uint8Array(await imagen.arrayBuffer()));
        canvas.width = anterior.width;
        canvas.height = anterior.height;
        actualizarPantalla(ctx, datos, seleccionado);
    });
});

function actualizarTitulo() {
    document.title = `${cambiado ? "* " : ""}${locale.mainTitle.replace(/{appname}/g, locale.appname).replace(/{os}/g, plataformas[plataforma]).replace(/{file}/g, archivoActual).replace(/{tool}/g, herramientas[modo])}`;
}

function ponerEnHistorial(datos) {
    historial.acciones = historial.acciones.slice(0, historial.acciones.length - historial.deshecho);
    historial.acciones.push(datos);
    historial.deshecho = 0;
}

function moverTrazo(posicion, ultimaPosicion) {
    let movimiento = { x: posicion.x - ultimaPosicion.x, y: posicion.y - ultimaPosicion.y };
    seleccionado.forEach(t => {
        switch(t.tipo) {
            case "trazo" :
                t.puntos.forEach(p => {
                    p.x += movimiento.x,
                    p.y += movimiento.y
                });
            break;
            case "imagen" :
                t.x += movimiento.x;
                t.y += movimiento.y;
            break;
        }
    });
}

vector.alCrearFondo(() => {
    ponerCapa();
    datos.capas[datos.capas.length - 1].nombre = locale.backgroundLayer;
    datos.capas[datos.capas.length - 1].bloqueada = true;
    datos.trazos.push({
        capa: datos.capas.length - 1,
        puntos: [
            {
                x: 0,
                y: canvas.height / 2
            },
            {
                x: canvas.width,
                y: canvas.height / 2
            }
        ],
        grosor: canvas.height,
        color: "#FFFFFF",
        posHistorial: datos.trazos.length,
        tipo: "trazo"
    });
    ponerEnHistorial({
        tipo: "trazo",
        index: datos.trazos.length - 1,
        trazos: [ JSON.parse(JSON.stringify(datos.trazos[datos.trazos.length - 1])) ]
    });
    actualizarCapas();
    actualizarPantalla(ctx, datos, seleccionado);
});

function registrarCambio(nuevo = true) {
    cambiado = nuevo;
    actualizarTitulo();
    vector.registrarCambio(nuevo);
}

vector.alGuardar(() => {
    registrarCambio(false);
});

vector.alLimpiarHistorial(() => {
    historial.acciones = [];
    historial.deshecho = 0;
});

function moverAlFrente(trazos) {
    for(let t of trazos) {
        datos.trazos.splice(datos.trazos.indexOf(t), 1);
        datos.trazos.push(t);
    }
    actualizarPantalla(ctx, datos, seleccionado);
}

function moverAlFondo(trazos) {
    for(let i = trazos.length - 1; i >= 0; i--) {
        let t = trazos[i];
        datos.trazos.splice(datos.trazos.indexOf(i), 1);
        datos.trazos.unshift(t);
    }
    actualizarPantalla(ctx, datos, seleccionado);
}

vector.alMoverAlFrente(() => moverAlFrente(seleccionado));
vector.alMoverAlFondo(() => moverAlFondo(seleccionado));

vector.alImportarImagen((event, args) => {
    for(let archivo of args) {
        datos.trazos.push({
            tipo: "imagen",
            capa: datos.capas[capas.selectedIndex !== -1 ? capas.selectedIndex : 0].identificador,
            x: 0,
            y: 0,
            imagen: archivo
        });
    }
    actualizarPantalla(ctx, datos, seleccionado);
});

function actualizarSeleccion() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.putImageData(ultimaCaptura, 0, 0);
    let datosFiltrados = JSON.parse(JSON.stringify(datos));
    datosFiltrados.trazos = seleccionado;
    actualizarPantalla(ctx, datosFiltrados, seleccionado, false, false);
}

//24/06/22 - Necesito ayuda mental
//25/06/22 - Despues de semanas, esta funcion finalmente funciona decentemente. FINALMENTE AAAAA
function escalarTrazos(trazos, posicion, ultimaPosicion, escalarX = 1, escalarY = 1, bloquear = false) {
    let extremos = obtenerExtremos(trazos);
    let w = extremos.puntosX[extremos.puntosX.length - 1] - extremos.puntosX[0];
    let h = extremos.puntosY[extremos.puntosY.length - 1] - extremos.puntosY[0];
    let invertidoX = (1 - escalarX) / 2;
    let invertidoY = (1 - escalarY) / 2;
    let posicionBoton = obtenerPosicion(botonPresionado);
    if(bloquear) {
        ultimaPosicion.x = Math.max(ultimaPosicion.x, ultimaPosicion.y);
        ultimaPosicion.y = ultimaPosicion.x;
        posicion.x = Math.max(posicion.x, posicion.y);
        posicion.y = posicion.x;
    }
    trazos.forEach(t => {
        switch(t.tipo) {
            case "trazo" :
                t.puntos.forEach(p => {
                    if(escalarX !== 0) {
                        if((ultimaPosicion.x - posicion.x) * escalarX < w) {
                        p.x = extremos.puntosX[0] + invertidoX * (posicion.x - ultimaPosicion.x) + ((p.x - extremos.puntosX[0]) * (w + (posicion.x - ultimaPosicion.x) * escalarX) / w);
                        }
                        else {
                            p.x = extremos.puntosX[0] - (p.x - extremos.puntosX[0]);
                            posicionBoton.x = 2 - posicionBoton.x;
                        }
                    }
                    if(escalarY !== 0) {
                        if((ultimaPosicion.y - posicion.y) * escalarY < h) {
                            p.y = extremos.puntosY[0] + invertidoY * (posicion.y - ultimaPosicion.y) + ((p.y - extremos.puntosY[0]) * (h + (posicion.y - ultimaPosicion.y) * escalarY) / h);
                        }
                        else {
                            p.y = extremos.puntosY[0] - (p.y - extremos.puntosY[0]);
                            posicionBoton.y = 2 - posicionBoton.y;
                        }
                    } //25/06/22 - Linea 1000
                });
            break;
        }
    });
    botonPresionado = obtenerBoton(posicionBoton);
    return trazos;
    
}

vector.alCambiarBlending((event, args) => {
    seleccionado.forEach(t => t.blending = args);
    actualizarPantalla(ctx, datos, seleccionado);
});

vector.alDeshabilitarBlending((event, args) => {
    habilitarBlending(!args);
    actualizarPantalla(ctx, datos, seleccionado);
});
