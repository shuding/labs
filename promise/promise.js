function a (callback) {
	setTimeout(function () {
		console.log('This is a');
		callback && callback(null);
	}, 100);
}

function b (callback) {
	setTimeout(function () {
		console.log('This is b');
		callback && callback();
	}, 200);
}

function c (callback) {
	setTimeout(function () {
		console.log('This is c');
		callback && callback();
	}, 10);
}

function d (callback) {
	setTimeout(function () {
		console.log('This is d');
		callback && callback();
	}, 60);
}

//a(); b(); c(); d():

// a(function () {
// 	b(function () {
// 		c(function () {
// 			d();
// 		});
// 	});
// });

function promise() {
	if (!(this instanceof promise)) {
		var pr = new promise();
		pr.resolve_set = true;
		return pr;
	}
	this.resolve_set = false;
	this.resolve_fn = null;
	this.__check = function () {
		if (this.resolve_set && this.resolve_fn) {
			this.resolve_fn.exec();
		}
	}
}

promise.prototype.resolve = function () {
	this.resolve_set = true;
	this.__check();
}

promise.prototype.then = function (fn) {
	this.resolve_fn = new promise_obj(fn);//fn.promise();
	this.__check();
	return this.resolve_fn.promise;
}

function promise_obj (fn) {
	this.promise = new promise();
	this.fn = fn;
}

promise_obj.prototype.exec = function () {
	var self = this;
	this.fn(function () {
		self.promise.resolve();
	});
};

var pr = promise().then(a).then(b).then(c);
// d();
// c();
// c(function () {
// 	a();
// });
pr.then(d).then(a).then(d).then(function (next) {
	setTimeout(function () {
		console.log('finish');
		next && next();
	}, 1000);
});

pr.then(function () {
	console.log('fin');
});


// how to execute a tree graph?

