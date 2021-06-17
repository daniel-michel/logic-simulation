import LogicCircuitUserInterface from "./LogicCircuitUserInterface.js";

/**
 * @type {HTMLCanvasElement}
 */
let canvas;
/**
 * @type {LogicCircuitUserInterface}
 */
let circuit;

window.onload = main;
async function main()
{
	canvas = document.querySelector("#canvas");

	let gateDescriptions = (await (await fetch("./circuits/default-gates.json")).json()).gates;

	circuit = new LogicCircuitUserInterface({ canvas });
	circuit.circuit.loadGateDescriptions(gateDescriptions);

	resize();
	circuit.draw();

	setInterval(() =>
	{
		circuit.update();
	}, 50);
}


window.onresize = resize;
function resize()
{
	canvas.width = innerWidth * devicePixelRatio;
	canvas.height = innerHeight * devicePixelRatio;
	circuit.requestRedraw();
}