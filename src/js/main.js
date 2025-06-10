// src/js/main.js

import { problemLoader } from './problem-loader.js';

document.addEventListener('DOMContentLoaded', () => {
    const problemSelectionSection = document.querySelector('.problem-selection');
    const problemDetailArea = document.getElementById('problem-detail-area');
    const selectProblemButtons = document.querySelectorAll('.select-problem-btn');

    // Función para mostrar la sección de detalles del problema y ocultar la selección
    function showProblemDetail(problemId) {
        problemSelectionSection.style.display = 'none'; // Oculta las tarjetas de selección
        problemDetailArea.style.display = 'block';      // Muestra el área de detalle
        problemLoader.loadProblem(`problem${problemId}`, problemDetailArea); // Carga el problema específico
    }

    // Añadir event listeners a cada botón de "Resolver Problema"
    selectProblemButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const problemId = event.target.dataset.problemId; // Obtenemos el ID del problema desde el atributo data-problem-id
            showProblemDetail(problemId);
        });
    });

    // Opcional: Implementar un botón de "Volver al Inicio" si es necesario
    // Para esto, necesitaríamos un botón en cada template de problema que llame a una función
    // que haga lo contrario: ocultar problemDetailArea y mostrar problemSelectionSection.
    // Esto lo veremos cuando creemos los templates.
});