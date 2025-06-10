// src/js/methods.js (MODIFICADO)

/**
 * Módulo que contiene las implementaciones de los métodos numéricos
 * para resolver Ecuaciones Diferenciales Ordinarias (EDOs).
 * Adaptado para manejar tanto EDOs simples (escalares) como sistemas de EDOs (vectoriales).
 *
 * Forma general de la EDO escalar: dy/dx = f(x, y)
 * Forma general de los sistemas de EDOs: dY/dx = F(x, Y), donde Y es un vector de estados.
 */

export const numericalMethods = {

    // --- Métodos para EDOs Escalare (originales, se mantienen por si acaso) ---
    // Puedes incluso removerlos si todos tus problemas son sistemas,
    // o refactorizarlos para que los métodos de sistema puedan ser usados para escalares.
    // Pero por claridad, los mantengo separados por ahora.
    eulerScalar: function(func, x0, y0, xEnd, h) {
        // Envolvemos la función escalar para que se comporte como una función de sistema de 1D
        const func_wrapper = (x, Y_vector) => [func(x, Y_vector[0])];
        const initial_Y_vector = [y0]; // La condición inicial escalar envuelta en un array

        // Llamamos al método de sistema
        const result = this.eulerSystem(func_wrapper, x0, initial_Y_vector, xEnd, h);

        // Desvolvemos el resultado: de number[][] a number[]
        return {
            x: result.x,
            y: result.y.map(arr => arr[0]), // ¡Esta es la línea clave que faltaba!
            iterations: result.iterations
        };
    },

    heunScalar: function(func, x0, y0, xEnd, h) {
        const func_wrapper = (x, Y_vector) => [func(x, Y_vector[0])];
        const initial_Y_vector = [y0];

        const result = this.heunSystem(func_wrapper, x0, initial_Y_vector, xEnd, h);

        return {
            x: result.x,
            y: result.y.map(arr => arr[0]), // ¡Esta es la línea clave que faltaba!
            iterations: result.iterations
        };
    },

    rungeKutta4Scalar: function(func, x0, y0, xEnd, h) {
        const func_wrapper = (x, Y_vector) => [func(x, Y_vector[0])];
        const initial_Y_vector = [y0];

        const result = this.rungeKutta4System(func_wrapper, x0, initial_Y_vector, xEnd, h);

        return {
            x: result.x,
            y: result.y.map(arr => arr[0]), // ¡Esta es la línea clave que faltaba!
            iterations: result.iterations
        };
    },


    /**
     * Resuelve un sistema de EDOs de primer orden usando el Método de Euler.
     * dY/dx = F(x, Y), donde Y es un vector [y1, y2, ..., yn]
     *
     * @param {function(number, number[]): number[]} func La función F(x, Y) que define el sistema de EDOs.
     * Toma x y un array Y, devuelve un array de derivadas.
     * @param {number} x0 El valor inicial de la variable independiente (x).
     * @param {number[]} Y0 El vector inicial de las variables dependientes (Y).
     * @param {number} xEnd El valor final de la variable independiente (x).
     * @param {number} h El tamaño del paso (incremento de x).
     * @returns {{x: number[], y: number[][], iterations: number}} Un objeto con el array de x, el array de arrays Y, y el número de iteraciones.
     */
    eulerSystem: function(func, x0, Y0, xEnd, h) {
        let x = [x0];
        let y = [Y0.slice()]; // Almacena una copia del vector inicial
        let currentX = x0;
        let currentY = Y0.slice(); // Trabaja con una copia mutable
        let iterations = 0;

        while (currentX < xEnd) {
            let step = h;
            if (currentX + h > xEnd) {
                step = xEnd - currentX;
            }
            if (step <= 0) break;

            const dY_dx = func(currentX, currentY); // Esto devuelve un array de derivadas [dy1/dx, dy2/dx, ...]
            let nextY = [];
            for (let i = 0; i < currentY.length; i++) {
                nextY.push(currentY[i] + dY_dx[i] * step);
            }
            let nextX = currentX + step;

            x.push(nextX);
            y.push(nextY.slice()); // Almacena una copia del siguiente vector

            currentX = nextX;
            currentY = nextY;
            iterations++;

            if (currentX >= xEnd) break;
        }

        return { x: x, y: y, iterations: iterations };
    },

    /**
     * Resuelve un sistema de EDOs de primer orden usando el Método de Heun.
     *
     * @param {function(number, number[]): number[]} func La función F(x, Y) que define el sistema de EDOs.
     * @param {number} x0 El valor inicial de la variable independiente (x).
     * @param {number[]} Y0 El vector inicial de las variables dependientes (Y).
     * @param {number} xEnd El valor final de la variable independiente (x).
     * @param {number} h El tamaño del paso (incremento de x).
     * @returns {{x: number[], y: number[][], iterations: number}} Un objeto con el array de x, el array de arrays Y, y el número de iteraciones.
     */
    heunSystem: function(func, x0, Y0, xEnd, h) {
        let x = [x0];
        let y = [Y0.slice()];
        let currentX = x0;
        let currentY = Y0.slice();
        let iterations = 0;

        while (currentX < xEnd) {
            let step = h;
            if (currentX + h > xEnd) {
                step = xEnd - currentX;
            }
            if (step <= 0) break;

            // Predictor (Euler)
            const dY_dx_predictor = func(currentX, currentY);
            let Y_predictor = [];
            for (let i = 0; i < currentY.length; i++) {
                Y_predictor.push(currentY[i] + dY_dx_predictor[i] * step);
            }

            // Corrector
            const dY_dx_corrector = func(currentX + step, Y_predictor);
            let nextY = [];
            for (let i = 0; i < currentY.length; i++) {
                let averageSlope = (dY_dx_predictor[i] + dY_dx_corrector[i]) / 2;
                nextY.push(currentY[i] + averageSlope * step);
            }
            let nextX = currentX + step;

            x.push(nextX);
            y.push(nextY.slice());

            currentX = nextX;
            currentY = nextY;
            iterations++;

            if (currentX >= xEnd) break;
        }

        return { x: x, y: y, iterations: iterations };
    },

    /**
     * Resuelve un sistema de EDOs de primer orden usando el Método de Runge-Kutta de 4to Orden.
     *
     * @param {function(number, number[]): number[]} func La función F(x, Y) que define el sistema de EDOs.
     * @param {number} x0 El valor inicial de la variable independiente (x).
     * @param {number[]} Y0 El vector inicial de las variables dependientes (Y).
     * @param {number} xEnd El valor final de la variable independiente (x).
     * @param {number} h El tamaño del paso (incremento de x).
     * @returns {{x: number[], y: number[][], iterations: number}} Un objeto con el array de x, el array de arrays Y, y el número de iteraciones.
     */
    rungeKutta4System: function(func, x0, Y0, xEnd, h) {
        let x = [x0];
        let y = [Y0.slice()];
        let currentX = x0;
        let currentY = Y0.slice();
        let iterations = 0;

        while (currentX < xEnd) {
            let step = h;
            if (currentX + h > xEnd) {
                step = xEnd - currentX;
            }
            if (step <= 0) break;

            const k1_vector = func(currentX, currentY);
            let y_k2_input = currentY.map((val, i) => val + k1_vector[i] * step / 2);
            const k2_vector = func(currentX + step / 2, y_k2_input);

            let y_k3_input = currentY.map((val, i) => val + k2_vector[i] * step / 2);
            const k3_vector = func(currentX + step / 2, y_k3_input);

            let y_k4_input = currentY.map((val, i) => val + k3_vector[i] * step);
            const k4_vector = func(currentX + step, y_k4_input);

            let nextY = [];
            for (let i = 0; i < currentY.length; i++) {
                nextY.push(currentY[i] + (step / 6) * (k1_vector[i] + 2 * k2_vector[i] + 2 * k3_vector[i] + k4_vector[i]));
            }
            let nextX = currentX + step;

            x.push(nextX);
            y.push(nextY.slice());

            currentX = nextX;
            currentY = nextY;
            iterations++;

            if (currentX >= xEnd) break;
        }

        return { x: x, y: y, iterations: iterations };
    }
};