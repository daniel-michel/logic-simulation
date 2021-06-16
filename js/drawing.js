import Vec2 from "./math/Vec2.js";

/**
 * 
 * @param {CanvasRenderingContext2D} context 
 * @param {Vec2} center 
 * @param {Vec2} halfSize 
 * @param {number} bevel
 */
export function beveledRect(context, center, halfSize, bevel)
{
	bevel = Math.min(bevel, halfSize.x, halfSize.y);
	let top = center.y - halfSize.y + bevel;
	let bottom = center.y + halfSize.y - bevel;
	let left = center.x - halfSize.x + bevel;
	let right = center.x + halfSize.x - bevel;
	context.beginPath();
	context.arc(left, top, bevel, -Math.PI, -Math.PI / 2);
	context.arc(right, top, bevel, -Math.PI / 2, 0);
	context.arc(right, bottom, bevel, 0, Math.PI / 2);
	context.arc(left, bottom, bevel, Math.PI / 2, Math.PI);
	context.closePath();
}

/**
 * 
 * @param {CanvasRenderingContext2D} context 
 * @param {Vec2} center 
 * @param {Vec2} halfSize 
 * @param {number} bevel
 */
export function fillBeveledRect(context, center, halfSize, bevel)
{
	beveledRect(context, center, halfSize, bevel);
	context.fill();
}
/**
 * 
 * @param {CanvasRenderingContext2D} context 
 * @param {Vec2} center 
 * @param {Vec2} halfSize 
 * @param {number} bevel
 */
export function drawBeveledRect(context, center, halfSize, bevel)
{
	beveledRect(context, center, halfSize, bevel);
	context.stroke();
}