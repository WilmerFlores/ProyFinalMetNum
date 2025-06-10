// src/js/problem-loader.js (MODIFICADO - Última versión con MathJax)

/**
 * Módulo para cargar dinámicamente el contenido HTML de los problemas
 * y sus scripts asociados.
 */

export const problemLoader = {

    /**
     * Carga el contenido HTML de un problema específico en un contenedor dado.
     * También puede cargar el script JS asociado al problema y ejecutar su función de inicialización.
     *
     * @param {string} problemId El ID o nombre del problema (ej. 'problem1', 'problem2').
     * @param {HTMLElement} containerElement El elemento DOM donde se inyectará el contenido HTML.
     * @returns {Promise<void>} Una promesa que se resuelve cuando el contenido y el script son cargados.
     */
    loadProblem: async function(problemId, containerElement) {
        if (!containerElement) {
            console.error('El elemento contenedor no ha sido proporcionado.');
            return;
        }

        const templatePath = `src/templates/${problemId}-template.html`;
        const scriptPath = `src/js/${problemId}.js`;

        try {
            // 1. Cargar el contenido HTML del template
            const response = await fetch(templatePath);
            if (!response.ok) {
                throw new Error(`No se pudo cargar el template: ${response.statusText}`);
            }
            const htmlContent = await response.text();
            containerElement.innerHTML = htmlContent;

            // **¡AQUÍ ES DONDE AÑADIMOS LA LLAMADA A MATHJAX!**
            // Se debe llamar después de que el HTML ha sido inyectado
            if (window.MathJax) { // Verificar si MathJax está cargado
                // Usamos typesetPromise para asegurar que se complete el renderizado
                await MathJax.typesetPromise();
                console.log('MathJax ha renderizado las ecuaciones del template.');
            } else {
                console.warn('MathJax no está disponible. Las ecuaciones no se renderizarán.');
            }

            // 2. Cargar y ejecutar el script JS asociado al problema
            const oldScript = document.getElementById(`${problemId}-script`);
            if (oldScript) {
                oldScript.remove();
            }

            const scriptElement = document.createElement('script');
            scriptElement.type = 'module';
            scriptElement.src = scriptPath;
            scriptElement.id = `${problemId}-script`;

            scriptElement.onerror = () => console.error(`Error al cargar el script para ${problemId}`);

            scriptElement.onload = async () => {
                try {
                    const moduleName = problemId.charAt(0).toUpperCase() + problemId.slice(1);
                    const initFunctionName = `init${moduleName}`;

                    const absoluteScriptPath = new URL(scriptPath, document.baseURI).href;

                    const problemModule = await import(absoluteScriptPath);

                    if (typeof problemModule[initFunctionName] === 'function') {
                        problemModule[initFunctionName]();
                        console.log(`Función ${initFunctionName} de ${problemId} ejecutada.`);
                    } else {
                        console.warn(`La función ${initFunctionName} no fue encontrada o no es una función en ${scriptPath}`);
                    }
                } catch (importError) {
                    console.error(`Error al importar o ejecutar el módulo ${problemId}:`, importError);
                }
            };

            document.body.appendChild(scriptElement);

            console.log(`Contenido y script de ${problemId} cargados exitosamente.`);

        } catch (error) {
            console.error(`Error al cargar el problema ${problemId}:`, error);
            containerElement.innerHTML = `<p>Error al cargar el contenido del problema. Por favor, inténtalo de nuevo.</p>`;
        }
    }
};