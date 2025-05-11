class Search_Student {

	constructor(grid, config) {
		this.config = config; 		
		this.grid = grid; 		
		this.sx = -1;					
		this.sy = -1;					
		this.gx = -1;					
		this.gy = -1;					
		this.cost = 0;
		this.inProcess = false;
		this.name = 'Student';
		this.path = []; 
		this.open = [];
		this.close = [];
		this.closeStates = []; 
		this.ozize = 1;
	}

	startSearch(sx, sy, gx, gy) {
		this.inProcess = true; 
		this.sx = sx;
		this.sy = sy;
		this.gx = gx;
		this.gy = gy;
		this.path = []; 	
		this.close = []; 
		this.open = [new Node(sx, sy, null, null)];
		this.closeStates = new Array(513 * 513).fill(false);
		this.closeStates[this.hash(sx, sy)] = true; 
	}

	isLegalAction(x, y, action) {
		let nx = x + action[0];
		let ny = y + action[1];
		if (this.grid.isOOB(nx, ny, this.ozize)) return false;
		if (this.grid.get(nx, ny) != this.grid.get(x, y)) return false;
		if (this.closeStates[this.hash(nx, ny)]) return false;
		return true;
	}

	isGoal(x, y) {
		return x == this.gx && y == this.gy; 
	}

	removeFromOpen() {
		if (this.config.strategy == 'bfs') return this.open.shift(); 
		if (this.config.strategy == 'dfs') return this.open.pop(); 
		return null;
	}

	hash(x, y) {
		return x * this.grid.width + y; 
	}
	
	restructPath(node) {
		while (node.parent != null) {
			this.path.push(node.action); 
			node = node.parent; 
		}
		this.path.reverse();
	}

	searchIteration() {
		if (!this.inProcess) { return; }
		if (this.open.length <= 0) {
			this.cost = -1; 
			this.inProcess = false;
			return; 
		}

		let node = this.removeFromOpen();
		this.close.push([node.x, node.y]); 
		if (this.isGoal(node.x, node.y)) {
			this.restructPath(node); 
			this.cost = this.path.length * 100; 
			this.inProcess = false;
			return; 
		}

		for (let i = 0; i < this.config.actions.length; i++) {
			let actionX = this.config.actions[i][0]; 
			let actionY = this.config.actions[i][1]; 
			if (this.isLegalAction(node.x, node.y, [actionX, actionY])) {
				let newX = node.x + actionX;
				let newY = node.y + actionY;
				let expandNode = new Node(newX, newY, [actionX, actionY], node); 
				this.closeStates[this.hash(newX, newY)] = true;
				if (this.config.strategy == 'bfs') {
					this.open.push(expandNode);
				} else if (this.config.strategy == 'dfs') {
					this.open.push(node);
					this.open.push(expandNode);
					return;
				}
			}
		}
	}

	getOpen() {
		let open = []; 
		for (let i = 0; i < this.open.length; i++) {
			open.push([this.open[i].x, this.open[i].y]);
		}
		return open; 
	}

	getClosed() {
		return this.close; 
	}
}

class Node {
	constructor(x, y, action, parent) {
		this.x = x;
		this.y = y;
		this.action = action;
		this.parent = parent;
	}
}
