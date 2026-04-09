// Prevención de re-envío: Si ya la envió, lo mandamos al index
if (sessionStorage.getItem('encuestaEnviada') === 'true') {
    window.location.replace('index.html');
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('survey-form');
    if (!form) return;

    // --- CONFIGURACIÓN DE ESTILO PARA SWEETALERT2 ---
    const neneNegro = '#0a0a0a';
    const neneOro = '#c5a059'; 
    const neneTexto = '#f1d592';

    const configuracionNene = {
        background: neneNegro,
        color: neneTexto,
        confirmButtonColor: neneOro,
        customClass: {
            popup: 'border-gold-nene', // Clase para tu CSS
            title: 'font-playfair'    // Clase para tu CSS
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

    // --- Captura de elementos ---
    const nombre = document.getElementById('nombre');
    const apellido = document.getElementById('apellido');
    const whatsapp = document.getElementById('whatsapp');
    const nacimiento = document.getElementById('nacimiento');
    const localidad = document.getElementById('localidad'); // Elemento Select

    // Restricciones de entrada
    if (nombre) nombre.oninput = (e) => e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').substring(0, 20);
    if (apellido) apellido.oninput = (e) => e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').substring(0, 20);
    if (whatsapp) whatsapp.oninput = (e) => e.target.value = e.target.value.replace(/\D/g, '').substring(0, 13);

    // --- Manejo del Envío ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); 

        // 1. Validación de campos obligatorios
        if (!nombre.value.trim()) return manejarError(nombre, "Por favor, ingresa tu nombre.");
        if (!apellido.value.trim()) return manejarError(apellido, "Por favor, ingresa tu apellido.");
        if (!nacimiento.value) return manejarError(nacimiento, "Selecciona tu fecha de nacimiento.");
        if (whatsapp.value.length < 10) return manejarError(whatsapp, "El WhatsApp debe tener al menos 10 dígitos.");
        if (!localidad.value || localidad.value === "") {
            return manejarError(localidad, "Por favor, selecciona tu localidad.");
        }

        // 2. Validación de Estrellas
        const categorias = ['platos', 'atencion', 'ambiente', 'invitar'];
        let faltanEstrellas = false;
        categorias.forEach(cat => {
            if (!document.querySelector(`input[name="${cat}"]:checked`)) faltanEstrellas = true;
        });

        if (faltanEstrellas) {
            return manejarError(null, "Por favor, califica todas las categorías con estrellas.");
        }

        // 3. Preparación del objeto final
        const datos = {
            fecha: new Date().toLocaleString('es-AR'),
            nombre: nombre.value.trim(),
            apellido: apellido.value.trim(),
            nacimiento: nacimiento.value,
            whatsapp: whatsapp.value,
            localidad: localidad.value, // <--- AHORA SÍ SE ENVÍA
            platos: document.querySelector('input[name="platos"]:checked').value,
            atencion: document.querySelector('input[name="atencion"]:checked').value,
            ambiente: document.querySelector('input[name="ambiente"]:checked').value,
            invitar: document.querySelector('input[name="invitar"]:checked').value,
            comentario: document.getElementById('critica')?.value.trim() || "Sin observaciones"
        };

        // Alerta de carga
        Swal.fire({
            ...configuracionNene,
            title: 'Enviando...',
            text: 'Guardando tu opinión en nuestras brasas.',
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
                text: 'Redirigiendo al inicio...',
                timer: 2500, 
                timerProgressBar: true,
                showConfirmButton: false
            }).then(() => {
                sessionStorage.setItem('encuestaEnviada', 'true');
                window.location.replace('index.html');
            });

        } catch (err) {
            Swal.fire({ 
                ...configuracionNene,
                icon: 'error', 
                title: 'Error', 
                text: 'No pudimos conectar con el servidor.' 
            });
        }
    });

    // Limpiar errores visuales
    document.querySelectorAll('.feedback-input, #localidad').forEach(input => {
        input.addEventListener('input', () => input.classList.remove('input-error'));
        input.addEventListener('change', () => input.classList.remove('input-error'));
    });
});