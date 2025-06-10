// src/js/problem1.js

import { numericalMethods } from './methods.js'; // Importa nuestros métodos numéricos

// Variables globales para Chart.js y control de animación
let chartInstance = null; // Para almacenar la instancia del gráfico Chart.js
let animationFrameId = null; // Para controlar la animación con requestAnimationFrame
let simulationRunning = false; // Bandera para controlar si la simulación está activa

// Función para inicializar la lógica específica del problema 1
// Esta función será llamada por main.js o problem-loader.js cuando el template se cargue
export function initProblem1() {
    console.log('Inicializando la lógica de Problem 1.');

    // --- Obtener referencias a elementos del DOM (inputs, botones, áreas de output) ---
    const p0Input = document.getElementById('p0-problem1');
    const b0Input = document.getElementById('b0-problem1');
    const rInput = document.getElementById('r-problem1');
    const aInput = document.getElementById('a-problem1');
    const cInput = document.getElementById('c-problem1');
    const dInput = document.getElementById('d-problem1');
    const timeEndInput = document.getElementById('time-end-problem1');
    const hInput = document.getElementById('h-problem1');
    const methodRadios = document.querySelectorAll('input[name="method-problem1"]');
    const startSimulationBtn = document.getElementById('start-simulation-problem1');
    const generateComparisonBtn = document.getElementById('generate-comparison-problem1');
    const comparisonTableBody = document.querySelector('#comparison-table-problem1 tbody');
    const comparisonTableContainer = document.getElementById('comparison-table-container-problem1');

    const preyValueSpan = document.getElementById('prey-value');
    const predatorValueSpan = document.getElementById('predator-value');
    const currentIterationSpan = document.getElementById('current-iteration-problem1');
    const currentTimeSpan = document.getElementById('current-time-problem1');

    const populationChartCanvas = document.getElementById('populationChart');
    const backToHomeBtn = document.querySelector('.problem-content[data-problem-id="1"] .back-to-home-btn');


    // --- Event Listeners ---
    if (startSimulationBtn) {
        startSimulationBtn.addEventListener('click', startSimulation);
    }
    if (generateComparisonBtn) {
        generateComparisonBtn.addEventListener('click', generateComparisonTable);
    }
    if (backToHomeBtn) {
        backToHomeBtn.addEventListener('click', () => {
            // Detener cualquier animación en curso
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            simulationRunning = false;

            // Destruir la instancia del gráfico si existe
            if (chartInstance) {
                chartInstance.destroy();
                chartInstance = null;
            }

            // Ocultar la sección del problema y mostrar la principal
            document.getElementById('problem-detail-area').style.display = 'none';
            document.querySelector('.problem-selection').style.display = 'block';

            // Remover el script del problema para limpiar el entorno
            const oldScript = document.getElementById(`problem1-script`);
            if (oldScript) {
                oldScript.remove();
            }
            console.log('Volviendo a la selección de problemas y limpiando Problem 1 JS.');
        });
    }

    // Almacenar resultados de las simulaciones para la comparación
    let simulationResults = {}; // { euler: {x:[], y:[]}, heun: {...}, rk4: {...} }

    // --- Funciones para la simulación ---

    // Define la función de la EDO (f(x, y) para el sistema de Lotka-Volterra)
    // Para un sistema de EDOs, func recibirá un vector de estados [P, B] y devolverá un vector de derivadas [dP/dt, dB/dt]
    // Pero nuestros métodos numéricos actuales son para una sola EDO dy/dx = f(x, y).
    // Para Lotka-Volterra (un sistema de dos EDOs), necesitamos adaptar la forma en que los métodos operan,
    // o considerar que cada EDO es independiente y se resuelve por separado en un ciclo iterativo.
    // La forma más robusta es adaptar los métodos para sistemas.

    // ************ ADAPTACIÓN CRÍTICA PARA SISTEMAS DE EDOs ************
    // Los métodos en methods.js asumen dy/dx = f(x,y) donde 'y' es un escalar.
    // Para un sistema como Lotka-Volterra, 'y' es un vector [P, B].
    // Tendremos que modificar methods.js para aceptar un vector 'y' y devolver un vector de derivadas,
    // o, una solución más sencilla para este proyecto, es aplicar los métodos
    // a cada variable del sistema secuencialmente, lo cual es una aproximación más simple
    // pero funcional para visualizaciones.

    // Para simplificar, vamos a redefinir cómo `func` opera dentro de `problem1.js`
    // y cómo se pasan los datos. La función `func` que pasaremos a los métodos
    // numéricos será una función que devuelve *una* de las derivadas.
    // Esto implicará que tendremos que llamar a los métodos de forma ligeramente diferente.

    // Reconsiderando, la forma más limpia para un sistema es que `methods.js` pueda manejarlo.
    // **ACTUALIZACIÓN IMPORTANTE:** Debemos modificar `methods.js` para que `func` pueda
    // recibir un vector de estados `y` y devolver un vector de derivadas.
    // Por ahora, vamos a asumir que `methods.js` ha sido modificado (o lo haremos después)
    // y la `func` que pasaremos aquí será una función que tome `t` y un `vector_y` y devuelva un `vector_dy_dt`.

    // Por el momento, para que este template funcione con el methods.js actual (escalar),
    // simulemos una EDO simple como placeholder.
    // Luego volveremos a methods.js para la modificación para sistemas.

    // ************ TEMPORAL: Función Placeholder para un Sistema ************
    // Esta es una función que representa el lado derecho de la EDOs para Lotka-Volterra.
    // Toma un tiempo 't' y un array de estados 'Y' (donde Y[0]=P, Y[1]=B)
    // y devuelve un array de derivadas [dP/dt, dB/dt].
    const lotkaVolterraSystem = (t, Y, params) => {
        const P = Y[0]; // Presas
        const B = Y[1]; // Depredadores
        const { r, a, c, d } = params; // Parámetros del modelo

        const dP_dt = r * P - a * P * B;
        const dB_dt = c * P * B - d * B;

        return [dP_dt, dB_dt];
    };

    // Esto significa que los métodos numéricos en methods.js *deben* ser adaptados para manejar
    // arrays (vectores) como entrada y salida para 'y' y 'dy/dx'.
    // Vuelvo a methods.js para esto después de terminar este problem1.js básico.
    // Por ahora, el siguiente código asume que los métodos recibirán la función
    // `lotkaVolterraSystem` y manejarán los vectores.


    async function startSimulation() {
        // Detener cualquier simulación previa
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        simulationRunning = false; // Resetear la bandera

        // Ocultar la tabla de comparación si está visible
        comparisonTableContainer.style.display = 'none';
        comparisonTableBody.innerHTML = ''; // Limpiar tabla


        // 1. Obtener valores de los inputs
        const P0 = parseFloat(p0Input.value);
        const B0 = parseFloat(b0Input.value);
        const r = parseFloat(rInput.value);
        const a = parseFloat(aInput.value);
        const c = parseFloat(cInput.value);
        const d = parseFloat(dInput.value);
        const timeEnd = parseFloat(timeEndInput.value);
        const h = parseFloat(hInput.value);
        const selectedMethod = Array.from(methodRadios).find(radio => radio.checked).value;

        // Validaciones básicas
        if (isNaN(P0) || isNaN(B0) || isNaN(r) || isNaN(a) || isNaN(c) || isNaN(d) || isNaN(timeEnd) || isNaN(h) || h <= 0 || timeEnd <= 0) {
            alert('Por favor, ingresa valores numéricos válidos para todos los parámetros. El paso y tiempo final deben ser positivos.');
            return;
        }

        const params = { r, a, c, d };
        const y0_vector = [P0, B0]; // Vector de condiciones iniciales [Presas, Depredadores]

        // 2. Ejecutar el método numérico seleccionado (asumiendo que methods.js ya soporta sistemas)
        let result;
        const startTime = performance.now(); // Para medir el tiempo de cálculo

        switch (selectedMethod) {
            case 'euler':
                result = numericalMethods.eulerSystem(
                    (t, Y) => lotkaVolterraSystem(t, Y, params),
                    0, // x0 (tiempo inicial)
                    y0_vector,
                    timeEnd,
                    h
                );
                break;
            case 'heun':
                result = numericalMethods.heunSystem(
                    (t, Y) => lotkaVolterraSystem(t, Y, params),
                    0,
                    y0_vector,
                    timeEnd,
                    h
                );
                break;
            case 'rungeKutta4':
                result = numericalMethods.rungeKutta4System(
                    (t, Y) => lotkaVolterraSystem(t, Y, params),
                    0,
                    y0_vector,
                    timeEnd,
                    h
                );
                break;
            default:
                alert('Método numérico no seleccionado.');
                return;
        }

        const endTime = performance.now();
        const calculationTime = (endTime - startTime).toFixed(2); // ms

        // Almacenar el resultado para futuras comparaciones
        // Ojo: `result.y` ahora será un array de arrays [[P0, B0], [P1, B1], ...]
        simulationResults[selectedMethod] = {
            x: result.x,
            y: result.y,
            iterations: result.iterations,
            calculationTime: calculationTime,
            finalPrey: result.y[result.y.length - 1][0],
            finalPredator: result.y[result.y.length - 1][1]
        };

        // 3. Inicializar/Actualizar el gráfico Chart.js
        if (chartInstance) {
            chartInstance.destroy(); // Destruir la instancia anterior si existe
        }

        const preyData = result.y.map(point => point[0]);
        const predatorData = result.y.map(point => point[1]);

        chartInstance = new Chart(populationChartCanvas, {
            type: 'line',
            data: {
                labels: result.x,
                datasets: [
                    {
                        label: 'Población de Presas (P)',
                        data: preyData,
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1,
                        fill: false,
                        pointRadius: 0 // No mostrar puntos individuales por defecto
                    },
                    {
                        label: 'Población de Depredadores (B)',
                        data: predatorData,
                        borderColor: 'rgb(255, 99, 132)',
                        tension: 0.1,
                        fill: false,
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false, // Deshabilitar animación de Chart.js para control manual
                plugins: {
                    title: {
                        display: true,
                        text: 'Evolución de Poblaciones de Presas y Depredadores'
                    },
                    zoom: { // Configuración del plugin de zoom
                        pan: {
                            enabled: true,
                            mode: 'xy'
                        },
                        zoom: {
                            wheel: { enabled: true },
                            pinch: { enabled: true },
                            mode: 'xy'
                        }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Tiempo' },
                        grid: { color: 'rgba(0,0,0,0.1)' }
                    },
                    y: {
                        title: { display: true, text: 'Población' },
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.1)' }
                    }
                }
            }
        });

        // 4. Iniciar la animación paso a paso
        animateSimulation(result.x, result.y);
    }

    let currentAnimationStep = 0;
    let animationIntervalTime = 50; // ms por paso, ajustable

    function animateSimulation(x_values, y_values) {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId); // Detener cualquier animación en curso
        }
        currentAnimationStep = 0;
        simulationRunning = true; // Indicar que la simulación está activa

        const totalSteps = x_values.length;

        function step() {
            if (!simulationRunning || currentAnimationStep >= totalSteps) {
                console.log('Animación detenida.');
                simulationRunning = false;
                return;
            }

            const currentX = x_values[currentAnimationStep];
            const currentY = y_values[currentAnimationStep]; // [P, B]

            // Actualizar valores numéricos
            preyValueSpan.textContent = currentY[0].toFixed(2);
            predatorValueSpan.textContent = currentY[1].toFixed(2);
            currentIterationSpan.textContent = currentAnimationStep;
            currentTimeSpan.textContent = currentX.toFixed(2);

            // Actualizar visualización animada (escalar iconos o mostrar barras)
            const preyIcon = document.getElementById('prey-icon');
            const predatorIcon = document.getElementById('predator-icon');
            // Escalar iconos basado en la población (necesitas definir un rango max/min)
            // Esto es un ejemplo, ajusta los factores de escala según tus necesidades
            const maxPopulation = Math.max(...y_values.flat()); // Asumiendo que es plano
            const scalePrey = 0.5 + (currentY[0] / maxPopulation) * 1.5; // Escala entre 0.5x y 2x
            const scalePredator = 0.5 + (currentY[1] / maxPopulation) * 1.5;

            if (preyIcon) preyIcon.style.transform = `scale(${scalePrey})`;
            if (predatorIcon) predatorIcon.style.transform = `scale(${scalePredator})`;


            // Actualizar gráfico (opcionalmente en tiempo real, puede ser lento para muchos pasos)
            // Para muchos pasos, es mejor actualizar el gráfico solo al final, o con menos frecuencia.
            // Para este ejemplo, lo haremos al final, pero si quieres en vivo, aquí iría la lógica.
            // chartInstance.data.labels.push(currentX);
            // chartInstance.data.datasets[0].data.push(currentY[0]);
            // chartInstance.data.datasets[1].data.push(currentY[1]);
            // chartInstance.update('none'); // 'none' para no animar la actualización


            currentAnimationStep++;
            animationFrameId = requestAnimationFrame(step);
        }

        // Si prefieres una animación controlada por un intervalo de tiempo fijo en lugar de requestAnimationFrame
        // setTimeout(() => {
        //     animationFrameId = requestAnimationFrame(step);
        // }, animationIntervalTime);

        // Iniciar la animación
        animationFrameId = requestAnimationFrame(step);
    }


    async function generateComparisonTable() {
        // Si no se ha simulado nada aún, ejecutar RK4 como base de comparación
        if (!simulationResults.rungeKutta4) {
             alert("Para una comparación completa, primero ejecuta una simulación o se ejecutará RK4 para obtener una base.");
             // Ejecutar RK4 automáticamente para tener una base
             const P0 = parseFloat(p0Input.value);
             const B0 = parseFloat(b0Input.value);
             const r = parseFloat(rInput.value);
             const a = parseFloat(aInput.value);
             const c = parseFloat(cInput.value);
             const d = parseFloat(dInput.value);
             const timeEnd = parseFloat(timeEndInput.value);
             const h = parseFloat(hInput.value);
             const params = { r, a, c, d };
             const y0_vector = [P0, B0];

             const startTimeRK4 = performance.now();
             const resultRK4 = numericalMethods.rungeKutta4System(
                (t, Y) => lotkaVolterraSystem(t, Y, params),
                0, y0_vector, timeEnd, h
             );
             const endTimeRK4 = performance.now();
             simulationResults.rungeKutta4 = {
                 x: resultRK4.x,
                 y: resultRK4.y,
                 iterations: resultRK4.iterations,
                 calculationTime: (endTimeRK4 - startTimeRK4).toFixed(2),
                 finalPrey: resultRK4.y[resultRK4.y.length - 1][0],
                 finalPredator: resultRK4.y[resultRK4.y.length - 1][1]
             };
        }

        // Si falta Euler o Heun, ejecutar si no se ha hecho
        const methodsToCompare = ['euler', 'heun', 'rungeKutta4'];
        for (const method of methodsToCompare) {
            if (!simulationResults[method]) {
                const P0 = parseFloat(p0Input.value);
                const B0 = parseFloat(b0Input.value);
                const r = parseFloat(rInput.value);
                const a = parseFloat(aInput.value);
                const c = parseFloat(cInput.value);
                const d = parseFloat(dInput.value);
                const timeEnd = parseFloat(timeEndInput.value);
                const h = parseFloat(hInput.value);
                const params = { r, a, c, d };
                const y0_vector = [P0, B0];
                let result;
                const startTime = performance.now();

                switch (method) {
                    case 'euler':
                        result = numericalMethods.eulerSystem((t, Y) => lotkaVolterraSystem(t, Y, params), 0, y0_vector, timeEnd, h);
                        break;
                    case 'heun':
                        result = numericalMethods.heunSystem((t, Y) => lotkaVolterraSystem(t, Y, params), 0, y0_vector, timeEnd, h);
                        break;
                    case 'rungeKutta4': // Ya se ejecutó en la primera comprobación, pero para consistencia
                        result = numericalMethods.rungeKutta4System((t, Y) => lotkaVolterraSystem(t, Y, params), 0, y0_vector, timeEnd, h);
                        break;
                }
                const endTime = performance.now();
                simulationResults[method] = {
                    x: result.x,
                    y: result.y,
                    iterations: result.iterations,
                    calculationTime: (endTime - startTime).toFixed(2),
                    finalPrey: result.y[result.y.length - 1][0],
                    finalPredator: result.y[result.y.length - 1][1]
                };
            }
        }


        // Limpiar la tabla antes de llenarla
        comparisonTableBody.innerHTML = '';
        comparisonTableContainer.style.display = 'block';

        // Determinar un "valor de referencia" (usaremos RK4 como el más preciso)
        const refFinalPrey = simulationResults.rungeKutta4?.finalPrey;
        const refFinalPredator = simulationResults.rungeKutta4?.finalPredator;

        for (const methodKey of methodsToCompare) {
            const data = simulationResults[methodKey];
            if (data) {
                const row = comparisonTableBody.insertRow();
                const methodName = methodKey === 'euler' ? 'Euler' :
                                   methodKey === 'heun' ? 'Heun' :
                                   'Runge-Kutta 4to Orden';

                let errorPrey = 'N/A';
                let errorPredator = 'N/A';
                if (refFinalPrey !== undefined && data.finalPrey !== undefined) {
                    errorPrey = ((Math.abs(data.finalPrey - refFinalPrey) / Math.abs(refFinalPrey)) * 100).toFixed(2) + '%';
                }
                if (refFinalPredator !== undefined && data.finalPredator !== undefined) {
                    errorPredator = ((Math.abs(data.finalPredator - refFinalPredator) / Math.abs(refFinalPredator)) * 100).toFixed(2) + '%';
                }


                row.insertCell().textContent = methodName;
                row.insertCell().textContent = data.finalPrey.toFixed(2);
                row.insertCell().textContent = data.finalPredator.toFixed(2);
                row.insertCell().textContent = data.iterations;
                row.insertCell().textContent = data.calculationTime;
                row.insertCell().textContent = `${errorPrey} (P) / ${errorPredator} (B)`; // Error relativo
            }
        }
    }
}