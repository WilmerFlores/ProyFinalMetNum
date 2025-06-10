// src/js/problem3.js

import { numericalMethods } from './methods.js';

let chartInstance = null;
let animationFrameId = null;
let simulationRunning = false;

export function initProblem3() {
    console.log('Inicializando la lógica de Problem 3 (Caída con Resistencia).');

    // --- Obtener referencias a elementos del DOM ---
    const v0Input = document.getElementById('v0-problem3');
    const mInput = document.getElementById('m-problem3');
    const cInput = document.getElementById('c-problem3');
    const gInput = document.getElementById('g-problem3');
    const timeEndInput = document.getElementById('time-end-problem3');
    const hInput = document.getElementById('h-problem3');
    const methodRadios = document.querySelectorAll('input[name="method-problem3"]');
    const startSimulationBtn = document.getElementById('start-simulation-problem3');
    const generateComparisonBtn = document.getElementById('generate-comparison-problem3');
    const comparisonTableBody = document.querySelector('#comparison-table-problem3 tbody');
    const comparisonTableContainer = document.getElementById('comparison-table-container-problem3');

    const currentVelocitySpan = document.getElementById('current-velocity-value');
    const currentDistanceSpan = document.getElementById('current-distance-value');
    const terminalVelocityEstimateSpan = document.getElementById('terminal-velocity-estimate');
    const currentIterationSpan = document.getElementById('current-iteration-problem3');
    const currentTimeSpan = document.getElementById('current-time-problem3');
    const fallingObjectAnimation = document.getElementById('falling-object-animation'); // El div del objeto
    const fallVisualizer = document.getElementById('fall-visualizer'); // Contenedor del visualizador

    const fallChartCanvas = document.getElementById('fallChart');
    const backToHomeBtn = document.querySelector('.problem-content[data-problem-id="3"] .back-to-home-btn');

    // --- Event Listeners ---
    if (startSimulationBtn) {
        startSimulationBtn.addEventListener('click', startSimulation);
    }
    if (generateComparisonBtn) {
        generateComparisonBtn.addEventListener('click', generateComparisonTable);
    }
    if (backToHomeBtn) {
        backToHomeBtn.addEventListener('click', () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            simulationRunning = false;
            if (chartInstance) {
                chartInstance.destroy();
                chartInstance = null;
            }
            document.getElementById('problem-detail-area').style.display = 'none';
            document.querySelector('.problem-selection').style.display = 'block';
            const oldScript = document.getElementById(`problem3-script`);
            if (oldScript) {
                oldScript.remove();
            }
            console.log('Volviendo a la selección de problemas y limpiando Problem 3 JS.');
        });
    }

    let simulationResults = {};

    // --- Función de la EDO para la Caída con Resistencia del Aire ---
    // dv/dt = g - (c/m)v^2
    const fallingObjectEquation = (t, v, m, c, g) => {
        return g - (c / m) * v * Math.abs(v); // Math.abs(v) para asegurar arrastre en la dirección correcta si v se vuelve negativa
    };

    async function startSimulation() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        simulationRunning = false;

        comparisonTableContainer.style.display = 'none';
        comparisonTableBody.innerHTML = '';

        const v0 = parseFloat(v0Input.value);
        const m = parseFloat(mInput.value);
        const c = parseFloat(cInput.value);
        const g = parseFloat(gInput.value);
        const timeEnd = parseFloat(timeEndInput.value);
        const h = parseFloat(hInput.value);
        const selectedMethod = Array.from(methodRadios).find(radio => radio.checked).value;

        if (isNaN(v0) || isNaN(m) || isNaN(c) || isNaN(g) || isNaN(timeEnd) || isNaN(h) || h <= 0 || timeEnd <= 0 || m <= 0 || c < 0) {
            alert('Por favor, ingresa valores numéricos válidos para todos los parámetros. Masa (m) debe ser positiva, coeficiente de arrastre (c) no negativo.');
            return;
        }

        let result;
        const startTime = performance.now();

        const funcToUse = (t, v) => fallingObjectEquation(t, v, m, c, g);

        switch (selectedMethod) {
            case 'euler':
                result = numericalMethods.eulerScalar(funcToUse, 0, v0, timeEnd, h);
                break;
            case 'heun':
                result = numericalMethods.heunScalar(funcToUse, 0, v0, timeEnd, h);
                break;
            case 'rungeKutta4':
                result = numericalMethods.rungeKutta4Scalar(funcToUse, 0, v0, timeEnd, h);
                break;
            default:
                alert('Método numérico no seleccionado.');
                return;
        }

        const endTime = performance.now();
        const calculationTime = (endTime - startTime).toFixed(2);

        // Calcular la distancia recorrida (integrando la velocidad numéricamente)
        let distances = [0];
        let currentDistance = 0;
        for (let i = 0; i < result.x.length - 1; i++) {
            // Usamos la regla del trapecio para una mejor aproximación de la integral
            const avgV = (result.y[i] + result.y[i+1]) / 2;
            const deltaT = result.x[i+1] - result.x[i];
            currentDistance += avgV * deltaT;
            distances.push(currentDistance);
        }

        // Calcular velocidad terminal analítica (si c > 0)
        let terminalVelocity = 'N/A';
        if (c > 0) {
            terminalVelocity = Math.sqrt((m * g) / c).toFixed(2) + ' m/s';
        } else {
             terminalVelocity = 'N/A (sin resistencia)';
        }
        terminalVelocityEstimateSpan.textContent = terminalVelocity;


        simulationResults[selectedMethod] = {
            x: result.x,
            y: result.y, // Velocidades
            distances: distances, // Distancias calculadas
            iterations: result.iterations,
            calculationTime: calculationTime,
            finalVelocity: result.y[result.y.length - 1],
            totalDistance: distances[distances.length - 1]
        };

        // Gráfico
        if (chartInstance) {
            chartInstance.destroy();
        }

        chartInstance = new Chart(fallChartCanvas, {
            type: 'line',
            data: {
                labels: result.x,
                datasets: [
                    {
                        label: 'Velocidad (m/s)',
                        data: result.y,
                        borderColor: 'rgb(54, 162, 235)', // Azul
                        tension: 0.1,
                        fill: false,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Altura Perdida (m)',
                        data: distances,
                        borderColor: 'rgb(255, 99, 132)', // Rojo
                        tension: 0.1,
                        fill: false,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Velocidad y Altura Perdida vs. Tiempo'
                    },
                    zoom: {
                        pan: { enabled: true, mode: 'xy' },
                        zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'xy' }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Tiempo (s)' },
                        grid: { color: 'rgba(0,0,0,0.1)' }
                    },
                    y: { // Eje Y para velocidad
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: { display: true, text: 'Velocidad (m/s)' },
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.1)' }
                    },
                    y1: { // Eje Y para distancia (en el lado derecho)
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: { display: true, text: 'Altura Perdida (m)' },
                        beginAtZero: true,
                        grid: { drawOnChartArea: false } // No dibujar líneas de cuadrícula para este eje
                    }
                }
            }
        });

        animateSimulation(result.x, result.y, distances);
    }

    let currentAnimationStep = 0;

    function animateSimulation(x_values, v_values, dist_values) {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        currentAnimationStep = 0;
        simulationRunning = true;

        const totalSteps = x_values.length;

        // Para la animación del objeto cayendo:
        // Necesitamos mapear la distancia recorrida a una posición vertical en el visualizador.
        const visualizerHeight = fallVisualizer.clientHeight; // Altura del área de visualización
        const maxDistance = dist_values[dist_values.length - 1]; // Máxima distancia para escalar
        const objectHeight = fallingObjectAnimation.clientHeight; // Altura del objeto (para no salirse por abajo)
        const animationRange = visualizerHeight - objectHeight; // Rango en píxeles donde el objeto puede moverse

        function step() {
            if (!simulationRunning || currentAnimationStep >= totalSteps) {
                simulationRunning = false;
                // Asegurar que el objeto termine abajo si la simulación se detiene antes del final
                fallingObjectAnimation.style.top = `${animationRange}px`;
                return;
            }

            const currentX = x_values[currentAnimationStep];
            const currentV = v_values[currentAnimationStep];
            const currentDist = dist_values[currentAnimationStep];

            currentVelocitySpan.textContent = currentV.toFixed(2);
            currentDistanceSpan.textContent = currentDist.toFixed(2);
            currentIterationSpan.textContent = currentAnimationStep;
            currentTimeSpan.textContent = currentX.toFixed(2);

            // Animación del objeto cayendo
            let topPosition = 0;
            if (maxDistance > 0) {
                topPosition = (currentDist / maxDistance) * animationRange;
            }
            fallingObjectAnimation.style.top = `${topPosition}px`;

            currentAnimationStep++;
            animationFrameId = requestAnimationFrame(step);
        }

        animationFrameId = requestAnimationFrame(step);
    }

    async function generateComparisonTable() {
        if (!simulationResults.rungeKutta4) {
             alert("Para una comparación completa, primero ejecuta una simulación o se ejecutará RK4 para obtener una base.");
             const v0 = parseFloat(v0Input.value);
             const m = parseFloat(mInput.value);
             const c = parseFloat(cInput.value);
             const g = parseFloat(gInput.value);
             const timeEnd = parseFloat(timeEndInput.value);
             const h = parseFloat(hInput.value);
             const funcToUse = (t, v) => fallingObjectEquation(t, v, m, c, g);

             const startTimeRK4 = performance.now();
             const resultRK4 = numericalMethods.rungeKutta4Scalar(funcToUse, 0, v0, timeEnd, h);
             const endTimeRK4 = performance.now();

             let distancesRK4 = [0];
             let currentDistanceRK4 = 0;
             for (let i = 0; i < resultRK4.x.length - 1; i++) {
                 const avgV = (resultRK4.y[i] + resultRK4.y[i+1]) / 2;
                 const deltaT = resultRK4.x[i+1] - resultRK4.x[i];
                 currentDistanceRK4 += avgV * deltaT;
                 distancesRK4.push(currentDistanceRK4);
             }

             simulationResults.rungeKutta4 = {
                 x: resultRK4.x,
                 y: resultRK4.y,
                 distances: distancesRK4,
                 iterations: resultRK4.iterations,
                 calculationTime: (endTimeRK4 - startTimeRK4).toFixed(2),
                 finalVelocity: resultRK4.y[resultRK4.y.length - 1],
                 totalDistance: distancesRK4[distancesRK4.length - 1]
             };
        }

        const methodsToCompare = ['euler', 'heun', 'rungeKutta4'];
        for (const method of methodsToCompare) {
            if (!simulationResults[method]) {
                const v0 = parseFloat(v0Input.value);
                const m = parseFloat(mInput.value);
                const c = parseFloat(cInput.value);
                const g = parseFloat(gInput.value);
                const timeEnd = parseFloat(timeEndInput.value);
                const h = parseFloat(hInput.value);
                const funcToUse = (t, v) => fallingObjectEquation(t, v, m, c, g);
                let result;
                const startTime = performance.now();

                switch (method) {
                    case 'euler':
                        result = numericalMethods.eulerScalar(funcToUse, 0, v0, timeEnd, h);
                        break;
                    case 'heun':
                        result = numericalMethods.heunScalar(funcToUse, 0, v0, timeEnd, h);
                        break;
                    case 'rungeKutta4':
                        result = numericalMethods.rungeKutta4Scalar(funcToUse, 0, v0, timeEnd, h);
                        break;
                }
                const endTime = performance.now();

                let distances = [0];
                let currentDistance = 0;
                for (let i = 0; i < result.x.length - 1; i++) {
                    const avgV = (result.y[i] + result.y[i+1]) / 2;
                    const deltaT = result.x[i+1] - result.x[i];
                    currentDistance += avgV * deltaT;
                    distances.push(currentDistance);
                }

                simulationResults[method] = {
                    x: result.x,
                    y: result.y,
                    distances: distances,
                    iterations: result.iterations,
                    calculationTime: (endTime - startTime).toFixed(2),
                    finalVelocity: result.y[result.y.length - 1],
                    totalDistance: distances[distances.length - 1]
                };
            }
        }

        comparisonTableBody.innerHTML = '';
        comparisonTableContainer.style.display = 'block';

        const refFinalVel = simulationResults.rungeKutta4?.finalVelocity;
        const refTotalDist = simulationResults.rungeKutta4?.totalDistance;

        for (const methodKey of methodsToCompare) {
            const data = simulationResults[methodKey];
            if (data) {
                const row = comparisonTableBody.insertRow();
                const methodName = methodKey === 'euler' ? 'Euler' :
                                   methodKey === 'heun' ? 'Heun' :
                                   'Runge-Kutta 4to Orden';

                let errorVel = 'N/A';
                let errorDist = 'N/A';
                if (refFinalVel !== undefined && data.finalVelocity !== undefined && Math.abs(refFinalVel) > 1e-6) { // Evitar división por cero
                    errorVel = ((Math.abs(data.finalVelocity - refFinalVel) / Math.abs(refFinalVel)) * 100).toFixed(2) + '%';
                }
                if (refTotalDist !== undefined && data.totalDistance !== undefined && Math.abs(refTotalDist) > 1e-6) {
                    errorDist = ((Math.abs(data.totalDistance - refTotalDist) / Math.abs(refTotalDist)) * 100).toFixed(2) + '%';
                }

                row.insertCell().textContent = methodName;
                row.insertCell().textContent = data.finalVelocity.toFixed(2);
                row.insertCell().textContent = data.totalDistance.toFixed(2);
                row.insertCell().textContent = data.iterations;
                row.insertCell().textContent = data.calculationTime;
                row.insertCell().textContent = `${errorVel} (V) / ${errorDist} (D)`;
            }
        }
    }
}