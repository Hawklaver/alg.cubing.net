/*
 * model.twisty.js
 *
 * Started by Lucas Garron, July 22, 2011 at WSOH
 * Made classy by Jeremy Fleischman, October 7, 2011 during the flight to worlds
 *
 */

"use strict";

if (typeof(assert) === "undefined") {
	// TODO - this is pretty lame, we could use something like stacktrace.js
	// to get some useful information here.
	var assert = function(cond, str) {
		if (!cond) {
			if (str) {
				throw str;
			} else {
				throw "Assertion Error";
			}
		}
	};
}

const twisty = {};

(function() {

/****************
 *
 * twisty.js Plugins
 *
 * Plugins register themselves by calling twisty.registerTwisty.
 * This lets plugins be defined in different files.
 *
 */

twisty.puzzles = {};


// TODO: Find a better way to expose this for multiple twisties on a page.
twisty.cachedRenderer = {};
twisty.cachedRenderer[THREE.CanvasRenderer] = null;
twisty.cachedRenderer[THREE.WebGLRenderer] = null;
twisty.cachedRenderer[THREE.SVGRenderer] = null;

twisty.scene = function(options) {

	// that=this is a Crockford convention for accessing "this" inside of methods.
	const that = this;


	/******** Constants ********/

	const CONSTANTS = {
		CAMERA_HEIGHT_STICKY_MIN: 2,
		CAMERA_HEIGHT_STICKY_MAX: 4,
		DRAG_RESISTANCE_X: 256,
		DRAG_RESISTANCE_Y: 60,
		SCROLL_RESISTANCE_X: 1024,
		SCROLL_RESISTANCE_Y: 180,
	};


	/******** Instance Variables ********/

	const model = {
		twisty: null,
		preMoveList: [],
		moveList: [],
		time: null,
		position: null,
	};

	const view = {
		camera: null,
		container: null,
		scene: null,
		renderer: null,
	};

	const control = {
		cameraTheta: null,
		cameraHeight: CONSTANTS.CAMERA_HEIGHT_STICKY_MAX,
		mouseXLast: null,
		mouseYLast: null,
		listeners: {
			animating: [],
			isStep: [],
			isBack: [],
			position: [],
			moveStart: [],
			moveAdvance: [],
		},
		speed: null,
		animating: false,
		isStep: false,
		isBack: false,
	};

	this.debug = {
		stats: null,
		model: model,
		view: view,
		control: control,
		cachedRenderer: false,
	};


	/******** General Initialization ********/


	const iniDefaults = {
		renderer: THREE.CanvasRenderer,
		allowDragging: true,
		stats: false,
		cachedRenderer: false,
	};

	function initialize(options) {
		options = getOptions(options, iniDefaults);
		that.debug.cachedRenderer = options.cachedRenderer;
		view.initialize(options.renderer);
		if (options.allowDragging) {
			that.startAllowDragging();
		}
		if (options.stats) {
			startStats();
		}
	}


	/******** Model: Initialization ********/

	this.initializePuzzle = function(twistyType) {
		model.position = 0;
		model.preMoveList = [];
		model.moveList = [];
		model.twisty = createTwisty(twistyType);
		view.scene.add(model.twisty["3d"]);
		that.resize();
	};

	this.resize = function() {
		const width = $(view.container).width();
		const height = $(view.container).height()
		const min = Math.min(width, height);
		view.camera.setViewOffset(min, min, (min - width) / 2, (min - height) / 2, width, height);
		moveCameraDelta(0, 0);
		view.renderer.setSize(width, height);
		renderOnce();
	};


	/******** View: Initialization ********/

	view.initialize = function(Renderer) {
		view.scene = new THREE.Scene();
		view.camera = new THREE.PerspectiveCamera(30, 1, 0.001, 1000);
		if (that.debug.cachedRenderer && twisty.cachedRenderer[Renderer]) {
			view.renderer = twisty.cachedRenderer[Renderer]
		} else {
			view.renderer = new Renderer({
				antialias: true,
				alpha: true,
				// TODO: We're using this so we can save pictures of WebGL canvases.
				// Investigate if there's a significant performance penalty.
				// Better yet, allow rendering to a CanvasRenderer view separately.
				preserveDrawingBuffer: true
			});
			view.renderer.setPixelRatio(globalThis.devicePixelRatio ?? 1);
		}
		if (that.debug.cachedRenderer) {
			twisty.cachedRenderer[Renderer] = view.renderer;
		}
		const canvas = view.renderer.domElement;
		$(canvas).css("position", "absolute").css("top", 0).css("left", 0);
		const container = $("<div>").css("width", "100%").css("height", "100%");
		view.container = container[0];
		container.append(canvas);
	};


	/******** View: Rendering ********/

	function render() {
		view.renderer.render(view.scene, view.camera);
		if (that.debug.stats) {
			that.debug.stats.update();
		}
	}

	function renderOnce() {
		if (!control.animating) {
			requestAnimationFrame(render);
		}
	}

	this.redraw = renderOnce;


	/******** View: Camera ********/

	this.setCameraPosition = function(theta, height) {
		control.cameraTheta = theta;
		if (typeof height !== "undefined") {
			control.cameraHeight = Math.max(-CONSTANTS.CAMERA_HEIGHT_STICKY_MAX, Math.min(CONSTANTS.CAMERA_HEIGHT_STICKY_MAX, height));
		}
		// We allow the height to enter a buffer from 2 to 3, but clip the display at 2.
		const actualHeight = Math.max(-CONSTANTS.CAMERA_HEIGHT_STICKY_MIN, Math.min(CONSTANTS.CAMERA_HEIGHT_STICKY_MIN, control.cameraHeight));
		const scale = model.twisty.cameraScale() + 1 - Math.pow(Math.abs(actualHeight) / CONSTANTS.CAMERA_HEIGHT_STICKY_MIN, 2);
		view.camera.position.x = 2.5 * Math.sin(theta) * scale;
		view.camera.position.y = actualHeight * scale;
		view.camera.position.z = 2.5 * Math.cos(theta) * scale;
		view.camera.lookAt(new THREE.Vector3(0, -0.075 * scale * (actualHeight) / CONSTANTS.CAMERA_HEIGHT_STICKY_MIN, 0));
	};

	function moveCameraDelta(deltaTheta, deltaHeight) {
		that.setCameraPosition(control.cameraTheta + deltaTheta, control.cameraHeight + deltaHeight);
	}

	// Detect modern versions of IE.
	// I try to write browser-agnostic code, but even IE11 manages to break the wheel event.
	const isIE = -1 < navigator.userAgent.indexOf("Trident");

	/******** Control: Mouse/Touch Dragging ********/

	this.startAllowDragging = function() {
		view.container.addEventListener("mousedown", onStart, false);
		view.container.addEventListener("touchstart", onStart, false);
		if (!isIE) {
			view.container.addEventListener("wheel", onWheel, false);
		}
	};

	const listeners = {
		"mouse": {
			"mousemove": onMove,
			"mouseup": onEnd,
		},
		"touch": {
			"touchmove": onMove,
			"touchend": onEnd,
		}
	};

	function eventKind(event) {
		if (event instanceof MouseEvent) {
			return "mouse";
		} else if (event instanceof TouchEvent) {
			return "touch";
		}
		throw "Unknown event kind.";
	}

	function onStart(event) {
		const kind = eventKind(event);
		// Ignore multi-finger touches (e.g. pinch to zoom).
		if (kind !== "touch" || event.touches.length === 1) {
			control.mouseXLast = (kind === "mouse") ? event.clientX : event.touches[0].pageX;
			control.mouseYLast = (kind === "mouse") ? event.clientY : event.touches[0].pageY;
			renderOnce();
			for (const listener in listeners[kind]) {
				window.addEventListener(listener, listeners[kind][listener], false);
			}
		}
	}

	function onMove(event) {
		const kind = eventKind(event);
		const mouseX = (kind === "mouse") ? event.clientX : event.touches[0].pageX;
		const mouseY = (kind === "mouse") ? event.clientY : event.touches[0].pageY;
		const deltaX = (control.mouseXLast - mouseX) / CONSTANTS.DRAG_RESISTANCE_X;
		const deltaY = -(control.mouseYLast - mouseY) / CONSTANTS.DRAG_RESISTANCE_Y;
		moveCameraDelta(deltaX, deltaY);
		control.mouseXLast = mouseX;
		control.mouseYLast = mouseY;
		renderOnce();
		event.preventDefault();
	}

	function onWheel(event) {
		const deltaX = -("wheelDeltaX" in event ? event.wheelDeltaX : -event.deltaX) / CONSTANTS.SCROLL_RESISTANCE_X;
		const deltaY = ("wheelDeltaY" in event ? event.wheelDeltaY : -event.deltaY) / CONSTANTS.SCROLL_RESISTANCE_Y;
		moveCameraDelta(deltaX, deltaY);
		renderOnce();
		event.preventDefault();
	}

	function onEnd(event) {
		const kind = eventKind(event);
		// Snap camera height to end of sticky region.
		if (CONSTANTS.CAMERA_HEIGHT_STICKY_MIN <= control.cameraHeight) {
			control.cameraHeight = CONSTANTS.CAMERA_HEIGHT_STICKY_MAX;
		} else if (control.cameraHeight <= -CONSTANTS.CAMERA_HEIGHT_STICKY_MIN) {
			control.cameraHeight = -CONSTANTS.CAMERA_HEIGHT_STICKY_MAX;
		}
		for (const listener in listeners[kind]) {
			window.removeEventListener(listener, listeners[kind][listener], false);
		}
	}


	/******** Control: Keyboard ********/

	this.keydown = function(e) {
		const keyCode = e.keyCode;
		const move = model.twisty.keydownCallback(model.twisty, e);
		if (move !== null) {
			fireListener("moveStart", move);
		}
		switch (keyCode) {
			case 37: // Left
				moveCameraDelta(Math.PI / 24);
				e.preventDefault();
				renderOnce();
				break;
			case 39: // Right
				moveCameraDelta(-Math.PI / 24);
				e.preventDefault();
				renderOnce();
				break;
		}
	};


	/******** Control: Move Listeners ********/

	this.addListener = function(kind, listener) {
		control.listeners[kind].push(listener);
	};

	this.removeListener = function(kind, listener) {
		const index = control.listeners[kind].indexOf(listener);
		assert(0 <= index);
		delete control.listeners[kind][index];
	};

	function fireListener(kind, data) {
		for (let i = 0; i < control.listeners[kind].length; i++) {
			control.listeners[kind][i](data);
		}
	}


	/******** Control: Animation ********/

	function triggerAnimation() {
		if (!control.animating) {
			model.time = Date.now();
			setAnimating(true);
			if (control.isBack) {
				animFrameBack();
			} else {
				animFrame();
			}
		}
	}

	function animFrame() {
		if (totalLength() <= model.position) {
			model.position = totalLength();
			setAnimating(false);
		}
		if (control.animating) {
			const prevTime = model.time;
			const prevPosition = model.position;
			const currentMove = model.moveList[Math.floor(model.position)];
			let amount = Math.abs(currentMove.amount);
			if (currentMove.combination) {
				amount = Math.max(amount, Math.abs(currentMove.combination.amount));
			}
			const speedCoef = 1 / (0.5 * (amount + 1));
			model.time = Date.now();
			model.position = prevPosition + (model.time - prevTime) * control.speed * speedCoef * 1.5 / 1000;
			if (Math.floor(prevPosition) < Math.floor(model.position)) {
				// If we finished a move, snap to the beginning of the next. (Will never skip a move.)
				model.position = Math.floor(prevPosition) + 1;
				const prevMove = model.moveList[Math.floor(prevPosition)];
				model.twisty["animateMoveCallback"](model.twisty, prevMove, 1);
				model.twisty["advanceMoveCallback"](model.twisty, prevMove);
				fireListener("moveAdvance");
				if (control.isStep) {
					setStep(false);
					setAnimating(false);
				}
			} else {
				model.twisty["animateMoveCallback"](model.twisty, currentMove, model.position % 1);
			}
		}
		render();
		fireListener("position", model.position);
		if (control.animating) {
			requestAnimationFrame(animFrame);
		}
	}

	function animFrameBack() {
		if (model.position <= 0) {
			model.position = 0;
			setAnimating(false);
		}
		if (control.animating) {
			const prevTime = model.time;
			const prevPosition = model.position;
			const currentMove = model.moveList[Math.ceil(model.position) - 1];
			let amount = Math.abs(currentMove.amount);
			if (currentMove.combination) {
				amount = Math.max(amount, Math.abs(currentMove.combination.amount));
			}
			const speedCoef = 1 / (0.5 * (amount + 1));
			model.time = Date.now();
			model.position = prevPosition - (model.time - prevTime) * control.speed * speedCoef * 1.5 / 1000;
			if (Number.isInteger(prevPosition) && prevPosition !== model.position) {
				const invertedMove = alg.cube.invert([currentMove])[0];
				model.twisty["advanceMoveCallback"](model.twisty, invertedMove);
				model.twisty["animateMoveCallback"](model.twisty, currentMove, 1);
			} else if (Math.ceil(model.position) < Math.ceil(prevPosition)) {
				model.position = Math.ceil(prevPosition) - 1;
				const prevMove = model.moveList[Math.ceil(prevPosition) - 1];
				model.twisty["animateMoveCallback"](model.twisty, prevMove, 0);
				if (control.isStep) {
					setStep(false);
					setAnimating(false);
				}
			} else {
				model.twisty["animateMoveCallback"](model.twisty, currentMove, model.position % 1);
			}
		}
		render();
		fireListener("position", model.position);
		if (control.animating) {
			requestAnimationFrame(animFrameBack);
		}
	}

	function totalLength() {
		return model.moveList.length;
	}

	function setAnimating(value) {
		control.animating = value;
		fireListener("animating", control.animating);
	}

	function setStep(value) {
		control.isStep = value;
		fireListener("isStep", control.isStep);
	}

	function setBack(value) {
		control.isBack = value;
		fireListener("isBack", control.isBack);
	}


	/******** Control: Playback ********/

	const setupDefaults = {
		init: [],
		type: "generator",
		speed: 1,
	};

	this.setupAnimation = function(algIn, options) {
		options = getOptions(options, setupDefaults);
		control.speed = options.speed;
		setAnimating(false);
		model.preMoveList = options.init;
		if (options.type === "solve") {
			const algInverse = alg.cube.invert(algIn);
			model.preMoveList = model.preMoveList.concat(algInverse);
		}
		that.applyMoves(model.preMoveList);
		that.queueMoves(algIn);
		renderOnce();
	};

	this.applyMoves = function(moves) {
		for (const i in moves) {
			model.twisty["advanceMoveCallback"](model.twisty, moves[i]);
		}
	};

	this.queueMoves = function(moves) {
		model.moveList = model.moveList.concat(moves);
	};

	this.player = {
		back() {
			setBack(true);
			triggerAnimation();
		},
		play() {
			setBack(false);
			triggerAnimation();
		},
		pause() {
			setAnimating(false);
		},
		prev() {
			setStep(true);
			setBack(true);
			triggerAnimation();
		},
		next() {
			setStep(true);
			setBack(false);
			triggerAnimation();
		},
		init() {
			setAnimating(false);
			that.setIndex(0);
		},
		skip() {
			setAnimating(false);
			that.setIndex(model.moveList.length);
		},
	};

	this.setPosition = function(position, force) {
		// If we're somewhere on the same move, don't recalculate position.
		// Else, recalculate from the beginning, since we don't have something clever yet.
		if (Math.floor(position) !== that.getIndex() || force) {
			const preMoveListSaved = model.preMoveList;
			const moveListSaved = model.moveList;
			// Hack
			view.scene.remove(model.twisty["3d"]);
			that.initializePuzzle(model.twisty.type);
			model.preMoveList = preMoveListSaved;
			model.moveList = moveListSaved;
			that.applyMoves(model.preMoveList);
			that.applyMoves(model.moveList.slice(0, position)); // Works with fractional positions
		}
		model.position = position;
		if (position < totalLength()) {
			const currentMove = model.moveList[Math.floor(model.position)];
			model.twisty["animateMoveCallback"](model.twisty, currentMove, model.position % 1);
		}
		renderOnce();
		// fireAnimation();
	};

	this.getPosition = function() {
		return model.position;
	};

	this.getIndex = function() {
		return Math.floor(model.position);
	};

	this.setIndex = function(idx) {
		this.setPosition(Math.floor(idx));
	};

	this.getMaxPosition = function() {
		return model.moveList.length;
	};


	/******** Getters/setters ********/

	this.getMoveList = function() {
		return model.moveList;
	};

	this.getDomElement = function() {
		return view.container;
	};

	this.setSpeed = function(speed) {
		control.speed = speed;
	};

	this.getCanvas = function() {
		return view.renderer.domElement;
	};


	/******** Twisty ********/

	function createTwisty(twistyType) {
		const twistyCreateFunction = twisty.puzzles[twistyType.type];
		if (!twistyCreateFunction) {
			err('model.twisty type "' + twistyType.type + '" is not recognized!');
			return null;
		}
		return twistyCreateFunction(that, twistyType);
	}


	/******** Debugging ********/

	function startStats() {
		that.debug.stats = new Stats();
		that.debug.stats.domElement.style.top = "0px";
		that.debug.stats.domElement.style.left = "0px";
		that.debug.stats.domElement.style.position = "absolute";
		view.container.appendChild(that.debug.stats.domElement);
		$(that.debug.stats.domElement).click();
	}


	/******** Convenience Functions ********/

	function getOptions(input, defaults) {
		const output = {};
		for (const key in defaults) {
			output[key] = (key in input) ? input[key] : defaults[key];
		}
		return output;
	}

	this.setOption = function(key, val) {
		model.twisty.type[key] = val;
	};

	/******** Go! ********/

	initialize(options);

};

})();
