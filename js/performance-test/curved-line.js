import Vec2 from "../math/Vec2.js";

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
function calculatePointsOnCurveAccurat(points, maxError = 3, minSteps = 7)
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

function toString(obj)
{
	if (obj instanceof Array)
	{
		return `(${obj.length})[${obj.map(o => toString(o)).join(", ")}]`;
	}
	return obj + "";
}

function test(func, times, ...args)
{
	let result = func(...args);
	let resultText = toString(result);
	let maxLength = 100;
	if (resultText.length > maxLength)
		resultText = resultText.substr(0, maxLength - 3) + "...";
	console.log(`running: ${func.name}(${args.map(a => toString(a)).join(", ")}) => ${resultText}`)
	let label = `time`;
	console.time(label);
	for (let i = 0; i < times; i++)
	{
		func(...args);
	}
	console.timeEnd(label);
	console.log("");
}
console.log("");

test(calculatePointsOnCurve, 5000, [new Vec2(0, 0), new Vec2(100, 100), new Vec2(200, 0)], 50);
test(calculatePointsOnCurveAccurat, 5000, [new Vec2(0, 0), new Vec2(100, 100), new Vec2(200, 0)], 1, 10);

test(calculatePointsOnCurve, 5000, [new Vec2(0, 0), new Vec2(100, 200), new Vec2(200, 0)], 50);
test(calculatePointsOnCurveAccurat, 5000, [new Vec2(0, 0), new Vec2(100, 200), new Vec2(200, 0)], 1, 10);

test(calculatePointsOnCurve, 5000, [new Vec2(0, 0), new Vec2(100, 300), new Vec2(200, 0)], 50);
test(calculatePointsOnCurveAccurat, 5000, [new Vec2(0, 0), new Vec2(100, 300), new Vec2(200, 0)], 0.4, 10);