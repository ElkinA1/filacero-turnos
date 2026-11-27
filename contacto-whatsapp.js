(() => {
  const numero = window.filaCeroContacto?.numeroWhatsApp?.trim();
  if (!numero || !/^[1-9]\d{6,14}$/.test(numero)) return;

  document.querySelectorAll("[data-whatsapp]").forEach((enlace) => {
    const mensaje = enlace.dataset.whatsapp;
    enlace.href = "https://wa.me/" + numero + "?text=" + encodeURIComponent(mensaje);
    enlace.hidden = false;
  });
})();