
export default class Vec2
{
	x = 0;
	y = 0;
	/**
	 * 
	 * @param {number|Vec2} [x] 
	 * @param {number} [y] 
	 */
	constructor(x = 0, y = 0)
	{
		if (x instanceof Vec2)
		{
			this.x = x.x;
			this.y = x.y;
		}
		else
		{
			this.x = x;
			this.y = y;
		}
	}
	toString()
	{
		return `(${this.x}, ${this.y})`;
	}

	getLength()
	{
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}
	getSquaredLength()
	{
		return this.x * this.x + this.y * this.y;
	}
	getHeading()
	{
		return Math.atan2(this.y, this.x);
	}

	round()
	{
		this.x = Math.round(this.x);
		this.y = Math.round(this.y);
		return this;
	}

	copy()
	{
		return new Vec2(this);
	}
	/**
	 * 
	 * @param {number | Vec2} x 
	 * @param {number} y 
	 */
	set(x = 0, y = 0)
	{
		if (x instanceof Vec2)
		{
			this.x = x.x;
			this.y = x.y;
		}
		else
		{
			this.x = x;
			this.y = y;
		}
		return this;
	}
	/**
	 * 
	 * @param {Vec2} vec 
	 */
	add(vec)
	{
		this.x += vec.x;
		this.y += vec.y;
		return this;
	}
	/**
	 *
	 * @param {Vec2} vec
	 */
	sub(vec)
	{
		this.x -= vec.x;
		this.y -= vec.y;
		return this;
	}
	/**
	 * 
	 * @param {number} s 
	 */
	mult(s)
	{
		this.x *= s;
		this.y *= s;
		return this;
	}
	/**
	 * 
	 * @param {number} s 
	 */
	div(s)
	{
		this.x /= s;
		this.y /= s;
		return this;
	}

	norm()
	{
		let len = this.getLength();
		this.x /= len;
		this.y /= len;
		return this;
	}


	rotate90DegRight()
	{
		[this.x, this.y] = [this.y, -this.x];
		return this;
	}
	rotate90DegLeft()
	{
		[this.x, this.y] = [-this.y, this.x];
		return this;
	}

	/**
	 * 
	 * @param {Vec2} a 
	 * @param {Vec2} b 
	 */
	static add(a, b)
	{
		return new Vec2(a.x + b.x, a.y + b.y);
	}
	/**
	 * 
	 * @param {Vec2} a 
	 * @param {Vec2} b 
	 */
	static sub(a, b)
	{
		return new Vec2(a.x - b.x, a.y - b.y);
	}
	/**
	 * 
	 * @param {Vec2} a 
	 * @param {number} s 
	 */
	static mult(a, s)
	{
		return new Vec2(a.x * s, a.y * s);
	}
	/**
	 *
	 * @param {Vec2} a
	 * @param {number} s
	 */
	static div(a, s)
	{
		return new Vec2(a.x / s, a.y / s);
	}
	/**
	 * 
	 * @param {Vec2} a 
	 * @param {Vec2} b 
	 */
	static dotProduct(a, b)
	{
		return a.x * b.x + a.y * b.y;
	}
}