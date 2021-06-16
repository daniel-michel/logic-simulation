import LogicConnector from "./LogicConnector.js";
import { drawBeveledRect, fillBeveledRect } from "./drawing.js";
// import LogicGateCircuit from "./LogicGateCircuit.js";
// import LogicGateFunction from "./LogicGateFunction.js";
import Rect from "./math/Rect.js";
import Vec2 from "./math/Vec2.js";

/**
 * @typedef {({name?: string} & ({type: "bit"} | {type: "collection", children: IOInterface[]} | {type: "rest", interface: IOInterface} | {type: "any"} | {type: "none"}))} IOInterface
 * @typedef {{input: IOInterface | string, output: IOInterface | string}} IO
 * 
 * @typedef {({name?: string} & ({type: "bit", value: number} | {type: "collection", children: IOValue[]}))} IOValue
 */
/**
 * @typedef {{context: CanvasRenderingContext2D}} DrawContext
 * 
 * @typedef {{logic: (input: IOValue) => IOValue, draw?: (con: DrawContext) => void, onclick?: (event: *) => void}} GateLogic
 * @typedef {{gates: {id: string, type: string, position?: {x: number, y: number}}[], connections: string[]}} LogicCircuitDescription
 * @typedef {{io: {input: string|IOInterface, output: string|IOInterface}, type?: string, function?: (() => GateLogic) | string, circuit?: LogicCircuitDescription}} GateDescription
 */

export default class LogicGate
{
	/**
	 * @type {IO}
	 */
	interface;
	/**
	 * @type {LogicConnector}
	 */
	inputConnector;
	/**
	 * @type {LogicConnector}
	 */
	outputConnector;
	name;
	type;
	rect = new Rect(new Vec2(), new Vec2());
	selected = false;
	error;
	/**
	 * 
	 * @param {IO} interf 
	 * @param {string} name 
	 * @param {Vec2} pos 
	 */
	constructor(interf, name = "undefined", type = "undefined", pos = new Vec2())
	{
		this.interface = interf;
		this.name = name;
		this.type = type;
		this.rect.center = pos;
		this.inputConnector = new LogicConnector(interf.input, true, () => this.rect.center.copy().sub(new Vec2(this.rect.halfSize.x)));
		this.outputConnector = new LogicConnector(interf.output, false, () => this.rect.center.copy().add(new Vec2(this.rect.halfSize.x)));
	}

	/**
	 * @abstract
	 */
	update()
	{
		throw new Error("This method has to be overwritten");
	}

	/**
	 * 
	 * @param {Vec2} pos 
	 */
	contains(pos)
	{
		return this.rect.contains(pos);
	}
	/**
	 * 
	 * @param {Vec2} pos 
	 * @returns {{connector: LogicConnector, path: string, gate: LogicGate}}
	 */
	getConnectorAtPos(pos)
	{
		for (let connector of [this.inputConnector, this.outputConnector])
		{
			let conn = connector.getConnectorAt(pos);
			if (conn)
				return { ...conn, gate: this };
		}
		return null;
	}

	/**
	 * 
	 * @param {DrawContext} world 
	 */
	draw({ context })
	{
		context.save();
		context.translate(this.rect.center.x, this.rect.center.y);

		this.customDraw({ context });

		if (this.selected)
			this.drawHighlight({ context });

		if (this.error)
		{
			context.textAlign = "center";
			context.textBaseline = "middle";
			context.font = "1px Consolas, monospace";
			context.fillStyle = "hsl(0, 100%, 80%)";
			context.fillText(this.error.message, 0, this.rect.halfSize.y + 12);
		}

		context.save();
		context.translate(-this.rect.halfSize.x, 0);
		this.inputConnector.draw({ context });
		context.restore();
		context.save();
		context.translate(this.rect.halfSize.x, 0);
		this.outputConnector.draw({ context });
		context.restore();
		context.restore();
	}
	/**
	 * 
	 * @param {DrawContext} world 
	 */
	customDraw({ context })
	{
		let fontSize = 1;
		context.font = `${fontSize}px Arial`;
		context.textAlign = "center";
		context.textBaseline = "middle";
		let width = context.measureText(this.name).width;
		let height = fontSize;
		this.rect.halfSize = new Vec2(width, height).div(2).add(new Vec2(0.5 * fontSize + (this.inputConnector.connectorRadius + this.outputConnector.connectorRadius) / 2, 0.4 * fontSize));

		this.drawBackground({ context });

		this.drawText({ context });
	}
	handleClick(e)
	{
		return false;
	}

	/**
	 *
	 * @param {DrawContext} world
	 */
	drawBackground({ context })
	{
		if (this.error)
			context.fillStyle = "hsl(0, 50%, 20%)";
		else
			context.fillStyle = "hsl(0, 0%, 18%)";
		fillBeveledRect(context, new Vec2(), this.rect.halfSize, 0.2);
	}
	/**
	 *
	 * @param {DrawContext} world
	 */
	drawText({ context })
	{
		context.fillStyle = "hsl(0, 0%, 100%)";
		context.fillText(this.name, (this.inputConnector.connectorRadius - this.outputConnector.connectorRadius) / 2, 0);
	}
	/**
	 *
	 * @param {DrawContext} world
	 */
	drawHighlight({ context })
	{
		context.strokeStyle = "hsl(200, 100%, 60%)";
		context.lineWidth = 0.1;
		drawBeveledRect(context, new Vec2(), this.rect.halfSize, 0.2);
	}


	static isCollectionMonotone(array)
	{
		let texts = array.map(item => this.interfaceToString(item, false));
		for (let i = 1; i < texts.length; i++)
			if (texts[i] !== texts[0])
				return false;
		return true;
	}


	/**
	 * 
	 * @param {IOInterface} a 
	 * @param {IOInterface} b 
	 * @return {IOInterface}
	 */
	static preciseInterface(a, b)
	{
		if (a.type === "any")
			return b;
		if (b.type === "any")
			return a;
		if (["bit", "none"].includes(a.type))
			return a;
		if (a.type === "collection" && b.type === "collection")
			return { type: "collection", children: a.children.map((childA, index) => this.preciseInterface(childA, b.children[index])) };
		if (a.type === "rest" && b.type === "collection")
			return { type: "collection", children: b.children.map(childB => this.preciseInterface(a.interface, childB)) };
		if (a.type === "collection" && b.type === "rest")
			return { type: "collection", children: a.children.map(childA => this.preciseInterface(childA, b.interface)) };
		if (a.type === "rest" && b.type === "rest")
			return { type: "rest", interface: this.preciseInterface(a.interface, b.interface) };
		throw new Error(`Could not merge the types "${LogicGate.interfaceToString(a)}" and "${LogicGate.interfaceToString(b)}".`);
	}
	/**
	 * 
	 * @param {IOInterface} a 
	 * @param {IOInterface} b 
	 * @returns {boolean}
	 */
	static interfaceMatch(a, b)
	{
		if (a.type === "any" || b.type === "any")
			return true;
		if (a.type === "collection" && this.isCollectionMonotone(a.children) && b.type === "rest")
			return this.interfaceMatch(a.children[0], b.interface);
		if (b.type === "collection" && this.isCollectionMonotone(b.children) && a.type === "rest")
			return this.interfaceMatch(a.interface, b.children[0]);
		if (a.type !== b.type)
			return false;
		if (a.type === "collection" && b.type === "collection")
		{
			if (a.children.length !== b.children.length)
				return false;
			for (let i = 0; i < a.children.length; i++)
				if (!this.interfaceMatch(a.children[i], b.children[i]))
					return false;
			return true;
		}
		if (a.type === "none")
			return true;
		if (a.type === "rest" && b.type === "rest")
			return this.interfaceMatch(a.interface, b.interface);
		if (a.type === "bit")
			return true;
		return false;
	}
	/**
	 * 
	 * @param {IOValue} value 
	 * @param {IOInterface} interf 
	 * @returns {boolean}
	 */
	static valueMatchesInterface(value, interf)
	{
		if (interf.type === "any")
			return true;
		if (interf.type === "bit")
			return value.type === "bit";
		if (interf.type === "collection")
			return value.type === "collection" && value.children.length === interf.children.length && value.children.every((value, i) => this.valueMatchesInterface(value, interf.children[i]));
		if (interf.type === "rest")
			return value.type === "collection" && value.children.every(value => this.valueMatchesInterface(value, interf.interface));
		if (interf.type === "none")
			throw new Error(`There is no value that matches the type "none".`);
		throw new Error(`Invalid type "${interf.type}".`);
	}
	/**
	 * 
	 * @param {IOInterface} interf 
	 * @param {IOInterface} match 
	 */
	static interfaceMatchesSubInterface(interf, match)
	{
		if (this.interfaceMatch(interf, match))
			return true;
		if (match.type === "bit")
			return false;
		if (match.type === "collection")
			return match.children.some(child => this.interfaceMatchesSubInterface(interf, child));
		if (match.type === "rest")
			return this.interfaceMatchesSubInterface(interf, match.interface);
		if (match.type === "none")
			return false;
		throw new Error("Invalid interface type: " + match.type);
	}

	/**
	 * 
	 * @param {string} string 
	 * @returns {IOInterface}
	 */
	static interfaceFromString(string)
	{
		// "[a:bit, b:bit, [bit, bit]]" "<[bit, bit],5>" "*" "<bit,*>" "none"
		let interf = {};

		// console.group("input", string);

		string = string.trim();

		let res = string.match(/^(?:([^\[\]\<\>]+?):)?(.+)$/);
		let [, name, type] = res;
		// console.log(string, res, { name, type });
		if (name)
			interf.name = name;
		type = type.trim();



		/**
		 * 
		 * @param {string} string 
		 * @returns {string[]}
		 */
		let seperateString = string =>
		{
			let stack = [];
			/**
			 * @type {string[]}
			 */
			let strings = [];
			let lastDivision = 0;
			let top = () => stack[stack.length - 1];
			for (let i = 0; i < string.length; i++)
			{
				let char = string[i];
				if (char === "[" || char === "<")
				{
					stack.push({ char, pos: i });
				}
				else if (char === ",")
				{
					if (stack.length === 0)
					{
						strings.push(string.substring(lastDivision, i));
						lastDivision = i + 1;
					}
				}
				else if (char === "]" || char === ">")
				{
					if (!top())
						throw new Error(`Unexpected closing parentheses at position ${i}.`);
					if (top().char === "[" && char === "]" || top().char === "<" && char === ">")
						stack.pop();
					else
						throw new Error(`Parentheses missmatch opended with "${top().char}" but closed with "${char}" at position ${i}.`);
				}
			}
			strings.push(string.substring(lastDivision, string.length));
			return strings;
		};


		if (type.startsWith("["))
		{
			if (!type.endsWith("]"))
				throw new Error(`A collection starting with "[" is expected to end with "]" but at the end "${type[type.length - 1]}" was found.`);
			let segments = seperateString(type.substring(1, type.length - 1));
			interf.type = "collection";
			interf.children = segments.map(segment => this.interfaceFromString(segment));
		}
		else if (type.startsWith("<"))
		{
			if (!type.endsWith(">"))
				throw new Error(`A collection/rest starting with "<" is expected to end with ">" but at the end "${type[type.length - 1]}" was found.`);
			let segments = seperateString(type.substring(1, type.length - 1));
			if (segments.length > 2 || segments.length === 0)
				throw new Error(`A collection/rest using "<" and ">" is expected to get an type and optionally an number like this: <type[, number|*]> but got ${segments.length} arguments.`);
			let childInterface = this.interfaceFromString(segments[0]);
			if (segments[1] && segments[1].trim() !== "*")
			{
				interf.type = "collection";
				interf.children = new Array(parseInt(segments[1])).fill(childInterface);
			}
			else
			{
				interf.type = "rest";
				interf.interface = childInterface;
			}
		}
		else if (type === "bit")
		{
			interf.type = "bit";
		}
		else if (type === "*" || type === "any")
		{
			interf.type = "any";
		}
		else if (type === "none")
		{
			interf.type = "none";
		}
		else
		{
			throw new Error(`The type "${type}" was not recognized.`);
		}

		// console.log(interf);
		// console.groupEnd();
		return interf;
	}

	/**
	 * 
	 * @param {IOInterface} interf 
	 * @returns {string}
	 */
	static interfaceToString(interf, includeName = true)
	{
		let text = "";
		if (interf.name && includeName)
			text += interf.name + ": ";
		if (interf.type === "none" || interf.type === "bit" || interf.type === "any")
			text += interf.type;
		else if (interf.type === "collection")
		{
			let items = interf.children.map(child => this.interfaceToString(child, includeName));
			if (items.length === 0)
			{
				text += "[]";
			}
			else
			{
				let same = true;
				for (let i = 1; i < items.length && same; i++)
					if (items[0] !== items[i])
						same = false;
				if (same)
					text += `<${items[0]}, ${items.length}>`;
				else
					text += `[${items.join(", ")}]`;
			}
		}
		else
		{
			text += `<${this.interfaceToString(interf.interface, includeName)}>`;
		}
		return text;
	}
	/**
	 * 
	 * @param {IOValue} value 
	 * @returns {string}
	 */
	static valueToString(value, includeName = true)
	{
		if (!value)
			return "invalid";
		let text = "";
		if (value.name && includeName)
			text += value.name + ": ";
		if (value.type === "bit")
			text += value.value;
		else if (value.type === "collection")
		{
			let items = value.children.map(child => this.valueToString(child, includeName));
			if (items.length === 0)
			{
				text += "[]";
			}
			else
			{
				let same = true;
				for (let i = 1; i < items.length && same; i++)
					if (items[0] !== items[i])
						same = false;
				if (same)
					text += `<${items[0]}, ${items.length}>`;
				else
					text += `[${items.join(", ")}]`;
			}
		}
		return text;
	}
	/**
	 * 
	 * @param {string} string 
	 * @returns {IOValue}
	 */
	static valueFromString(string)
	{
		// "[a:bit, b:bit, [bit, bit]]" "<[bit, bit],5>" "*" "<bit,*>" "none"
		let value = {};

		// console.group("input", string);

		string = string.trim();

		let res = string.match(/^(?:([^\[\]\<\>]+?):)?(.+)$/);
		let [, name, type] = res;
		// console.log(string, res, { name, type });
		if (name)
			value.name = name;
		type = type.trim();



		/**
		 * 
		 * @param {string} string 
		 * @returns {string[]}
		 */
		let seperateString = string =>
		{
			let stack = [];
			/**
			 * @type {string[]}
			 */
			let strings = [];
			let lastDivision = 0;
			let top = () => stack[stack.length - 1];
			for (let i = 0; i < string.length; i++)
			{
				let char = string[i];
				if (char === "[" || char === "<")
				{
					stack.push({ char, pos: i });
				}
				else if (char === ",")
				{
					if (stack.length === 0)
					{
						strings.push(string.substring(lastDivision, i));
						lastDivision = i + 1;
					}
				}
				else if (char === "]" || char === ">")
				{
					if (!top())
						throw new Error(`Unexpected closing parentheses at position ${i}.`);
					if (top().char === "[" && char === "]" || top().char === "<" && char === ">")
						stack.pop();
					else
						throw new Error(`Parentheses missmatch opended with "${top().char}" but closed with "${char}" at position ${i}.`);
				}
			}
			strings.push(string.substring(lastDivision, string.length));
			return strings;
		};


		if (type.startsWith("["))
		{
			if (!type.endsWith("]"))
				throw new Error(`A collection starting with "[" is expected to end with "]" but at the end "${type[type.length - 1]}" was found.`);
			let segments = seperateString(type.substring(1, type.length - 1));
			value.type = "collection";
			value.children = segments.map(segment => this.valueFromString(segment));
		}
		else if (type.startsWith("<"))
		{
			if (!type.endsWith(">"))
				throw new Error(`A collection/rest starting with "<" is expected to end with ">" but at the end "${type[type.length - 1]}" was found.`);
			let segments = seperateString(type.substring(1, type.length - 1));
			if (segments.length > 2 || segments.length === 0)
				throw new Error(`A collection/rest using "<" and ">" is expected to get an type and optionally an number like this: <type[, number|*]> but got ${segments.length} arguments.`);
			let childInterface = this.valueFromString(segments[0]);
			if (segments[1] && segments[1].trim() !== "*")
			{
				value.type = "collection";
				value.children = new Array(parseInt(segments[1])).fill(childInterface);
			}
			else
			{
				throw new Error(`The "*" can only be used for types, not for values.`);
			}
		}
		else if (type === "0" || type === "1")
		{
			value.type = "bit";
			value.value = +type;
		}
		else if (type === "*" || type === "any")
		{
			value = undefined;
		}
		else if (type === "none")
		{
			value = undefined;
		}
		else
		{
			throw new Error(`The type "${type}" was not recognized.`);
		}

		// console.log(interf);
		// console.groupEnd();
		return value;
	}
}



// LogicGate.createInterface("[a:bit, b:bit, [bit, bit]]");
// LogicGate.createInterface("<[bit, bit],5>");
// LogicGate.createInterface("*");
// LogicGate.createInterface("<bit,*>");
// LogicGate.createInterface("none");
// LogicGate.createInterface("[none]");