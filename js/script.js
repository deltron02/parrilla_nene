//Verificación de seguridad inmediata
const urlParams = new URLSearchParams(window.location.search);
const isFromQR = urlParams.get('source') === 'nene_qr';

if (!isFromQR) {
    alert("Acceso restringido. Por favor, escanee el QR para acceder a la encuesta.");
    window.location.replace('index.html');
}

// Prevención de re-envío
if (sessionStorage.getItem('encuestaEnviada') === 'true') {
    window.location.replace('index.html');
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('survey-form');
    if (!form) return;

    // CONFIGURACIÓN DE ESTILO PREMIUM SWEETALERT2
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

    // Captura de elementos y validación +16 años
    const nombre = document.getElementById('nombre');
    const apellido = document.getElementById('apellido');
    const whatsapp = document.getElementById('whatsapp');
    const nacimiento = document.getElementById('nacimiento');
    const localidad = document.getElementById('localidad');

    const fechaActual = new Date();
    const fechaLimite = new Date(fechaActual.getFullYear() - 16, fechaActual.getMonth(), fechaActual.getDate());
    const maxFecha = fechaLimite.toISOString().split('T')[0];
    if (nacimiento) nacimiento.setAttribute('max', maxFecha);

    // Filtros de entrada
    if (nombre) nombre.oninput = (e) => e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').substring(0, 20);
    if (apellido) apellido.oninput = (e) => e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').substring(0, 20);
    if (whatsapp) whatsapp.oninput = (e) => e.target.value = e.target.value.replace(/\D/g, '').substring(0, 13);

    // Generador de Token
    const generarToken = () => {
        const timeFactor = Math.floor(Date.now() / (1000 * 60 * 5));
        return btoa("nene_secure_" + timeFactor);
    };

    // Envío del formulario
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); 

        if (!new URLSearchParams(window.location.search).get('source')) {
            return manejarError(null, "Acceso no autorizado.");
        }

        if (!nombre.value.trim() || !apellido.value.trim()) return manejarError(nombre, "Ingresá nombre y apellido.");
        if (!nacimiento.value || new Date(nacimiento.value) > fechaLimite) return manejarError(nacimiento, "Debes ser mayor de 16 años.");
        if (whatsapp.value.length < 10) return manejarError(whatsapp, "WhatsApp inválido.");
        if (!localidad.value) return manejarError(localidad, "Seleccioná tu localidad.");

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

        Swal.fire({
            ...configuracionNene,
            title: 'Verificando...',
            text: 'Guardando tu opinión.',
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => { Swal.showLoading(); }
        });

        try {
            const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwNyYEhhjb1-7ugE1riOZc0lWwcTRn4GqsQBYvKUtQg_VrTjiD8BkD8klD4OzuhxIee/exec";
            
            await fetch(SCRIPT_URL, { 
                method: 'POST', 
                mode: 'no-cors', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos) 
            });

            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
            
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

    document.querySelectorAll('.feedback-input, #localidad').forEach(input => {
        input.addEventListener('input', () => input.classList.remove('input-error'));
        input.addEventListener('change', () => input.classList.remove('input-error'));
    });
});