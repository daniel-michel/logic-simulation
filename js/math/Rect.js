import Vec2 from "./Vec2.js";


export default class Rect
{
	/**
	 * @type {Vec2}
	 */
	center;
	/**
	 * @type {Vec2}
	 */
	halfSize;
	/**
	 * 
	 * @param {Vec2} center 
	 * @param {Vec2} halfSize 
	 */
	constructor(center, halfSize)
	{
		this.center = center;
		this.halfSize = halfSize;
	}
	get top()
	{
		return this.center.y - this.halfSize.y;
	}
	set top(v)
	{
		this.center.y = v + this.halfSize.y;
	}
	get bottom()
	{
		return this.center.y + this.halfSize.y;
	}
	set bottom(v)
	{
		this.center.y = v - this.halfSize.y;
	}
	get left()
	{
		return this.center.x - this.halfSize.x;
	}
	set left(v)
	{
		this.center.x = v + this.halfSize.x;
	}
	get right()
	{
		return this.center.x + this.halfSize.x;
	}
	set right(v)
	{
		this.center.x = v - this.halfSize.x;
	}
	get width()
	{
		return this.halfSize.x * 2;
	}
	set width(w)
	{
		this.halfSize.x = w * 0.5;
	}
	get height()
	{
		return this.halfSize.y * 2;
	}
	set height(h)
	{
		this.halfSize.y = h * 0.5;
	}

	/**
	 * 
	 * @param {Vec2} point 
	 */
	contains(point)
	{
		let relative = point.copy().sub(this.center);
		return Math.abs(relative.x) <= this.halfSize.x && Math.abs(relative.y) <= this.halfSize.y;
	}

	static createFromBounds(left, right, top, bottom)
	{
		return new Rect(new Vec2(left + right, top + bottom).div(2), new Vec2(right - left, bottom - top).div(2))
	}
	/**
	 * 
	 * @param {Vec2[]} points 
	 */
	static createContaining(points)
	{
		let left = Infinity;
		let right = -Infinity;
		let top = Infinity;
		let bottom = -Infinity;
		for (let {x, y} of points)
		{
			if (x < left)
				left = x;
			if (x > right)
				right = x;
			if (y < top)
				top = y;
			if (y > bottom)
				bottom = y;
		}
		return this.createFromBounds(left, right, top, bottom);
	}
}