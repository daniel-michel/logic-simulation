import LogicConnection from "./LogicConnection.js";
import LogicGate from "./LogicGate.js";
import LogicConnector from "./LogicConnector.js";
import Vec2 from "./math/Vec2.js";
import LogicFunctionGate from "./LogicFunctionGate.js";

export default class LogicCircuitGate extends LogicGate
{
	/**
	 * @type {LogicGate[]}
	 */
	gates = [];
	/**
	 * @type {LogicConnection[]}
	 */
	connections = [];

	/**
	 * @type {LogicConnector}
	 */
	innerInputConnector;
	/**
	 * @type {LogicConnector}
	 */
	innerOutputConnector;

	/**
	 * @type {{[x: string]: import("./LogicGate.js").GateDescription}}
	 */
	gateDescriptions = {};

	constructor(name = "undefined", type = "undefined", pos = new Vec2())
	{
		super({ input: "any", output: "any" }, name, type, pos);

		this.innerInputConnector = new LogicConnector("any", false, () => new Vec2());
		this.innerOutputConnector = new LogicConnector("any", true, () => new Vec2());
	}

	updateConnectorTypes()
	{
		let inputType = this.innerInputConnector.getTypeFromCurrentConnection();
		this.innerInputConnector.updateInterface(inputType);
		this.inputConnector.updateInterface(inputType);
		let outputType = this.innerOutputConnector.getTypeFromCurrentConnection();
		this.innerOutputConnector.updateInterface(outputType);
		this.outputConnector.updateInterface(outputType);
	}
	/**
	 * 
	 * @param {{[x: string]: import("./LogicGate.js").GateDescription}} descriptions 
	 */
	loadGateDescriptions(descriptions)
	{
		Object.assign(this.gateDescriptions, descriptions);
	}
	/**
	 * 
	 * @param {string} type 
	 * @returns {LogicGate}
	 */
	createGate(type)
	{
		let gateDescription = this.gateDescriptions[type];
		if (!gateDescription)
			throw new Error(`No gate description of the type "${type}" could be found.`);
		let gate = LogicCircuitGate.gateFromDescription({ ...gateDescription, type }, type, this.gateDescriptions);
		gate.name = type;
		this.add(gate);
		return gate;
	}
	/**
	 * 
	 * @param {LogicGate | LogicConnection} element 
	 */
	add(element)
	{
		if (element instanceof LogicGate)
			this.gates.push(element);
		else if (element instanceof LogicConnection)
		{
			this.connections.push(element);
			element.ondelete(() =>
			{
				try
				{
					this.remove(element);
				}
				catch (e)
				{
					console.warn(element, "could not be removed, error:", e);
				}
			});
		}
		else
			throw new Error("The type of the item is unknown: " + element);
	}
	/**
	 *
	 * @param {LogicGate | LogicConnection} element
	 */
	remove(element)
	{
		if (element instanceof LogicGate)
		{
			let index = this.gates.indexOf(element);
			if (index >= 0)
			{
				let [gate] = this.gates.splice(index, 1);
				gate.inputConnector.disconnectAll();
				gate.outputConnector.disconnectAll();
			}
			else
				throw new Error("The gate is not in this circuit.");
		}
		else if (element instanceof LogicConnection)
		{
			let index = this.connections.indexOf(element);
			if (index >= 0)
				this.connections.splice(index, 1);
			else
				throw new Error("The connection is not in this circuit.");
		}
		else
			throw new Error("The type of the item is unknown: " + element);
	}
	update()
	{
		try
		{
			if (this.innerInputConnector.interface.type !== "none")
				this.innerInputConnector.setValue(this.inputConnector.getValue());
			for (let gate of this.gates)
				gate.update();
			for (let connection of this.connections)
				connection.update();
			if (this.outputConnector.interface.type !== "none")
				this.outputConnector.setValue(this.innerOutputConnector.getValue());
			this.error = undefined;
		}
		catch (e)
		{
			this.error = { message: e.message };
		}
	}

	toString(gatesToConvertToString = this.gates)
	{
		let idCount = 0;
		let ids = new Map();
		let gates = gatesToConvertToString.map(gate =>
		{
			let id = idCount++;
			ids.set(gate, id);
			return { type: gate.type, id: id + "", position: gate.rect.center };
		});
		let connections = this.connections.map(connection =>
		{
			let halfString = info =>
			{
				let id = ids.get(info.gate);
				if (info.path)
					return id + "/" + info.path;
				else
					return id;
			};
			if (!ids.has(connection.fromGate.gate) || !ids.has(connection.toGate.gate))
				return undefined;
			return `${halfString(connection.fromGate)}=>${halfString(connection.toGate)}` + (connection.lastValue ? ":" + LogicGate.valueToString(connection.lastValue) : "");
		}).filter(v => v);
		return JSON.stringify({ gates, connections }, null, "\t");
	}
	insertStringified(string)
	{
		let obj = JSON.parse(string);
		return this.createFromDescription(obj, new Vec2(1, 1));
	}

	/**
	 * 
	 * @param {import("./LogicGate.js").GateDescription} gateDescription
	 * @param {{[name: string]: import("./LogicGate.js").GateDescription}} gateDescriptions 
	 */
	static gateFromDescription(gateDescription, type, gateDescriptions = {})
	{
		if (!gateDescription.io)
			throw new Error("The io is not defined.");
		if (!gateDescription.circuit === !gateDescription.function)
			throw new Error("The circuit or function (not both) property has to be set.");
		if (gateDescription.function)
		{
			let gate = new LogicFunctionGate(gateDescription.io, gateDescription.type, type, new Vec2(), gateDescription.function);
			return gate;
		}
		else
		{
			let circuit = this.createFromDescription(gateDescription.circuit, type, gateDescriptions);
			if (gateDescription.io)
			{
				if (gateDescription.io.input)
				{
					let inputInterface = LogicGate.preciseInterface(LogicGate.interfaceFromString(gateDescription.io.input), circuit.innerInputConnector.interface);
					circuit.inputConnector.updateInterface(inputInterface);
					circuit.innerInputConnector.updateInterface(inputInterface);
				}
				if (gateDescription.io.output)
				{
					let outputInterface = LogicGate.preciseInterface(LogicGate.interfaceFromString(gateDescription.io.output), circuit.innerOutputConnector.interface);
					circuit.outputConnector.updateInterface(outputInterface);
					circuit.innerOutputConnector.updateInterface(outputInterface);
				}
			}
			return circuit;
		}
	}

	/**
	 * 
	 * @param {{gates: *[], connections: *[]}} description
	 * @param {string} type
	 * @param {{[name: string]: import("./LogicGate.js").GateDescription}} gateDescriptions
	 */
	static createFromDescription(description, type, gateDescriptions)
	{
		let circuit = new LogicCircuitGate(type, type);
		circuit.loadGateDescriptions(gateDescriptions);
		circuit.createFromDescription(description);
		return circuit;
	}

	/**
	 * 
	 * @param {{gates: *[], connections: *[]}} description
	 * @param {Vec2} offset
	 */
	createFromDescription(description, offset = new Vec2())
	{
		/**
		 * @type {{[x: string]: LogicGate}}
		 */
		let gates = {};
		for (let g of description.gates)
		{
			let gate = this.createGate(g.type);
			if (g.position)
				gate.rect.center = new Vec2(g.position.x, g.position.y);
			gate.rect.center.add(offset);
			gates[g.id] = gate;
		}
		for (let conn of description.connections)
		{
			let [, f, t, value] = conn.match(/^(.*?)=>(.*?)(?::(.*))?$/);
			let [fromID, ...fromPath] = f.split("/");
			let [toID, ...toPath] = t.split("/");
			let from = fromID === "outside" ? { gate: this, inside: true, path: fromPath.join("/") } : { gate: gates[fromID], path: fromPath.join("/") };
			let to = toID === "outside" ? { gate: this, inside: true, path: toPath.join("/") } : { gate: gates[toID], path: toPath.join("/") };
			let connection = new LogicConnection(from, to);
			if (value)
			{
				connection.currentValue = connection.lastValue = LogicGate.valueFromString(value);
			}
			this.add(connection);
		}
		this.updateConnectorTypes();
		return gates;
	}
}