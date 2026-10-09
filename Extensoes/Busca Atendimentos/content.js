chrome.runtime.onMessage.addListener((msg) => {
	if (msg.tipo !== 'preencher-protocolo') return;

	const input = document.getElementById('id_ac_atendimentos_protocolo');
	if (!input) return;

	console.log(msg.protocolo)

	input.value = msg.protocolo;
	input.dispatchEvent(new Event('input', { bubbles: true }));
	input.dispatchEvent(new Event('change', { bubbles: true }));
});