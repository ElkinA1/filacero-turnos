/*!
 * FilaCero IA · asesor comercial para la web de FilaCero.
 *
 *   <script src="./servidor.js"></script>   (opcional: window.filaCeroServidor = { api: "https://…" })
 *   <script src="./asesor.js" data-api="https://servidor-filacero" data-whatsapp="57…" defer></script>
 *
 * Botón flotante + panel de conversación dentro de un Shadow DOM (no hereda ni rompe los estilos de
 * la página). Si el servidor no responde, ofrece WhatsApp y correo. No usa cookies: la conversación
 * vive en sessionStorage de esta pestaña. Todo el texto recibido se escapa antes de mostrarse.
 */
(function () {
  "use strict";
  if (window.__filaCeroAsesor) return;
  window.__filaCeroAsesor = true;

  var script = document.currentScript;
  var ajustes = window.filaCeroServidor || {};
  var API = ((script && script.getAttribute("data-api")) || ajustes.api || (script ? new URL(script.src, location.href).origin : location.origin)).replace(/\/+$/, "");
  var NUMERO = ((script && script.getAttribute("data-whatsapp")) || (window.filaCeroContacto && window.filaCeroContacto.numeroWhatsApp) || "").replace(/\D/g, "");
  var CORREO = (script && script.getAttribute("data-correo")) || "";
  var CLAVE = "filacero-asesor-v1";

  var idiomaNavegador = (navigator.language || "es").slice(0, 2).toLowerCase();
  var L = ["es", "en", "pt"].indexOf(idiomaNavegador) >= 0 ? idiomaNavegador : "en";
  var T = {
    es: { abrir: "Abrir FilaCero IA", lanzador: "FilaCero IA", sub: "Asesor comercial · responde al instante", basico: "Asesor comercial · modo básico",
      escribiendo: "Escribiendo…", fuera: "Sin conexión con el asesor", placeholder: "Escribe tu pregunta…", enviar: "Enviar", cerrar: "Cerrar", nueva: "Nueva conversación",
      wa: "WhatsApp con Elkin", privacidad: "Aviso de privacidad", burbuja: "¿Te ayudo a ver si FilaCero encaja con tu operación?",
      offline: "En este momento no puedo conectarme. Escríbele a Elkin, fundador de FilaCero, por WhatsApp y te responde personalmente.",
      error: "No pude responder ahora. Intenta de nuevo o escríbenos por WhatsApp.", correo: "Escribir por correo", ia: "Respuesta generada por IA" },
    en: { abrir: "Open FilaCero IA", lanzador: "FilaCero IA", sub: "Sales advisor · instant answers", basico: "Sales advisor · basic mode",
      escribiendo: "Typing…", fuera: "Advisor offline", placeholder: "Type your question…", enviar: "Send", cerrar: "Close", nueva: "New conversation",
      wa: "WhatsApp with Elkin", privacidad: "Privacy notice", burbuja: "Can I help you see if FilaCero fits your operation?",
      offline: "I can't connect right now. Message Elkin, FilaCero's founder, on WhatsApp and he'll reply personally.",
      error: "I couldn't answer right now. Try again or message us on WhatsApp.", correo: "Send an email", ia: "AI-generated answer" },
    pt: { abrir: "Abrir FilaCero IA", lanzador: "FilaCero IA", sub: "Assessora comercial · respostas na hora", basico: "Assessora comercial · modo básico",
      escribiendo: "Digitando…", fuera: "Assessora offline", placeholder: "Escreva sua pergunta…", enviar: "Enviar", cerrar: "Fechar", nueva: "Nova conversa",
      wa: "WhatsApp com Elkin", privacidad: "Aviso de privacidade", burbuja: "Posso ajudar a ver se a FilaCero se encaixa na sua operação?",
      offline: "Não consigo me conectar agora. Fale com Elkin, fundador da FilaCero, pelo WhatsApp e ele responde pessoalmente.",
      error: "Não consegui responder agora. Tente de novo ou fale conosco pelo WhatsApp.", correo: "Enviar e-mail", ia: "Resposta gerada por IA" }
  };

  var ICONOS = {
    chispa: '<path d="M12 3.5 13.8 9a2 2 0 0 0 1.2 1.2l5.5 1.8-5.5 1.8a2 2 0 0 0-1.2 1.2L12 20.5 10.2 15A2 2 0 0 0 9 13.8L3.5 12 9 10.2A2 2 0 0 0 10.2 9L12 3.5Z"/><path d="M19 3v3M17.5 4.5h3"/>',
    cerrar: '<path d="M6 6l12 12M18 6 6 18"/>',
    enviar: '<path d="M4 12 20 4l-6 16-3-7-7-1Z"/>',
    nueva: '<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4h4"/>',
    wa: '<path d="M4.5 19.5 5.6 16A8 8 0 1 1 8.2 18.6Z"/><path d="M9.2 9.4c.3 1.7 1.7 3.6 3.6 4.5.6.3 1.2-.1 1.5-.6l.3-.5-1.4-.9-.6.5c-.8-.4-1.4-1-1.8-1.8l.5-.6-.9-1.4-.5.3c-.5.3-.8.9-.7 1.5Z"/>',
    demo: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    enlace: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'
  };
  function icono(nombre, t) {
    return '<svg viewBox="0 0 24 24" width="' + (t || 18) + '" height="' + (t || 18) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONOS[nombre] + "</svg>";
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }
  function urlSegura(u) {
    try { var x = new URL(u, location.href); return /^https?:$/.test(x.protocol) ? x.href : null; } catch (e) { return null; }
  }
  /* Negrita, código, viñetas, listas numeradas y enlaces https. Todo se escapa primero. */
  function enriquecido(texto) {
    function linea(l) {
      return esc(l)
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/(https?:\/\/[^\s<)]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    }
    return String(texto || "").split(/\n{2,}/).map(function (bloque) {
      var lineas = bloque.split("\n"), html = "", lista = null;
      lineas.forEach(function (l) {
        var t = l.trim(), m = t.match(/^(?:[-•*]|\d+[.)])\s+(.*)$/);
        if (m) {
          var tipo = /^\d/.test(t) ? "ol" : "ul";
          if (lista !== tipo) { if (lista) html += "</" + lista + ">"; html += "<" + tipo + ">"; lista = tipo; }
          html += "<li>" + linea(m[1]) + "</li>";
        } else if (t) {
          if (lista) { html += "</" + lista + ">"; lista = null; }
          html += "<p>" + linea(t) + "</p>";
        }
      });
      if (lista) html += "</" + lista + ">";
      return html;
    }).join("");
  }

  function leer() { try { return JSON.parse(sessionStorage.getItem(CLAVE)) || {}; } catch (e) { return {}; } }
  function guardar() {
    try {
      sessionStorage.setItem(CLAVE, JSON.stringify({ codigo: s.codigo, secreto: s.secreto, mensajes: s.mensajes.slice(-40), burbuja: s.burbuja, modo: s.modo }));
    } catch (e) { /* almacenamiento bloqueado: la conversación sigue en memoria */ }
  }

  var s = leer();
  s.mensajes = s.mensajes || [];
  var vista = { abierto: false, pensando: false, conectado: null, ficha: null, sugerencias: [], aviso: "", privacidad: "", waGeneral: null };

  function waGeneral() {
    if (vista.waGeneral) return vista.waGeneral;
    if (!NUMERO) return null;
    var texto = { es: "Hola Elkin, quiero conocer FilaCero.", en: "Hi Elkin, I'd like to learn about FilaCero.", pt: "Olá Elkin, quero conhecer a FilaCero." }[L];
    return "https://wa.me/" + NUMERO + "?text=" + encodeURIComponent(texto);
  }

  function pedir(ruta, cuerpo, metodo) {
    var opciones = { method: metodo || "POST", headers: { "Content-Type": "application/json" }, credentials: "omit", mode: "cors" };
    if (cuerpo && cuerpo.__keepalive) { delete cuerpo.__keepalive; opciones.keepalive = true; }
    if (cuerpo) opciones.body = JSON.stringify(cuerpo);
    return fetch(API + "/asesor/v1/chat/" + ruta, opciones).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) { if (!r.ok) { var e = new Error(d.error || "HTTP " + r.status); e.status = r.status; throw e; } return d; });
    });
  }

  // Enlaces de la demo: <a data-demo-perfil="cliente"> apunta al servidor vigente.
  function actualizarEnlacesDemo() {
    // Solo cuando la página vive en otro sitio (GitHub Pages) y conoce la URL del servidor.
    if (!(ajustes.api || (script && script.getAttribute("data-api")))) return;
    document.querySelectorAll("a[data-demo-perfil]").forEach(function (a) {
      a.href = API + "/demo/?perfil=" + encodeURIComponent(a.getAttribute("data-demo-perfil"));
    });
  }

  var CSS = [
    ":host{all:initial;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;color:#0f2a2e;--tinta:#0f2a2e;--petroleo:#135e63;--ambar:#f0b429}",
    "*{box-sizing:border-box}button,textarea,input{font:inherit}button{cursor:pointer}",
    ".fab{position:fixed;z-index:2147483000;right:max(18px,env(safe-area-inset-right));bottom:max(18px,env(safe-area-inset-bottom));display:inline-flex;align-items:center;gap:10px;height:54px;padding:0 20px 0 8px;border:0;border-radius:999px;background:linear-gradient(120deg,#0f2a2e 0%,#135e63 60%,#1f7d74 100%);color:#fff;font-size:15px;font-weight:700;letter-spacing:-.1px;box-shadow:0 12px 28px rgb(15 42 46/28%),0 0 0 1px rgb(255 255 255/8%) inset;transition:transform .2s ease,box-shadow .2s ease,opacity .2s ease}",
    ".fab:hover{transform:translateY(-2px);box-shadow:0 16px 34px rgb(15 42 46/34%)}.fab:focus-visible,.ia button:focus-visible,.ia a:focus-visible{outline:3px solid #bd8300;outline-offset:3px}",
    ".fab__ic{display:grid;place-items:center;width:38px;height:38px;border-radius:50%;background:var(--ambar);color:#0f2a2e;animation:latido 3.2s ease-in-out infinite}",
    ".fab__punto{position:absolute;top:6px;left:36px;width:11px;height:11px;border:2px solid #135e63;border-radius:50%;background:#5fd39a}",
    "@keyframes latido{0%,100%{box-shadow:0 0 0 0 rgb(240 180 41/45%)}50%{box-shadow:0 0 0 8px rgb(240 180 41/0%)}}",
    ".fab--oculto{opacity:0;pointer-events:none;transform:scale(.9)}",
    ".globo{position:fixed;z-index:2147483000;right:max(18px,env(safe-area-inset-right));bottom:calc(max(18px,env(safe-area-inset-bottom)) + 66px);max-width:260px;padding:12px 34px 12px 14px;border-radius:16px 16px 4px 16px;background:#fff;color:#0f2a2e;font-size:14px;line-height:1.45;box-shadow:0 12px 30px rgb(15 42 46/18%),0 0 0 1px #e3ece9;animation:sube .35s cubic-bezier(.2,.8,.2,1) both}",
    ".globo button{position:absolute;top:6px;right:6px;display:grid;place-items:center;width:24px;height:24px;border:0;border-radius:8px;background:transparent;color:#51676b}.globo button:hover{background:#eef4f2}",
    ".globo__texto{cursor:pointer}",
    "@keyframes sube{from{opacity:0;transform:translateY(8px)}}",
    ".ia{position:fixed;z-index:2147483001;right:max(20px,env(safe-area-inset-right));bottom:max(20px,env(safe-area-inset-bottom));display:flex;flex-direction:column;width:min(410px,calc(100vw - 40px));height:min(640px,calc(100vh - 40px));border:1px solid #dbe7e3;border-radius:22px;background:#f7faf9;overflow:hidden;box-shadow:0 28px 64px rgb(15 42 46/26%),0 4px 14px rgb(15 42 46/10%);opacity:0;pointer-events:none;transform:translateY(16px) scale(.98);transform-origin:bottom right;transition:opacity .22s ease,transform .22s cubic-bezier(.2,.8,.2,1)}",
    ".ia--abierto{opacity:1;pointer-events:auto;transform:none}",
    ".cab{display:flex;align-items:center;gap:11px;padding:14px 10px 14px 16px;background:linear-gradient(120deg,#0f2a2e,#135e63);color:#fff}",
    ".av{display:grid;flex:none;place-items:center;width:40px;height:40px;border-radius:13px;background:var(--ambar);color:#0f2a2e}",
    ".tit{display:flex;flex:1;flex-direction:column;min-width:0}.tit strong{font-size:15.5px;letter-spacing:-.2px}",
    ".tit small{display:inline-flex;align-items:center;gap:6px;overflow:hidden;color:#b9d3cf;font-size:12px;text-overflow:ellipsis;white-space:nowrap}",
    ".pt{flex:none;width:7px;height:7px;border-radius:50%;background:#5fd39a}.pt--activo{background:var(--ambar);animation:parpadeo 1s ease-in-out infinite}.pt--fuera{background:#9fb6b2}",
    "@keyframes parpadeo{50%{opacity:.3}}",
    ".bt{display:grid;flex:none;place-items:center;width:36px;height:36px;border:0;border-radius:10px;background:transparent;color:inherit;opacity:.85;text-decoration:none}.bt:hover{background:rgb(255 255 255/12%);opacity:1}",
    ".hilo{display:flex;flex:1;flex-direction:column;gap:14px;padding:16px 14px 8px;overflow-y:auto;overscroll-behavior:contain}",
    ".aviso{margin:0 auto;max-width:34ch;color:#51676b;font-size:11.5px;line-height:1.45;text-align:center}.aviso a{color:#135e63}",
    ".msg{display:flex;gap:8px;align-items:flex-end;animation:msg .25s cubic-bezier(.2,.8,.2,1) both}@keyframes msg{from{opacity:0;transform:translateY(6px)}}",
    ".msg--visitante{justify-content:flex-end}",
    ".mav{display:grid;flex:none;place-items:center;width:24px;height:24px;margin-bottom:2px;border-radius:8px;background:#0f2a2e;color:var(--ambar)}",
    ".bur{max-width:88%;padding:11px 13px;border-radius:16px 16px 16px 5px;background:#fff;color:#0f2a2e;font-size:14px;line-height:1.5;box-shadow:0 1px 3px rgb(15 42 46/8%),0 0 0 1px #e3ece9;overflow-wrap:anywhere}",
    ".msg--visitante .bur{border-radius:16px 16px 5px 16px;background:#135e63;color:#fff;box-shadow:none;white-space:pre-wrap}",
    ".msg--error .bur{background:#f8e3e3;color:#8f1d24}",
    ".bur p{margin:0}.bur p+p,.bur p+ul,.bur p+ol,.bur ul+p,.bur ol+p{margin-top:8px}.bur ul,.bur ol{display:grid;gap:4px;margin:6px 0 0;padding-left:18px}.bur li::marker{color:#135e63}",
    ".bur strong{color:#0d4a4f;font-weight:700}.bur code{padding:1px 5px;border-radius:5px;background:#eef4f2;font-size:12.5px}.bur a{color:#135e63}",
    ".acc{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}",
    ".ab{display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border:1px solid #cfe0db;border-radius:11px;background:#fff;color:#135e63;font-size:13px;font-weight:650;text-decoration:none;transition:background .15s,border-color .15s}",
    ".ab:hover{border-color:#135e63;background:#eef6f4}.ab--whatsapp{border-color:#0d7a4f;background:#0d7a4f;color:#fff}.ab--whatsapp:hover{background:#0a6342;border-color:#0a6342}",
    ".fuente{display:block;margin-top:8px;color:#7d9091;font-size:10.5px;font-weight:600}",
    ".esc{display:inline-flex;gap:4px;padding:14px 16px}.esc i{width:7px;height:7px;border-radius:50%;background:#9fb6b2;animation:salto 1.1s ease-in-out infinite}.esc i:nth-child(2){animation-delay:.15s}.esc i:nth-child(3){animation-delay:.3s}",
    "@keyframes salto{0%,60%,100%{transform:none;opacity:.5}30%{transform:translateY(-5px);opacity:1}}",
    ".sug{display:flex;gap:6px;padding:6px 14px 8px;overflow-x:auto;scrollbar-width:none}.sug::-webkit-scrollbar{display:none}",
    ".sug button{flex:none;padding:7px 12px;border:1px solid #cfe0db;border-radius:999px;background:#fff;color:#135e63;font-size:12.5px;font-weight:650;white-space:nowrap}.sug button:hover{border-color:#135e63;background:#eef6f4}",
    ".form{display:flex;align-items:flex-end;gap:6px;margin:0 12px 12px;padding:5px 5px 5px 14px;border:1px solid #d3e2de;border-radius:16px;background:#fff;box-shadow:0 2px 10px rgb(15 42 46/5%)}",
    ".form:focus-within{border-color:#135e63;box-shadow:0 0 0 3px rgb(19 94 99/12%)}",
    ".form textarea{flex:1;min-width:0;max-height:110px;padding:10px 0;border:0;background:transparent;color:#0f2a2e;font-size:14.5px;line-height:1.4;resize:none;outline:none}",
    ".env{display:grid;flex:none;place-items:center;width:40px;height:40px;border:0;border-radius:12px;background:#135e63;color:#fff}.env:hover:not(:disabled){background:#0d4a4f}.env:disabled{opacity:.4}",
    ".trampa{position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden}",
    "@media (max-width:620px){.fab{right:14px;bottom:14px;padding:0 16px 0 7px;font-size:14px}.globo{right:14px;bottom:80px}.ia{inset:0;width:100%;height:100%;height:100dvh;border:0;border-radius:0;transform-origin:bottom center}.cab{padding-top:max(12px,env(safe-area-inset-top))}.form{margin-bottom:max(10px,env(safe-area-inset-bottom))}.bur{max-width:92%}}",
    "@media (max-width:360px){.fab__txt{display:none}.fab{padding:0 7px}}",
    "@media (prefers-reduced-motion:reduce){.fab__ic,.pt--activo,.esc i{animation:none}.ia,.msg,.globo{transition:none;animation:none}}",
    "@media print{:host{display:none}}"
  ].join("\n");

  var anfitrion = document.createElement("div");
  anfitrion.setAttribute("data-filacero-asesor", "");
  var raiz = anfitrion.attachShadow ? anfitrion.attachShadow({ mode: "open" }) : anfitrion;
  try {
    var hoja = new CSSStyleSheet();
    hoja.replaceSync(CSS);
    raiz.adoptedStyleSheets = [hoja];
  } catch (e) {
    var estilo = document.createElement("style");
    estilo.textContent = CSS;
    raiz.appendChild(estilo);
  }

  var t = T[L];
  var cont = document.createElement("div");
  cont.innerHTML =
    '<button type="button" class="fab" aria-haspopup="dialog" aria-expanded="false" aria-label="' + t.abrir + '">' +
      '<span class="fab__ic">' + icono("chispa", 20) + '</span><span class="fab__punto" aria-hidden="true"></span><span class="fab__txt">' + t.lanzador + "</span></button>" +
    '<section class="ia" role="dialog" aria-modal="false" aria-label="FilaCero IA" aria-hidden="true" inert>' +
      '<header class="cab"><span class="av">' + icono("chispa", 20) + '</span><div class="tit"><strong>FilaCero IA</strong><small data-sub></small></div>' +
        '<a class="bt" data-wa-cab target="_blank" rel="noopener" title="' + t.wa + '" aria-label="' + t.wa + '" hidden>' + icono("wa", 19) + "</a>" +
        '<button type="button" class="bt" data-nueva title="' + t.nueva + '" aria-label="' + t.nueva + '" hidden>' + icono("nueva", 17) + "</button>" +
        '<button type="button" class="bt" data-cerrar aria-label="' + t.cerrar + '">' + icono("cerrar", 18) + "</button></header>" +
      '<div class="hilo" data-hilo aria-live="polite"></div>' +
      '<div class="sug" data-sug></div>' +
      '<form class="form" data-form novalidate>' +
        '<label class="trampa" aria-hidden="true">Sitio web<input name="sitio_web" tabindex="-1" autocomplete="off"></label>' +
        '<textarea rows="1" maxlength="600" aria-label="' + t.placeholder + '" placeholder="' + t.placeholder + '"></textarea>' +
        '<button type="submit" class="env" aria-label="' + t.enviar + '">' + icono("enviar", 18) + "</button></form>" +
    "</section>";
  raiz.appendChild(cont);

  var fab = raiz.querySelector(".fab"), panel = raiz.querySelector(".ia"), hilo = raiz.querySelector("[data-hilo]");
  var sug = raiz.querySelector("[data-sug]"), form = raiz.querySelector("[data-form]"), area = form.querySelector("textarea");
  var trampa = form.querySelector("input[name=sitio_web]"), sub = raiz.querySelector("[data-sub]");
  var waCab = raiz.querySelector("[data-wa-cab]"), btNueva = raiz.querySelector("[data-nueva]");

  function cabecera() {
    var clase = vista.pensando ? "pt pt--activo" : vista.conectado === false ? "pt pt--fuera" : "pt";
    var texto = vista.pensando ? t.escribiendo : vista.conectado === false ? t.fuera : (s.modo === "local" ? t.basico : t.sub);
    sub.innerHTML = '<i class="' + clase + '"></i>' + esc(texto);
    var wa = waGeneral();
    if (wa) { waCab.href = wa; waCab.hidden = false; }
    btNueva.hidden = !s.mensajes.length;
  }

  function botones(acciones) {
    if (!acciones || !acciones.length) return "";
    return '<div class="acc">' + acciones.map(function (a, i) {
      var url = urlSegura(a.url);
      if (!url) return "";
      var ic = a.tipo === "whatsapp" ? "wa" : a.tipo === "demo" ? "demo" : "enlace";
      return '<a class="ab ab--' + esc(a.tipo) + '" href="' + esc(url) + '" target="_blank" rel="noopener" data-evento="' + esc(a.tipo) + '">' + icono(ic, 15) + esc(a.etiqueta) + "</a>";
    }).join("") + "</div>";
  }

  function pintar() {
    var html = "";
    if (vista.aviso) html += '<p class="aviso">' + esc(vista.aviso) + (vista.privacidad ? ' <a href="' + esc(urlSegura(vista.privacidad) || "#") + '" target="_blank" rel="noopener">' + t.privacidad + "</a>" : "") + "</p>";
    s.mensajes.forEach(function (m) {
      if (m.rol === "visitante") {
        html += '<article class="msg msg--visitante"><div class="bur">' + esc(m.texto) + "</div></article>";
      } else {
        html += '<article class="msg' + (m.error ? " msg--error" : "") + '"><span class="mav" aria-hidden="true">' + icono("chispa", 13) + '</span><div class="bur">' +
          enriquecido(m.texto) + botones(m.acciones) + (m.fuente === "ia" ? '<span class="fuente">' + t.ia + "</span>" : "") + "</div></article>";
      }
    });
    if (vista.pensando) html += '<article class="msg"><span class="mav" aria-hidden="true">' + icono("chispa", 13) + '</span><div class="bur esc" aria-label="' + t.escribiendo + '"><i></i><i></i><i></i></div></article>';
    hilo.innerHTML = html;
    hilo.scrollTop = hilo.scrollHeight;
    sug.innerHTML = vista.pensando ? "" : vista.sugerencias.map(function (x) { return '<button type="button">' + esc(x) + "</button>"; }).join("");
    sug.hidden = !vista.sugerencias.length || vista.pensando;
    form.querySelector(".env").disabled = vista.pensando || vista.conectado === false;
    cabecera();
  }

  function sinConexion() {
    vista.conectado = false;
    var acciones = [];
    var wa = waGeneral();
    if (wa) acciones.push({ tipo: "whatsapp", etiqueta: t.wa, url: wa });
    if (CORREO) acciones.push({ tipo: "correo", etiqueta: t.correo, url: "mailto:" + CORREO });
    if (!s.mensajes.length || !s.mensajes[s.mensajes.length - 1].offline) {
      s.mensajes.push({ rol: "asesor", texto: t.offline, acciones: acciones, offline: true });
    }
    pintar();
  }

  function preparar() {
    if (vista.ficha || vista.preparando) return vista.preparando;
    vista.preparando = pedir("abrir", { idioma: navigator.language || "", pagina: location.pathname.slice(0, 160) })
      .then(function (d) {
        vista.ficha = d.ficha;
        vista.conectado = d.activo !== false;
        vista.aviso = d.aviso || "";
        vista.privacidad = d.privacidad || "";
        vista.waGeneral = d.whatsapp_url || null;
        s.modo = d.modo;
        if (!s.mensajes.length) {
          s.mensajes.push({ rol: "asesor", texto: d.saludo });
          vista.sugerencias = d.sugerencias || [];
        }
        if (vista.conectado === false) sinConexion();
        guardar();
        pintar();
      })
      .catch(function () {
        vista.preparando = null;
        // Con el túnel rápido la URL cambia; servidor.js puede estar en caché. Se relee una vez.
        if (!vista.releido && ajustes.api && script) {
          vista.releido = true;
          return fetch(new URL("servidor.js", script.src).href, { cache: "no-store" })
            .then(function (r) { return r.text(); })
            .then(function (codigo) {
              var m = codigo.match(/api:\s*"(https?:\/\/[^"]+)"/);
              if (!m || m[1].replace(/\/+$/, "") === API) throw new Error("sin cambio");
              API = m[1].replace(/\/+$/, "");
              actualizarEnlacesDemo();
              return preparar();
            })
            .catch(function () { sinConexion(); });
        }
        sinConexion();
      });
    return vista.preparando;
  }

  function abrir() {
    vista.abierto = true;
    quitarGlobo(true);
    panel.classList.add("ia--abierto");
    panel.removeAttribute("inert");
    panel.setAttribute("aria-hidden", "false");
    fab.classList.add("fab--oculto");
    fab.setAttribute("aria-expanded", "true");
    pintar();
    preparar();
    setTimeout(function () { area.focus(); }, 60);
  }
  function cerrar() {
    vista.abierto = false;
    panel.classList.remove("ia--abierto");
    panel.setAttribute("inert", "");
    panel.setAttribute("aria-hidden", "true");
    fab.classList.remove("fab--oculto");
    fab.setAttribute("aria-expanded", "false");
    fab.focus();
  }

  function enviar(texto) {
    texto = String(texto || "").trim();
    if (!texto || vista.pensando) return;
    s.mensajes.push({ rol: "visitante", texto: texto });
    vista.sugerencias = [];
    vista.pensando = true;
    area.value = "";
    ajustarAltura();
    pintar();
    Promise.resolve(preparar())
      .then(function () {
        if (vista.conectado === false) throw new Error("offline");
        function mandar(intento) {
          return pedir("mensajes", { texto: texto, codigo: s.codigo || "", secreto: s.secreto || "", ficha: vista.ficha || "",
            sitio_web: trampa.value, idioma: navigator.language || "", pagina: location.pathname.slice(0, 160) })
            .then(function (d) {
              if (!d.reintentar || intento > 1) return d;
              return new Promise(function (listo) { setTimeout(listo, Math.min(d.espera_ms || 2000, 5000)); })
                .then(function () { return mandar(intento + 1); });
            });
        }
        return mandar(0);
      })
      .then(function (d) {
        if (!d.respuesta) throw new Error("sin respuesta");
        if (d.codigo) s.codigo = d.codigo;
        if (d.idioma && T[d.idioma] && d.idioma !== L) {
          // La interfaz sigue el idioma en que escribe el visitante.
          L = d.idioma; t = T[L];
          area.placeholder = t.placeholder; area.setAttribute("aria-label", t.placeholder);
        }
        if (d.secreto) s.secreto = d.secreto;
        s.mensajes.push({ rol: "asesor", texto: d.respuesta, acciones: d.acciones, fuente: d.fuente });
        vista.sugerencias = d.sugerencias || [];
      })
      .catch(function (e) {
        if (e && e.status === 404 && s.codigo) { s.codigo = null; s.secreto = null; vista.ficha = null; vista.preparando = null; }
        var acciones = waGeneral() ? [{ tipo: "whatsapp", etiqueta: t.wa, url: waGeneral() }] : [];
        s.mensajes.push({ rol: "asesor", texto: (e && e.status && e.message && e.status !== 500) ? e.message : t.error, acciones: acciones, error: true });
      })
      .then(function () { vista.pensando = false; guardar(); pintar(); if (vista.abierto) area.focus(); });
  }

  function ajustarAltura() { area.style.height = "auto"; area.style.height = Math.min(area.scrollHeight, 110) + "px"; }

  fab.addEventListener("click", abrir);
  raiz.querySelector("[data-cerrar]").addEventListener("click", cerrar);
  btNueva.addEventListener("click", function () {
    s = { mensajes: [], modo: s.modo, burbuja: true };
    vista.ficha = null; vista.preparando = null; vista.sugerencias = [];
    guardar(); pintar(); preparar();
  });
  form.addEventListener("submit", function (e) { e.preventDefault(); enviar(area.value); });
  area.addEventListener("input", ajustarAltura);
  area.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); enviar(area.value); }
  });
  sug.addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) enviar(b.textContent); });
  panel.addEventListener("keydown", function (e) { if (e.key === "Escape") cerrar(); });
  hilo.addEventListener("click", function (e) {
    var a = e.target.closest("a[data-evento]");
    if (!a || !s.codigo || ["whatsapp", "demo"].indexOf(a.getAttribute("data-evento")) < 0) return;
    pedir("eventos", { tipo: a.getAttribute("data-evento"), codigo: s.codigo, secreto: s.secreto, __keepalive: true }).catch(function () {});
  });

  // Globo de invitación: una vez por sesión, a los 12 s, nunca encima de un chat abierto.
  var globo = null;
  function quitarGlobo(recordar) {
    if (globo) { globo.remove(); globo = null; }
    if (recordar) { s.burbuja = true; guardar(); }
  }
  if (!s.burbuja && !s.mensajes.length) {
    setTimeout(function () {
      if (vista.abierto || s.burbuja) return;
      globo = document.createElement("div");
      globo.className = "globo";
      globo.setAttribute("role", "status");
      globo.innerHTML = '<span class="globo__texto">' + esc(t.burbuja) + '</span><button type="button" aria-label="' + t.cerrar + '">' + icono("cerrar", 14) + "</button>";
      globo.querySelector(".globo__texto").addEventListener("click", abrir);
      globo.querySelector("button").addEventListener("click", function () { quitarGlobo(true); });
      raiz.appendChild(globo);
    }, 12000);
  }

  function montar() {
    document.body.appendChild(anfitrion);
    // El chat ya ofrece WhatsApp: se ocultan los botones flotantes de la página para no encimarlos.
    document.querySelectorAll(".whatsapp-flotante, a.whatsapp, a.float[href*=\"wa.me\"]").forEach(function (a) { a.style.display = "none"; });
    actualizarEnlacesDemo();
    pintar();
  }
  if (document.body) montar(); else document.addEventListener("DOMContentLoaded", montar);
})();
