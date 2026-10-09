chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
	if (msg.tipo !== 'buscar') return;

	buscar(sender.tab.id, msg.protocolo)
		.then(sendResponse)
		.catch((e) => sendResponse({ ok: false, erro: String(e) }));

	return true; // resposta assíncrona
});

async function buscar(tabId, protocolo) {
	const target = { tabId, allFrames: true };
	const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

	// roda func até algum frame devolver { ok: true }
	const tentar = async (func, args = [], limiteMs = 8000) => {
		const ini = Date.now();
		while (Date.now() - ini < limiteMs) {
			try {
				const res = await chrome.scripting.executeScript({ target, func, args });
				const ok = res.find((r) => r.result?.ok);
				if (ok) return ok.result;
			} catch (e) {
				// frame ainda carregando
			}
			await esperar(150);
		}
		return null;
	};

	// ETAPA 1: Empresa > Relatórios
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

	await esperar(1500);

	// ETAPA 2: Atendimentos > Geral
	await chrome.scripting.executeScript({
		target,
		func: async () => {
			const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
			const textoDe = (a) => a?.textContent.trim();

			const anchors = [...document.querySelectorAll('a.jstree-anchor')];
			if (!anchors.some((a) => textoDe(a) === 'Atendimentos')) return;

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

	// ETAPA 3: preencher o protocolo, esperar o autocomplete retornar e dar Enter
	const LIMITE_AUTOCOMPLETE = 6000; // ms: quanto esperar o autocomplete retornar algo

	const etapa3 = await tentar(
		async (valor, limite) => {
			const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

			const visivel = document.querySelector('input[name="atendimentos_protocolo_autocomp"]');
			if (!visivel) return null; // outro frame, ou ainda não carregou

			await esperar(500); // deixa a tela terminar de carregar

			const oculto = document.querySelector('input[name="atendimentos_protocolo"]');
			const evento = (tipo) => new Event(tipo, { bubbles: true });
			const tecla = (tipo, key, keyCode) =>
				new KeyboardEvent(tipo, {
					key, code: key, keyCode, which: keyCode,
					bubbles: true, cancelable: true,
				});

			visivel.focus();
			visivel.value = valor;
			visivel.dispatchEvent(evento('input'));
			visivel.dispatchEvent(tecla('keyup', valor.slice(-1) || '0', 48));

			// espera o autocomplete retornar itens
			const itensVisiveis = () => {
				const listas = [...document.querySelectorAll('ul.ui-autocomplete')].filter(
					(ul) => getComputedStyle(ul).display !== 'none'
				);
				return listas.flatMap((ul) => [...ul.querySelectorAll('li')]);
			};

			let itens = [];
			const ini = Date.now();
			while (Date.now() - ini < limite) {
				itens = itensVisiveis();
				if (itens.length) break;
				await esperar(100);
			}

			if (oculto) {
				oculto.value = valor;
				oculto.dispatchEvent(evento('change'));
			}

			window.__antesDoReload = true;

			// destaca o primeiro item da lista (se veio algum) e dá Enter
			if (itens.length) {
				visivel.dispatchEvent(tecla('keydown', 'ArrowDown', 40));
				await esperar(150);
			}

			visivel.dispatchEvent(tecla('keydown', 'Enter', 13));
			visivel.dispatchEvent(tecla('keypress', 'Enter', 13));
			visivel.dispatchEvent(tecla('keyup', 'Enter', 13));

			return { ok: true, itens: itens.length };
		},
		[protocolo, LIMITE_AUTOCOMPLETE]
	);
	if (!etapa3) return { ok: false, erro: 'campo de protocolo não encontrado' };
	console.log('autocomplete retornou itens:', etapa3.itens);

	// ETAPA 4: Detalhar, assim que o relatório recarregar
	const clicarDetalhar = (forcar) => {
		if (!forcar && window.__antesDoReload) return null;
		const botao =
			document.querySelector('#Rrotac_top') ||
			document.querySelector('a[title="Exibir em detalhes"]');
		if (!botao) return null;
		botao.click();
		return { ok: true };
	};

	let etapa4 = await tentar(clicarDetalhar, [false], 6000);
	if (!etapa4) etapa4 = await tentar(clicarDetalhar, [true], 2000);

	return etapa4 ? { ok: true } : { ok: false, erro: 'botão Detalhar não encontrado' };
}