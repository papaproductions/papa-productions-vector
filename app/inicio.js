const titulo = document.getElementById("titulo");
const recientes = document.getElementById("recientes");
const txtRecientes = document.getElementById("txt-recientes");
const txtNuevo = document.getElementById("txt-nuevo");
const txtAbrir = document.getElementById("txt-abrir");
const btnNuevo = document.getElementById("btn-nuevo");
const btnAbrir = document.getElementById("btn-abrir");
const imgNuevo = document.getElementById("img-nuevo");
const imgAbrir = document.getElementById("img-abrir");
let fecha = new Date();
//Primero de abril
let diaDeLosInocentes = fecha.getDate() === 1 && fecha.getMonth() === 3;

vector.obtenerLocale().then(locale => {
    document.title = `${locale.appname}, ${diaDeLosInocentes ? locale.aprilFoolsDescription : locale.description}`;
    txtRecientes.innerHTML = locale.recent;
    txtNuevo.innerHTML = locale.menuBarFileNew;
    txtAbrir.innerHTML = locale.menuBarFileOpen;
    if(diaDeLosInocentes) {
        let srcNuevo = imgNuevo.src;
        imgNuevo.src = imgAbrir.src;
        imgAbrir.src = srcNuevo;
    }
    let prefijo = "time"
    let horas = Object.keys(locale).filter(k => k.length > prefijo.length && k.startsWith(prefijo)).map(k => { return { hora: parseInt(k.slice(prefijo.length)), texto: locale[k] } });

    titulo.innerHTML = `${locale.time}${horas.find(h => new Date().getHours() >= h.hora).texto}.`;

    vector.obtenerRecientes().then(r => {
        for(let i = 0; i < r.length; i++) {
            let archivo = r[i];
            let li = document.createElement("li");
            let canvas = document.createElement("canvas");
            let div = document.createElement("div");
            let a = document.createElement("a");
            for(let t of archivo.data.trazos) {
                if(!Object.keys(t).includes("tipo")) {
                    t.tipo = "trazo";
                }
            }
            canvas.width = archivo.data.res[0];
            canvas.height = archivo.data.res[1];
            canvas.className = "thumb";
            div.className = "archivo-reciente";
            li.appendChild(div);
            li.className = "li-archivo";
            div.appendChild(canvas);
            recientes.appendChild(li);
            let ctx = canvas.getContext("2d");
            actualizarPantalla(ctx, archivo.data, []);
            //div.innerHTML += `<span><a href="#"><b>${purificar(archivo.path)}</b></a> (${locale.access} ${new Date(archivo.lastUse).toString()})</span>`;
            a.className = "archivo";
            if(archivo.exists) {
                a.href = "#";
                a.addEventListener("click", () => abrirReciente(i));
            }
            else {
                a.classList.add("no-existente");
                a.title = locale.nonExistent.replace(/{path}/g, archivo.path);
            }
            a.innerHTML = `<b>${purificar(archivo.path)}</b> (${locale.access} ${new Date(archivo.lastUse).toString()})`;
            div.appendChild(a);
        }
    });

    function purificar(codigo) {
        return codigo.replace(/</, "&lt;").replace(/>/, "&gt;").replace(/&/, "&amp;");
    }

    btnNuevo.addEventListener("click", () => {
        vector.cambiarRPC();
        document.location.href = "dibujo.html";
    });

    btnAbrir.addEventListener("click", () => {
        vector.abrir();
    });
});

function abrirReciente(index) {
    vector.abrir(index);
}
