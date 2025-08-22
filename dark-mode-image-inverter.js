if (!window.IS_DARK_MODE_IMAGE_INVERTER_LOADED) {
    window.IS_DARK_MODE_IMAGE_INVERTER_LOADED = true;

    const darkModeImageInverter = (() => {
        const loadDMIIDependencies = (callback) => {
            mw.loader.using('mediawiki.util', 'mediawiki.api', 'mediawiki.notify');
            if (document.readyState !== 'loading') {
                callback();
            } else {
                document.addEventListener('DOMContentLoaded', callback());
            }
        }

        // Función que obtiene el contenido de una página
        async function getContent(pageName) {
            const params = {
                action: 'query',
                prop: 'revisions',
                titles: pageName,
                rvprop: 'content',
                rvslots: 'main',
                formatversion: '2',
                format: 'json'
            };

            const data = await new mw.Api().get(params);
            return data.query.pages[0].revisions[0].slots?.main?.content ?? null;
        }

        function addButton(pageName, content) {
            const infobox = document.querySelector('.infobox');
            if (!infobox) return;

            const button = document.createElement('button');
            button.textContent = '🌙';
            Object.assign(button.style, {
                position: 'absolute',
                top: '5px',
                right: '5px',
                fontSize: '12px',
                padding: '2px 5px',
                zIndex: '999',
                cursor: 'pointer'
            });

            button.addEventListener('click', () => {
                makeEdits(pageName, content);
            });

            infobox.style.position = 'relative';
            infobox.appendChild(button);
        }

        function hasInfobox(content) {
            return /\{\{\s*ficha de/i.test(content);
        }

        function addImageDarkModeAdaptationParameter(content) {
            return content.replace(
                /(\{\{\s*ficha de[^\n]*)/i,
                '$1\n|imagen modo oscuro = sí'
            );
        }

        async function editPage(pageName, newContent) {

            const summaryMessage = 'Añadido parámetro de modo oscuro a la infobox';

            const params = {
                action: 'edit',
                title: pageName,
                text: newContent,
                token: mw.user.tokens.get('csrfToken'),
                summary: summaryMessage,
                format: 'json'
            };

            try {
                await new mw.Api().postWithToken('csrf', params);
                mw.notify(`Parámetro de modo oscuro añadido a la página ${pageName}`, { type: 'success' });
            } catch (error) {
                mw.notify(`Error al añadir el parámetro de modo oscuro a la página ${pageName}: ${error}`, { type: 'error' });
            }
        }

        async function makeEdits(pageName, content) {
            const updated = addImageDarkModeAdaptationParameter(content);
            await editPage(pageName, updated);
        }


        const initializeScript = async () => {
            const pageName = mw.config.get('wgPageName');
            const content = await getContent(pageName);
            const articleHasInfobox = hasInfobox(content);

            if (articleHasInfobox) {
                addButton(pageName, content);
            }

            console.log("Pruebas:", pageName, content)
        };

        (async () => {
            // El script solo debería de cargarse en el espacio de nombres adecuado
            const namespace = await mw.config.get('wgNamespaceNumber');
            if (namespace == 0 || namespace == 104 || namespace == 2) {
                loadDMIIDependencies(initializeScript);
            }
        })();

    })();
} else {
    console.warn("Dark Mode Image Inverter se ha intentado cargar dos veces.");
}
