/**
 * Gestión de acceso y seguridad para la encuesta
 * Restringe la entrada si no viene desde un QR o si ya fue completada
 */
const urlParams = new URLSearchParams(window.location.search);
const isFromQR = urlParams.get('source') === 'nene_qr';

if (window.location.pathname.includes('encuesta.html')) {
    if (!isFromQR) {
        alert("Acceso restringido. Por favor, escanee el QR para acceder a la encuesta.");
        window.location.replace('index.html');
    }
    // Evita duplicados en la misma sesión
    if (sessionStorage.getItem('encuestaEnviada') === 'true') {
        window.location.replace('index.html');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    
    // --- LÓGICA DEL VISOR DE CARTA (LIGHTBOX) ---
    const lightbox = document.getElementById('lightbox');
    const openBtn = document.getElementById('openMenu');
    const closeBtn = document.querySelector('.close-lightbox');
    const lightboxImg = document.querySelector('.lightbox-content');

    // Estado inicial: oculto
    if (lightbox) {
        lightbox.style.display = 'none';
    }

    if (openBtn && lightbox) {
        // Apertura del visor y bloqueo de scroll en el body
        openBtn.onclick = () => {
            lightbox.style.display = 'block'; 
            lightbox.style.overflowY = 'auto';
            document.body.style.overflow = 'hidden';
            lightbox.scrollTop = 0;
            
            if (closeBtn) {
                closeBtn.style.position = 'fixed';
                closeBtn.style.top = '20px';
                closeBtn.style.right = '30px';
                closeBtn.style.zIndex = '10001';
            }
        };

        const cerrarImagen = () => {
            lightbox.style.display = 'none';
            document.body.style.overflow = 'auto';
            // Reset de zoom al cerrar
            if (lightboxImg) {
                lightboxImg.style.width = 'auto';
                lightboxImg.style.maxWidth = '90%';
                lightboxImg.style.marginTop = '60px'; 
                lightboxImg.style.cursor = 'zoom-in';
            }
        };

        // Zoom interactivo dentro del visor (Click en la imagen)
        if (lightboxImg) {
            lightboxImg.style.display = 'block';
            lightboxImg.style.margin = '60px auto'; 
            lightboxImg.style.transition = 'width 0.3s ease';
            lightboxImg.style.cursor = 'zoom-in';
            
            lightboxImg.onclick = (e) => {
                e.stopPropagation(); // Evita que el click cierre el lightbox
                const isZoomed = lightboxImg.style.maxWidth === 'none';
                
                lightboxImg.style.maxWidth = isZoomed ? '90%' : 'none';
                lightboxImg.style.width = isZoomed ? 'auto' : '150%';
                lightboxImg.style.cursor = isZoomed ? 'zoom-in' : 'zoom-out';
            };
        }

        // Eventos de cierre (Botón, fondo y tecla Escape)
        if (closeBtn) closeBtn.onclick = cerrarImagen;
        lightbox.onclick = (e) => { if (e.target === lightbox) cerrarImagen(); };
        document.addEventListener('keydown', (e) => { if (e.key === "Escape") cerrarImagen(); });
    }

    // --- GESTIÓN DEL FORMULARIO DE ENCUESTA ---
    const form = document.getElementById('survey-form');
    if (form) {
        // Identidad visual de la marca
        const neneNegro = '#0a0a0a';
        const neneOro = '#c5a059'; 
        const neneTexto = '#f1d592';

        const configuracionNene = {
            background: neneNegro,
            color: neneTexto,
            buttonsStyling: false,
            customClass: {
                popup: 'border-gold-nene', 
                title: 'font-playfair',
                confirmButton: 'btn-nene-gold swal-btn-custom'
            }
        };

        // Mixin para alertas rápidas (Toasts)
        const Toast = Swal.mixin({
            ...configuracionNene,
            toast: true,
            position: 'center',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
        });

        const manejarError = (elemento, mensaje) => {
            Toast.fire({ icon: 'warning', iconColor: neneOro, title: mensaje });
            if (elemento) {
                elemento.classList.add('input-error');
                elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        };

        const nombre = document.getElementById('nombre');
        const apellido = document.getElementById('apellido');
        const whatsapp = document.getElementById('whatsapp');
        const nacimiento = document.getElementById('nacimiento');
        const localidad = document.getElementById('localidad');

        // Validación de edad mínima (16 años)
        const fechaActual = new Date();
        const fechaLimite = new Date(fechaActual.getFullYear() - 16, fechaActual.getMonth(), fechaActual.getDate());
        const maxFecha = fechaLimite.toISOString().split('T')[0];
        if (nacimiento) nacimiento.setAttribute('max', maxFecha);

        // Sanitización de inputs en tiempo real
        if (nombre) nombre.oninput = (e) => e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').substring(0, 20);
        if (apellido) apellido.oninput = (e) => e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').substring(0, 20);
        if (whatsapp) whatsapp.oninput = (e) => e.target.value = e.target.value.replace(/\D/g, '').substring(0, 13);

        // Generación de token dinámico basado en tiempo (rotación cada 5 min)
        const generarToken = () => {
            const timeFactor = Math.floor(Date.now() / (1000 * 60 * 5));
            return btoa("nene_secure_" + timeFactor);
        };

        // Envío de datos a Google Apps Script
        form.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            
            // Validaciones de negocio
            if (!nombre.value.trim() || !apellido.value.trim()) return manejarError(nombre, "Ingresá nombre y apellido.");
            if (!nacimiento.value || new Date(nacimiento.value) > fechaLimite) return manejarError(nacimiento, "Debes ser mayor de 16 años.");
            if (whatsapp.value.length < 10) return manejarError(whatsapp, "WhatsApp inválido.");
            if (!localidad.value) return manejarError(localidad, "Seleccioná tu localidad.");

            // Validación de categorías con estrellas
            const categorias = ['platos', 'atencion', 'ambiente', 'invitar'];
            let faltanEstrellas = false;
            categorias.forEach(cat => {
                if (!document.querySelector(`input[name="${cat}"]:checked`)) faltanEstrellas = true;
            });
            if (faltanEstrellas) return manejarError(null, "Calificá todas las categorías.");

            const datos = {
                token: generarToken(),
                fecha: new Date().toLocaleString('es-AR'),
                nombre: nombre.value.trim(),
                apellido: apellido.value.trim(),
                nacimiento: nacimiento.value,
                whatsapp: whatsapp.value,
                localidad: localidad.value,
                platos: document.querySelector('input[name="platos"]:checked').value,
                atencion: document.querySelector('input[name="atencion"]:checked').value,
                ambiente: document.querySelector('input[name="ambiente"]:checked').value,
                invitar: document.querySelector('input[name="invitar"]:checked').value,
                comentario: document.getElementById('critica')?.value.trim() || "Sin observaciones"
            };

            // Loader de espera
            Swal.fire({
                ...configuracionNene,
                title: 'Verificando...',
                text: 'Guardando tu opinión.',
                allowOutsideClick: false,
                showConfirmButton: false,
                didOpen: () => { Swal.showLoading(); }
            });

            try {
                const SCRIPT_URL = "https://script.google.com/macros/s/TU_SCRIPT_ID/exec";
                await fetch(SCRIPT_URL, { 
                    method: 'POST', 
                    mode: 'no-cors', 
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datos) 
                });

                // Feedback visual de éxito
                if (typeof confetti === 'function') confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
                
                Swal.fire({
                    ...configuracionNene,
                    icon: 'success',
                    iconColor: neneOro,
                    title: '¡Muchas gracias!',
                    timer: 2500, 
                    showConfirmButton: false
                }).then(() => {
                    sessionStorage.setItem('encuestaEnviada', 'true');
                    window.location.replace('index.html');
                });
            } catch (err) {
                Swal.fire({ ...configuracionNene, icon: 'error', title: 'Error', text: 'No se pudo enviar.' });
            }
        });

        // Limpieza automática de errores al interactuar
        document.querySelectorAll('.feedback-input, #localidad').forEach(input => {
            input.addEventListener('input', () => input.classList.remove('input-error'));
            input.addEventListener('change', () => input.classList.remove('input-error'));
        });
    }
});