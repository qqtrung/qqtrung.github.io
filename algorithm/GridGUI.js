class GridGUI extends GUI {

	constructor (container, mapText) {
		super(container);
		this.map = new Grid(mapText);
		this.config = {};
		this.config.actions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
		this.config.actionCosts = [100, 100, 100, 100]; 					
		this.config.strategy = 'bfs'; 														
		this.pixelWidth = 768;
		this.pixelHeight = 768;
		this.sqSize = this.pixelWidth / this.map.width; 
		this.showInteractions = false; 
		this.drawInfo = true;
		this.step = false;
		this.stepping = false;
		this.drawMethod = 'info';
		this.showGrid = true;
		this.animspeed = 1; 
		this.osize = 1;
		this.maxSize = 1;
		this.mx = -1;
		this.my = -1;
		this.gx = -1;
		this.gy = -1; 
		this.omx = -1;
		this.omy = -1;
		ggui = this; 
		this.colors = ["#777777", "#00ff00", "#0055ff"]; 
		this.pathTime = 0;
		this.setHTML(); 
		this.addEventListener(); 
		this.setDrawMethod(); 
		this.drawBackGround(); 
		this.drawGrid(); 
		this.setAlgorithm(); 
	}

	draw() {
		let t0 = performance.now(); 
		this.fg_ctx.clearRect(0, 0, this.bg.width, this.bg.height); 
		if (this.omx != -1) {
			if (this.showInteractions) {
				if (!this.stepping) { 
					for (let a = 0; a < this.animspeed; a++) { 
						this.search.searchIteration();
					}
				} else if (this.step) {
					this.search.searchIteration();
					this.step = false;
				}
			} else {
				let setTime = this.search.inProcess; 
				let tt0 = performance.now();
				while (this.search.inProcess) { 
					this.search.searchIteration();
				}
				let tt1 = performance.now(); 
				if (setTime) { 
					this.pathTime = Math.round(tt1 - tt0); 
					this.displaySearchInfo(this.testDiv);
				}
			}

			let ix = this.omx;
			let iy = this.omy;

			let open = this.search.getOpen(); 
			for (let i = 0; this.drawInfo && i < open.length; i++) { 
				this.drawAgent(open[i][0], open[i][1], this.osize, '#ffcc00'); 
			}
			let closed = this.search.getClosed(); 
			for (let i = 0; this.drawInfo && i < closed.length; i++) { 
				this.drawAgent(closed[i][0], closed[i][1], this.osize, '#ff0000'); 
			}

			for (let i = 0; i < this.search.path.length; i++) {
				ix += this.search.path[i][0];
				iy += this.search.path[i][1]; 
				this.drawAgent(ix, iy, this.osize, '#ffffff'); 
			}

			this.drawAgent(this.omx, this.omy, this.osize, '#ffff00'); 
		}

		if (this.mx != -1) {
			this.drawAgent(this.mx, this.my, this.osize, '#ff0000'); 
		}

		if (this.search.inProcess) {
			this.drawAgent(this.search.gx, this.search.gy, this.osize, '#ffff00'); 
		}

		this.drawGrid(); 

		let t1 = performance.now(); 
		let ms = Math.round(t1 - t0); 
		this.fg_ctx.fillStyle = '#ffffff'; 
		this.fg_ctx.fillText("Mouse Pos: (" + this.mx + "," + this.my + ")", 5, this.bg.height - 8); 
	}

	drawAgent(x, y, size, color) {
		this.fg_ctx.fillStyle = color;
		for (let sx = 0; sx < size; sx++) {
			for (let sy = 0; sy < size; sy++) {
				this.fg_ctx.fillRect((x + sx) * this.sqSize, (y + sy) * this.sqSize, this.sqSize, this.sqSize); 
			}
		}
	}	

	drawGrid() {
		if (this.showGrid) {
			this.fg_ctx.fillStyle = "#000000"; 
			for (let y = 0; y <= this.map.height; y++) {
				this.fg_ctx.fillRect(0, y * this.sqSize, this.fg.width, 1); 
			}
			for (let x = 0; x <= this.map.width; x++) {
				this.fg_ctx.fillRect(x * this.sqSize, 0, 1, this.fg.height); 
			}
		}
	}

	drawBackGround() {
		for (let y = 0; y < this.map.height; y++) {
			for (let x = 0; x < this.map.width; x++) {
				this.bg_ctx.fillStyle = this.colors[parseInt(this.map.get(x, y))]; 
				this.bg_ctx.fillRect(x * this.sqSize, y * this.sqSize, this.sqSize, this.sqSize); 
			}
		}
	}

	drawNodeLine(node, color) {
		if (node.parent == null) { return; }
		let half = this.sqSize / 2;
		this.fg_ctx.fillStyle = color;
		ox1 = node.x * this.sqSize + half;
		oy1 = node.y * this.sqSize + half;
		ox2 = ox1 - (node.action[0] / 3) * this.sqSize; 
		oy2 = oy1 - (node.action[1] / 3) * this.sqSize;
		this.drawLine(ox1, oy1, ox2, oy2, color); 
	}

	drawLine(x1, y1, x2, y2, color) {
		this.fg_ctx.fillStyle = color;
		this.fg_ctx.beginPath();
		this.fg_ctx.moveTo(x1, y1); 
		this.fg_ctx.lineTo(x2, y2);
		this.fg_ctx.stroke(); 
	}

	addEventListener() {
		this.fg.gui = this;
		this.fg.addEventListener('mousemove', function (evt) {
			let mousePos = this.gui.getMousePos(this, evt); 
			let newmx = Math.floor(mousePos.x / this.gui.sqSize);
			let newmy = Math.floor(mousePos.y / this.gui.sqSize); 
			
			if (this.gui.mouse == 1) {
				this.gui.gx = this.gui.mx;
				this.gui.gy = this.gui.my;
				this.gui.startSearch(); 
			}

			this.gui.mx = newmx;
			this.gui.my = newmy;

		}, false); 

		this.fg.addEventListener('mousedown', function (evt) {
			let mousePos = this.gui.getMousePos(this, evt); 
			this.gui.mouse = evt.which;

			if (this.gui.mouse == 1) {
				if (this.gui.omx != -1 && this.gui.omx == this.gui.gx && this.gui.omy == this.gui.gy) {
					this.gui.gx = this.gui.mx;
					this.gui.gy = this.gui.my;
					this.gui.startSearch(); 
				} else {
					this.gui.omx = Math.floor(mousePos.x / this.gui.sqSize); 
					this.gui.omy = Math.floor(mousePos.y / this.gui.sqSize); 
					this.gui.gx = this.gui.mx;
					this.gui.gy = this.gui.my;
					this.gui.startSearch(); 
				}
			}
		}, false); 

		this.fg.addEventListener('mouseup', function (evt) {
			this.gui.mouse = -1;
		}, false); 

		this.fg.oncontextmenu = function (evt) {
			evt.preventDefault(); 
		};
	}

	setAnimationSpeed(value) {
		this.animspeed = parseInt(value); 
	}

	setObjectSize(value) {
		this.osize = parseInt(value); 
		this.startSearch(); 
	}

	setAStarWeight(value) {
		this.config.weight = parseFloat(value); 
		this.startSearch(); 
	}

	setAStarTiebreak(value) {
		this.config.tiebreak = value;
		this.setAlgorithm(this.algorithm);  
	}

	setHeuristic(value) {
		this.config.heuristic = value;
		this.setAlgorithm(this.algorithm); 
	}

	setLegalAction(value) {
		if (value == 'card') {
			this.config.actions = [[-1, 0], [0, -1], [1, 0], [0, 1]];
			this.config.actionCosts = [100, 100, 100, 100]; 
		} 
		if (value == 'diag') {
			this.config.actions = [[1, 1], [-1, -1], [1, -1], [-1, 1], [0, 1], [0, -1], [1, 0], [-1, 0]]; 
			this.config.actionCosts = [141, 141, 141, 141, 100, 100, 100, 100]; 
		}
		this.setAlgorithm(this.algorithm); 
	}

	setMap(value) {
		this.map = new Grid(document.getElementById(value).value); 
		this.sqSize = this.pixelWidth / this.map.width;
		this.bg_ctx.clearRect(0, 0, this.pixelWidth, this.pixelHeight); 
		this.omx = -1; 
		this.omy = -1;
		this.gx = -1;
		this.gy = -1;
		this.drawBackGround(); 
		this.drawGrid(); 
		this.setAlgorithm(this.algorithm); 
	}

	getAlgorithm() {
		let algorithm = document.getElementById('selectalgorithm').value;
		if (algorithm == 'bfs') {	
			return new Search_BFS(this.map, this.config); 
		} else if (algorithm == 'dfs') {
			return new Search_DFS(this.map, this.config); 
		} else if (algorithm == 'studentBFS') {
			this.config.strategy = 'bfs'; 
			return new Search_Student(this.map, this.config); 
		} else if (algorithm == 'studentDFS') {
			this.config.strategy = 'dfs'; 
			return new Search_Student(this.map, this.config); 
		} else if (algorithm == 'studentIDDFS') {
			this.config.strategy = 'iddfs'; 
			return new Search_Student(this.map, this.config); 
		}
		return null;
	}

	setAlgorithm() {
		let t0 = performance.now(); 
		this.pathTime = 0; 
		let algorithm = document.getElementById('selectalgorithm').value;
		this.hideElements(['astartiebreak', 'astarweight']);
		this.search = this.getAlgorithm(); 
		let t1 = performance.now(); 
		console.log("Search constructor time: ", t1 - t0); 
		this.startSearch(); 
	}

	setDrawMethod() {
		this.drawMethod = document.getElementById('drawMethodSelect').value;
		// this.hideElements(['StepButton', 'AnimSpeedSelect']); 
		if (this.drawMethod == 'info') { this.showInteractions = false; this.drawInfo = true; this.stepping = false; }
		else if (this.drawMethod == 'path') { this.showInteractions = false; this.drawInfo = false; this.stepping = false; }
		else if (this.drawMethod == 'iter') { this.showInteractions = true; this.drawInfo = true; this.stepping = false; }
		else if (this.drawMethod == 'step') { this.showInteractions = true; this.drawInfo = true; this.stepping = true; }
	}

	displaySearchInfo(div) {
		var algorithm = ['astar', 'ucs', 'wastar', 'gbefs', 'bfs', 'dfs']; 
		this.detailedSearchHTML = '<table rules="all" width="400px"><tbody>';
		this.detailedSearchHTML += "<tr>\
																<th>Search</th>\
																<th>Start</th>\
																<th>Goal</th>\
																<th>Cost</th>\
																<th>Closed</th>\
																<th>Time</th>\
																<th>Node/ms</th>\
															</tr>";

		let closed = this.search.getClosed();
		let nps = ( (this.pathTime == 0 || this.showInteractions) ? "-" : Math.round(closed.length / this.pathTime));
		let rowHTML = "<tr>";
			rowHTML += "<td>" + this.search.name + "</td>";
			rowHTML += "<td>" + (this.omx == -1 ? "-" : "(" + this.omx + "," + this.omy + ")" + "</td>");
			rowHTML += "<td>" + (this.gx == -1 ? "-" : "(" + this.gx + "," + this.gy + ")" + "</td>");
			rowHTML += "<td>" + this.search.cost + "</td>";
			rowHTML += "<td>" + closed.length + "</td>";
			rowHTML += "<td>" + (this.showInteractions ? "-" : this.pathTime.toFixed(4)) + "</td>";
			rowHTML += "<td>" + nps + "</td>";
		rowHTML += "</tr>";
		this.detailedSearchHTML += rowHTML;
		this.detailedSearchHTML += "</tbody></table>";
		div.innerHTML = this.detailedSearchHTML;
	}

	startSearch() {
		this.search.startSearch(this.omx, this.omy, this.gx, this.gy, this.osize); 
	}

	setHTML() {

		let top = 0; 
		let skip = 35;

		this.createCanvas(this.map.width * this.sqSize + 1, this.map.height * this.sqSize + 1); 
		this.controlDiv = this.create('div', 'ButtonContainer', this.fg.width + 30, 0, 600, 7 * skip); 
		this.testDiv = this.create('div', 'TestContainer', this.fg.width + 30, top + 7 * skip + 10, 600, 100); 
		testContainer = this.testDiv;

		this.addText(this.controlDiv, 'selectmaptext', 0, top, 150, 25, "Enviroment Map:"); 
		this.addSelectBox(this.controlDiv, 'selectmap', 150, top, 250, 25, function() { this.gui.setMap(this.value); }, 
			[['defaultmap', 'Default (64 x 64)'], ['caves', 'Sparse Caves (128 x 128'], ['bigcaves', 'Dense Cave (256 x 256)'],
			['64maze', 'Small Maze (64 x 64)'], ['128maze', 'Medium Maze (128 x 128)'], ['256maze', 'Large Maze (256 x 256)'],
			['wheelofwar', 'StarCraft: Wheel of War (256 x 256)'], ['blankmap', 'Blank (32 x 32)'], ['lshapemap', 'L-Shape Wall (16 x 16)']]); 
		
		this.addText(this.controlDiv, 'selectalgorithmtext', 0, top + skip, 150, 25, "Search Algorithm:"); 
		this.addSelectBox(this.controlDiv, 'selectalgorithm', 150, top + skip, 250, 25, function() { this.gui.setAlgorithm(); },
			[['studentBFS', 'Student BFS'], ['studentDFS', 'Student DFS'], ['studentIDDFS', 'Student IDDFS']]);
		
		this.addSelectBox(this.controlDiv, 'astartiebreak', 425, top + skip, 125, 25, function() { this.gui.setAlgorithm(); },
			[['lessh', 'Tie Break Min H'], ['lessg', 'Tiebreak Min G'], ['fonly', 'Select Min F Only']]);

		this.addSelectBox(this.controlDiv, 'astarweight', 425, top + skip, 125, 25, function() { this.gui.setAStarWeight(this.value); },
			[['1', '1x Heuristic'], ['1.1', '1.1x Heuristic'], ['1.5', '1.5x Heuristic'], ['2', '2x Heuristic']]); 
		
		this.addText(this.controlDiv, 'objectsizetext', 0, top + 2*skip, 150, 25, "Object Size:"); 
		this.addSelectBox(this.controlDiv, 'objectsize', 150, top + 2*skip, 250, 25, function() { this.gui.setObjectSize(this.value); }, 
			[['1', '1x1 Square'], ['2', '2x2 Square'], ['3', '3x3 Square']]); 

		this.addText(this.controlDiv, 'legalactiontext', 0, top + 3*skip, 150, 25, "Legal Actions:"); 
		this.addSelectBox(this.controlDiv, 'legalactions', 150, top + 3*skip, 250, 25, function() { this.gui.setLegalAction(this.value); }, 
			[['card', '4 Cardinal (Up, Down, Left, Right)'], ['diag', '8 Directions']]); 

		this.addText(this.controlDiv, 'drawText', 0, top + 4 * skip, 150, 25, "Visualization:"); 
		this.addSelectBox(this.controlDiv, 'drawMethodSelect', 150, top + 4*skip, 250, 25, function() {this.gui.setDrawMethod(); },
			[['info', 'Instant Path + Open/Closed'], ['path', 'Instant Path Only'], ['iter', 'Animated Search'], ['step', 'Single Step']]); 

		this.addSelectBox(this.controlDiv, 'AnimSpeedSelect', 425, top + 4*skip, 125, 25, function() { this.gui.setAnimationSpeed(this.value); },
			[['1', '1x Speed'], ['2', '2x Speed'], ['4', '4x Speed'], ['8', '8x Speed'], ['16', '16x Speed'], ['32', '32x Speed']]); 
		
		this.addButton(this.controlDiv, 'ToggleGrid', 425, 	top, 				125, 25, "Toggle Grid", 				function() { this.gui.showGrid = !this.gui.showGrid }); 
		this.addButton(this.controlDiv, 'rerun', 			0, 		top+5*skip, 145, 25, "Rerun Previous Path", function() { this.gui.startSearch(); }); 
		this.addButton(this.controlDiv, 'TestButton', 150, 	top+5*skip, 120, 25, "Run Tests", 					function() { test = 0; randomTests = false; RunTests(); }); 
		this.addButton(this.controlDiv, 'TestButton', 275,  top+5*skip, 125, 25, "Random Tests", 				function() { test = 0; randomTests = true; RunTests(); }); 
		this.addButton(this.controlDiv, 'StepButton', 425, 	top+5*skip, 125, 25, "Single Step", 				function() { this.gui.step = true; }); 

		this.disableElements(['objectsize', 'legalactions']);

		let instructionsHTML = "<b>Search Visualization Instructions:</b><br>";
		instructionsHTML += "<ul>";
			instructionsHTML += "<li><font color='#ff0000'><b>LEFT CLICK AND DRAG TO SET START AND GOAL TILE</b></font></li>";
			instructionsHTML += "<li>Object can only move through same color tiles in the grid</li>";
			instructionsHTML += "<li>Click any drop-down menu above to change the search settings</li>";
			instructionsHTML += "<li>Choose 'Animate Search' visualization to see real-time search progress</li>";
			instructionsHTML += "<li>Re-Run Previous - Performs previous search again (useful when animating)</li>";
			instructionsHTML += "<li>Assignment Tests - Performs Assignment Tests</li>";
			instructionsHTML += "<li>Random Tests - Performs Random Tests Tests</li>";
		instructionsHTML += "</ul>";
		instructionsHTML += "<b>Visualization Legend:</b><br>";
		instructionsHTML += "<ul>";
			instructionsHTML += "<li>Blue / Green / Grey Tile - Terrain type, object can move within a colour</li>";
			instructionsHTML += "<li>Red Tile - Node is in closed list (has been expanded)</li>";
			instructionsHTML += "<li>Orange Tile - Node is in open list (generated, but not expanded)</li>";
			instructionsHTML += "<li>White Tile - Node is on the generated path</li>";
		instructionsHTML += "</ul>";
		this.testDiv.innerHTML = instructionsHTML;
	}
}	

let test = 0;
let startTiles = [
  [1, 3], 	[3, 33], 	[4, 50], 	[2, 60], 	[4, 50], 	[17, 0],
  [6, 34], 	[36, 34], [1, 1], 	[13, 81], [63, 58], [51, 23],
];
let endTiles = [
  [6, 2], 	[3, 55], 	[13, 58], [28, 21], [13, 59], [60, 50],
  [60, 45], [5, 5], 	[63, 81], [63, 81], [51, 45], [28, 30], 
];

let tableHeader = '<table rules="all" width="400px"><tbody>\
									<tr>\
										<th>Test</th>\
										<th>Start</th>\
										<th>Goal</th>\
										<th colspan="2"; collapsed>Solution Path</th>\
										<th colspan="2"; collapsed>Selected Path</th>\
									</tr>';

let tableRows = "";
let tableEnd = "";
let studentPathCorrect = 0;
let studentConnectedCorrect = 0;
let solutionPathTime = 0;
let studentPathTime = 0;
let searchStudent = null;
let searchSolution = null;
let testContainer = null;
let randomTests = false;
let ggui = null;

RunTests = function () {

  if (test == 0) {
    tableRows = "";
    studentPathCorrect = 0;
    studentConnectedCorrect = 0;
    solutionPathTime = 0;
    studentPathTime = 0;
    searchStudent = ggui.getAlgorithm();
    searchSolution = new Search_BFS(ggui.map, ggui.config);
  }

	if (test < startTiles.length) {
		let start = [startTiles[test][0], startTiles[test][1]];
		let end = [endTiles[test][0], endTiles[test][1]];

		if (randomTests) {
			start[0] = Math.floor(Math.random() * ggui.map.width);
			start[1] = Math.floor(Math.random() * ggui.map.height);
			end[0] = Math.floor(Math.random() * ggui.map.width);
			end[1] = Math.floor(Math.random() * ggui.map.height);	
		}

		t0 = performance.now();
		searchSolution.startSearch(start[0], start[1], end[0], end[1], ggui.osize);
		while (searchSolution.inProcess) { searchSolution.searchIteration(); }
		let solutionPath = searchSolution.path;
		t1 = performance.now();
		let solutionPathMS = Math.round(t1 - t0);
		solutionPathTime += solutionPathMS;

		t0 = performance.now();
		searchStudent.startSearch(start[0], start[1], end[0], end[1], ggui.osize);
		while (searchStudent.inProcess) { searchStudent.searchIteration(); }
		let studentPath = searchStudent.path;
		t1 = performance.now();
		let studentPathMS = Math.round(t1 - t0);
		studentPathTime += studentPathMS;

		let pathColor = '#ff0000';
		if (searchStudent.cost == searchSolution.cost) {
			studentPathCorrect++;
			pathColor = '#00aa00';
		}

		tableRows	+= "<tr>";
			tableRows += "<td>" + (test + 1) + "</td>";
			tableRows += "<td>(" + start[0] + "," + start[1] + ")</td>";
			tableRows += "<td>(" + end[0] + "," + end[1] + ")</td>";
			tableRows += "<td>" + searchSolution.cost + "</td>";
			tableRows += "<td>" + solutionPathMS + "</td>";
			tableRows	+= "<td><font color='" + pathColor + "'>" + searchStudent.cost + "</font></td>";
			tableRows	+= "<td>" + studentPathMS + "</td>"
		tableRows += "</tr>";

		tableEnd = "<tr>";
			tableEnd += "<td>Total</td>";
			tableEnd += "<td>-</td>";
			tableEnd += "<td>-</td>";
			tableEnd += "<td>-</td>";
			tableEnd += "<td>" + solutionPathTime + "</td>";
			tableEnd += "<td>" + studentPathCorrect + "/" + (test + 1) + "</td>";
			tableEnd += "<td>" + studentPathTime + "</td>";
		tableEnd += "</tr>";

		testContainer.innerHTML = tableHeader + tableRows + tableEnd + "</tbody></table>";
		setTimeout(RunTests, 10);
	}
	test++;
};
