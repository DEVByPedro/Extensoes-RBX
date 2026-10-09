let tx = innerWidth / 2, ty = innerHeight / 2; // alvo (mouse)
let cx = tx, cy = ty;                          // posição suavizada

document.addEventListener('mousemove', (e) => {
	tx = e.clientX;
	ty = e.clientY;
});

function animate() {
	cx += (tx - cx) * 0.06;
	cy += (ty - cy) * 0.06;

	const root = document.documentElement.style;
	root.setProperty('--ix', (innerWidth - cx) + 'px');
	root.setProperty('--iy', (innerHeight - cy) + 'px');

	requestAnimationFrame(animate);
}
animate();