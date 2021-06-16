import LogicConnection from "./LogicConnection.js";
import Vec2 from "./math/Vec2.js";
import LogicGate from "./LogicGate.js";



export default class LogicConnector
{
	/**
	 * @type {import("./LogicGate.js").IOInterface}
	 */
	interface;
	/**
	 * @type {boolean}
	 */
	input;
	/**
	 * @type {LogicConnection[]}
	 */
	connections = [];
	/**
	 * @type {LogicConnector[]}
	 */
	subConnectors = [];
	/**
	 * @type {Vec2}
	 */
	size = new Vec2();
	numBits = 1;
	connectorRadius = 0;
	margin = 0.5;
	subConnectorOffset = 2;
	/**
	 * @type {LogicConnector}
	 */
	parent;
	/**
	 * @type {() => Vec2}
	 */
	#requestPosition;
	/**
	 *
	 * @param {import("./LogicGate.js").IOInterface | string} interf
	 * @param {boolean} input
	 * @param {() => Vec2} requestPosition
	 */
	constructor(interf, input, requestPosition, parent = null)
	{
		this.parent = parent;
		this.interface = typeof interf === "string" ? LogicGate.interfaceFromString(interf) : interf;
		this.input = input;
		this.#requestPosition = requestPosition;
		if (this.interface.type === "collection")
			for (let i = 0; i < this.interface.children.length; i++)
				this.#addSubConnector(i);
		this.updateLayout();
	}
	/**
	 * 
	 * @param {number} index 
	 */
	//@ts-ignore
	#addSubConnector(index)
	{
		if (index < 0)
			throw new Error(`The index ${index} is invalid.`);
		/**
		 * @type {import("./LogicGate.js").IOInterface}
		 */
		let interf;
		if (this.interface.type === "any")
			interf = { type: "any" };
		else if (this.interface.type === "collection")
		{
			if (index >= this.interface.children.length)
				throw new Error(`This connector (${LogicGate.interfaceToString(this.interface)}) should have ${this.interface.children.length} subconnectors. The index ${index} is to big.`);
			interf = this.interface.children[index];
		}
		else if (this.interface.type === "rest")
			interf = this.interface.interface;
		else
			throw new Error(`Cannot add a subconnector for connector of type ${LogicGate.interfaceToString(this.interface)}`);
		let connector = new LogicConnector(interf, this.input, () => this.determinePosition(connector), this);
		this.subConnectors[index] = connector;
		return connector;
	}
	//@ts-ignore
	#getNumBits()
	{
		let num = this.subConnectors.reduce((acc, c) => acc + c.numBits, 0);
		if (this.interface.type === "any")
		{
			if (this.subConnectors.length === 0)
				num++;
		}
		else if (this.interface.type === "bit")
			num++;
		else if (this.interface.type === "rest")
			num++;
		return num;
	}
	updateLayout()
	{
		this.numBits = this.#getNumBits();
		this.connectorRadius = this.numBits ** (1 / 8) * 0.5;
		let height = 0;
		if (this.interface.type === "collection" || this.interface.type === "rest" || this.interface.type === "any")
			height = this.subConnectors.length * this.margin + this.subConnectors.reduce((acc, c) => acc + c.size.y, 0);
		height = Math.max(height, this.connectorRadius * 2);
		this.size.y = height;
		// if (this.parent)
		// 	this.parent.updateLayout();
	}
	/**
	 * 
	 * @param {import("./LogicGate.js").IOInterface} interf 
	 */
	updateInterface(interf)
	{
		if (interf.type === "collection")
		{
			for (let i = 0; i < Math.max(interf.children.length, this.subConnectors.length); i++)
			{
				if (i >= interf.children.length)
				{
					delete this.subConnectors[i];
				}
				else if (i >= this.subConnectors.length || !this.subConnectors[i])
				{
					let connector = new LogicConnector(interf.children[i], this.input, () => this.determinePosition(connector), this);
					this.subConnectors[i] = connector;
				}
				else
				{
					this.subConnectors[i].updateInterface(interf.children[i]);
				}
			}
		}
		if (interf.type !== this.interface.type)
		{
			//TODO
		}
		else
		{
			if (interf.type === "collection")
			{

			}
		}
		this.interface = interf;
		this.updateLayout();
	}
	/**
	 *
	 * @param {LogicConnector} child
	 */
	determinePosition(child)
	{
		let offset = -this.size.y / 2 + this.margin / 2;
		for (let connector of this.subConnectors)
		{
			if (connector === child)
				return this.getPosition().copy().add(new Vec2((this.input ? -1 : 1) * this.subConnectorOffset, offset + connector.size.y / 2));
			if (connector)
				offset += connector.size.y;
			offset += this.margin;
		}
		return null;
	}
	/**
	 * @returns {Vec2}
	 */
	getPosition()
	{
		return this.#requestPosition();
	}

	/**
	 * 
	 * @param {Vec2} pos 
	 * @returns {{connector: LogicConnector, path: string}}
	 */
	getConnectorAt(pos)
	{
		if (pos.copy().sub(this.getPosition()).getLength() < this.connectorRadius)
			return { connector: this, path: "" };
		if (this.showSubConnectors())
		{
			for (let i = 0; i < this.subConnectors.length; i++)
			{
				let conn = this.subConnectors[i].getConnectorAt(pos);
				if (conn)
				{
					conn.path = `${i}/${conn.path}`;
					return conn;
				}
			}
		}
		return null;
	}
	/**
	 *
	 * @param {import("./LogicGate.js").DrawContext} world
	 */
	draw(world)
	{
		if (this.showSubConnectors())
		{
			let offset = -this.size.y / 2 + this.margin / 2;
			for (let connector of this.subConnectors)
			{
				if (connector) // && connector.isShown()
				{
					let position = new Vec2((this.input ? -1 : 1) * this.subConnectorOffset, offset + connector.size.y / 2);
					world.context.strokeStyle = "hsl(0, 0%, 60%)";

					// LogicConnection.drawParallelConnectionInterface(world.context, connector.interface, [new Vec2(0, 0), new Vec2(0, position.y), position], connector.connectorRadius);
					// LogicConnection.drawParallelConnectionInterface(world.context, connector.interface, [new Vec2(0, 0), new Vec2(0, position.y), position].reverse(), connector.connectorRadius);

					let drawn = false;
					let points = [new Vec2(0, 0), new Vec2(0, position.y), position];
					if (this.input)
						points.reverse();
					if (connector.hasValue())
					{
						try
						{
							LogicConnection.drawParallelConnections(world.context, connector.getValue(), points, connector.connectorRadius * 1.8,
								"hsla(240, 40%, 60%, 1)", "hsla(0, 40%, 60%, 1)");
							drawn = true;
						}
						catch (e) 
						{

						}
					}
					if (!drawn)
						LogicConnection.drawParallelConnectionInterface(world.context, connector.interface, points, connector.connectorRadius * 1.8);
					// world.context.beginPath();
					// world.context.moveTo(0, 0);
					// world.context.quadraticCurveTo(0, position.y, position.x, position.y);
					// world.context.quadraticCurveTo(position.x, 0, position.x, position.y);
					// world.context.stroke();
					world.context.save();
					world.context.translate(position.x, position.y);
					connector.draw(world);
					world.context.restore();
					// console.log(connector.size.y);
					offset += connector.size.y;
				}
				offset += this.margin;
			}
		}

		world.context.fillStyle = "hsl(0, 0%, 30%)";
		world.context.beginPath();
		world.context.arc(0, 0, this.connectorRadius, 0, 2 * Math.PI);
		world.context.closePath();
		world.context.fill();
		if (this.interface.name)
		{
			world.context.textAlign = "center";
			world.context.textBaseline = "middle";
			world.context.font = `${this.connectorRadius * 1.5}px Arial`;
			world.context.fillStyle = "hsl(0, 0%, 80%)";
			world.context.fillText(this.interface.name, 0, 0);
		}
	}

	/**
	 * 
	 * @returns {import("./LogicGate.js").IOInterface}
	 */
	getTypeFromCurrentConnection()
	{
		if (this.interface.type === "bit" || this.interface.type === "none")
			return this.interface;
		if (this.interface.type === "collection" || this.interface.type === "rest" || this.interface.type === "any")
		{
			if (this.connections.length > 0)
				return this.connections[0].getCurrentType();
			else if (this.subConnectors.length > 0)
				return { type: "collection", children: this.subConnectors.map(connector => connector.getTypeFromCurrentConnection()) };
			else
				return { type: "none" };
		}
		throw new Error(`The type of this interface is invalid.`);
	}

	/**
	 * 
	 * @returns {LogicConnector}
	 */
	showAdditionalSubConnector()
	{
		if (this.interface.type === "any" || this.interface.type === "rest")
		{
			let connector = this.#addSubConnector(this.subConnectors.length);
			this.updateLayout()
			return connector;
		}
		else
		{
			throw new Error(`The connector of type ${LogicGate.interfaceToString(this.interface)} cannot show an additional subconnector.`);
		}
	}
	hideAdditionalSubConnectors()
	{
		if (this.interface.type === "any" || this.interface.type === "rest")
		{
			for (let i = this.subConnectors.length - 1; i >= 0; i--)
			{
				if (!this.subConnectors[i].hasConnection())
				{
					this.subConnectors.splice(i, 1);
				}
			}
			this.updateLayout();
		}
		else
		{
			throw new Error(`The connector of type ${LogicGate.interfaceToString(this.interface)} cannot hide additional subconnectors.`);
		}
	}

	canConnect(interf)
	{
		return LogicGate.interfaceMatch(this.interface, interf);
	}
	canConnectToSubConnector(interf)
	{
		return LogicGate.interfaceMatchesSubInterface(interf, this.interface);
	}
	hasConnection()
	{
		return this.connections.length > 0 || this.subConnectors.some(connector => connector.hasConnection());
	}
	isShown()
	{
		return this.connections.length > 0 || this.subConnectors.some(connector => connector.isShown());
	}
	showSubConnectors()
	{
		return (!this.input || true) || this.connections.length === 0;
	}
	hasValue()
	{
		return this.connections[0]?.lastValue || this.subConnectors.length > 0 && this.subConnectors.every(connector => connector.hasValue());
	}
	/**
	 *
	 * @returns {import("./LogicGate.js").IOValue}
	 */
	getValue()
	{
		// if (!this.input)
		// 	throw new Error("The value of the output connector cannot be read");
		if (this.connections[0]?.lastValue)
		{
			if (!LogicGate.valueMatchesInterface(this.connections[0].lastValue, this.interface))
				throw new Error(`The input value "${LogicGate.valueToString(this.connections[0].lastValue)}" is not of the expected format: "${LogicGate.interfaceToString(this.interface, false)}"`);
			return this.connections[0].lastValue;
		}
		/**
		 * @type {import("./LogicGate.js").IOValue}
		 */
		let value;
		if (this.interface.type === "bit")
		{
			value = { type: "bit", value: 0 };
		}
		else if (this.interface.type === "rest" || this.interface.type === "collection" || (this.interface.type === "any" && this.subConnectors.length > 0))
		{
			value = { type: "collection", children: [] };
			for (let i = 0; i < this.subConnectors.length; i++)
				value.children[i] = this.subConnectors[i].getValue();
		}
		else if (this.interface.type === "none" || this.interface.type === "any")
		{

		}
		else
		{
			throw new Error("Invalid interface type: " + this.interface.type);
		}
		return value;
	}
	/**
	 *
	 * @param {import("./LogicGate.js").IOValue} value
	 */
	setValue(value)
	{
		if (this.input)
			throw new Error("The value of the input connector cannot be set");
		if (!LogicGate.valueMatchesInterface(value, this.interface))
			throw new Error(`Invlaid value (does not match the interface). value: "${LogicGate.valueToString(value)}", interface: "${LogicGate.interfaceToString(this.interface, false)}"`);
		for (let connection of this.connections)
			connection.currentValue = value;
		if (value?.type === "collection")
			for (let i = 0; i < this.subConnectors.length; i++)
				if (this.subConnectors[i] && value.children[i])
					this.subConnectors[i].setValue(value.children[i]);
	}

	/**
	 * @param {number} index 
	 * @returns {import("./LogicGate.js").IOInterface | string}
	 */
	//@ts-ignore
	#getSubconnectorType(index = -1)
	{
		if (this.interface.type === "none" || this.interface.type === "bit")
			throw new Error(`A connector of type "${this.interface.type}" cannot habe any subconnectors.`);
		if (this.interface.type === "any")
			return "any";
		if (this.interface.type === "collection")
		{
			if (index < 0 || index >= this.interface.children.length)
				throw new Error(`This connector does not have a subconnector at index ${index}`);
			return this.interface.children[index];
		}
		return this.interface.interface;
	}
	/**
	 * 
	 * @param {LogicConnection} connection 
	 * @param {string} path 
	 * @returns {LogicConnector}
	 */
	connectTo(connection, path = "")
	{
		if (path === "")
			return this.connect(connection);
		else
		{
			if (this.interface.type === "none")
				throw new Error(`It is not possible to connect to a connector with interface type "none".`);
			else if (this.interface.type === "bit")
				throw new Error(`This connector is of the type "bit" there can't be a subconnection.`);
			else
			{
				let list = path.split("/");
				let first = list.shift();
				let num = parseInt(first);
				if (first === "*")
				{
					if (this.interface.type !== "any" && this.interface.type !== "rest")
						throw new Error(`Cannot connec to to any sub connector on connector of type ${this.interface.type}.`);
					let connector = this.#addSubConnector(this.subConnectors.length);
					this.updateLayout();
					return connector.connectTo(connection, list.join("/"));
				}
				else if (!isNaN(num))
				{
					let connector = this.subConnectors[num];
					if (!connector)
					{
						connector = this.#addSubConnector(num);
						this.updateLayout();
					}
					return connector.connectTo(connection, list.join("/"));
				}
				else
				{
					throw new Error(`Not able to do anything with the path ${path} on a connector with the interface ${this.interface}.`);
				}
			}
		}
	}

	/**
	 *
	 * @param {LogicConnection} connection
	 * @returns {LogicConnector}
	 */
	connect(connection)
	{
		if (!this.canConnect(connection.dataInterface))
		{
			throw new Error(`Interface missmatch. The type of the connector is "${LogicGate.interfaceToString(this.interface, false)}" but the connection is of the type "${LogicGate.interfaceToString(connection.dataInterface, false)}".`);
		}
		if (this.input && this.hasConnection())
			throw new Error("There can only be one input connection");
		this.connections.push(connection);
		return this;
	}
	disconnect(connection)
	{
		let index = this.connections.indexOf(connection);
		if (index < 0)
			throw new Error("The connection is not connected to this connector");
		this.connections.splice(index, 1);
	}

	disconnectAll()
	{
		let connection;
		while (connection = this.connections[0])
			connection.delete();
		// for (let i = this.connections.length - 1; i >= 0; i--)
		// 	this.connections[i].delete();
		for (let connector of this.subConnectors)
			connector.disconnectAll();
	}
}
