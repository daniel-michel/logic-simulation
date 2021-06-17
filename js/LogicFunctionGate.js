import LogicGate from "./LogicGate.js";
import Vec2 from "./math/Vec2.js";


export default class LogicFunctionGate extends LogicGate
{
	/**
	 * @type {import("./LogicGate.js").GateLogic}
	 */
	logic;
	/**
	 *
	 * @param {import("./LogicGate.js").IO} interf
	 * @param {string} name
	 * @param {string} type
	 * @param {Vec2} pos
	 * @param {(() => ((input: import("./LogicGate.js").IOValue) => import("./LogicGate.js").IOValue) | import("./LogicGate.js").GateLogic) | string} logicObj
	 */
	constructor(interf, name, type, pos, logicObj)
	{
		super(interf, name, type, pos);
		this.#initiateLogic(logicObj);
	}

	async #initiateLogic(logicObj)
	{
		try
		{
			//@ts-ignore
			let func = typeof logicObj === "string" ? new (async () => { }).constructor(logicObj) : logicObj;
			let logic = await func.apply(this, []);
			if (logic instanceof Function)
				this.logic = { logic };
			else
				this.logic = logic;
		}
		catch (e)
		{
			this.error = { message: e.message };
		}
	}

	/**
	 * 
	 * @param {import("./LogicGate.js").DrawContext} context 
	 */
	customDraw(context)
	{
		if (this.logic?.draw)
			this.logic.draw.apply(this, [context]);
		else
			super.customDraw(context);
	}
	handleClick(e)
	{
		if (this.logic?.onclick)
		{
			this.logic.onclick(e);
			return true;
		}
		return false;
	}

	update()
	{
		if (!this.logic?.logic)
		{
			if (!this.error)
				this.error = { message: "not loaded" };
			return;
		}
		try
		{
			let value = this.inputConnector.getValue();
			let results = this.logic.logic(value);
			if (this.outputConnector.interface.type !== "none")
				this.outputConnector.setValue(results);
			this.error = undefined;
		}
		catch (e)
		{
			this.error = { message: e.message };
		}
	}
}
