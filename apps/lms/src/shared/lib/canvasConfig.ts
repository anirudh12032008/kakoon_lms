/**
 * Shared tuning constants for the ReactFlow canvases (blocks editor + hardware view).
 * Keep canvas "feel" knobs here so they're easy to adjust in one place.
 */

/**
 * Pixel radius around a handle within which a dragged connection will snap and
 * attach. ReactFlow's default is 20px — too tight for younger users dragging
 * wires. Bumped up so connections are forgiving and easy to make.
 *
 * Increase this value to make wiring even easier; decrease for more precision.
 */
export const CONNECTION_RADIUS = 45;
