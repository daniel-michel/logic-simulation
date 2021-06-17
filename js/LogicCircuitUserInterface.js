import LogicConnection from "./LogicConnection.js";
import LogicConnector from "./LogicConnector.js";
import LogicGate from "./LogicGate.js";
import LogicCircuitGate from "./LogicCircuitGate.js";
import Rect from "./math/Rect.js";
import Vec2 from "./math/Vec2.js";



export default class LogicCircuitUserInterface
{
	/**
	 * @type {LogicCircuitGate}
	 */
	circuit;

	/**
	 * @type {HTMLCanvasElement}
	 */
	#canvas;
	/**
	 * @type {CanvasRenderingContext2D}
	 */
	#context;

	#fileHandle;

	camera = {
		zoom: 0,
		defaultScale: 20,
		position: new Vec2(),
	};

	/**
	 * @type {Rect}
	 */
	#selectionArea;
	#mousedown = false;
	#mouseStart = new Vec2();
	#mouseCurrent = new Vec2();
	/**
	 * @type {LogicGate|{connector: LogicConnector, path: string, gate: LogicGate}}
	 */
	#startElement;
	#dragging = false;
	#noClick = false;
	#temporarySelected = [];
	/**
	 * @type {LogicConnector[][]}
	 */
	#temporaryShownConnectors = [];
	#shiftPressed = false;
	#ctrlPressed = false;
	#redrawRequested = false;
	#search = { text: "", position: new Vec2() };
	/**
	 * @type {Map<LogicGate, { startPosition?: Vec2 }>}
	 */
	#selectedInfo = new Map();
	/**
	 * @type {() => void}
	 */
	#cleanupEventListeners;
	/**
	 * 
	 * @param {{canvas?: HTMLCanvasElement, circuit?: LogicCircuitGate}} options 
	 */
	constructor({ canvas, circuit = new LogicCircuitGate() })
	{
		this.circuit = circuit;
		this.setCanvas(canvas);
	}

	getScale()
	{
		return 1.3 ** this.camera.zoom * this.camera.defaultScale;
	}
	getCenterOfScreen()
	{
		return new Vec2(this.#canvas.width, this.#canvas.height).mult(0.5);
	}
	projectScale(s)
	{
		return s * this.getScale();
	}
	/**
	 * 
	 * @param {Vec2} vec 
	 */
	projectToCircuit(vec)
	{
		return this.getCenterOfScreen().mult(-1).add(vec).div(this.getScale()).add(this.camera.position);
	}
	/**
	 *
	 * @param {Vec2} vec
	 */
	projectToScreen(vec)
	{
		return vec.copy().sub(this.camera.position).mult(this.getScale()).add(this.getCenterOfScreen());
	}

	/**
	 *
	 * @param {MouseEvent} e
	 */
	#getMousePos(e)
	{
		let boundingRect = this.#canvas.getBoundingClientRect();
		return new Vec2(e.clientX - boundingRect.left, e.clientY - boundingRect.top);
	}
	/**
	 *
	 * @param {MouseEvent|KeyboardEvent} e
	 */
	#updatePressed(e)
	{
		this.#shiftPressed = e.shiftKey;
		this.#ctrlPressed = e.ctrlKey;
	}
	/**
	 * 
	 * @param {HTMLCanvasElement} canvas 
	 */
	setCanvas(canvas)
	{
		if (this.#canvas)
			this.#cleanupEventListeners();

		this.#canvas = canvas;
		this.#canvas.setAttribute("tabindex", "0");
		this.#context = this.#canvas?.getContext("2d");


		if (this.#canvas)
		{
			/**
			 * 
			 * @param {KeyboardEvent} e 
			 */
			let windowOnKeydown = e =>
			{
				if (e.repeat)
					return;
				if (e.key === "Escape")
				{
					if (this.#startElement instanceof LogicGate)
					{
						for (let [gate, info] of this.#selectedInfo)
						{
							gate.rect.center = info.startPosition;
							delete info.startPosition;
						}
					}
					cleanup();
				}
			};
			/**
			 * 
			 * @param {MouseEvent} e 
			 */
			let windowOnMove = e =>
			{
				this.#updatePressed(e);

				this.#mouseCurrent = this.#getMousePos(e);
				let pos = this.projectToCircuit(this.#mouseCurrent);
				if (!this.#dragging && this.#mouseCurrent.copy().sub(this.#mouseStart).getLength() > 5)
				{
					if (this.#startElement instanceof LogicGate)
					{
						if (!this.#selectedInfo.has(this.#startElement))
						{
							this.#selectedInfo.clear();
							this.#selectedInfo.set(this.#startElement, {});
						}
						for (let [gate, info] of this.#selectedInfo)
						{
							info.startPosition = gate.rect.center.copy();
						}
					}
					this.#dragging = true;
					this.#noClick = true;
				}
				if (this.#dragging)
				{
					if (this.#startElement instanceof LogicGate)
					{
						for (let [gate, info] of this.#selectedInfo)
						{
							gate.rect.center.set().add(info.startPosition).add(pos).sub(this.projectToCircuit(this.#mouseStart)).round();
						}
					}
					else if (this.#startElement)
					{
						for (let i = this.#temporaryShownConnectors.length - 1; i >= 0; i--)
						{
							let list = this.#temporaryShownConnectors[i];
							while (list.length > 1)
							{
								let top = list[list.length - 2];
								let dist = top.getPosition().copy().sub(pos).getLength();
								if (dist > 5)
								{
									list.pop();
									top.hideAdditionalSubConnectors();
								}
								else
								{
									break;
								}
							}
							if (list.length <= 1)
								this.#temporaryShownConnectors.splice(i, 1);
						}
						/**
						 * 
						 * @param {LogicConnector} connector 
						 */
						let showConnectorsInRange = connector =>
						{
							let list = this.#temporaryShownConnectors.find(l => l[0] === connector);
							let isNew = !list;
							if (isNew)
								list = [connector];
							let current = list[list.length - 1];
							while (current)
							{
								let dist = current.getPosition().copy().sub(pos).getLength();
								if (dist < 10 && (current.interface.type === "any" || current.interface.type === "rest"))
								{
									let con = current.showAdditionalSubConnector();
									list.push(con);
									current = con;
								}
								else
								{
									current = undefined;
								}
							}
							if (list.length > 1 && isNew)
								this.#temporaryShownConnectors.push(list);
							for (let con of connector.subConnectors)
							{
								if (con !== list[1])
									showConnectorsInRange(con);
							}
						};
						for (let gate of this.circuit.gates)
						{
							showConnectorsInRange(gate.inputConnector);
							showConnectorsInRange(gate.outputConnector);
						}
					}
					else if (decodeMouseButtonsPressed(e.buttons).includes("left"))
					{
						this.#selectionArea = Rect.createContaining([this.projectToCircuit(this.#mouseStart), pos]);
						this.#temporarySelected = [];
						for (let gate of this.circuit.gates)
						{
							if (this.#selectionArea.contains(gate.rect.center))
							{
								this.#temporarySelected.push(gate);
							}
						}
					}
					else if (decodeMouseButtonsPressed(e.buttons).includes("middle"))
					{
						this.camera.position.add(new Vec2(e.movementX, e.movementY).div(-this.getScale()));
					}
					this.requestRedraw();
				}
			};
			/**
			 * 
			 * @param {MouseEvent} e 
			 */
			let windowOnUp = e =>
			{
				this.#updatePressed(e);
				this.#mouseCurrent = this.#getMousePos(e);
				if (!this.#startElement)
				{
					for (let gate of this.circuit.gates)
					{
						let selected = this.#isSelected(gate);
						let inSelectionList = this.#selectedInfo.has(gate);
						if (selected && !inSelectionList)
							this.#selectedInfo.set(gate, {});
						else if (!selected && inSelectionList)
							this.#selectedInfo.delete(gate);
					}
				}
				else if (this.#startElement instanceof LogicGate)
				{

				}
				else if (this.#startElement instanceof Object)
				{
					/**
					 * @type {{connector: LogicConnector, path: string, gate: LogicGate}}
					 */
					let to;
					for (let gate of this.circuit.gates)
					{
						let connector = gate.getConnectorAtPos(this.projectToCircuit(this.#mouseCurrent));
						if (connector && connector.connector.input !== this.#startElement.connector.input)
						{
							to = connector;
							break;
						}
					}
					if (to)
					{
						let from = this.#startElement;
						if (this.#startElement.connector.input)
							[from, to] = [to, from];
						if (to.connector.canConnect(from.connector.interface))
						{
							try
							{
								this.circuit.add(new LogicConnection(from, to));
							}
							catch (e)
							{

							}
						}
					}

					for (let i = this.#temporaryShownConnectors.length - 1; i >= 0; i--)
					{
						let list = this.#temporaryShownConnectors[i];
						while (list.length > 1)
						{
							let top = list[list.length - 2];
							list.pop();
							top.hideAdditionalSubConnectors();
						}
						this.#temporaryShownConnectors.splice(i, 1);
					}
				}
				cleanup();
			};
			let cleanup = () =>
			{
				window.removeEventListener("mousemove", windowOnMove);
				window.removeEventListener("mouseup", windowOnUp);
				window.removeEventListener("keydown", windowOnKeydown);
				this.#mousedown = false;
				this.#dragging = false;
				this.#startElement = null;
				this.#selectionArea = undefined;
				this.#temporarySelected = [];
				this.requestRedraw();
			};
			let click = e => 
			{
				if (this.#noClick)
					return;
				let mousePos = this.#getMousePos(e);
				let clickedGate;
				for (let gate of this.circuit.gates)
				{
					if (gate.contains(this.projectToCircuit(mousePos)))
					{
						clickedGate = gate;
						break;
					}
				}
				if (clickedGate && clickedGate.handleClick())
				{

				}
				else if (clickedGate)
				{
					let isSelected = this.#selectedInfo.has(clickedGate);
					if (e.ctrlKey)
					{
						if (isSelected)
							this.#selectedInfo.delete(clickedGate);
						else
							this.#selectedInfo.set(clickedGate, {});
					}
					else
					{
						this.#selectedInfo.clear();
						this.#selectedInfo.set(clickedGate, {});
					}
				}
				else
				{
					this.#selectedInfo.clear();
				}
				this.requestRedraw();
			};
			let mousedown = e =>
			{
				this.#noClick = false;
				this.#updatePressed(e);
				window.addEventListener("mousemove", windowOnMove);
				window.addEventListener("mouseup", windowOnUp);
				window.addEventListener("keydown", windowOnKeydown);
				this.#mousedown = true;
				this.#mouseStart = this.#getMousePos(e);
				this.#mouseCurrent = this.#mouseStart;
				for (let gate of this.circuit.gates)
				{
					let connector = gate.getConnectorAtPos(this.projectToCircuit(this.#mouseStart));
					if (connector)
					{
						this.#startElement = connector;
						break;
					}
				}
				if (this.#startElement && !(this.#startElement instanceof LogicGate))
				{
					if (this.#startElement.connector.input && this.#startElement.connector.hasConnection())
					{
						this.#startElement.connector.disconnectAll();
						this.#startElement = undefined;
					}
				}
				else
				{
					for (let gate of this.circuit.gates)
					{
						if (gate.contains(this.projectToCircuit(this.#mouseStart)))
						{
							this.#startElement = gate;
							break;
						}
					}
				}
			};
			let mousemove = e =>
			{
				this.#mouseCurrent = this.#getMousePos(e);
			};
			/**
			 * 
			 * @param {KeyboardEvent} e 
			 */
			let keydown = async e =>
			{
				if (e.key === "Enter")
				{

					let gateType = this.#search.text;
					if (!this.circuit.gateDescriptions[gateType])
						gateType = Object.keys(this.circuit.gateDescriptions).find(name => name.startsWith(this.#search.text));
					if (this.circuit.gateDescriptions[gateType])
					{
						if (e.ctrlKey && this.circuit.gateDescriptions[gateType].circuit)
						{
							this.circuit.createFromDescription(this.circuit.gateDescriptions[gateType].circuit, this.#search.position.round());
						}
						else
						{
							let gate = this.circuit.createGate(gateType);
							gate.rect.center.set(this.#search.position);
						}
					}
					this.#search.text = "";
				}
				if (e.ctrlKey)
				{
					if (e.key === "c")
					{
						navigator.clipboard.writeText(this.stringifySelection());
					}
					else if (e.key === "v")
					{
						try
						{
							let pasted = await getPaste();
							let gates = this.circuit.insertStringified(pasted);
							this.#selectedInfo.clear();
							for (let gate of Object.values(gates))
								this.#selectedInfo.set(gate, {});
						}
						catch (e)
						{
							alert("The text in the clipboard does not appear to be a valid circuit description.");
						}
					}
					else if (e.key === "s")
					{
						e.preventDefault();
						this.save();
					}
				}
				else
				{
					if (this.#search.text === "")
						this.#search.position = this.projectToCircuit(this.#mouseCurrent).round();
					if (e.key === "Backspace")
						this.#search.text = this.#search.text.substr(0, this.#search.text.length - 1);
					else if (e.key === "Escape")
						this.#search.text = "";
					else if (e.key === "Delete")
						this.deleteSelected();
					else if (e.key.length === 1)
						this.#search.text += e.key;
				}
				this.requestRedraw();
			};
			/**
			 * 
			 * @param {WheelEvent} e 
			 */
			let scroll = e =>
			{
				let amount = (e.deltaMode === 0 ? 1 / 100 : e.deltaMode === 1 ? 1 / 3 : 1) * -e.deltaY;
				let mousePos = this.#getMousePos(e);
				let circuitPos = this.projectToCircuit(mousePos);
				this.camera.zoom += amount;
				let newCircuitPos = this.projectToCircuit(mousePos);
				this.camera.position.sub(newCircuitPos).add(circuitPos);
				this.requestRedraw();
			};

			this.#canvas.addEventListener("click", click);
			this.#canvas.addEventListener("mousedown", mousedown);
			this.#canvas.addEventListener("keydown", keydown);
			this.#canvas.addEventListener("mousemove", mousemove);
			this.#canvas.addEventListener("wheel", scroll, { passive: true });

			this.#cleanupEventListeners = () =>
			{
				cleanup();
				this.#canvas.removeEventListener("click", click);
				this.#canvas.removeEventListener("mousedown", mousedown);
				this.#canvas.removeEventListener("keydown", keydown);
				this.#canvas.removeEventListener("mousemove", mousemove);
				this.#canvas.removeEventListener("wheel", scroll);
			};
		}
	}

	deleteSelected()
	{
		if (this.#selectedInfo.size > 0)
		{
			for (let [gate] of this.#selectedInfo)
				this.circuit.remove(gate);
			this.#selectedInfo.clear();
		}
	}

	#isSelected(gate)
	{
		if (!this.#selectionArea)
			return this.#selectedInfo.has(gate);
		if (!this.#ctrlPressed)
			return this.#temporarySelected.includes(gate);
		if (!this.#shiftPressed)
			return this.#selectedInfo.has(gate) || this.#temporarySelected.includes(gate);
		return this.#selectedInfo.has(gate) && !this.#temporarySelected.includes(gate);
	}
	stringifySelection()
	{
		return this.circuit.toString(Array.from(this.#selectedInfo.keys()));
	}
	update()
	{
		this.circuit.update();
		this.requestRedraw();
	}

	requestRedraw()
	{
		if (this.#redrawRequested)
			return;
		window.requestAnimationFrame(() => this.draw());
		this.#redrawRequested = true;
	}
	draw()
	{
		if (!this.#canvas)
			return;
		this.#context.resetTransform();
		this.#context.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
		this.#context.translate(this.#canvas.width / 2, this.#canvas.height / 2);
		let s = this.projectScale(1);
		this.#context.scale(s, s);
		this.#context.translate(-this.camera.position.x, -this.camera.position.y);
		for (let connection of this.circuit.connections)
			connection.draw({ context: this.#context });
		if (this.#startElement && !(this.#startElement instanceof LogicGate))
		{
			/**
			 * @type {LogicConnector|Vec2}
			 */
			let from = this.#startElement.connector;
			/**
			 * @type {LogicConnector|Vec2}
			 */
			let to = this.projectToCircuit(this.#mouseCurrent);
			if (this.#startElement.connector.input)
				[from, to] = [to, from];
			LogicConnection.drawConnection(this.#context, this.#startElement.connector.interface, from, to);
		}
		for (let gate of this.circuit.gates)
		{
			gate.selected = this.#isSelected(gate);
			gate.draw({ context: this.#context });
		}
		if (this.#selectionArea)
		{
			this.#context.fillStyle = "hsla(220, 100%, 70%, 0.5)";
			this.#context.fillRect(this.#selectionArea.left, this.#selectionArea.top, this.#selectionArea.width, this.#selectionArea.height);
		}


		if (this.#search.text)
		{
			let completion = this.#search.text;
			if (!this.circuit.gateDescriptions[completion])
				completion = Object.keys(this.circuit.gateDescriptions).find(name => name.startsWith(this.#search.text));
			this.#context.font = "1px Arial";
			this.#context.textAlign = "center";
			this.#context.textBaseline = "middle";
			if (completion)
			{
				let firstWidth = this.#context.measureText(this.#search.text).width;
				let completionText = completion.substring(this.#search.text.length, completion.length);
				let secondWidth = this.#context.measureText(completionText).width;
				this.#context.fillStyle = "hsl(0, 0%, 100%)";
				this.#context.fillText(this.#search.text, this.#search.position.x - secondWidth / 2, this.#search.position.y);
				this.#context.fillStyle = "hsl(0, 0%, 50%)";
				this.#context.fillText(completionText, this.#search.position.x + firstWidth / 2, this.#search.position.y);
			}
			else
			{
				this.#context.fillStyle = "hsl(0, 100%, 70%)";
				this.#context.fillText(this.#search.text, this.#search.position.x, this.#search.position.y);
			}
		}


		this.#redrawRequested = false;
	}


	async save()
	{
		if (!this.#fileHandle)
		{
			this.#fileHandle = await window.showSaveFilePicker({
				types: [
					{
						description: "JSON",
						accept: {
							"application/json": [".json"]
						}
					}
				]
			});
		}
		console.log(this.#fileHandle);
		await writeTo(this.#fileHandle, this.circuit.toString());
	}
}

/**
 * 
 * @param {FileSystemFileHandle} fileHandle 
 * @param {string} content 
 */
async function writeTo(fileHandle, content)
{
	/**
	 * @type {FileSystemWriteableFileStream}
	 */
	let writeable = await fileHandle.createWritable();
	await writeable.write(content);
	await writeable.close();
}
/**
 * 
 * @param {FileSystemFileHandle} fileHandle 
 */
async function readFrom(fileHandle)
{
	/**
	 * @type {File}
	 */
	let file = await fileHandle.getFile();
	return await file.text()
}


/**
 * 
 * @param {number} code 
 * @returns 
 */
function decodeMouseButtonsPressed(code)
{
	let buttons = ["left", "right", "middle", "4th", "5th"];
	let pressed = [];
	for (let i = 0; i < buttons.length; i++)
		if ((code >> i) & 1)
			pressed.push(buttons[i]);
	return pressed;
}

async function getPaste()
{
	let focusedElement = document.activeElement;
	let input = document.createElement("textarea");
	input.style.position = "fixed";
	input.style.opacity = "0";
	input.style.pointerEvents = "none";
	document.body.appendChild(input);
	input.focus();
	return new Promise(resolve =>
	{
		setTimeout(() =>
		{
			let text = input.value;
			document.body.removeChild(input);
			if (focusedElement instanceof HTMLElement)
				focusedElement.focus();
			console.log(document.activeElement)
			resolve(text);
		}, 1);
	});
}