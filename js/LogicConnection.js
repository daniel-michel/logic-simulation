import LogicConnector from "./LogicConnector.js";
import LogicGate from "./LogicGate.js";
import LogicCircuitGate from "./LogicCircuitGate.js";
import Vec2 from "./math/Vec2.js";


export default class LogicConnection
{
	/**
	 * @type {import("./LogicGate.js").IOInterface}
	 */
	dataInterface = LogicGate.interfaceFromString("any");
	fromGate;
	toGate;
	/**
	 * @type {LogicConnector}
	 */
	from;
	/**
	 * @type {LogicConnector}
	 */
	to;
	/**
	 * @type {import("./LogicGate.js").IOValue}
	 */
	currentValue;
	/**
	 * @type {import("./LogicGate.js").IOValue}
	 */
	lastValue;
	/**
	 * @type {(() => void)[]}
	 */
	onDeleteListeners = [];
	/**
	 * 
	 * @param {{gate: LogicGate, path: string, inside?: false} | {gate: LogicCircuitGate, path: string, inside: true}} from
	 * @param {{gate: LogicGate, path: string, inside?: false} | {gate: LogicCircuitGate, path: string, inside: true}} to
	 */
	constructor(from, to)
	{
		this.fromGate = from;
		this.toGate = to;

		this.from = (this.fromGate.inside ? this.fromGate.gate.innerInputConnector : this.fromGate.gate.outputConnector).connectTo(this, this.fromGate.path);
		this.dataInterface = this.from.interface;
		this.to = (this.toGate.inside ? this.toGate.gate.innerOutputConnector : this.toGate.gate.inputConnector).connectTo(this, this.toGate.path);
	}
	ondelete(callback)
	{
		this.onDeleteListeners.push(callback);
	}
	/**
	 * 
	 * @returns {import("./LogicGate.js").IOInterface}
	 */
	getCurrentType()
	{
		return LogicGate.preciseInterface(this.from.interface, this.to.interface);
	}

	update()
	{
		this.lastValue = this.currentValue;
	}
	/**
	 * 
	 * @param {import("./LogicGate.js").DrawContext} world 
	 */
	draw({ context })
	{
		if (!this.from || !this.to)
			return;
		let from = this.from.getPosition();
		let to = this.to.getPosition();
		if (!from || !to)
		{
			return;
		}
		// context.lineWidth = 0.2;
		let xDist = from.x - to.x + 7;
		if (xDist < 0)
			xDist = xDist * -0.8;
		let yDist = (Math.abs(from.y - to.y) * 0.5) ** (0.7);
		let offset = Math.sqrt(xDist * xDist + yDist * yDist) ** 0.8;
		if (this.currentValue)
			LogicConnection.drawParallelConnections(context, this.currentValue, [from, from.copy().add(new Vec2(offset, 0)), to.copy().sub(new Vec2(offset, 0)), to], this.from.connectorRadius * 1.8);
		else
			LogicConnection.drawParallelConnectionInterface(context, this.dataInterface, [from, from.copy().add(new Vec2(offset, 0)), to.copy().sub(new Vec2(offset, 0)), to], this.from.connectorRadius * 1.8);
	}

	delete()
	{
		this.from.disconnect(this);
		this.to.disconnect(this);
		this.from = undefined;
		this.to = undefined;
		this.onDeleteListeners.forEach(listener => listener());
		this.onDeleteListeners = [];
	}

	/**
	 * 
	 * @param {CanvasRenderingContext2D} context 
	 * @param {import("./LogicGate.js").IOValue|import("./LogicGate.js").IOInterface} value 
	 * @param {LogicConnector|Vec2} start 
	 * @param {LogicConnector|Vec2} end 
	 */
	static drawConnection(context, value, start, end)
	{
		/**
		 * 
		 * @param {import("./LogicGate.js").IOValue|import("./LogicGate.js").IOInterface} v 
		 * @returns {"value"|"interface"}
		 */
		let isValueOrInterface = v =>
		{
			if (v.type === "any" || v.type === "rest" || v.type === "none")
				return "interface";
			if (v.type === "bit")
				return v.hasOwnProperty("value") ? "value" : "interface";
			if (v.children.length > 0)
				return isValueOrInterface(v.children[0]);
			return "interface";
		};
		let valueType = isValueOrInterface(value);

		let maxWidth = 100;
		if (start instanceof LogicConnector)
			maxWidth = Math.min(start.connectorRadius * 1.8, maxWidth);
		if (end instanceof LogicConnector)
			maxWidth = Math.min(end.connectorRadius * 1.8, maxWidth);

		let from = start instanceof LogicConnector ? start.getPosition() : start;
		let to = end instanceof LogicConnector ? end.getPosition() : end;
		let xDist = from.x - to.x + 7;
		if (xDist < 0)
			xDist = xDist * -0.8;
		let yDist = (Math.abs(from.y - to.y) * 0.5) ** (0.7);
		let offset = Math.sqrt(xDist * xDist + yDist * yDist) ** 0.8;
		if (valueType === "value")
			LogicConnection.drawParallelConnections(context, value, [from, from.copy().add(new Vec2(offset, 0)), to.copy().sub(new Vec2(offset, 0)), to], maxWidth);
		else
			LogicConnection.drawParallelConnectionInterface(context, value, [from, from.copy().add(new Vec2(offset, 0)), to.copy().sub(new Vec2(offset, 0)), to], maxWidth);
	}

	/**
	 * 
	 * @param {CanvasRenderingContext2D} context 
	 * @param {import("./LogicGate.js").IOValue} value 
	 * @param {Vec2[]} points
	 * @param {number} maxWidth
	 */
	static drawParallelConnections(context, value, points, maxWidth, hightColor = "hsl(240, 100%, 70%)", lowColor = "hsl(0, 100%, 70%)")
	{
		/**
		 * 
		 * @param {import("./LogicGate.js").IOValue} value 
		 * @returns {ConnectionVisualization}
		 */
		let convertToVisualization = value =>
		{
			if (value?.type === "collection")
				return value.children.map(child => convertToVisualization(child));
			return value?.value ? hightColor : lowColor;
		};
		this.drawConnectionVisualization(context, convertToVisualization(value), points, maxWidth);
	}
	/**
	 * 
	 * @param {CanvasRenderingContext2D} context 
	 * @param {import("./LogicGate.js").IOInterface} interf 
	 * @param {Vec2[]} points 
	 * @param {number} maxWidth 
	 */
	static drawParallelConnectionInterface(context, interf, points, maxWidth)
	{
		/**
		 * 
		 * @param {import("./LogicGate.js").IOInterface} interf 
		 * @returns {ConnectionVisualization}
		 */
		let convertToVisualization = interf =>
		{
			if (interf.type === "collection")
				return interf.children.map(child => convertToVisualization(child));
			if (interf.type === "any")
				return { color: "hsl(0, 0%, 60%)", dash: [10, 3] };
			if (interf.type === "bit")
				return "hsl(0, 0%, 60%)";
			if (interf.type === "rest")
				return { color: "hsl(0, 0%, 60%)", dash: [3, 5] };
			return "hsl(0, 0%, 60%)";
		};
		this.drawConnectionVisualization(context, convertToVisualization(interf), points, maxWidth);
	}


	/**
	 * 
	 * @typedef {{[x: number]: string|{color: string, dash?: boolean}|ConnectionVisualization}|string|{color: string, dash?: number[]}} ConnectionVisualization
	 * 
	 * @param {CanvasRenderingContext2D} context 
	 * @param {ConnectionVisualization} value 
	 * @param {Vec2[]} points 
	 * @param {number} maxWidth 
	 * @param {string} label 
	 */
	static drawConnectionVisualization(context, value, points, maxWidth, label = "")
	{
		if (!value)
			return;
		let decrementFunction = (depth) => 1 / (depth ** (0.8));
		/**
		 * 
		 * @param {ConnectionVisualization} v 
		 */
		let getSpacing = (v, depth) =>
		{
			if (v instanceof Array)
				return (v.length - 1) * decrementFunction(depth) + v.reduce((acc, child) => acc + getSpacing(child, depth + 1), 0);
			return 0;
		};

		let totalSpacing = getSpacing(value, 1);
		let spaceDist = Math.min(totalSpacing > 0 ? maxWidth / totalSpacing : 0, 0.2);

		let curve = calculatePointsOnCurveAccurate(points);
		/**
		 * @type {{point: Vec2, right: Vec2}[]}
		 */
		let curveInfo = [];
		for (let i = 0; i < curve.length; i++)
		{
			let last = curve[i - 1];
			let current = curve[i];
			let next = curve[i + 1];
			let heading = new Vec2();
			if (last)
				heading.add(current).sub(last);
			if (next)
				heading.add(next).sub(current);
			heading.norm();
			let right = heading.copy().rotate90DegLeft(); // the function assumes the coordinate system to be cartesian but the y-axis ont he canvas is flipped so the rotation has to be flipped as well
			curveInfo.push({ point: current, right });
		}
		let middle = curveInfo[Math.floor(curveInfo.length / 2)];
		context.save();
		context.fillStyle = "white";
		context.font = "10px Arial";
		context.textAlign = "center";
		context.textBaseline = "bottom";
		context.translate(middle.point.x, middle.point.y);
		context.rotate(middle.right.getHeading() - Math.PI / 2);
		context.fillText(label + "", 0, -(spaceDist * totalSpacing / 2 + 5));
		context.restore();

		/**
		 * 
		 * @param {ConnectionVisualization} v 
		 * @param {number} offset 
		 * @returns {number}
		 */
		let drawSet = (v, offset, depth) =>
		{
			context.lineWidth = 0.1 * decrementFunction(depth);
			if (v instanceof Array)
			{
				for (let child of v)
				{
					offset = drawSet(child, offset, depth + 1);
					offset += spaceDist * decrementFunction(depth);
				}
				offset -= spaceDist * decrementFunction(depth);
			}
			else
			{
				context.save();
				if (typeof v === "string")
					v = { color: v };
				context.strokeStyle = v.color;
				if (v.dash)
					context.setLineDash(v.dash);
				context.beginPath();
				for (let point of curveInfo)
				{
					let pos = point.point.copy().add(point.right.copy().mult(offset));
					context.lineTo(pos.x, pos.y);
				}
				context.lineJoin = "round";
				context.stroke();
				context.restore();
			}
			return offset;
		};
		drawSet(value, -spaceDist * totalSpacing / 2, 1);
	}
}

/**
 * 
 * @param {Vec2[]} points 
 * @param {number} t 
 * @returns {Vec2}
 */
function interpolatePoints(points, t)
{
	let newPoints = [];
	for (let i = 0; i < points.length - 1; i++)
	{
		let p0 = points[i];
		let p1 = points[i + 1];
		let between = p0.copy().mult(1 - t).add(p1.copy().mult(t));
		newPoints.push(between);
	}
	if (newPoints.length > 1)
		return interpolatePoints(newPoints, t);
	return newPoints[0];
}

/**
 * 
 * @param {Vec2[]} points 
 * @param {number} steps
 * @returns {Vec2[]}
 */
function calculatePointsOnCurve(points, steps = 10)
{
	let curve = [];
	for (let i = 0; i < steps; i++)
	{
		let t = i / (steps - 1);
		curve.push(interpolatePoints(points, t));
	}
	return curve;
}

/**
 * 
 * @param {Vec2[]} points 
 * @param {number} minSteps
 * @returns {Vec2[]}
 */
function calculatePointsOnCurveAccurate(points, maxError = 0.01, minSteps = 10)
{
	/**
	 * @type {{pos: Vec2, t: number}[]}
	 */
	let curve = [];
	for (let i = 0; i < minSteps; i++)
	{
		let t = i / (minSteps - 1);
		curve.push({ pos: interpolatePoints(points, t), t });
	}
	let checkAccuracy = (from, to, depth = 0) =>
	{
		if (depth > 10)
		{
			console.warn("too deep");
			return;
		}
		if (to - from < 1)
			return;
		let first = new Vec2(), second = new Vec2();
		for (let i = to - 1; i >= from + 1; i--)
		{
			let prev = curve[i - 1];
			let curr = curve[i];
			let next = curve[i + 1];
			first.set(curr.pos).sub(prev.pos);
			second.set(next.pos).sub(curr.pos);
			let res = Vec2.dotProduct(first, second);
			if (res < Math.sqrt(first.getSquaredLength() * second.getSquaredLength()) - maxError)
			{
				let t0 = (prev.t + curr.t) / 2;
				let p0 = interpolatePoints(points, t0);

				let t1 = (curr.t + next.t) / 2;
				let p1 = interpolatePoints(points, t1);

				curve.splice(i + 1, 0, { pos: p1, t: t1 });
				curve.splice(i, 0, { pos: p0, t: t0 });
				checkAccuracy(i - 1, i + 3, depth + 1);
			}
		}
	};
	checkAccuracy(0, curve.length - 1);
	return curve.map(p => p.pos);
}