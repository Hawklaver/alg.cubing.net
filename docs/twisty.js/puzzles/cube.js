/*
 * Rubik's Cube NxNxN
 */

"use strict";

twisty.puzzles.cube = function(twistyScene, twistyParameters) {

	// Cube Variables
	const cubeObject = new THREE.Object3D();
	const cubePieces = [];
	const easing = {};
	easing.linear = function(x) {
		return x;
	};
	easing.smooth = function(x) {
		x = x * x; // Ease in.
		return x * (2 - x); // Ease out.
	};
	easing.extra_smooth = function(x) {
		return x * x * x * (10 - x * (15 - 6 * x));
	};
	easing.boingy_sproingy = function(x) {
		// TODO: make this less jarring.
		const y = x * x; // Ease in.
		return 3 * (y * (2 - y) - x / 1.5); // Ease out.
	};

	// Defaults
	const cubeOptions = {
		stickerBorder: true,
		borderWidth: 8,
		cubies: false,
		picture: false,
		stickerWidth: 1.7,
		algUpdateCallback: null,
		hintStickers: false,
		hintStickersDistance: 1,
		opacity: 1,
		dimension: 3,
		easing: easing.smooth,
		colors: [
			0x444444, 0xffffff, 0xff8800, 0x00ff00, 0xff0000, 0x0000ff, 0xffff00,
			// TODO: Handle extra colors procedurally
			0x222222, 0x888888, 0x884400, 0x008800, 0x660000, 0x000088, 0x888800,
		],
		stage: "full",
		stageMap: null,
		scale: 1,
	};

	// Passed Parameters
	for (const option in cubeOptions) {
		if (option in twistyParameters) {
			cubeOptions[option] = twistyParameters[option];
		}
	}

	// Cube Constants
	const numSides = 6;

	// Create Picture Texture
	if (!twisty.puzzles.pictureMap) {
		const size = 256;
		const ctx = document.createElement("canvas").getContext("2d");
		ctx.canvas.width = size;
		ctx.canvas.height = size;
		ctx.fillStyle = "#fff";
		ctx.fillRect(0, 0, size, size);
		ctx.font = `bold ${size}px sans-serif`;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillStyle = "#000";
		ctx.fillText("A", size / 2, size / 2);
		twisty.puzzles.pictureMap = new THREE.TextureLoader().load(ctx.canvas.toDataURL());
	}
	const map = cubeOptions.picture ? twisty.puzzles.pictureMap : null;

	// Cube Materials
	const materials = { singleSided: [], doubleSided: [] };
	for (let i = 0; i < cubeOptions.colors.length; i++) {
		for (const side of ["singleSided", "doubleSided"]) {
			const material = new THREE.MeshBasicMaterial({ color: cubeOptions.colors[i], overdraw: 0.5, map });
			if (side === "doubleSided") {
				material.side = THREE.DoubleSide;
			}
			material.opacity = cubeOptions.opacity;
			materials[side].push(material);
		}
	}

	// Stickering for stages.
	function createStageMap(stage) {
		const map = [];
		const d = cubeOptions.dimension;
		for (let i = 0; i < numSides; i++) {
			map[i] = [];
			for (let j = 0; j < d ** 2; j++) {
				switch (stage) {
					case "full":
						map[i][j] = 1;
						break;
					case "center":
						if (j < d || j % d === 0 || j % d === d - 1 || d ** 2 < j + d) {
							map[i][j] = 0;
						} else {
							map[i][j] = 1;
						}
						break;
					case "edge":
						if (j === 0 || j === d - 1 || j === d ** 2 - d || j === d ** 2 - 1) {
							map[i][j] = 0;
						} else if (j < d || j % d === 0 || j % d === d - 1 || d ** 2 < j + d) {
							map[i][j] = 1;
						} else {
							map[i][j] = 0;
						}
						break;
					case "corner":
						if (j === 0 || j === d - 1 || j === d ** 2 - d || j === d ** 2 - 1) {
							map[i][j] = 1;
						} else {
							map[i][j] = 0;
						}
						break;
					case "cross":
						if (i === 0) {
							map[i][j] = 0;
						} else if (i === numSides - 1) {
							map[i][j] = [0, d - 1, d ** 2 - d, d ** 2 - 1].includes(j) ? 0 : 1;
						} else {
							map[i][j] = j < d || [0, d - 1].includes(j % d) ? 0 : 1;
						}
						break;
					case "F2L":
						if (i === 0) {
							map[i][j] = 0;
						} else if (i === numSides - 1) {
							map[i][j] = 1;
						} else {
							map[i][j] = j < d ? 0 : 1;
						}
						break;
					case "OLL":
						if (i === 0) {
							map[i][j] = 1;
						} else if (i === numSides - 1) {
							map[i][j] = 2;
						} else {
							map[i][j] = j < d ? 0 : 2;
						}
						break;
					case "PLL":
						if (i === 0) {
							map[i][j] = 1;
						} else if (i === numSides - 1) {
							map[i][j] = 2;
						} else {
							map[i][j] = j < d ? 1 : 2;
						}
						break;
					case "CLS":
						if (i === 0) {
							if (j === 0 || j === d - 1 || j === d ** 2 - d || j === d ** 2 - 1) {
								map[i][j] = 1;
							} else {
								map[i][j] = 2;
							}
						} else if (i < numSides - 1) {
							if (j < d) {
								map[i][j] = 0;
							} else if ((i === 2 && j === d ** 2 - 1) || (i === 3 && j === d ** 2 - d)) {
								map[i][j] = 1;
							} else {
								map[i][j] = 2;
							}
						} else {
							map[i][j] = j === d - 1 ? 1 : 2;
						}
						break;
					case "ELS":
						if (i === 0) {
							if (j === 0 || j === d - 1 || j === d ** 2 - d || j === d ** 2 - 1) {
								map[i][j] = 0;
							} else {
								map[i][j] = 1;
							}
						} else if (i < numSides - 1) {
							if (j < d) {
								map[i][j] = 0;
							} else {
								map[i][j] = 2;
								if (i === 2 && j % d === d - 1) {
									if (j === d ** 2 - 1) {
										map[i][j] = 0;
									} else {
										map[i][j] = 1;
									}
								}
								if (i === 3 && j % d === 0) {
									if (j === d ** 2 - d) {
										map[i][j] = 0;
									} else {
										map[i][j] = 1;
									}
								}
							}
						} else {
							map[i][j] = j === d - 1 ? 0 : 2;
						}
						break;
					case "L6E":
						if (i === 0) {
							if (j === 0 || j === d - 1 || j === d ** 2 - d || j === d ** 2 - 1) {
								map[i][j] = 2;
							} else {
								map[i][j] = 1;
							}
						} else if (i === 1 || i === 3) {
							if (j < d && j !== 0 && j !== d - 1) {
								map[i][j] = 1;
							} else {
								map[i][j] = 2;
							}
						} else {
							if (j % d === 0 || j % d === d - 1) {
								map[i][j] = 2;
							} else {
								map[i][j] = 1;
							}
						}
						break;
					case "CMLL":
						if (i === 0) {
							if (j === 0 || j === d - 1 || j === d ** 2 - d || j === d ** 2 - 1) {
								map[i][j] = 1;
							} else {
								map[i][j] = 0;
							}
						} else if (i < numSides - 1) {
							if (j < d) {
								if (j === 0 || j === d - 1) {
									map[i][j] = 1;
								} else {
									map[i][j] = 0;
								}
							} else if ((i === 2 || i === 4) && j % d !== 0 && j % d !== d - 1) {
								map[i][j] = 0;
							} else {
								map[i][j] = 2;
							}
						} else {
							map[i][j] = j % d !== 0 && j % d !== d - 1 ? 0 : 1;
						}
						break;
					case "WV":
						if (i === 0) {
							map[i][j] = 1;
						} else if (i < numSides - 1) {
							if (j < d) {
								map[i][j] = 0;
							} else {
								map[i][j] = 2;
								if (i === 2 && j % d === d - 1) {
									map[i][j] = 1;
								}
								if (i === 3 && j % d === 0) {
									map[i][j] = 1;
								}
							}
						} else {
							map[i][j] = j === d - 1 ? 1 : 2;
						}
						break;
					case "ZBLL":
						if (i === 0) {
							if (j === 0 || j === d - 1 || j === d ** 2 - d || j === d ** 2 - 1) {
								map[i][j] = 1;
							} else {
								map[i][j] = 2;
							}
						} else if (i < numSides - 1) {
							if (j < d) {
								map[i][j] = 1;
							} else {
								map[i][j] = 2;
							}
						} else {
							map[i][j] = 2;
						}
						break;
					case "void":
						if (j < d || j % d === 0 || j % d === d - 1 || d ** 2 < j + d) {
							map[i][j] = 1;
						} else {
							map[i][j] = 0;
						}
						break;
					default:
						break;
				}
			}
		}
		return map;

	}
	const isVoidCube = cubeOptions.stage === "void";
	let stickers = createStageMap("full");
	if (cubeOptions.stage === "custom" && cubeOptions.stageMap) {
		stickers = cubeOptions.stageMap;
	} else {
		stickers = createStageMap(cubeOptions.stage);
	}

	// Cube Helper Linear Algebra
	function axify(v1, v2, v3) {
		const ax = new THREE.Matrix4();
		ax.set(v1.x, v2.x, v3.x, 0, v1.y, v2.y, v3.y, 0, v1.z, v2.z, v3.z, 0, 0, 0, 0, 1);
		return ax;
	}
	const xx = new THREE.Vector3(1, 0, 0);
	const yy = new THREE.Vector3(0, 1, 0);
	const zz = new THREE.Vector3(0, 0, 1);
	const xxi = new THREE.Vector3(-1, 0, 0);
	const yyi = new THREE.Vector3(0, -1, 0);
	const zzi = new THREE.Vector3(0, 0, -1);
	const index_side = ["U", "L", "F", "R", "B", "D"];
	const sidesRot = {
		U: axify(zz, yy, xxi),
		L: axify(xx, zz, yyi),
		F: axify(yyi, xx, zz),
		R: axify(xx, zzi, yy),
		B: axify(yy, xxi, zz),
		D: axify(zzi, yy, xx),
	};
	const sidesNorm = {
		U: yy,
		L: xxi,
		F: zz,
		R: xx,
		B: zzi,
		D: yyi,
	};
	const sidesRotAxis = {
		U: yyi,
		L: xx,
		F: zzi,
		R: xxi,
		B: zz,
		D: yy,
	};
	const sidesUV = [axify(xx, zzi, yy), axify(zz, yy, xxi), axify(xx, yy, zz), axify(zzi, yy, xx), axify(xxi, yy, zzi), axify(xx, zz, yyi)];
	const borderGeometry = new THREE.Geometry();
	const c = cubeOptions.stickerWidth * 0.51;
	borderGeometry.vertices.push(new THREE.Vector3(-c, -c, 0));
	borderGeometry.vertices.push(new THREE.Vector3(+c, -c, 0));
	borderGeometry.vertices.push(new THREE.Vector3(+c, +c, 0));
	borderGeometry.vertices.push(new THREE.Vector3(-c, +c, 0));
	borderGeometry.vertices.push(new THREE.Vector3(-c, -c, 0));
	const borderMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: cubeOptions.borderWidth, opacity: cubeOptions.opacity });
	const borderTemplate = new THREE.Line(borderGeometry, borderMaterial);
	const innerGeometry = new THREE.PlaneGeometry(cubeOptions.stickerWidth, cubeOptions.stickerWidth);
	const innerTemplate = new THREE.Mesh(innerGeometry);
	const hintGeometry = innerGeometry.clone();
	const hintTemplate = new THREE.Mesh(hintGeometry);
	hintTemplate.rotateY(Math.PI);
	hintTemplate.translateZ(-2.5 * cubeOptions.dimension * cubeOptions.hintStickersDistance);
	const cubieTemplate = new THREE.Object3D();
	let w = 2;
	let cubieGeometry = new THREE.BoxGeometry(w, w, w);
	let cubieMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, overdraw: 0.5 });
	cubieMaterial.side = THREE.BackSide; // Hack to get around z-fighting.
	let cubieTemplate1 = new THREE.Mesh(cubieGeometry, cubieMaterial);
	cubieTemplate1.translateZ(-1);
	cubieTemplate.add(cubieTemplate1);
	w = 1.9;
	cubieGeometry = new THREE.BoxGeometry(w, w, w);
	cubieMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, overdraw: 0.5 });
	cubieMaterial.side = THREE.BackSide; // Hack to get around z-fighting.
	cubieTemplate1 = new THREE.Mesh(cubieGeometry, cubieMaterial);
	cubieTemplate1.translateZ(-1);
	cubieTemplate.add(cubieTemplate1);
	const side = cubeOptions.hintStickers ? "singleSided" : "doubleSided";

	// Cube Object Generation
	for (let i = 0; i < numSides; i++) {
		const facePieces = [];
		cubePieces.push(facePieces);
		const stickerTemplate = new THREE.Object3D();
		const innerSticker = innerTemplate.clone();
		stickerTemplate.add(innerSticker);
		if (cubeOptions.hintStickers) {
			stickerTemplate.add(hintTemplate);
		}
		if (cubeOptions.stickerBorder) {
			stickerTemplate.add(borderTemplate);
		}
		if (cubeOptions.cubies) {
			// Easiest to make this one per sticker for now. Can be optimized later.
			stickerTemplate.add(cubieTemplate);
		}
		for (let su = 0; su < cubeOptions.dimension; su++) {
			for (let sv = 0; sv < cubeOptions.dimension; sv++) {
				if (isVoidCube && 0 < su && su < cubeOptions.dimension - 1 && 0 < sv && sv < cubeOptions.dimension - 1) {
					continue;
				}
				const sticker = stickerTemplate.clone();
				const material = materials[side][i + 1].clone();
				const material2 = materials.singleSided[i + 1].clone();
				if (stickers[i] && stickers[i][su + sv * cubeOptions.dimension] === 0) {
					material.color.set(0x222222);
					material2.color.set(0x222222);
				}
				if (stickers[i] && stickers[i][su + sv * cubeOptions.dimension] === 2) {
					material.color.setHSL(material.color.getHSL().h, material.color.getHSL().s, material.color.getHSL().l / 2);
					material2.color.setHSL(material2.color.getHSL().h, material2.color.getHSL().s, material2.color.getHSL().l / 2);
				}
				sticker.children[0].material = material;
				if (cubeOptions.hintStickers) {
					sticker.children[1].material = material2;
				}
				const positionMatrix = new THREE.Matrix4();
				positionMatrix.makeTranslation(su * 2 - cubeOptions.dimension + 1, -(sv * 2 - cubeOptions.dimension + 1), cubeOptions.dimension);
				const x = sidesUV[i].clone();
				x.multiplyMatrices(x, positionMatrix);
				sticker.applyMatrix(x);
				facePieces.push([x, sticker]);
				cubeObject.add(sticker);
			}
		}
	}

	function matrixVector3Dot(m, v) {
		return m.elements[12] * v.x + m.elements[13] * v.y + m.elements[14] * v.z;
	}

	function cameraScale() {
		let actualScale = 2.2 * cubeOptions.dimension / cubeOptions.scale;
		if (cubeOptions.hintStickers) {
			actualScale *= (cubeOptions.hintStickersDistance + 0.9);
		}
		return actualScale;
	}

	let lastMoveProgress = 0;
	const animateMoveCallback = function(twisty, currentMove, moveProgress) {
		// Easing
		moveProgress = twisty.options.easing(moveProgress);
		const moves = currentMove.combination ? [currentMove, currentMove.combination] : [currentMove];
		for (const move of moves) {
			const canonical = alg.cube.canonicalizeMove(move, twisty.options.dimension);
			if (canonical.base === ".") {
				return; // Pause
			}
			const rott = new THREE.Matrix4();
			lastMoveProgress = moveProgress;
			rott.makeRotationAxis(sidesRotAxis[canonical.base], (moveProgress * canonical.amount * Math.PI) / 2);
			const state = twisty.cubePieces;
			for (let faceIndex = 0; faceIndex < state.length; faceIndex++) {
				const faceStickers = state[faceIndex];
				for (let stickerIndex = 0; stickerIndex < faceStickers.length; stickerIndex++) {
					// TODO - sticker isn't really a good name for this --jfly
					const sticker = state[faceIndex][stickerIndex];
					// Support negative layer indices (e.g. for rotations)
					// TODO: Bug 20110906, if negative index ends up the same as start index, the animation is iffy.
					const layerStart = canonical.startLayer;
					let layerEnd = canonical.endLayer;
					if (layerEnd < 0) {
						layerEnd = twisty.options.dimension + 1 + layerEnd;
					}
					const layer = matrixVector3Dot(sticker[1].matrix, sidesNorm[canonical.base]);
					if (layer < twisty.options.dimension - 2 * layerStart + 2.5 && twisty.options.dimension - 2 * layerEnd - 0.5 < layer) {
						const roty = rott.clone();
						roty.multiply(sticker[0]);
						sticker[1].matrix.copy(sticker[0]);
						sticker[1].applyMatrix(rott);
					}
				}
			}
		}
	};

	function matrix4Power(inMatrix, power) {
		let matrix = null;
		if (power < 0) {
			matrix = new THREE.Matrix4();
			matrix.getInverse(inMatrix);
		} else {
			matrix = inMatrix.clone();
		}
		const out = new THREE.Matrix4();
		for (let i = 0; i < Math.abs(power); i++) {
			out.multiply(matrix);
		}
		return out;
	}

	const cumulativeAlgorithm = [];

	const advanceMoveCallback = function(twisty, currentMove) {
		const moves = currentMove.combination ? [currentMove, currentMove.combination] : [currentMove];
		for (const move of moves) {
			const canonical = alg.cube.canonicalizeMove(move, twisty.options.dimension);
			if (canonical.base === ".") {
				return; // Pause
			}
			const rott = matrix4Power(sidesRot[canonical.base], canonical.amount);
			const state = twisty.cubePieces;
			for (let faceIndex = 0; faceIndex < state.length; faceIndex++) {
				const faceStickers = state[faceIndex];
				for (let stickerIndex = 0; stickerIndex < faceStickers.length; stickerIndex++) {
					// TODO - sticker isn't really a good name for this --jfly
					const sticker = state[faceIndex][stickerIndex];
					const layerStart = canonical.startLayer;
					let layerEnd = canonical.endLayer;
					if (layerEnd < 0) {
						layerEnd = twisty.options.dimension + 1 + layerEnd;
					}
					const layer = matrixVector3Dot(sticker[1].matrix, sidesNorm[canonical.base]);
					if (layer < twisty.options.dimension - 2 * layerStart + 2.5 && twisty.options.dimension - 2 * layerEnd - 0.5 < layer) {
						const roty = rott.clone();
						roty.multiply(sticker[0]);
						sticker[1].matrix.identity();
						sticker[1].applyMatrix(roty);
						sticker[0].copy(roty);
					}
				}
			}
			cumulativeAlgorithm.push(canonical);
			if (twisty.options.algUpdateCallback) {
				twisty.options.algUpdateCallback(cumulativeAlgorithm);
			}
		}
	};

	function generateScramble(twisty) {
		const dim = twisty.options.dimension;
		const n = 32;
		const newMoves = [];
		for (let i = 0; i < n; i++) {
			const startLayer = 1 + Math.floor((Math.random() * dim) / 2);
			const endLayer = startLayer + Math.floor((Math.random() * dim) / 2);
			const side = Math.floor(Math.random() * 6);
			const amount = [-2, -1, 1, 2][Math.floor(Math.random() * 4)];
			const newMove = {
				type: "move",
				base: ["u", "l", "f", "r", "b", "d"][side],
				amount: amount,
				startLayer: startLayer,
				endLayer: endLayer,
			};
			newMoves.push(newMove);
		}
		return newMoves;
	}

	const iS = 1;
	const oS = 1;
	const iSi = cubeOptions.dimension;
	const cubeKeyMapping = {
		73: "R", 75: "R'",
		87: "B", 79: "B'",
		83: "D", 76: "D'",
		68: "L", 69: "L'",
		74: "U", 70: "U'",
		72: "F", 71: "F'", // Heise
		78: "F", 86: "F'", // Kirjava
		67: "l", 82: "l'",
		85: "r", 77: "r'",
		84: "x", 89: "x", 66: "x'", // 84 (T) and 89 (Y) are alternatives.
		186: "y", 59: "y", 65: "y'", // 186 is WebKit, 59 is Mozilla; see http://unixpapa.com/js/key.html
		80: "z", 81: "z'",
		190: "M'",
	};

	const keydownCallback = function(twisty, e) {
		if (e.altKey || e.ctrlKey) {
			return null;
		}
		const keyCode = e.keyCode;
		if (keyCode in cubeKeyMapping) {
			const move = alg.cube.fromString(cubeKeyMapping[keyCode])[0];
			twistyScene.queueMoves(move);
			twistyScene.play.start();
			return move;
		}
		return null;
	};

	const ogCubePiecesCopy = [];
	for (let faceIndex = 0; faceIndex < cubePieces.length; faceIndex++) {
		const faceStickers = cubePieces[faceIndex];
		const ogFaceCopy = [];
		ogCubePiecesCopy.push(ogFaceCopy);
		for (let i = 0; i < faceStickers.length; i++) {
			ogFaceCopy.push(cubePieces[faceIndex][i][0].clone());
		}
	}

	function areMatricesEqual(m1, m2) {
		const flatM1 = m1.flattenToArrayOffset(new Array(16), 0);
		const flatM2 = m2.flattenToArrayOffset(new Array(16), 0);
		for (let i = 0; i < flatM1.length; i++) {
			if (flatM1[i] !== flatM2[i]) {
				return false;
			}
		}
		return true;
	}

	const isSolved = function() {
		const state = cubePieces;
		const dimension = cubeOptions.dimension;
		// This implementation of isSolved simply checks that
		// all polygons have returned to their original locations.
		// There are 2 problems with this scheme:
		//  1. Re-orienting the cube makes every sticker look unsolved.
		//  2. A center is still solved even if it is rotated in place.
		//     This isn't a supercube!
		//
		// To deal with 1, we pick a sticker, and assume that it is solved.
		// We then derive what the necessary amount of rotation is to have
		// taken our solved cube and placed the sticker where it is now.
		//      netRotation * originalLocation = newLocation
		//      netRotation = newLocation * (1/originalLocation)
		// We then proceed to compare every sticker to netRotation*originalLocation.
		//
		// We deal with center stickers by apply all 4 rotations to the original location.
		// If any of them match the new location, then we consider the sticker solved.
		let faceIndex = 0;
		let stickerIndex = 0;
		const stickerState = state[faceIndex][stickerIndex][0];
		const netCubeRotations = new THREE.Matrix4();
		netCubeRotations.getInverse(ogCubePiecesCopy[faceIndex][stickerIndex]);
		netCubeRotations.multiplyMatrices(stickerState, netCubeRotations);
		for (faceIndex = 0; faceIndex < state.length; faceIndex++) {
			const faceStickers = state[faceIndex];
			for (stickerIndex = 0; stickerIndex < faceStickers.length; stickerIndex++) {
				// TODO - sticker isn't really a good name for this --jfly
				const currSticker = state[faceIndex][stickerIndex];
				const currState = currSticker[0];
				let i = Math.floor(stickerIndex / dimension);
				let j = stickerIndex % dimension;
				if (0 < i && i < dimension - 1 && 0 < j && j < dimension - 1) {
					// Center stickers can still be solved even if they didn't make it
					// back to their original location (unless we're solving a supercube!)
					// We could skip the true centers on odd cubes, but I see no reason to do
					// so.
					const face = index_side[faceIndex];
					const rott = matrix4Power(sidesRot[face], 1);
					const rotatedOgState = ogCubePiecesCopy[faceIndex][stickerIndex].clone();
					let centerMatches = false;
					for (i = 0; i < 4; i++) {
						const transformedRotatedOgState = new THREE.Matrix4();
						transformedRotatedOgState.multiplyMatrices(netCubeRotations, rotatedOgState);
						if (areMatricesEqual(currState, transformedRotatedOgState)) {
							centerMatches = true;
							break;
						}
						rotatedOgState.multiplyMatrices(rott, rotatedOgState);
					}
					if (!centerMatches) {
						return false;
					}
				} else {
					// Every non-center sticker should return to exactly where it was
					const ogState = new THREE.Matrix4();
					ogState.multiplyMatrices(netCubeRotations, ogCubePiecesCopy[faceIndex][stickerIndex]);
					if (!areMatricesEqual(currState, ogState)) {
						return false;
					}
				}
			}
		}
		return true;
	};

	const isInspectionLegalMove = function(move) {
		if (["x", "y", "z"].indexOf(move.base) !== -1) {
			return true;
		}
		return false;
	};

	return {
		"type": twistyParameters,
		"options": cubeOptions,
		"3d": cubeObject,
		"cubePieces": cubePieces,
		"cameraScale": cameraScale,
		"animateMoveCallback": animateMoveCallback,
		"advanceMoveCallback": advanceMoveCallback,
		"keydownCallback": keydownCallback,
		"isSolved": isSolved,
		"isInspectionLegalMove": isInspectionLegalMove,
		"generateScramble": generateScramble,
	};
};
