// src/js/problem2.js

import { numericalMethods } from './methods.js';

let chartInstance = null;
let animationFrameId = null;
let simulationRunning = false;
let coolingChartInstance = null; // <-- Nueva variable para la instancia del gráfico

export function initProblem2() {
    console.log('Inicializando la lógica de Problem 2 (Enfriamiento).');

    // --- Obtener referencias a elementos del DOM ---
    const T0Input = document.getElementById('T0-problem2');
    const TaInput = document.getElementById('Ta-problem2');
    const kInput = document.getElementById('k-problem2');
    const timeEndInput = document.getElementById('time-end-problem2');
    const hInput = document.getElementById('h-problem2');
    const methodRadios = document.querySelectorAll('input[name="method-problem2"]');
    const startSimulationBtn = document.getElementById('start-simulation-problem2');
    const generateComparisonBtn = document.getElementById('generate-comparison-problem2');
    const comparisonTableBody = document.querySelector('#comparison-table-problem2 tbody');
    const comparisonTableContainer = document.getElementById('comparison-table-container-problem2');

    const currentTemperatureSpan = document.getElementById('current-temperature-value');
    const currentIterationSpan = document.getElementById('current-iteration-problem2');
    const currentTimeSpan = document.getElementById('current-time-problem2');
    const thermometerFill = document.getElementById('thermometer-fill'); // Elemento para la animación

    const coolingChartCanvas = document.getElementById('coolingChart');
    const backToHomeBtn = document.querySelector('.problem-content[data-problem-id="2"] .back-to-home-btn');

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
            const oldScript = document.getElementById(`problem2-script`);
            if (oldScript) {
                oldScript.remove();
            }
            console.log('Volviendo a la selección de problemas y limpiando Problem 2 JS.');
        });
    }

    let simulationResults = {};

    // --- Función de la EDO para el Enfriamiento de Newton ---
    // dT/dt = -k * (T - Ta)
    const coolingEquation = (t, T, k, Ta) => {
        return -k * (T - Ta);
    };

    async function startSimulation() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        simulationRunning = false;

        comparisonTableContainer.style.display = 'none';
        comparisonTableBody.innerHTML = '';

        const T0 = parseFloat(T0Input.value);
        const Ta = parseFloat(TaInput.value);
        const k = parseFloat(kInput.value);
        const timeEnd = parseFloat(timeEndInput.value);
        const h = parseFloat(hInput.value);
        const selectedMethod = Array.from(methodRadios).find(radio => radio.checked).value;

        if (isNaN(T0) || isNaN(Ta) || isNaN(k) || isNaN(timeEnd) || isNaN(h) || h <= 0 || timeEnd <= 0 || k < 0) {
            alert('Por favor, ingresa valores numéricos válidos para todos los parámetros. La tasa de enfriamiento (k) no puede ser negativa.');
            return;
        }

        let result;
        const startTime = performance.now();

        // Los métodos de methods.js aún tienen los escalares como funciones separadas
        // O si hemos modificado methods.js para que los _System puedan tomar escalares envueltos,
        // usaríamos eso. Para claridad, asumiremos que eulerScalar, etc. están disponibles.
        const funcToUse = (t, T) => coolingEquation(t, T, k, Ta);

        switch (selectedMethod) {
            case 'euler':
                result = numericalMethods.eulerScalar(funcToUse, 0, T0, timeEnd, h);
                break;
            case 'heun':
                result = numericalMethods.heunScalar(funcToUse, 0, T0, timeEnd, h);
                break;
            case 'rungeKutta4':
                result = numericalMethods.rungeKutta4Scalar(funcToUse, 0, T0, timeEnd, h);
                break;
            default:
                alert('Método numérico no seleccionado.');
                return;
        }

        const endTime = performance.now();
        const calculationTime = (endTime - startTime).toFixed(2);

        simulationResults[selectedMethod] = {
            x: result.x,
            y: result.y,
            iterations: result.iterations,
            calculationTime: calculationTime,
            finalTemperature: result.y[result.y.length - 1]
        };

        // Gráfico
        if (chartInstance) {
            chartInstance.destroy();
        }

        chartInstance = new Chart(coolingChartCanvas, {
            type: 'line',
            data: {
                labels: result.x,
                datasets: [
                    {
                        label: 'Temperatura (°C)',
                        data: result.y,
                        borderColor: 'rgb(255, 159, 64)', // Naranja
                        tension: 0.1,
                        fill: false,
                        pointRadius: 0
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
                        text: 'Evolución de la Temperatura del Objeto'
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
                    y: {
                        title: { display: true, text: 'Temperatura (°C)' },
                        // beginAtZero: true, // No siempre queremos que empiece en cero para temperaturas
                        grid: { color: 'rgba(0,0,0,0.1)' }
                    }
                }
            }
        });

        animateSimulation(result.x, result.y, Ta);
    }

    let currentAnimationStep = 0;

    function animateSimulation(x_values, y_values, Ta) {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        currentAnimationStep = 0;
        simulationRunning = true;

        const totalSteps = x_values.length;

        // Determinar rango de temperaturas para el escalado del termómetro
        const minTemp = Math.min(...y_values, Ta);
        const maxTemp = Math.max(...y_values, Ta);
        const tempRange = maxTemp - minTemp;
        const thermometerHeight = thermometerFill.parentElement.clientHeight; // Altura total del contenedor del termómetro

        function step() {
            if (!simulationRunning || currentAnimationStep >= totalSteps) {
                simulationRunning = false;
                return;
            }

            const currentX = x_values[currentAnimationStep];
            const currentY = y_values[currentAnimationStep];

            currentTemperatureSpan.textContent = currentY.toFixed(2);
            currentIterationSpan.textContent = currentAnimationStep;
            currentTimeSpan.textContent = currentX.toFixed(2);

            // Animación del termómetro
            // Calcular el porcentaje de llenado (0% a 100%)
            let fillPercentage = 0;
            if (tempRange > 0) {
                fillPercentage = ((currentY - minTemp) / tempRange) * 100;
            } else {
                 fillPercentage = (currentY >= Ta) ? 100 : 0; // Si T=Ta, 100% o 0% dependiendo de la relación
            }


            // Ajustar el color y la altura del mercurio
            // Invertir el fillPercentage porque el 0% está en la parte inferior del termómetro (CSS)
            thermometerFill.style.height = `${fillPercentage}%`;
            thermometerFill.style.backgroundColor = currentY > Ta ? '#dc3545' : '#007bff'; // Rojo si está caliente, azul si está frío


            currentAnimationStep++;
            animationFrameId = requestAnimationFrame(step);
        }

        animationFrameId = requestAnimationFrame(step);
    }

    async function generateComparisonTable() {
        if (!simulationResults.rungeKutta4) {
             alert("Para una comparación completa, primero ejecuta una simulación o se ejecutará RK4 para obtener una base.");
             const T0 = parseFloat(T0Input.value);
             const Ta = parseFloat(TaInput.value);
             const k = parseFloat(kInput.value);
             const timeEnd = parseFloat(timeEndInput.value);
             const h = parseFloat(hInput.value);
             const funcToUse = (t, T) => coolingEquation(t, T, k, Ta);

             const startTimeRK4 = performance.now();
             const resultRK4 = numericalMethods.rungeKutta4Scalar(funcToUse, 0, T0, timeEnd, h);
             const endTimeRK4 = performance.now();
             simulationResults.rungeKutta4 = {
                 x: resultRK4.x,
                 y: resultRK4.y,
                 iterations: resultRK4.iterations,
                 calculationTime: (endTimeRK4 - startTimeRK4).toFixed(2),
                 finalTemperature: resultRK4.y[resultRK4.y.length - 1]
             };
        }

        const methodsToCompare = ['euler', 'heun', 'rungeKutta4'];
        for (const method of methodsToCompare) {
            if (!simulationResults[method]) {
                const T0 = parseFloat(T0Input.value);
                const Ta = parseFloat(TaInput.value);
                const k = parseFloat(kInput.value);
                const timeEnd = parseFloat(timeEndInput.value);
                const h = parseFloat(hInput.value);
                const funcToUse = (t, T) => coolingEquation(t, T, k, Ta);
                let result;
                const startTime = performance.now();

                switch (method) {
                    case 'euler':
                        result = numericalMethods.eulerScalar(funcToUse, 0, T0, timeEnd, h);
                        break;
                    case 'heun':
                        result = numericalMethods.heunScalar(funcToUse, 0, T0, timeEnd, h);
                        break;
                    case 'rungeKutta4':
                        result = numericalMethods.rungeKutta4Scalar(funcToUse, 0, T0, timeEnd, h);
                        break;
                }
                const endTime = performance.now();
                simulationResults[method] = {
                    x: result.x,
                    y: result.y,
                    iterations: result.iterations,
                    calculationTime: (endTime - startTime).toFixed(2),
                    finalTemperature: result.y[result.y.length - 1]
                };
            }
        }

        comparisonTableBody.innerHTML = '';
        comparisonTableContainer.style.display = 'block';

        const refFinalTemp = simulationResults.rungeKutta4?.finalTemperature;

        for (const methodKey of methodsToCompare) {
            const data = simulationResults[methodKey];
            if (data) {
                const row = comparisonTableBody.insertRow();
                const methodName = methodKey === 'euler' ? 'Euler' :
                                   methodKey === 'heun' ? 'Heun' :
                                   'Runge-Kutta 4to Orden';

                let errorRelative = 'N/A';
                if (refFinalTemp !== undefined && data.finalTemperature !== undefined) {
                    errorRelative = ((Math.abs(data.finalTemperature - refFinalTemp) / Math.abs(refFinalTemp)) * 100).toFixed(2) + '%';
                }

                row.insertCell().textContent = methodName;
                row.insertCell().textContent = data.finalTemperature.toFixed(2);
                row.insertCell().textContent = data.iterations;
                row.insertCell().textContent = data.calculationTime;
                row.insertCell().textContent = errorRelative;
            }
        }
    }
}