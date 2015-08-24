// This is a 8-bit gradient image generator
// Based on HTML5 canvas

function gradient () {
	// set defaults
	this.gradient = {
		// rgb
		from: [0, 0, 0],
		to: [255, 255, 255]
	};
	this.size = {
		width: 200,
		height: 150
	};
	this.scale = 2;
}

// setters
gradient.prototype.setGradient = function (from, to) {
	this.gradient.from = from;
	this.gradient.to = to;
};

gradient.prototype.setSize = function (width, height) {
	this.size.width = width;
	this.size.height = height;
};

gradient.prototype.setScale = function (scale) {
	this.scale = scale;
};

// methods
gradient.prototype.printTo = function (canvas) {
	// set properties
	canvas.width = this.size.width * this.scale;
	canvas.height = this.size.height * this.scale;

	// clear colours
	colours = [];

	var ctx = canvas.getContext('2d');

	for (var y = 0; y < this.size.height; ++y) {
		colours.push([]);
		var percent = y * 1.0 / (this.size.height - 1);
		var r = (this.gradient.to[0] - this.gradient.from[0]) * percent + this.gradient.from[0];
		var g = (this.gradient.to[1] - this.gradient.from[1]) * percent + this.gradient.from[1];
		var b = (this.gradient.to[2] - this.gradient.from[2]) * percent + this.gradient.from[2];

		for (var x = 0; x < this.size.width; ++x) {
			colours[y].push([r, g, b]);
		}
	}

	for (var y = 0; y < this.size.height; ++y) {
		for (var x = 0; x < this.size.width; ++x) {
			var r = colours[y][x][0];
			var g = colours[y][x][1];
			var b = colours[y][x][2];
			var delta = [r - (~~(r / 32)) * 32, g - (~~(g / 32)) * 32, b - (~~(b / 32)) * 32];

			if (x + 1 < this.size.width) 
				colours[y][x + 1].forEach(function (c, index) {
					colours[y][x + 1][index] = c + delta[index] * 7.0 / 16;
				});
			if (y + 1 < this.size.height && x)
				colours[y + 1][x - 1].forEach(function (c, index) {
					colours[y + 1][x - 1][index] = c + delta[index] * 3.0 / 16;
				});
			if (y + 1 < this.size.height)
				colours[y + 1][x].forEach(function (c, index) {
					colours[y + 1][x][index] = c + delta[index] * 5.0 / 16;
				});
			if (y + 1 < this.size.height && x + 1 < this.size.width)
				colours[y + 1][x + 1].forEach(function (c, index) {
					colours[y + 1][x + 1][index] = c + delta[index] * 1.0 / 16;
				});

			ctx.fillStyle = 'rgb(' + (~~(r / 32)) * 32 + ',' + (~~(g / 32)) * 32 + ',' + (~~(b / 32)) * 32 + ')';
			ctx.fillRect(x * this.scale, y * this.scale, this.scale, this.scale);
		}
	}
};
