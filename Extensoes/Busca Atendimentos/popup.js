const button_send = document.getElementById('button');

button_send.addEventListener('click', async () => {
	const protocolo = document.getElementById('input').value.trim();
	if (!protocolo) return;

	button_send.classList.remove('done', 'error');
	button_send.classList.add('loading');

	try {
		const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
		const target = { tabId: tab.id, allFrames: true };

		await chrome.scripting.executeScript({
			target,
			func: async () => {
				const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

				const achar = (texto) =>
					[...document.querySelectorAll('div, a, span, li, td, p')]
						.filter((el) => el.textContent.trim() === texto)
						.pop();

				const visivel = (el) => el && el.offsetParent !== null;

				const empresa = achar('Empresa');
				if (!empresa) return;

				let relatorios = achar('Relatórios');

				if (!visivel(relatorios)) {
					empresa.click();
					await esperar(400);
					relatorios = achar('Relatórios');
				}

				if (relatorios) relatorios.click();
			},
		});

		await new Promise((r) => setTimeout(r, 1500));

		await chrome.scripting.executeScript({
			target,
			func: async () => {
				const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
				const textoDe = (a) => a?.textContent.trim();

				const anchors = [...document.querySelectorAll('a.jstree-anchor')];
				const ehArvoreRelatorios = anchors.some(
					(a) => textoDe(a) === 'Atendimentos'
				);
				if (!ehArvoreRelatorios) return;

				const li = [...document.querySelectorAll('li.jstree-node[aria-level="1"]')].find(
					(n) => textoDe(n.querySelector(':scope > a.jstree-anchor')) === 'Atendimentos'
				);
				if (!li) return;

				if (li.classList.contains('jstree-closed')) {
					li.querySelector(':scope > i.jstree-ocl')?.click();
				}

				let geral = null;
				for (let i = 0; i < 15 && !geral; i++) {
					geral = [...li.querySelectorAll(':scope > ul > li > a.jstree-anchor')].find(
						(a) => textoDe(a) === 'Geral'
					);
					if (!geral) await esperar(200);
				}

				geral?.click();
			},
		});
		await new Promise((r) => setTimeout(r, 2000));

		const resultados = await chrome.scripting.executeScript({
			target,
			args: [protocolo],
			func: async (valor) => {
				const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

				let visivel = null;
				for (let i = 0; i < 20 && !visivel; i++) {
					visivel = document.querySelector('input[name="atendimentos_protocolo_autocomp"]');
					if (!visivel) await esperar(250);
				}
				if (!visivel) return null;

				const oculto = document.querySelector('input[name="atendimentos_protocolo"]');
				const evento = (tipo) => new Event(tipo, { bubbles: true });

				visivel.focus();
				visivel.value = valor;
				visivel.dispatchEvent(evento('input'));
				visivel.dispatchEvent(evento('change'));

				if (oculto) {
					oculto.value = valor;
					oculto.dispatchEvent(evento('change'));
				}

				const enter = (tipo) =>
					new KeyboardEvent(tipo, {
						key: 'Enter', code: 'Enter', keyCode: 13, which: 13,
						bubbles: true, cancelable: true,
					});

				await esperar(440);
				visivel.dispatchEvent(enter('keydown'));
				visivel.dispatchEvent(enter('keypress'));
				visivel.dispatchEvent(enter('keyup'));

				return `OK: campo="${visivel.value}" oculto="${oculto?.value}" frame=${location.pathname}`;
			},
		});

		await new Promise((r) => setTimeout(r, 200));

		const detalhar = await chrome.scripting.executeScript({
			target,
			func: async () => {
				const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

				const achar = () =>
					document.querySelector('#Rrotac_top') ||
					document.querySelector('a[title="Exibir em detalhes"]');

				let botao = null;
				for (let i = 0; i < 20 && !botao; i++) {
					botao = achar();
					if (!botao) await esperar(1);
				}
				if (!botao) return null;

				botao.click();
				return `clicou em Detalhar, frame=${location.pathname}`;
			},
		});

		button_send.classList.remove('loading');
		button_send.classList.add('done');
	} catch (e) {
		console.error(e);
		button_send.classList.remove('loading');
		button_send.classList.add('error');
	} finally {
		setTimeout(() => {
			button_send.classList.remove('loading', 'done', 'error');
		}, 2200);
	}
});