class Grid {
	
	constructor(mapText) {
		this.grid = mapText.split("\n"); 
		this.height = this.grid.length;
		this.width = this.grid[0].length;
		this.maxSize = 3;
	}

	get(x, y) {
		return this.grid[x][y]; 
	}

	isOOB(x, y, size) {
		return x < 0 || y < 0 || (x + size) > this.width || (y + size) > this.height;  
	}
	
};
