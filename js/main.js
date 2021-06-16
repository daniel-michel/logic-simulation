import LogicCircuitGate from "./LogicCircuitGate.js";
import LogicConnection from "./LogicConnection.js";
import LogicFunctionGate from "./LogicFunctionGate.js";
import Vec2 from "./math/Vec2.js";
import LogicGate from "./LogicGate.js";
import LogicCircuitUserInterface from "./LogicCircuitUserInterface.js";

/**
 * @type {HTMLCanvasElement}
 */
let canvas;
/**
 * @type {LogicCircuitUserInterface}
 */
let circuit;
let pulseGate;

window.onload = main;
async function main()
{
	canvas = document.querySelector("#canvas");

	let gateDescriptions = (await (await fetch("./circuits/default-gates.json")).json()).gates;

	// circuit = new LogicCircuitUserInterface({ canvas, circuit: LogicCircuitGate.gateFromDescription(gateDescriptions["Negative-Edge-Triggered-D-Flip-Flop"], "D-Flip-Flop", gateDescriptions)});
	circuit = new LogicCircuitUserInterface({ canvas });
	circuit.circuit.loadGateDescriptions(gateDescriptions);
	window.circuit = circuit;
	// circuit.loadGateDescriptions(gateDescriptions);

	// for (let i = 0; i < 10; i++)
	// 	circuit.createGate("switch").rect.center.set(42, 40);

	// let notGate = circuit.createGate("not any");
	// notGate.rect.center = new Vec2(500, 100);

	// let andGate = circuit.createGate("and");
	// andGate.rect.center = new Vec2(500, 200);

	// let switchGate = circuit.createGate("switch");
	// switchGate.rect.center = new Vec2(100, 150);

	// let squareGate = circuit.createGate("square");
	// squareGate.rect.center = new Vec2(100, 250);

	// let orGate = circuit.createGate("or");
	// orGate.rect.center = new Vec2(300, 200);

	// let nandGate = circuit.createGate("nand circuit");
	// nandGate.rect.center = new Vec2(700, 150);

	// let sevenSeg = circuit.createGate("7 segment display");
	// sevenSeg.rect.center.set(1000, 200);

	// let test = new LogicGateFunction(
	// 	{
	// 		input: "[[bit, [bit, [bit, bit]], [bit, bit, bit]]]",
	// 		output: "[[bit, [bit, [bit, bit]], [bit, bit, bit]]]",
	// 	}, "test", new Vec2(200, 500), () => input => input);
	// let test2 = new LogicGateFunction(
	// 	{
	// 		input: "[[bit, [bit, [bit, bit]], [bit, bit, bit]]]",
	// 		output: "[[bit, [bit, [bit, bit]], [bit, bit, bit]]]",
	// 	}, "test", new Vec2(600, 550), () => input => input);
	// // circuit.add(notGate);
	// // circuit.add(andGate);
	// circuit.add(test);
	// circuit.add(test2);

	// // circuit.add(LogicConnection.connect(switchGate.outputConnector, switchGate.inputConnector, "", ""));

	// circuit.add(new LogicConnection(switchGate.outputConnector, orGate.inputConnector, "", "*"));
	// circuit.add(new LogicConnection(squareGate.outputConnector, orGate.inputConnector, "", "*"));

	// circuit.add(new LogicConnection(notGate.outputConnector, andGate.inputConnector, "", "*"));
	// circuit.add(new LogicConnection(orGate.outputConnector, andGate.inputConnector, "", "*"));

	// circuit.add(new LogicConnection(andGate.outputConnector, notGate.inputConnector));

	// circuit.add(new LogicConnection(notGate.outputConnector, nandGate.inputConnector, "", "*"));
	// circuit.add(new LogicConnection(andGate.outputConnector, nandGate.inputConnector, "", "*"));
	// circuit.add(new LogicConnection(nandGate.outputConnector, andGate.inputConnector, "", "*"));


	// circuit.add(new LogicConnection(notGate.outputConnector, sevenSeg.inputConnector, "", "0"));
	// circuit.add(new LogicConnection(nandGate.outputConnector, sevenSeg.inputConnector, "", "1"));
	// circuit.add(new LogicConnection(andGate.outputConnector, sevenSeg.inputConnector, "", "2"));
	// circuit.add(new LogicConnection(orGate.outputConnector, sevenSeg.inputConnector, "", "3"));
	// circuit.add(new LogicConnection(switchGate.outputConnector, sevenSeg.inputConnector, "", "4"));
	// circuit.add(new LogicConnection(squareGate.outputConnector, sevenSeg.inputConnector, "", "5"));

	resize();
	circuit.draw();
	circuit.draw();

	circuit.circuit.gates.forEach(gate =>
	{
		console.log(gate.name, "input :", LogicGate.interfaceToString(gate.inputConnector.interface));
		console.log(gate.name, "output:", LogicGate.interfaceToString(gate.outputConnector.interface));
	});
	setInterval(() =>
	{
		// console.log("start");
		// for (let connection of circuit.connections)
		// 	console.log(LogicGate.valueToString(connection.currentValue));
		circuit.update();
		// circuit.draw();
	}, 1000);
	// let loop = () => {
	// 	circuit.update();
	// 	requestAnimationFrame(loop);
	// };
	// loop();
}


window.onresize = resize;
function resize()
{
	canvas.width = innerWidth * devicePixelRatio;
	canvas.height = innerHeight * devicePixelRatio;
	circuit.requestRedraw();
}