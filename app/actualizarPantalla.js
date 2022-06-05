let cache = [];
let sBotones = 20;

async function actualizarPantalla(ctx, datos, seleccionado, limpiar = true) {
    var organizado = JSON.parse(JSON.stringify(datos.trazos)).sort((a, b) => datos.capas.findIndex(c => b.capa === c.identificador) - datos.capas.findIndex(c => a.capa === c.identificador)).filter(c => datos.capas.find(capa => capa.identificador === c.capa).visible);
    if(limpiar) limpiarTodo(ctx);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for(let trazo of organizado) {
        switch(trazo.tipo) {
            case "trazo" :
                ctx.beginPath();
                try {
                    ctx.moveTo(trazo.puntos[0].x, trazo.puntos[0].y);
                }
                catch(err) {
                    //xd
                }
                ctx.lineWidth = trazo.grosor;
                ctx.strokeStyle = trazo.color;
                trazo.puntos.forEach(t => {
                    ctx.lineTo(t.x, t.y);
                });
                ctx.stroke();
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
    seleccionado.forEach(t => {
        ctx.fillStyle = `rgba(${colorSeleccion.join(", ")}, 0.4)`;
        ctx.strokeStyle = `rgba(${colorSeleccion.join(", ")}, 1)`;
        ctx.lineWidth = 1;
        ctx.beginPath(); 
        switch(t.tipo) {
            case "trazo" :
                let x = t.puntos.map(t => t.x).sort((a, b) => a - b);
                let y = t.puntos.map(t => t.y).sort((a, b) => a - b);
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
}

function dibujarBotones(x, y, w, h) {
    colorBotones = colorSeleccion.map(c => c * 1.5 > 255 ? 255 : c * 1.5);
    ctx.fillStyle = `rgba(${colorBotones.join(", ")}, 0.4)`;
    ctx.strokeStyle = `rgba(${colorBotones.join(", ")}, 1)`;
    for(let j = 0; j < 3; j++) {
        for(let i = 0; i < 3; i++) {
            if(i === 1 && j === 1) continue;
            ctx.beginPath();
            ctx.rect(x + i * w / 2 - sBotones / 2, y + j * h / 2 - sBotones / 2, sBotones, sBotones);
            ctx.fill();
            ctx.stroke();
        }
    }
}
