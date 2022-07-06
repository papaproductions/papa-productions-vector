let cache = [];
let sBotones = 20;
let colorSeleccion = [50, 50, 255];

async function actualizarPantalla(ctx, datos, seleccionado, limpiar = true) {
    var organizado = JSON.parse(JSON.stringify(datos.trazos)).sort((a, b) => datos.capas.findIndex(c => b.capa === c.identificador) - datos.capas.findIndex(c => a.capa === c.identificador)).filter(c => datos.capas.find(capa => capa.identificador === c.capa).visible);
    if(limpiar) limpiarTodo(ctx);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    let canvasBlending = document.createElement("canvas");
    canvasBlending.width = ctx.canvas.width;
    canvasBlending.height = ctx.canvas.height;
    let ctxBlending = canvasBlending.getContext("2d");
    ctxBlending.lineCap = "round";
    ctxBlending.lineJoin = "round";
    for(let trazo of organizado) {
        switch(trazo.tipo) {
            case "trazo" :
                limpiarTodo(ctxBlending);
                let c = trazo.blending ? ctxBlending : ctx;
                c.beginPath();
                try {
                    c.moveTo(trazo.puntos[0].x, trazo.puntos[0].y);
                }
                catch(err) {
                    //xd
                }
                c.lineWidth = trazo.grosor;
                c.strokeStyle = trazo.color;
                trazo.puntos.forEach(t => {
                    c.lineTo(t.x, t.y);
                });
                c.stroke();
                if(trazo.blending) {
                    let imgBlending = c.getImageData(0, 0, canvasBlending.width, canvasBlending.height);
                    let img = ctx.getImageData(0, 0, canvasBlending.width, canvasBlending.height);
                    imgBlending.data.forEach((p, i) => {
                        let n = p + img.data[i];
                        if(n > 255) {
                            img.data[i] = 255;
                        }
                        else {
                            img.data[i] = n;
                        }
                    });
                    ctx.putImageData(img, 0, 0);
                }
            break;
            case "imagen" :
                let imagen = cache.find(i => i.archivo === trazo.imagen);
                let existente = true;
                if(!imagen) {
                    imagen = { archivo: trazo.imagen, imagen: new Image() };
                    imagen.imagen.src = trazo.imagen;
                    await new Promise((resolve, reject) => {
                        imagen.imagen.addEventListener("load", () => {
                            ctx.drawImage(imagen.imagen, trazo.x, trazo.y, trazo.w || imagen.imagen.width, trazo.h || imagen.imagen.height);
                            cache.push(imagen);
                            resolve();
                        });
                    });
                }
                else {
                    ctx.drawImage(imagen.imagen, trazo.x, trazo.y, trazo.w || imagen.imagen.width, trazo.h || imagen.imagen.height);
                }
            break;
        }
    }
    seleccionado.forEach((t, i) => {
        ctx.fillStyle = `rgba(${colorSeleccion.join(", ")}, 0.4)`;
        ctx.strokeStyle = `rgba(${colorSeleccion.join(", ")}, 1)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        switch(t.tipo) {
            case "trazo" :
                x = t.puntos.map(t => t.x).sort((a, b) => a - b);
                y = t.puntos.map(t => t.y).sort((a, b) => a - b);
                ctx.rect(x[0] - t.grosor / 2, y[0] - t.grosor / 2, x[x.length - 1] - x[0] + t.grosor, y[y.length - 1] - y[0] + t.grosor);
                ctx.fill();
                ctx.stroke();
                let colorInvertido = (0xFFFFFF - parseInt(t.color.replace(/#/, ""), 16)).toString(16);
                t.puntos.forEach(p => {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, t.grosor / 4, 0, Math.PI * 2);
                    ctx.fillStyle = `#${"0".repeat(6 - colorInvertido.length)}${colorInvertido}`;
                    ctx.fill();
                });
            break;
            case "imagen" :
                let imagen = cache.find(i => t.imagen === i.archivo).imagen;
                ctx.rect(t.x, t.y, t.w || imagen.width, t.h || imagen.height);
                ctx.fill();
                ctx.stroke();
            break;
        }
    });
    if(seleccionado.length > 0) {
        let { puntosX, puntosY } = obtenerExtremos(seleccionado);
        dibujarBotones(ctx, puntosX[0], puntosY[0], puntosX[puntosX.length - 1], puntosY[puntosY.length - 1]);
    }
}

function obtenerExtremos(trazos) {
    let puntosX = [];
    let puntosY = [];
    trazos.forEach(t => {
        switch(t.tipo) {
            case "trazo" :
                puntosX = puntosX.concat(t.puntos.map(p => p.x));
                puntosY = puntosY.concat(t.puntos.map(p => p.y));
            break;
            case "imagen" :
                let imagen = cache.find(i => i.archivo === t.imagen).imagen;
                puntosX.push(t.x, t.x + (t.w || imagen.width));
                puntosY.push(t.y, t.y + (t.h || imagen.height));
            break;
        }
    });
    puntosX = puntosX.sort((a, b) => a - b);
    puntosY = puntosY.sort((a, b) => a - b);
    return { puntosX, puntosY };
}

function dibujarBotones(ctx, x, y, x2, y2) {
    let w = x2 - x;
    let h = y2 - y;
    ctx.fillStyle = `rgba(${colorSeleccion.join(", ")}, 0.4)`;
    ctx.strokeStyle = `rgba(${colorSeleccion.join(", ")}, 1)`;
    let posiciones = obtenerPosiciones(x, y, x2, y2);
    for(let i = 0; i < posiciones.length; i++) {
        ctx.beginPath();
        ctx.rect(posiciones[i].x - sBotones / 2, posiciones[i].y - sBotones / 2, sBotones, sBotones);
        ctx.fill();
        ctx.stroke();
    }
}

function obtenerPosiciones(x, y, x2, y2) {
    let w = x2 - x;
    let h = y2 - y;
    let posiciones = [];
    for(let j = 0; j < 3; j++) {
        for(let i = 0; i < 3; i++) {
            if(i === 1 && j === 1) continue;
            posiciones.push({ x: x + i * w / 2, y: y + j * h / 2 });
        }
    }
    return posiciones;
}

function obtenerBotonPresionado(x, y, x2, y2, mouseX, mouseY) {
    let posiciones = obtenerPosiciones(x, y, x2, y2);
    
    return posiciones.findIndex(p => p.x - sBotones / 2 < mouseX && p.x + sBotones / 2 > mouseX && p.y - sBotones / 2 < mouseY && p.y + sBotones / 2 > mouseY);
}

function obtenerPosicion(boton) {
    if(boton > 3) boton += 1;
    return { x: boton % 3, y: Math.floor(boton / 3) };
}

function obtenerBoton(posicion) {
    let salida = posicion.y * 3 + posicion.x;
    if(salida > 3) salida -= 1;
    return salida;
}
