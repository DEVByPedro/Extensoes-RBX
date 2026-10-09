(() => {
	const CSS = `
		:host {
			display: inline-flex; align-items: center; gap: 8px;
			padding: 6px 8px; border-radius: 8px;
			background: #15151f;
			box-shadow: 0 2px 10px rgba(0,0,0,.45);
		}
		* { box-sizing: border-box; font-family: 'Google Sans', 'Segoe UI', sans-serif; }

		input {
			width: 150px; height: 36px; padding: 0 10px;
			background: #252436; color: #fff; font-weight: 500;
			border: 1px solid transparent; border-radius: 5px; outline: none;
			transition: border-color .25s, box-shadow .25s;
		}
		input::placeholder { color: #525175; }
		input:focus { border-color: #65658a; box-shadow: 0 0 0 3px rgba(120,100,255,.2); }

		button {
			position: relative; width: 110px; height: 36px;
			background: #252436; color: #fff; font-weight: 500;
			border: none; border-radius: 5px; cursor: pointer;
			transition: all .25s ease;
		}
		button:hover {
			background: #2b2a3a;
			box-shadow: 0 0 10px 2px #1c1c29, 0 0 20px 4px rgba(120,100,255,.25);
			transform: translateY(-1px);
		}
		button:active { transform: scale(.97); }

		.label, .dots {
			position: absolute; inset: 0; display: flex;
			align-items: center; justify-content: center;
			transition: opacity .25s, transform .25s;
		}
		.dots { opacity: 0; transform: translateY(10px); }

		/* carregando */
		button.loading { pointer-events: none; }
		button.loading .label { opacity: 0; transform: translateY(-10px); }
		button.loading .dots { opacity: 1; transform: translateY(0); }
		.dots i { width: 6px; height: 6px; margin: 0 3px; border-radius: 50%; background: #fff; }
		button.loading .dots i { animation: pulo .9s ease-in-out infinite; }
		button.loading .dots i:nth-child(2) { animation-delay: .15s; }
		button.loading .dots i:nth-child(3) { animation-delay: .3s; }
		@keyframes pulo {
			0%, 60%, 100% { transform: translateY(0); opacity: .5; }
			30% { transform: translateY(-7px); opacity: 1; }
		}

		/* finalizado */
		.check {
			position: absolute; inset: 0; margin: auto; width: 22px; height: 22px;
			fill: none; stroke: #6dffb0; stroke-width: 3;
			stroke-linecap: round; stroke-linejoin: round;
			stroke-dasharray: 24; stroke-dashoffset: 24;
		}
		button::after {
			content: ''; position: absolute; inset: 0; border: 2px solid #6dffb0;
			border-radius: inherit; opacity: 0; pointer-events: none;
		}
		button.done {
			pointer-events: none; background: #1f3a33;
			box-shadow: 0 0 12px 2px rgba(109,255,176,.35), 0 0 28px 6px rgba(109,255,176,.15);
			animation: pop .5s cubic-bezier(.34,1.56,.64,1);
		}
		button.done .label { opacity: 0; transform: scale(.8); }
		button.done .check { animation: desenhar .45s .15s ease-out forwards; }
		button.done::after { animation: onda .8s ease-out; }
		@keyframes desenhar { to { stroke-dashoffset: 0; } }
		@keyframes pop { 0% { transform: scale(.95); } 50% { transform: scale(1.08); } 100% { transform: scale(1); } }
		@keyframes onda { 0% { opacity: .8; transform: scale(1); } 100% { opacity: 0; transform: scale(1.2); } }

		/* erro */
		button.error {
			pointer-events: none; background: #3a1f27;
			box-shadow: 0 0 12px 2px rgba(255,100,120,.35);
			animation: tremer .4s ease;
		}
		@keyframes tremer {
			0%, 100% { transform: translateX(0); }
			20%, 60% { transform: translateX(-5px); }
			40%, 80% { transform: translateX(5px); }
		}
	`;

	function posicionar(host) {
		const header = document.querySelector('header.header') || document.querySelector('header');
		const h = header?.getBoundingClientRect();
		const alt = host.offsetHeight || 48;

		host.style.top = (h ? h.top + (h.height - alt) / 2 : 11) + 'px';
		host.style.left = 'auto';
		host.style.right = '400px';
	}

	const CSS_HEADER = `
		#idMenuHeader,
		#idMenuHeader > td {
			background: #15151f !important;
		}

		header.header {
			position: relative !important;
			isolation: isolate;
			overflow: hidden;
			background-color: #15151f !important;
			background-image: none !important;
			border-bottom: 1px solid #252436;
		}

		header.header .header__main,
		header.header .box__left,
		header.header .box__left_itens,
		header.header .box__right {
			background: transparent !important;
		}

		.extp-luzes {
			position: absolute;
			inset: 0;
			z-index: -1;
			overflow: hidden;
			pointer-events: none;
		}

		.extp-orb {
			position: absolute;
			left: var(--x);
			top: var(--y);
			width: var(--w);
			height: var(--h);
			margin: calc(var(--h) / -2) 0 0 calc(var(--w) / -2);
			border-radius: 50%;
			background: radial-gradient(closest-side, rgba(var(--cor), 0.5), transparent);
			filter: blur(6px);
			opacity: 0;
			animation: extp-luz ease-in-out infinite;
		}

		@keyframes extp-luz {
			0%   { opacity: 0; transform: translate(0, 0) scale(0.7); }
			30%  { opacity: 1; }
			70%  { opacity: 0.9; }
			100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(1.25); }
		}

		@media (prefers-reduced-motion: reduce) {
			.extp-orb { animation: none; opacity: 0.4; }
		}

		header,
		#header_will,
		.header_will > * {
			background: #15151f !important;
			background-color: #15151f !important;
			background-image: none !important;
		}

	`;

	const CORES_LUZ = ['120, 100, 255', '80, 160, 255', '255, 100, 180'];
	const QTD_LUZES = 6;

	function criarLuzes(header) {
		if (header.querySelector('.extp-luzes')) return;

		const rand = (a, b) => a + Math.random() * (b - a);

		const reposicionar = (el) => {
			el.style.setProperty('--x', rand(0, 100) + '%');
			el.style.setProperty('--y', rand(25, 75) + '%');
			el.style.setProperty('--dx', rand(-140, 140) + 'px');
			el.style.setProperty('--dy', rand(-14, 14) + 'px');
		};

		const wrap = document.createElement('div');
		wrap.className = 'extp-luzes';

		for (let i = 0; i < QTD_LUZES; i++) {
			const orb = document.createElement('span');
			orb.className = 'extp-orb';
			orb.style.setProperty('--cor', CORES_LUZ[i % CORES_LUZ.length]);
			orb.style.setProperty('--w', rand(220, 340) + 'px');
			orb.style.setProperty('--h', rand(90, 140) + 'px');
			orb.style.animationDuration = rand(7, 12) + 's';
			orb.style.animationDelay = -rand(0, 12) + 's';
			reposicionar(orb);

			orb.addEventListener('animationiteration', () => reposicionar(orb));

			wrap.append(orb);
		}

		header.prepend(wrap);
	}

	function aplicarEstiloHeader() {
		if (!document.getElementById('ext-protocolo-estilo')) {
			const style = document.createElement('style');
			style.id = 'ext-protocolo-estilo';
			style.textContent = CSS_HEADER;
			document.head.append(style);
		}
		const header = document.querySelector('header.header');
		if (header) criarLuzes(header);
	}

	function montar() {
		if (!document.querySelector('header.header, header') || document.getElementById('ext-protocolo-host')) return;

		const host = document.createElement('div');
		host.id = 'ext-protocolo-host';
		host.style.cssText = 'position:fixed; z-index:2147483647;';
		document.body.append(host);
		posicionar(host);

		const root = host.attachShadow({ mode: 'open' });
		root.innerHTML = `
			<style>${CSS}</style>
			<input type="text" placeholder="Protocolo" />
			<button>
				<span class="label">Buscar</span>
				<span class="dots"><i></i><i></i><i></i></span>
				<svg class="check" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
			</button>
		`;

		const input = root.querySelector('input');
		const botao = root.querySelector('button');

		const buscar = () => {
			const protocolo = input.value.trim();
			if (!protocolo) return;

			botao.classList.remove('done', 'error');
			botao.classList.add('loading');

			chrome.runtime.sendMessage({ tipo: 'buscar', protocolo }, (resp) => {
				botao.classList.remove('loading');
				botao.classList.add(resp?.ok ? 'done' : 'error');
				if (!resp?.ok) console.warn('Busca de protocolo:', resp?.erro);
				setTimeout(() => botao.classList.remove('done', 'error'), 2200);
			});
		};

		botao.addEventListener('click', buscar);
		input.addEventListener('keydown', (e) => {
			e.stopPropagation();
			if (e.key === 'Enter') buscar();
		});
	}

	setInterval(() => {
		if (document.querySelector('header.header')) aplicarEstiloHeader();
		montar();
		const host = document.getElementById('ext-protocolo-host');
		if (host) posicionar(host);
	}, 1000);

	setInterval(montar, 1000);
})();