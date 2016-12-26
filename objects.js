
function move_to (x, y, mx, my, canvas, ds) {
	if (ds == null) ds = DRAWING_SIZE;
	mx= mx * ds;
	my= my * ds;
	canvas.moveTo(x+mx,y+my);
}
function line_to (x, y, mx, my, canvas, ds) {
	if (ds == null) ds = DRAWING_SIZE;
	mx= mx * ds;
	my= my * ds;
	canvas.lineTo(x+mx,y+my);
}
function circle (x, y, mx, my, ms, canvas, ds) {
	canvas.beginPath(x,y);
	if (ds == null) ds = DRAWING_SIZE;
	mx= mx * ds;
	my= my * ds;
	ms= ms * ds;
	canvas.arc(x+mx,y+my,ms,0,2*Math.PI);
	canvas.fill();
}
function draw_shape (x, y, array, canvas, ds) {
	var i = 1;
	canvas.beginPath(x,y);
	move_to(x, y, array[0][0], array[0][1], canvas, ds);
	for (i = 1; i < array.length; i++) {
		line_to(x, y, array[i][0], array[i][1], canvas, ds);
	}
	canvas.fill();
}
function draw_lines (x, y, array, canvas, ds) {
	canvas.beginPath(x,y);
	for (i = 0; i < array.length; i+=2) {
		move_to(x, y, array[i][0], array[i][1], canvas, ds);
		line_to(x, y, array[i+1][0], array[i+1][1], canvas, ds);
	}
	canvas.stroke();
	
	// TODO - html canvas draws a black line on the last set of draw_lines/draw_shape function, so this is to bypass that
	draw_shape(-10, -10, [[-10,-10],[-8,-8]], canvas, ds);
}
function draw_outlined (x, y, shape, canvas, ds) {
	draw_shape(x, y, shape, canvas, ds);
					
	var shape_line = [];
	for (var i = 0; i < shape.length; i++) {
		var next = 0;
		if (i == shape.length-1) {
			next = shape[0];
		} else {
			next = shape[i+1];
		}
		var j = i*2;
		shape_line[j] = shape[i];
		shape_line[j+1] = next;
	}

	draw_lines(x, y, shape_line, canvas, ds);

}

function casting_animation (obj, canvas, ds) {

	var dir = null;
	
	var oxy = map_to_screen(CURRENT_ROUND['objects'][obj['owner']]['pos']);
	var ox = oxy[0]-1*ds;
	var oy = oxy[1]+7*ds;
	
	if (obj['dir'] == null) {
		if (obj['dest'] == null) return;
		var xy = map_to_screen(obj['dest']);

		dir = getDir(oxy, xy);
	} else {
		dir = obj['dir'];
	}
	var ax = ox-Math.sin((dir)/RAD)*(5*ds);
	var ay = oy-Math.cos((dir)/RAD)*(5*ds);

	var lx = ox-Math.sin((dir+240)/RAD)*(2*ds);
	var ly = oy-Math.cos((dir+240)/RAD)*(2*ds);
	
	var rx = ox-Math.sin((dir+120)/RAD)*(2*ds);
	var ry = oy-Math.cos((dir+120)/RAD)*(2*ds);

	var fx = ax-Math.sin((dir)/RAD)*(8*ds);
	var fy = ay-Math.cos((dir)/RAD)*(8*ds);
	
	
	canvas.lineWidth = 2;
	canvas.strokeStyle = '#000';
	canvas.beginPath();
	canvas.moveTo(ax,ay);
	canvas.lineTo(rx,ry);
	canvas.stroke();
	canvas.beginPath();
	canvas.moveTo(ax,ay);
	canvas.lineTo(lx,ly);
	canvas.stroke();

	canvas.lineWidth = 4;
	canvas.strokeStyle = '#FFF';//CURRENT_ROUND['objects'][obj['owner']]['colour'];
	canvas.beginPath();
	canvas.moveTo(ax,ay);
	canvas.lineTo(fx,fy);
	canvas.stroke();

	canvas.lineWidth = 2;
	canvas.strokeStyle = '#AA5';
	canvas.beginPath();
	canvas.moveTo(ax,ay);
	canvas.lineTo(fx,fy);
	canvas.stroke();
	canvas.lineWidth = 1;
	
}

function player_character_animation (obj, canvas, cr, colour, ds) {
	var xy = map_to_screen(obj['pos']);
	var x = xy[0];
	var y = xy[1];

	if ('frozen' in obj && obj['frozen']===true) {
		canvas.strokeStyle="#FFF";	
	} else {
		canvas.strokeStyle="#000";	
	}
	
	canvas.fillStyle="#000";
	var shape = [
		[+4,-4],
		[-8,-1],
		[-10,+2],
		[+8,+2],
	];
	draw_outlined(x, y, shape, canvas, ds);
	canvas.fill();

	canvas.fillStyle=colour;
	shape = [
			[-0,-8],
			[-8,-16],
			[-8,-8],
	];
	draw_outlined(x, y, shape, canvas, ds);

	shape = [
			[-0,-8],
			[-8,-8],
			[-16,-0],
			[+10,-4],
	];
	draw_outlined(x, y, shape, canvas, ds);
	
	canvas.beginPath(x,y);

	var mx = cr % 4 -2;
	if (cr == -1) mx = 0;
	shape = [
		[+8,+2],
		[-10,+2],
		[-20+mx,+16+mx],
		
		[+7,+13],
		[+9,+12],
		[+10,+11],
		[+10,+9],
	];
	draw_outlined(x, y, shape, canvas, ds);
/*
	canvas.strokeStyle="#000";
	var shape = [
		[-14,+4],
		[-12,+13],
		
		[-16,+7],
		[-14,+14],

		[-18,+12],
		[-16,+15],
	];
	draw_lines(x, y, shape, canvas, ds);
*/

	// draw shoe
	if (obj['sprinting']) {
		var sx = x-21*ds+mx;
		var sy = y+19*ds+mx;
		shoeAnimation(sx,sy,canvas,ds,0);
	}

}

function shoeAnimation (x, y, canvas, ds, frame) {
			
	canvas.fillStyle ="#D22";
	var shape = [
		[5, -10],
		[11,-5],

		[10,-3],
		[9,-2],
		[11,0],
		[14,-1],

		[16,3],
		[14,6],
		[2,6],

		[-6,-5],

	];			
	draw_shape(x, y, shape, canvas, ds);
	
	canvas.strokeStyle ="#000";

	shape = [			
		[10,-3],
		[8,-4],
		
		[10,-2],
		[7,0],
		
		[11,0],
		[10,2],
		
		[14,6],
		[2,6],
		[2,6],
		[-6,-5],
	];
	draw_lines(x, y, shape, canvas, ds);
	
}
var player_animation = {
	'still':{'total':1,'animations':
		{'frames':[4],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {	
			player_character_animation(obj, canvas, 0, not_nice, ds);
		},
		function (x,y) {
		}],},
		'finish':function (obj) {},
	},

	'moving':{
		'total':1,'animations':
		{'frames':[1],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {	
			player_character_animation(obj, canvas, cr, not_nice, ds);
		}],},
		'finish':function (obj) {},
	},
	'hit': {
		'total':1,'animations':
		{'frames':[4],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {	
			var xy = map_to_screen(obj['pos']);
			var x = xy[0];
			var y = xy[1];
			if (cr % 2 == 0) {
				canvas.fillStyle="#000";
			} else {
				canvas.fillStyle="#FFF";
			}
			circle (x, y, 0, 0, 10, canvas, ds);
			canvas.fill();
		}],},
		'finish':function (obj) {/*obj['action'] = 'moving';*/},
	},
	'death': {
		'total':1,'animations':
		{'frames':[4],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {	
			var xy = map_to_screen(obj['pos']);
			var x = xy[0];
			var y = xy[1];
			  canvas.fillStyle="#000";
			  canvas.arc(x,y,10*ds-(cr/FRAME_LENGTH+1)*ds,0,2*Math.PI);
			  canvas.fill();
		}],},
		'finish':function (obj) {killObject(obj);},
	},
};

var boomerang_animation = {
	'still':{'total':1,'animations':
		{'frames':[4],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {	
			var xy = map_to_screen(obj['pos']);
			var x = xy[0];
			var y = xy[1];

		  canvas.fillStyle="#641";
			var shape = [
			  [-10,-16],
			  [+16,-16],
			  [+8,-8],
			  [-10,-10],
		  ];
			draw_shape(x, y, shape, canvas, ds);
		  
			var shape = [
			  [-16,-10],
			  [-16,+16],
			  [-8,+8],
			  [-10,-10],
			];
			draw_shape(x, y, shape, canvas, ds);
			
			canvas.lineStyle="#641";
			canvas.beginPath();
			var mx = -8*ds;
			var my = -8*ds;
			var ms = 8*ds;
			canvas.arc(x+mx, y+my, ms, 2*Math.PI / 8*3, 2*Math.PI/8*7);
			canvas.fill();
			
		}],},
		'finish':function (obj) {obj['current_animation'] = 0;},
	},

	'moving':{
		'total':1,'animations':
		{'frames':[1],
		'func':[
		function (x,y) {}],},
		'finish':function (obj) {},
	},
	'hit': {
		'total':1,'animations':
		{'frames':[4],
		'func':[
		function (x,y, cr) {}],},
		'finish':function (obj) {/*obj['action'] = 'moving';*/},
	},
	'death': {
		'total':1,'animations':
		{'frames':[4],
		'func':[
		function (x,y, cr) {}],},
		'finish':function (obj) {killObject(obj);},
	},
};

function old_fire_animation (obj,canvas, cr,not_nice, ds) {	
	var xy = map_to_screen(obj['pos']);
	var x = xy[0];
	var y = xy[1];
	
		canvas.beginPath(x,y);

		var d = cr%4;
		var one = 5;
		var two = 10;
			canvas.fillStyle="#F48";
		
		if (d < 2) {
			one = 10;
			two =  5;
			canvas.fillStyle="#F84";
		}
		

	var shape = [
		[-one,-10],
		[+one,-10],
		[+two,-5],
		[+one,-0],
		[+two,+5],
		[+one,+10],
		
		[-one,+10],
		[-two,+5],
		[-one,-0],
		[-two,-5],
		[-one,-10],
	  ];
	draw_shape(x, y, shape, canvas, ds);
}

var fire_animation = {
	'still':{'total':1,'animations':
		{'frames':[20],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {	
			var xy = map_to_screen(obj['pos']);
			var x = xy[0];
			var y = xy[1];

			canvas.fillStyle="#F00";
			circle (x, y, 0, 0, 10, canvas, ds);
			canvas.fill();	
			
			var shape = [
				[0,-10],
				[-10,-20],
				[-10,0],
			  ];
			draw_shape(x, y, shape, canvas, ds);
			
	
			var ran = Math.random()*100;
			
			canvas.fillStyle="#FF0";
			if (ran > 20) {
				if (ran % 10 < 3) {
					canvas.fillStyle="#DA0";
				} else if (ran % 10 < 7) {
					canvas.fillStyle="#FB0";
				}
				if (ran < 60) {
					var shape = [
						[0,-6],
						[-6,-12],
						[-6,0],
					  ];
				} else {
					var shape = [
						[0,-6],
						[-9,-9],
						[-6,0],
					  ];				
				}
				draw_shape(x, y, shape, canvas, ds);
				canvas.fill();	
			}
			canvas.fillStyle="#FF0";
			circle (x, y, 0, 0, 6, canvas, ds);
			canvas.fill();

		}],},
		'finish':function (obj) {},
	},

	'moving':{
		'total':1,'animations':
		{'frames':[1],
		'func':[
		function (x,y) {}],},
		'finish':function (obj) {},
	},
	'hit': {
		'total':1,'animations':
		{'frames':[4],
		'func':[
		function (x,y, cr) {}],},
		'finish':function (obj) {/*obj['action'] = 'moving';*/},
	},
	'death': {
		'total':1,'animations':
		{'frames':[4],
		'func':[
		function (x,y, cr) {}],},
		'finish':function (obj) {killObject(obj);},
	},
};

var shot_animation = {
	'still':{'total':1,'animations':
		{'frames':[20],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {	
			var xy = map_to_screen(obj['pos']);
			var x = xy[0];
			var y = xy[1];

			canvas.fillStyle="#FFF";
			canvas.beginPath();
			canvas.arc(x,y,10*ds,0,2*Math.PI);

			canvas.fill();

			canvas.fillStyle="#000";
			canvas.arc(x,y,10*ds,0,2*Math.PI);
			canvas.stroke();
		}],},
		'finish':function (obj) {},
	},

	'moving':{
		'total':1,'animations':
		{'frames':[1],
		'func':[
		function (x,y) {}],},
		'finish':function (obj) {},
	},
	'hit': {
		'total':1,'animations':
		{'frames':[4],
		'func':[
		function (x,y, cr) {}],},
		'finish':function (obj) {/*obj['action'] = 'moving';*/},
	},
	'death': {
		'total':1,'animations':
		{'frames':[4],
		'func':[
		function (x,y, cr) {}],},
		'finish':function (obj) {killObject(obj);},
	},
};


var beam_animation = {
	'opening':{'total':1,'animations':
		{'frames':[1],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {	

			var xy = map_to_screen(obj['pos']);
			var x = xy[0];
			var y = xy[1];
			xy = map_to_screen(obj['dest']);
			var dx = xy[0];
			var dy = xy[1];
	
			var dir = getDir(obj['pos'],obj['dest']);
			
			var ax = Math.sin((dir+90)/RAD)*(2);
			var ay = Math.cos((dir+90)/RAD)*(2);
			
			var ax2 = Math.sin((dir-90)/RAD)*(2);
			var ay2 = Math.cos((dir-90)/RAD)*(2);
			
			var fx = Math.sin((dir)/RAD)*(4);
			var fy = Math.cos((dir)/RAD)*(4);

			canvas.beginPath();
			canvas.fillStyle="#CCF";
			
			canvas.lineTo(x+ax-fx*2,y+ay-fy*2);
			canvas.lineTo(x+ax2-fx*2,y+ay2-fy*2);
			
			canvas.lineTo(dx+ax2,dy+ay2);
			canvas.lineTo(dx+ax,dy+ay);
			canvas.fill();
			//obj['current_animation']++;

			
		}],},
		'finish':function (obj) {obj['action']='still';},
	},
	'still':{'total':1,'animations':
		{'frames':[3],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {	

			var xy = map_to_screen(obj['pos']);
			var x = xy[0];
			var y = xy[1];
			xy = map_to_screen(obj['dest']);
			var dx = xy[0];
			var dy = xy[1];
	
			var dir = getDir(obj['pos'],obj['dest']);
			
			var ax = Math.sin((dir+90)/RAD)*(2);
			var ay = Math.cos((dir+90)/RAD)*(2);
			
			var ax2 = Math.sin((dir-90)/RAD)*(2);
			var ay2 = Math.cos((dir-90)/RAD)*(2);
			
			var fx = Math.sin((dir)/RAD)*(4);
			var fy = Math.cos((dir)/RAD)*(4);

			canvas.beginPath();
			canvas.fillStyle ="#77F";
			
			var cr = 3;
			
			var mr = cr % 4;
			var md = (3+mr)*ds;
			canvas.lineTo(x+ax*md-fx*md,y+ay*md-fy*md);
			canvas.lineTo(x+ax2*md-fx*md,y+ay2*md-fy*md);
			
			canvas.lineTo(dx+ax2*md,dy+ay2*md);
			canvas.lineTo(dx+ax*md,dy+ay*md);
			canvas.fill();
			
			canvas.beginPath();
			canvas.fillStyle="#00F";
			
			mr = cr % 2;
			md = (2+mr)*ds;
			canvas.lineTo(x+ax*md-fx*md,y+ay*md-fy*md);
			canvas.lineTo(x+ax2*md-fx*md,y+ay2*md-fy*md);
			
			canvas.lineTo(dx+ax2*md,dy+ay2*md);
			canvas.lineTo(dx+ax*md,dy+ay*md);
			canvas.fill();
			
			canvas.beginPath();
			canvas.fillStyle="#AAF";
			
			canvas.lineTo(x+ax-fx*md,y+ay-fy*md);
			canvas.lineTo(x+ax2-fx*md,y+ay2-fy*md);
			
			canvas.lineTo(dx+ax2,dy+ay2);
			canvas.lineTo(dx+ax,dy+ay);
			canvas.fill();
			
				// some circles at the end
			var x_dif = ax2*md - ax*md;
			var y_dif = ay2*md - ay*md;
			for (var i = 0; i < 5; i++) {
				var ran = Math.floor(Math.random()*3);
				if (ran == 1) {
					canvas.fillStyle="#99F";
				} else if (ran == 2) {
					canvas.fillStyle="#CAF";
				} else if (ran == 3) {
					canvas.fillStyle="#ACF";
				}
				var cs = Math.random()*3+3;
				var cx = ax2*md - x_dif*i/4;
				var cy = ay2*md - y_dif*i/4;
				circle (dx, dy, cx, cy, cs, canvas, ds);
			}
			canvas.fill();
			
		}],},
		'finish':function (obj) {killObject(obj);},
	},
	'icon':{'total':1,'animations':
		{'frames':[3],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {	

			var x = obj['pos'][0];
			var y = obj['pos'][1];
			
			canvas.beginPath();
			canvas.fillStyle ="#77F";
			var shape = [
				[-16,-13],
				[-16,13],
				
				[16,13],
				[16,-13],
			];
			draw_shape(x, y, shape, canvas, ds);
			
			canvas.fillStyle="#00F";
			
			var shape = [
				[-16,-9],
				[-16,9],
				
				[16,9],
				[16,-9],
			];
			draw_shape(x, y, shape, canvas, ds);
			
			canvas.fillStyle="#AAF";
			
			var shape = [
				[-16,-5],
				[-16,5],
				
				[16,5],
				[16,-5],
			];
			draw_shape(x, y, shape, canvas, ds);


		}],},
		'finish':function (obj) {obj['current_animation'] = 0;},
	},

	'moving':{
		'total':1,'animations':
		{'frames':[1],
		'func':[
		function (x,y) {}],},
		'finish':function (obj) {},
	},

	'death': {
		'total':1,'animations':
		{'frames':[4],
		'func':[
		function (x,y, cr) {}],},
		'finish':function (obj) {killObject(obj);},
	},
};


var bomb_animation = {
	'still':{'total':1,'animations':
		{'frames':[20],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {	
			var xy = map_to_screen(obj['pos']);
			var x = xy[0];
			var y = xy[1];
			canvas.fillStyle="#000";
			circle (x, y, 0, 0, 5, canvas, ds);
			canvas.fill();
			
			if (CURRENT_ROUND != null && obj['owner'] >= 0) {
				var dist = getDist(obj['pos'][0], obj['pos'][1], obj['dest'][0], obj['dest'][1]);
				
				var owner_pos = CURRENT_ROUND['objects'][obj['owner']]['pos'];
				var total_dist = getDist(owner_pos[0], owner_pos[1], obj['dest'][0], obj['dest'][1]);
				
				if (dist / total_dist > 0.6) {
					canvas.fillStyle="#FFF";
				} else if (dist / total_dist > 0.4) {
					canvas.fillStyle="#FBB";				
				} else if (dist / total_dist > 0.3) {
					canvas.fillStyle="#F88";
				} else if (dist / total_dist > 0.2) {
					canvas.fillStyle="#F44";
				} else if (dist / total_dist > 0.1) {
					canvas.fillStyle="#F11";
				} else {
					canvas.fillStyle="#F00";				
				}
			} else {
					canvas.fillStyle="#F00";				
			}
			/*
			if (cr % 32 < 16) {
				canvas.fillStyle="#FFF";
			} else {
				canvas.fillStyle="#F00";
			}
			*/
			var shape = [
				[-0,-5],
				[-5,0],
				[-0,+5],
				[+5,0],
			  ];
			draw_shape(x, y, shape, canvas, ds);
			
		}],},
		'finish':function (obj) {},
	},

	'moving':{
		'total':1,'animations':
		{'frames':[1],
		'func':[
		function (x,y) {}],},
		'finish':function (obj) {},
	},
	'hit': {
		'total':1,'animations':
		{'frames':[4],
		'func':[
		function (x,y, cr) {}],},
		'finish':function (obj) {/*obj['action'] = 'moving';*/},
	},
	'death': {
		'total':1,'animations':
		{'frames':[4],
		'func':[
		function (x,y, cr) {}],},
		'finish':function (obj) {killObject(obj);},
	},
};

var explosion_animation = {
	'still':{'total':1,'animations':
		{'frames':[2],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {	
			var xy = map_to_screen(obj['pos']);
			var x = xy[0];
			var y = xy[1];
			
					
		var mr = 30 + cr % 10;
		
		canvas.beginPath();
		canvas.fillStyle="#F55";
		
		var shape = [
			[+mr,+mr],
			[-mr,+mr],
			
			[-mr,-mr],
			[+mr,-mr],
		  ];
			draw_shape(x, y, shape, canvas, ds);
		  		
		canvas.fillStyle="#F00";
		
		mr = 30 + 10 - (cr % 10);
		var shape = [
			[+mr,0],
			[0,+mr],			
			[-mr,0],
			[0,-mr],
		  ];
		draw_shape(x, y, shape, canvas, ds);
		  


		}],},
		'finish':function (obj) {killObject(obj);},
	},

	'moving':{
		'total':1,'animations':
		{'frames':[1],
		'func':[
		function (x,y) {}],},
		'finish':function (obj) {},
	},
	'hit': {
		'total':1,'animations':
		{'frames':[0],
		'func':[
		function (x,y, cr) {}],},
		'finish':function (obj) {obj['action'] = 'still';},
	},
	'death': {
		'total':1,'animations':
		{'frames':[4],
		'func':[
		function (x,y, cr) {}],},
		'finish':function (obj) {killObject(obj);},
	},
};

function sound_animation (x,y,spread,size,dir,canvas,ds,icon) {
			
			canvas.lineWidth = 20;
			canvas.fillStyle="#222";
			canvas.strokeStyle="#222";
			if (icon) {
				canvas.lineWidth = 4;
				canvas.fillStyle="#222";
				canvas.strokeStyle="#222";
			}
			for (var i = 1; i < 8; i++) {
				canvas.beginPath();
				canvas.arc(x,y,size*i*ds, dir-spread/2,dir+spread/2);
				canvas.stroke();
			}
			canvas.lineWidth = 1;	
}
function sonic_intermediary (obj,canvas, cr,not_nice, ds) {	
			
	var xy = map_to_screen(obj['pos']);
	var x = xy[0];
	var y = xy[1];

	var dir = getDir([obj['pos'][0],obj['dest'][1]], [obj['dest'][0],obj['pos'][1]])+90;
	dir = dir/RAD;
	var spr = obj['spread']/RAD/2;
	var ms = obj['size']*ds/8;
	
	sound_animation (x,y,spr,ms,dir,canvas,ds,false);

}

var sonic_animation = {
	'still':{'total':1,'animations':
		{'frames':[3],
		'func':[sonic_intermediary],},
		'finish':function (obj) {killObject(obj);},
	},
	'icon':{'total':1,'animations':
		{'frames':[3],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {	
			var x = 0;
			var y = 0;

			var dir = 45/RAD;
			var spr = obj['spread']/RAD;
			var ms = 5;
			
			sound_animation (x,y,spr,ms,dir,canvas,ds,true);
	
		}],},
		'finish':function (obj) {killObject(obj);},
	},

	'moving':{
		'total':1,'animations':
		{'frames':[1],
		'func':[
		function (x,y) {}],},
		'finish':function (obj) {},
	},
	'hit': {
		'total':1,'animations':
		{'frames':[2],
		'func':[sonic_intermediary],},
		'finish':function (obj) {killObject(obj);},
	},
	'death': {
		'total':1,'animations':
		{'frames':[4],
		'func':[
		function (x,y, cr) {}],},
		'finish':function (obj) {killObject(obj);},
	},
};

var lightning_animation = {
	'opening':{'total':1,'animations':
		{'frames':[1],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {	
// lightning coming down
			var xy = map_to_screen(obj['dest']);
			var x = xy[0];
			var y = xy[1];

			canvas.beginPath();
			canvas.fillStyle="#FF0";
			canvas.strokeStyle="#000";

			var shapes = [
				[
					[-6,-12],
					[+4,-12],

					[+8,-0],
					[0,-5],
				],
				[
					[+8,-0],
					[-0,-0],
					[-6,-5],
					[0,-5],
				],
				[
					[-0,-0],
					[3,+12],
					[-6,-5],
				],
				[
					[1,+8],
					[3,+12],
					[5,+8],
				],
			];
			var f = Math.round(cr/shapes.length);
			if (f == shapes.length) f--;

			var con = shapes[f];
			if (f > 0) {
				con = shapes[f-1].concat(shapes[f]);
			}
			if (f < shapes.length-1) {
				con = shapes[f].concat(shapes[f+1]);
			}
		//	console.log(con);
			draw_outlined(x, y-15*ds, shapes[f], canvas, ds*2);
	
		}],},
		'finish':function (obj) {
			obj['action'] = 'still';
			return true;
		},
	},	
	'still':{'total':1,'animations':
		{'frames':[1],
		'func':[
		
		function (obj,canvas, cr,not_nice, ds) {	
// lightning exploding out
			var xy = map_to_screen(obj['dest']);
			var x = xy[0];
			var y = xy[1];

			canvas.beginPath();
			canvas.strokeStyle ="#FF0";
			canvas.lineWidth = 2;
			/*var shape = [
				[0,-4],
				[0,-2],

				[6,-3],
				[2,-1],

				[6,3],
				[2,1],

				
				[0,6],
				[0,2],

				[-6,3],
				[-2,1],

				[-6,-3],
				[-2,-1],

			];			
			draw_lines(x, y, shape, canvas, ds*(cr)/3);*/
			canvas.arc(x,y,cr*2*ds, 0, 2* Math.PI);
			canvas.stroke();
			canvas.lineWidth = 1;
		
	
		}
		],},
		'finish':function (obj) {
			killObject(obj);
			return true;
		},
	},
	'icon':{'total':1,'animations':
		{'frames':[3],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {	

			var x = obj['pos'][0];
			var y = obj['pos'][1];
			x = x-2;
			canvas.beginPath();
			canvas.fillStyle="#FF0";
			canvas.strokeStyle="#000";

			var shape = [
				[-6,-12],
				[+4,-12],

				[+8,-0],
				[-0,-0],

				[3,+12],

				[-6,-5],
				[0,-5],

			  ];
			draw_outlined(x, y, shape, canvas, ds);
		 
		}],},
		'finish':function (obj) {killObject(obj);},
	},

	'moving':{
		'total':1,'animations':
		{'frames':[1],
		'func':[
		function (x,y) {}],},
		'finish':function (obj) {},
	},
	'death': {
		'total':1,'animations':
		{'frames':[4],
		'func':[
		function (x,y, cr) {}],},
		'finish':function (obj) {killObject(obj);},
	},
};

function snowflake_animation (x,y,size,shape,canvas, ds, icon) {	
	  
	  canvas.fillStyle="#FFF";
	  //circle(x, y, 0, 0, size, canvas, ds);

	  if (shape == null) {
		var sz = size;
		var sh = [
			[-sz,-sz],
			[sz,sz],
			
			[sz,-sz],
			[-sz,sz],
			
			[sz,0],
			[-sz,0],
			
			[0,-sz],
			[0,sz],
			
		];
		var sym = Math.round(Math.random()*6+2);
		
		for (var i = 0; i < sym; i++) {
			var sx = Math.round(Math.random()*sz);
			var sy = Math.round(Math.random()*sz);
			var fx = Math.round(Math.random()*sz);
			var fy = Math.round(Math.random()*sz);
			sh.push([sx,sy]);
			sh.push([fx,fy]);
		}
		var nsh = [];
		for (var s in sh) {
			nsh[s] = [sh[s][0], -sh[s][1]];
		}
		sh = sh.concat(nsh);
		var nsh = [];
		for (var s in sh) {
			nsh[s] = [-sh[s][0], sh[s][1]];
		}
		sh = sh.concat(nsh);
		var nsh = [];
		for (var s in sh) {
			nsh[s] = [-sh[s][0], -sh[s][1]];
		}
		sh = sh.concat(nsh);

		shape = sh;
	  }
	  
	  
	  canvas.strokeStyle="#FFF";
	  
	  if (icon) canvas.strokeStyle="#88F";

	  canvas.lineWidth = 2;
	  draw_lines(x, y, shape, canvas, ds);
	  canvas.lineWidth = 1;

	  return shape;

}
var ice_animation = {
	'still':{'total':1,'animations':
		{'frames':[2],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {	
			var xy = map_to_screen(obj['pos']);
			var x = xy[0];
			var y = xy[1];
		  // TODO - make ice into randomly generated icicle
		  var shape = null;
		  
		  if ('shape' in obj && obj['shape'] != null) shape = obj['shape'];
  
		  obj['shape'] = snowflake_animation(x,y,obj['size'],shape,canvas,ds,false);

		}],},
		'finish':function (obj) {},
	},

	'icon':{'total':1,'animations':
		{'frames':[2],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {	
			var xy = obj['pos'];
			var x = xy[0];
			var y = xy[1];
		  // TODO - make ice into randomly generated icicle
		  var shape = null;
		  
		  if ('shape' in obj && obj['shape'] != null) shape = obj['shape'];
  
		  obj['shape'] = snowflake_animation(x,y,obj['size'],shape,canvas,ds,true);

		}],},
		'finish':function (obj) {},
	},

	'moving':{
		'total':1,'animations':
		{'frames':[1],
		'func':[
		function (x,y) {}],},
		'finish':function (obj) {},
	},
	'hit': {
		'total':1,'animations':
		{'frames':[4],
		'func':[
		function (x,y, cr) {}],},
		'finish':function (obj) {/*obj['action'] = 'moving';*/},
	},
	'death': {
		'total':1,'animations':
		{'frames':[4],
		'func':[
		function (x,y, cr) {}],},
		'finish':function (obj) {killObject(obj);},
	},
};




var homing_animation = {
	'still':{'total':1,'animations':
		{'frames':[9],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {

			if (cr % 3 == 0) {
				obj['chain'].push(obj['pos']);
				if (obj['chain'].length > 4) {
					obj['chain'].splice(0, 1);
				}
			}
			canvas.strokeStyle="#8FF";
			canvas.fillStyle="#AAF";
		  			
			var sz = 16;
			for (var sp in obj['chain']) {
				var spot = obj['chain'][sp];
				var xy = map_to_screen(spot);
				var x = xy[0];
				var y = xy[1];
				circle(x,y,0,0,sz,canvas,ds);
				canvas.fill();
				sz-=2;
			}

		}],},
		'finish':function (obj) {killObject(obj);},
	},
	'icon':{'total':1,'animations':
		{'frames':[3],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {
			
			var chain = [
					[8,8],
					[13,13],
					[18,18],
					[23,23],
				];
			
			canvas.strokeStyle="#8FF";
			canvas.fillStyle="#AAF";
		  			
			var sz = 10;
			for (var sp in chain) {
				var spot = chain[sp];
				var xy = spot;
				var x = xy[0];
				var y = xy[1];
				circle(x,y,0,0,sz,canvas,ds);
				canvas.fill();
				sz-=2;
			}
		}],},
		'finish':function (obj) {obj['current_animation'] = 0;},
	},

	'moving':{
		'total':1,'animations':
		{'frames':[1],
		'func':[
		function (x,y) {}],},
		'finish':function (obj) {},
	},
	'hit': {
		'total':1,'animations':
		{'frames':[3],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {	

		}],},		
		'finish':function (obj) {obj['action'] = 'still';},
	},
	'death': {
		'total':1,'animations':
		{'frames':[4],
		'func':[
		function (x,y, cr) {}],},
		'finish':function (obj) {killObject(obj);},
	},
};



function mouth_animation (x, y, canvas, ds, height, icon) {

	canvas.fillStyle="#FFF";
	canvas.strokeStyle="#FFF";
	/*if (icon)*/ canvas.strokeStyle="#000";

	var shape = [
		[20, 0],
		[10, -12],
		[-10, -12],
		[-20, 0],
		[-18, 0],
	
		
				[-14, -6],
		[-10, -2],
		[-6, -10],

		[6, -10],
		[10, -2],
		[14, -6],
		[18, 0],

];
	for (var s in shape) {
		shape[s][1] *= height;
	}
	draw_outlined(x, y, shape, canvas, ds);

shape = [
		[-18, 0],
		[-20, 0],
		[-10,12],
		[10,12],
		[20, 0],
		[18, 0],
		
		
		[16, 0],

		[10, 9],
		[8, 4],
		[6, 9],

		[-6, 9],
		[-8, 4],
		[-10, 9],

		[-16, 0],

		[-14, -6],

	];
	for (var s in shape) {
		shape[s][1] *= height;
	}
	draw_outlined(x, y, shape, canvas, ds);

}

var lifesteal_animation = {
	'still':{'total':1,'animations':
		{'frames':[2],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {	
				var xy = map_to_screen(obj['pos']);
				var x = xy[0];
				var y = xy[1];
				
				var height = 1;
				var f = cr;//Math.round(cr/2);
				if (cr > 10) {
					height = (10-f/2+5)/10;
				} else {
					height = (f+5)/10;
				}
				mouth_animation (x, y, canvas, ds, height, false);
				
		}],},
		'finish':function (obj) {},
	},
	'icon':{'total':1,'animations':
		{'frames':[3],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {	
				var x = obj['pos'][0];
				var y = obj['pos'][1];

				mouth_animation (x, y, canvas, ds, 1, true);

		}],},
		'finish':function (obj) {obj['current_animation'] = 0;},
	},

	'moving':{
		'total':1,'animations':
		{'frames':[1],
		'func':[
		function (x,y) {}],},
		'finish':function (obj) {},
	},
	'hit': {
		'total':1,'animations':
		{'frames':[3],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {	

		}],},		
		'finish':function (obj) {obj['action'] = 'still';},
	},
	'death': {
		'total':1,'animations':
		{'frames':[4],
		'func':[
		function (x,y, cr) {}],},
		'finish':function (obj) {killObject(obj);},
	},
};

var lifeReturn_animation = {
	'still':{'total':1,'animations':
		{'frames':[3],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {	
				var xy = map_to_screen(obj['pos']);
				var x = xy[0];
				var y = xy[1];

				canvas.fillStyle="#44F";
				circle(x,y,0,0,5,canvas,ds);

				canvas.fillStyle="#F44";
				circle(x,y,0,0,3,canvas,ds);
		}],},
		'finish':function (obj) {},
	},

	'moving':{
		'total':1,'animations':
		{'frames':[1],
		'func':[
		function (x,y) {}],},
		'finish':function (obj) {},
	},
	'hit': {
		'total':1,'animations':
		{'frames':[3],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {	

		}],},		
		'finish':function (obj) {obj['action'] = 'still';},
	},
	'death': {
		'total':1,'animations':
		{'frames':[4],
		'func':[
		function (x,y, cr) {}],},
		'finish':function (obj) {killObject(obj);},
	},
};

function grabber_animation (obj, canvas, cr, ds) {
	var xy = map_to_screen(obj['pos']);
	var x = xy[0];
	var y = xy[1];
	
	var pxy = map_to_screen(CURRENT_ROUND['objects'][obj['owner']]['pos']);
	
	canvas.lineWidth = 3;

	canvas.beginPath();
	canvas.strokeStyle = '#555';
	canvas.moveTo(x,y);
	canvas.lineTo(pxy[0],pxy[1]);
	canvas.stroke();

	var angle = (getDir(xy, pxy));
	var circle_sz = 6;
	var og_circle_sz = circle_sz;
	//i > OBJECTS['grab']['aim_range']/og_circle_sz+2
	var dist = getDist(xy[0],xy[1],pxy[0],pxy[1]);
	var max_range = OBJECTS['grab']['aim_range'];
	var cap = max_range/og_circle_sz+2;
	var gap_sz = circle_sz;
	
	if (dist > max_range) {
		gap_sz = dist/cap;
	}

	canvas.beginPath();
	canvas.strokeStyle = '#FF0';
	
	var sx = x+Math.sin((angle+45)/RAD)*(circle_sz*3*ds);
	var sy = y+Math.cos((angle+45)/RAD)*(circle_sz*3*ds);
	canvas.moveTo(x,y);
	canvas.lineTo(sx,sy);

	var sx = sx+Math.sin((angle-15)/RAD)*(circle_sz*3*ds);
	var sy = sy+Math.cos((angle-15)/RAD)*(circle_sz*3*ds);
	canvas.lineTo(sx,sy);
	canvas.stroke();

	
	var sx = x+Math.sin((angle-45)/RAD)*(circle_sz*3*ds);
	var sy = y+Math.cos((angle-45)/RAD)*(circle_sz*3*ds);
	canvas.moveTo(x,y);
	canvas.lineTo(sx,sy);

	var sx = sx+Math.sin((angle+15)/RAD)*(circle_sz*3*ds);
	var sy = sy+Math.cos((angle+15)/RAD)*(circle_sz*3*ds);
	canvas.lineTo(sx,sy);
	canvas.stroke();

	canvas.lineWidth = 1;

	canvas.beginPath();
	canvas.strokeStyle = '#000';

	var i = 1;
	var dxy = [x,y];

	canvas.fillStyle = '#FF0';
	circle(dxy[0],dxy[1], 0, 0, circle_sz+2, canvas, ds);
	canvas.fillStyle = '#F00';
	circle(dxy[0],dxy[1], 0, 0, circle_sz, canvas, ds);
	

	while (
		Math.abs(dxy[0] - pxy[0]) > circle_sz*3+gap_sz-2 || 
		Math.abs(dxy[1] - pxy[1]) > circle_sz*3+gap_sz-2	
	) {
		
		angle = getDir(dxy, pxy);
		
		dxy[0] = dxy[0]-Math.sin((angle)/RAD)*(gap_sz*ds);
		dxy[1] = dxy[1]-Math.cos((angle)/RAD)*(gap_sz*ds);	
		
		canvas.fillStyle = '#000';
		circle(dxy[0],dxy[1], 0, 0, circle_sz, canvas, ds);
		canvas.fillStyle = '#bbb';
		circle(dxy[0],dxy[1], 0, 0, circle_sz-2, canvas, ds);
		i++;
		if (i > cap) {
			console.log('failed');
			return;
		}
		
	}
	canvas.stroke();

}
var grab_animation = {
	'still':{'total':1,'animations':
		{'frames':[8],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {	
				grabber_animation(obj,canvas, cr, ds);
		}],},
		'finish':function (obj) {
			obj['current_animation'] = 0;
			obj['chasing_speed'] *= 1.2;

			if ('target' in obj && obj['target'] != -1) {
				killObject(obj);
				return true;
			}
		},
	},
	'icon':{'total':1,'animations':
		{'frames':[3],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {	
				
			canvas.lineWidth = 2;
			canvas.beginPath();
			canvas.strokeStyle = '#000';

			canvas.moveTo(obj['pos'][0],obj['pos'][1]);
			canvas.lineTo(obj['dest'][0], obj['dest'][1]);
			canvas.stroke();

			canvas.beginPath();
			var angle = (getDir(obj['dest'], obj['pos'])+180)%360/RAD;
			canvas.arc(obj['dest'][0], obj['dest'][1],4,angle-(0.5*Math.PI), angle+(0.5*Math.PI));
			canvas.stroke();

			canvas.lineWidth = 1;

		}],},
		'finish':function (obj) {obj['current_animation'] = 0;},
	},

	'moving':{
		'total':1,'animations':
		{'frames':[1],
		'func':[
		function (x,y) {}],},
		'finish':function (obj) {},
	},
	'hit': {
		'total':1,'animations':
		{'frames':[4],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {	
			grabber_animation(obj,canvas, cr, ds);
		}],},		
		'finish':function (obj) {killObject(obj);},
	},
	'death': {
		'total':1,'animations':
		{'frames':[4],
		'func':[
		function (x,y, cr) {}],},
		'finish':function (obj) {killObject(obj);},
	},
};


var gravity_animation = {
	'opening':{'total':1,'animations':
		{'frames':[1],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {	
			var xy = map_to_screen(obj['pos']);
			var x = xy[0];
			var y = xy[1];			
			
			canvas.fillStyle = '#808';
			var f = cr;
			if (f > obj['size']) f = obj['size'];
			circle(x, y, 0, 0, f*ds, canvas, ds);

		}],},
		'finish':function (obj) {obj['action'] = 'still';},
	},
		'still':{'total':1,'animations':
		{'frames':[18],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {	
			var xy = map_to_screen(obj['pos']);
			var x = xy[0];
			var y = xy[1];			
			
			canvas.fillStyle = '#808';
			circle(x, y, 0, 0, obj['size']/4, canvas, ds);

			canvas.strokeStyle = '#0DD';
			var num = 8;
			for (var i = 0; i < num; i++) {
				canvas.beginPath();
				var angle = (360*i/num+cr*3+180)%360/RAD;

				var sx = Math.sin((360*i/num+cr*3)/RAD)*(obj['size']/4);
				var sy = Math.cos((360*i/num+cr*3)/RAD)*(obj['size']/4);
				canvas.arc(x-sx*ds,y-sy*ds,obj['size']*3/4*ds,angle, angle+(1*Math.PI));
				canvas.stroke();
			}
		}],},
		'finish':function (obj) {killObject(obj);},
	},
	'icon':{'total':1,'animations':
		{'frames':[3],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {	

			var xy = obj['pos'];
			var x = xy[0];
			var y = xy[1];			
			
			cr = 0;
			
			canvas.fillStyle = '#505';
			circle(x, y, 0, 0, obj['size']/4, canvas, ds);

			canvas.strokeStyle = '#0DD';
			var num = 8;
			for (var i = 0; i < num; i++) {
				canvas.beginPath();
				var angle = (360*i/num+cr*3+180)%360/RAD;

				var sx = Math.sin((360*i/num+cr*3)/RAD)*(obj['size']/4);
				var sy = Math.cos((360*i/num+cr*3)/RAD)*(obj['size']/4);
				canvas.arc(x-sx,y-sy,obj['size']*3/4,angle, angle+(1*Math.PI));
				canvas.stroke();
			}
			
		}],},
		'finish':function (obj) {obj['current_animation'] = 0;},
	},

	'moving':{
		'total':1,'animations':
		{'frames':[1],
		'func':[
		function (x,y) {}],},
		'finish':function (obj) {},
	},
/*	'hit': {
		'total':1,'animations':
		{'frames':[3],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {	

		}],},		
		'finish':function (obj) {obj['action'] = 'still';},
	},
*/	'death': {
		'total':1,'animations':
		{'frames':[4],
		'func':[
		function (x,y, cr) {}],},
		'finish':function (obj) {killObject(obj);},
	},
};



var discharge_animation = {
	'still':{'total':1,'animations':
		{'frames':[2],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {	
			var xy = map_to_screen(obj['pos']);
			var x = xy[0];
			var y = xy[1];			
			
			canvas.beginPath();
			canvas.lineWidth = 3;
			canvas.strokeStyle = '#295';
			var f = cr % 5;
			var size = obj['size'];
			canvas.arc(x, y, (size+f)*ds, 0, 2*Math.PI);
			canvas.stroke()
			
			if ((!'lines' in obj) || obj['lines'] == null) {
				obj['lines'] = [];
				var ran = Math.round(Math.random()*3+3);
				for (var i = 0; i < ran; i++) {
					var lx = Math.round(Math.random()*size*ds-size/2*ds);
					var ly = -Math.round(Math.random()*5*ds-5);
					var sy = Math.round(Math.random()*5*ds+3);
					
					obj['lines'].push([lx,ly]);
					obj['lines'].push([lx,ly-sy]);
				}
			}
			for (var l in obj['lines']) {
				obj['lines'][l][1]--;
			}
			canvas.fillStyle = '#2B7';
			draw_lines(x, y, obj['lines'],canvas, ds);
			canvas.lineWidth = 1;
		}],},
		'finish':function (obj) {killObject(obj);},
	},
	'icon':{'total':1,'animations':
		{'frames':[3],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {	
			var xy = obj['pos'];
			var x = xy[0];
			var y = xy[1];			
			
			canvas.lineWidth = 3;
			canvas.strokeStyle = '#295';
			var size = 20;
			canvas.arc(x, y, size*ds, 0, 2*Math.PI);
			canvas.stroke()
			
			if (!('lines' in obj) || obj['lines'] == null) {
				obj['lines'] = [];
				var ran = Math.round(Math.random()*3+3);
				for (var i = 0; i < ran; i++) {
					var lx = Math.round(Math.random()*size*ds-size/2*ds);
					var ly = -Math.round(Math.random()*5*ds-10);
					var sy = Math.round(Math.random()*5*ds+3);
					
					obj['lines'].push([lx,ly]);
					obj['lines'].push([lx,ly-sy]);
				}
			}
			canvas.fillStyle = '#2B7';

			draw_lines(x, y, obj['lines'],canvas, ds);
			canvas.lineWidth = 1;
		}],},
		'finish':function (obj) {obj['current_animation'] = 0;},
	},

	'hit': {
		'total':1,'animations':
		{'frames':[3],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {	

		}],},		
		'finish':function (obj) {obj['action'] = 'still';},
	},
	'death': {
		'total':1,'animations':
		{'frames':[4],
		'func':[
		function (x,y, cr) {}],},
		'finish':function (obj) {killObject(obj);},
	},
};

var sheild_animation = {
	'still':{'total':1,'animations':
		{'frames':[15],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {	
				var xy = map_to_screen(obj['pos']);
				var x = xy[0];
				var y = xy[1];
				
				canvas.fillStyle="#6D2";
				canvas.strokeStyle="#962";

				var shape = [
					[-8,-8],
					[-4,-6],
					[0,-8],
					[4,-6],
					[8,-8],
					[8,8],
					[0,12],
					[-8,8],
				];
				draw_outlined(x, y, shape, canvas, ds*3/2);
	
				canvas.fillStyle="#5C1";
				var shape = [
					[0,-8],
					[4,-6],
					[8,-8],
					[8,8],
					[0,12],
				];			
				draw_shape (x,y,shape,canvas,ds*3/2);
		}],},
		'finish':function (obj) {killObject(obj);},
	},
	'icon':{'total':1,'animations':
		{'frames':[3],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {	
				var x = obj['pos'][0];
				var y = obj['pos'][1];

				
				canvas.fillStyle="#6D2";
				canvas.strokeStyle="#962";

				var shape = [
					[-8,-8],
					[-4,-6],
					[0,-8],
					[4,-6],
					[8,-8],
					[8,8],
					[0,12],
					[-8,8],
				];
				draw_outlined(x, y, shape, canvas, ds);

		}],},
		'finish':function (obj) {obj['current_animation'] = 0;},
	},

	'moving':{
		'total':1,'animations':
		{'frames':[1],
		'func':[
		function (x,y) {}],},
		'finish':function (obj) {},
	},
	'hit': {
		'total':1,'animations':
		{'frames':[3],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {	

		}],},		
		'finish':function (obj) {obj['action'] = 'still';},
	},
	'death': {
		'total':1,'animations':
		{'frames':[4],
		'func':[
		function (x,y, cr) {}],},
		'finish':function (obj) {killObject(obj);},
	},
};
var gold_animation = {
	'still':{'total':1,'animations':
		{'frames':[8],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {	
			var xy = map_to_screen(obj['pos']);
			var x = xy[0];
			var y = xy[1];

			var cw = cr%40;
			if (cr >= 40 && cr < 80) {
				cw = 40 - cw;
			}
			cw = cw/10;
			canvas.fillStyle="#FF0";
			var shape = [
				[0,-6],
				[-cw/4,-3],
				[-cw,0],
				[-cw/4,+3],
				[0,6],
			];
			draw_shape(x, y, shape, canvas, ds);

			shape = [
				[0,-6],
				[cw/4,-3],
				[cw,0],
				[cw/4,+3],
				[0,6],
			];
			draw_shape(x, y, shape, canvas, ds);
		}],},
		'finish':function (obj) {},
	},

	'moving':{
		'total':1,'animations':
		{'frames':[1],
		'func':[
		function (x,y) {}],},
		'finish':function (obj) {},
	},
	'hit': {
		'total':1,'animations':
		{'frames':[4],
		'func':[
		function (x,y, cr) {}],},
		'finish':function (obj) {/*obj['action'] = 'moving';*/},
	},
	'death': {
		'total':1,'animations':
		{'frames':[4],
		'func':[
		function (x,y, cr) {}],},
		'finish':function (obj) {killObject(obj);},
	},
};


var none_animation = {
	'still':{'total':1,'animations':
		{'frames':[1],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {
		}],},
		'finish':function (obj) {},
	},

	'moving':{
		'total':1,'animations':
		{'frames':[1],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {}],},
		'finish':function (obj) {},
	},
	'hit': {
		'total':1,'animations':
		{'frames':[4],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {}],},
		'finish':function (obj) {},
	},
	'death': {
		'total':1,'animations':
		{'frames':[4],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {}],},
		'finish':function (obj) {killObject(obj);},
	},
};

var jump_animation = {};
jump_animation['icon'] = {
		'total':1,'animations':
		{'frames':[1],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {

			var x = obj['pos'][0];
			var y = obj['pos'][1];
			x = x-2;
			canvas.strokeStyle ="#000";
	
			var shape = [];
			var xx = 0;
			for (var i = 0; i < 8; i+=2) {
				xx = (i - 5)*2;
				shape[i] = [xx,-4];
				shape[i+1] = [xx,4];
			}
			xx = (8 - 5)*2;
				
			shape[8] = [xx,-4];
			shape[9] = [xx+3,0];
			
			shape[10] = [xx,4];
			shape[11] = [xx+3,0];
			
			draw_lines(x, y, shape, canvas, ds);
			
		}],},
		'finish':function (obj) {},
	};
	
function portal_animation (x, y, canvas, ds, level) {

	// diablo-esque
	if (level > 10) {
		canvas.fillStyle = '#88F';
	} else {
		canvas.fillStyle = '#44F';
	}
	var height = level+2;
	circle(x,y+height,0,0,12,canvas,ds);
	var shape = [
		[-12,-height],
		[12,-height],
		[12,height],
		[-12,height],
	];
	draw_shape(x,y,shape,canvas,ds);
	circle(x,y-height,0,0,12,canvas,ds);
	
	height -= 2;
	canvas.fillStyle = '#000';
	circle(x,y+height,0,0,10,canvas,ds);
	var shape = [
		[-10,-height],
		[10,-height],
		[10,height],
		[-10,height],
	];
	draw_shape(x,y,shape,canvas,ds);
	circle(x,y-height,0,0,10,canvas,ds);
	
}
var teleport_animation = {
	'icon':{
		'total':1,'animations':
		{'frames':[1],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {

			var x = obj['pos'][0];
			var y = obj['pos'][1];
			x = x-2;

			canvas.fillStyle ="#2F2";
			circle(x, y, -4, 4, 4, canvas, ds);
			circle(x, y, 4, -4, 4, canvas, ds);

			canvas.strokeStyle ="#000";
	
			var shape = [
					// chopped up arrow
				[-12,12],
				[-4,4],
				
				[4,-4],
				[12,-12],

				[8,-12],
				[12,-12],

				[12,-8],
				[12,-12],
			];
			draw_lines(x, y, shape, canvas, ds);

		}],},
		'finish':function (obj) {},
	},
	'opening':{
		'total':1,'animations':
		{'frames':[1],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {

			var xy = map_to_screen(obj['pos']);
			var x = xy[0];
			var y = xy[1];
			var level = cr;
			portal_animation(x,y,canvas,ds, level);

			var xy = map_to_screen(obj['dest']);
			var x = xy[0];
			var y = xy[1];
			var level = cr;
			portal_animation(x,y,canvas,ds, level);
			
		}],},
		'finish':function (obj) {obj['action'] ='still';},
	},
	'still':{
		'total':1,'animations':
		{'frames':[1],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {

			var xy = map_to_screen(obj['pos']);
			var x = xy[0];
			var y = xy[1];
			var level = 10;
			portal_animation(x,y,canvas,ds, level);

			var xy = map_to_screen(obj['dest']);
			var x = xy[0];
			var y = xy[1];
			var level = 10;
			portal_animation(x,y,canvas,ds, level);
		
		}],},
		'finish':function (obj) {},
	},
	'hit':{
		'total':1,'animations':
		{'frames':[1],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {
			var xy = map_to_screen(obj['pos']);
			var x = xy[0];
			var y = xy[1];
			var level = 10-cr;
			portal_animation(x,y,canvas,ds, level);

			var xy = map_to_screen(obj['dest']);
			var x = xy[0];
			var y = xy[1];
			var level = 10-cr;
			portal_animation(x,y,canvas,ds, level);
			
		}],},
		'finish':function (obj) {
			killObject(obj); 
			return true;
		},
	},
};
	
var cloak_animation = {};
cloak_animation['icon'] = {
		'total':1,'animations':
		{'frames':[1],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {
		
			var x = obj['pos'][0];
			var y = obj['pos'][1];
			x = x-2;
			if (WORLD_STATE['button_icon']) x = x-2;

			canvas.fillStyle ="#111";
			var shape = [
				[0,-6],
				[6,6],
				[-6,6],
			];			
			draw_shape(x, y, shape, canvas, ds);

			canvas.fillStyle ="#6A6";
			var shape = [
				[-6,-12],
				[6,-12],

				[12,10],
				[6,12],

				[4,8],
				[0,-4],
				[-4,8],

				[-6,12],
				[-12,10],

			];			
			draw_shape(x, y, shape, canvas, ds);

			canvas.fillStyle ="#111";
			var shape = [
				[-3,-10],
				[3,-10],

				[4,-4],
				[-4,-4],
			];			
			draw_shape(x, y, shape, canvas, ds);

	
		}],},
		'finish':function (obj) {},
	};
	
var sprint_animation = {};
sprint_animation['icon'] = {
		'total':1,'animations':
		{'frames':[1],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {
				
			var x = obj['pos'][0];
			var y = obj['pos'][1];
			x = x-2;
			
			
			shoeAnimation (x, y, canvas, ds, 0);

			y = y-3;
			x = x+2;
			var shape = [
				[-4,8],
				[-2,6],
				[-4,4],
				[-2,6],
				[-8,6],
				[-2,6],
				
			
			
				
	/*			// arrow one
				[0,-6],
				[2,-4],
				[0,-2],
				[2,-4],
				[-4,-4],
				[2,-4],

				// arrow two
				[0,6],
				[2,4],
				[0,2],
				[2,4],
				[-4,4],
				[2,4],

				// arrow three
				[4,-2],
				[6,0],
				[4,2],
				[6,0],
				[-2,0],
				[6,0],
*/
			];			
			draw_lines(x, y, shape, canvas, ds);


		}],},
		'finish':function (obj) {},
	};

var column_animation = {};
column_animation['still'] = {
		'total':1,'animations':
		{'frames':[1],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {
			var xy = map_to_screen(obj['pos']);
			var x = xy[0];
			var y = xy[1];
			
			canvas.fillStyle ="#C9B9B9";
			canvas.lineWidth =1;
			
			var shape = [
				[-8,-10],
				[8,-10],
				[8,-8],
				[6,-8],
				[6,6],
				[8,8],

				[8,10],
				[-8,10],
				[-8,8],
				[-6,6],
				[-6,-8],
				[-8,-8],
			];			
			draw_shape(x, y, shape, canvas, ds*2);
			shape = [
				[0,-7],
				[0,7],

				[4,-7],
				[4,5],

				[-4,-7],
				[-4,5],
				
			];
			draw_lines(x, y, shape, canvas, ds*2);
		}],},
		'finish':function (obj) {},
	};
column_animation['hit'] = column_animation['still'];
column_animation['icon'] = {
		'total':1,'animations':
		{'frames':[1],
		'func':[
		function (obj,canvas, cr,not_nice, ds) {
			var xy = obj['pos'];
			var x = xy[0];
			var y = xy[1];
			
			if (WORLD_STATE['button_icon']) x--;
			
			canvas.fillStyle ="#C0A0A0";
			canvas.lineWidth =1;
			
			var shape = [
				[-10,-10],
				[8,-10],
				[8,-8],
				[6,-8],
				[6,6],
				[8,8],

				[8,10],
				[-10,10],
				[-10,8],
				[-8,6],
				[-8,-8],
				[-10,-8],
			];			
			draw_shape(x, y, shape, canvas, ds*3/2);
			shape = [
				[-1,-7],
				[-1,7],

				[4,-7],
				[4,5],

				[-6,-7],
				[-6,5],
				
			];
			draw_lines(x, y, shape, canvas, ds*3/2);
		}],},
		'finish':function (obj) {},
	};


function level_up_animation (x, y, canvas) {
	canvas.strokeStyle ="#000";
	canvas.lineWidth =4;
	x--;
	var shape = [
		[-6, 0],
		[1,-6],
		[6, 0],
		[-1,-6],
		[0, 8],
		[0,-6],
	];			
	draw_lines(x, y, shape, canvas, 2);
	canvas.lineWidth =1;
}



var hitboxes = {
	'line':line_collision,
	'point':point_collision,
	'triangle': triangle_collision,

};
function line_collision (obj, obj2, ds) {

	var x = obj2['pos'][0];
	var y = obj2['pos'][1];
	
	if (ds == null) ds = DRAWING_SIZE;
	
	var dds = obj['size'] * ds;
	if ((obj['pos'][0]+dds < x && obj['dest'][0]+dds < x) || (obj['pos'][0]-dds > x && obj['dest'][0]-dds > x) && (obj['pos'][1]+dds < y && obj['dest'][1]+dds < y) || (obj['pos'][1]-dds > y && obj['dest'][1]-dds > y) ) {
		return false;
	}

	var line_dir = obj['dir'] || getDir(obj['pos'],obj['dest']);
	
	var dir = getDir(obj['pos'],[x,y]);	
	
	var d_dir = getDirDiff(line_dir, dir);
	var dist = getDist(x,y,obj['pos'][0],obj['pos'][1]);

	var len = getDist(obj['pos'][0],obj['pos'][1],obj['dest'][0],obj['dest'][1]);
	if (dist > len+obj['size']) return false;
	
	if (Math.abs(Math.sin(d_dir/RAD))*dist <= obj['size']*ds) {
		return true;
	}
	return false;
}
	
function point_collision (obj, obj2, ds) {
	var x = obj2['pos'][0];
	var y = obj2['pos'][1];
	
	if (ds == null) ds = DRAWING_SIZE;
	var r = obj['size']*ds;
	if (Math.abs(x - obj['pos'][0]) < r && Math.abs(y - obj['pos'][1]) < r ) {
		return true;
	}
	return false;
}
	
function triangle_collision (obj, obj2, ds) {
// a fan shape/ attack which radiates out
	var x = obj2['pos'][0];
	var y = obj2['pos'][1];
	
	if (ds == null) ds = DRAWING_SIZE;
	var d = getDir(obj['pos'],[x,y]);
	if (Math.abs(d - obj['dir']) <= obj['spread']/2) {
		var dist = getDist(obj['pos'][0],obj['pos'][1],x,y);
		if (dist <= obj['size']*ds) {
			return true;
		}
	}
	return false;
}

function double_line_collision(obj1, obj2, ds) {
	// check if two lines intersect
		// lines made from pos and dest of both obj1 and obj2
	if (ds == null) ds = DRAWING_SIZE;
	
	var pos = obj1['pos'];
	var dest = obj1['dest'];
	var npos = obj2['pos'];
	var ndest = obj2['dest'];
	
	var s = getDir(pos,dest);
	var dp =getDir(pos, npos);
	var dd =getDir(pos, ndest);

	var s2 = getDir(dest, pos);
	var dp2 =getDir(dest, npos);
	var dd2 =getDir(dest, ndest);

	var d_dif = Math.abs(dp-dd) < 180;
	var d_dif2 = Math.abs(dp2-dd2) < 180;
	// s is within dp and dd
	var s_within = (dp <= s && s <= dd) || (dp >= s && s >= dd);
	var s_within2 = (dp2 <= s2 && s2 <= dd2) || (dp2 >= s2 && s2 >= dd2);

	if ((d_dif && s_within) || (!d_dif && !s_within)) {
		if ((!d_dif2 && !s_within2) || (d_dif2 && s_within2)) {
			return true;
		}
	}

	return false
}






var bomb_to_explosion = function (obj) {
	var exp = constructObject("explosion", obj['pos'], CURRENT_ROUND['player']);
	exp['owner'] = obj['owner'];
	killObject(obj);
	newObject(exp);
	
	/*
		var exp = constructObject("explosion", obj['pos'], CURRENT_ROUND['player']);
	
	    
    if (ONLINE) {
      SOCKET.emit('client', {type:'new', obj:exp} );
    } else {
		newObject(exp);
		killObject(obj);
    }
 
	
	*/
};
function return_on_dest (obj) {
	if ('target' in obj && obj['target'] != -1) {
		return true;
	}

	obj['returning'] = true;
	obj['on_tick'] = follow_target;
	var owner = getOwner(obj);
	if (owner != null) obj['dest'] = [owner['dest'][0], owner['dest'][1]];
}

var pickup_collision = function (object_one, object_two) {
	if (object_two['returning'] == false) 	return [false,false];

	if (object_one['id'] == object_two['owner'] && object_one['id'] == CURRENT_ROUND['player']['id']) {
		CURRENT_ROUND['cooling'][object_two['type']] -= 3;
		cooldown_cooldowns(0);
	}
	
	return [true,false];
};

var slow_collision = function (object_one, object_two) {
  if (object_one['id'] == object_two['owner']) {
	return [false,false];
  } else {
	object_one['move_speed'] -= (40 + 20*object_one['level']);
    object_one['frozen'] = true;
  }
	return [true,false];

};
var teleport_collision = function (object_one, object_two) {
  if (object_one['id'] == object_two['owner'] && object_two['action'] != 'hit') {
	object_one['pos'][0] = object_two['dest'][0];
	object_one['pos'][1] = object_two['dest'][1];
	object_one['dest'][0] = object_two['dest'][0];
	object_one['dest'][1] = object_two['dest'][1];
	CURRENT_ROUND['camera'].x = object_one['pos'][0];
	CURRENT_ROUND['camera'].y = object_one['pos'][1];
	object_one['move_queue'] = [];
	object_two['action'] = 'hit';
  }
	return [true,true];

};
var fast_collision = function (object_one, object_two) {
  if (object_one['id'] == object_two['owner']) {
    object_one['move_speed'] += 100 + 20*object_one['level'];
    object_one['sprinting'] = true;
  }
	return [true,false];

};
var invisible_collision = function (object_one, object_two) {
  if (object_one['id'] == object_two['owner']) {
	if (!('invisible' in object_one)) {
		object_one['invisible'] = 0;
	}
	if (object_one['invisible'] == null || object_one['invisible'] == false) {
		object_one['invisible'] = 0;
	}
	object_one['invisible'] += 10 * (1000/WORLD_STATE['framerate']);
  }	
	return [true,false];
};



var protect_collision = function (object_one, object_two) {
  if (object_one['id'] == object_two['owner']) {
	return [true,false];
  } else {

  	// TODO - make this good
  	object_two['health'] -= object_one['damage'];
  	if (object_two['health'] <= 0) {
  		killObject(object_two);
  	}

  }
	return [true,false];
};


var lifesteal_collision = function (object_one, object_two) {
  if (object_one['id'] == object_two['owner']) {
	return [false,false];
  } else {
	//CURRENT_ROUND['objects'][object_two['owner']]['health'] += object_two['damage'];
	
	var pos = [CURRENT_ROUND['objects'][object_two['owner']]['pos'][0],CURRENT_ROUND['objects'][object_two['owner']]['pos'][1]];
	var g = constructObject("lifeReturn",pos, object_two);
	newObject(g);
  }
	return [true,false];
};


var grab_collision = function (object_one, object_two) {
  if (object_one['id'] == object_two['owner']) {
	if (object_two['returning']) killObject(object_two);
	return [false,false];
  } else {
	if ('target' in object_two && object_two['target'] != -1) {
		return [true,true];
	}
	object_two['target'] = object_one['id'];
	object_two['chasing_speed'] = null;
	object_two['on_tick'] = grab_on_tick;
	object_two['current_animation'] = 0;
	object_two['sp'] = null;
  }
	return [true,false];
  // TODO - grab

};

var gravity_collision = function (object_one, object_two) {
  if (object_one['id'] == object_two['owner']) {
	return [false,false];
  } else {
  }
	return [false,false];
  // TODO - bucket

};



var gold_collision = function (object_one, object_two) {
	if (object_two['owner'] == object_one['id']) {

	} else {
		if (object_one['id'] == CURRENT_ROUND['player']['id']) goldChange(5);
		
		killObject(object_two);
	}
	return [true,false];
};

var player_death = function (obj) {

	var g = constructObject("gold",obj['pos'], obj);
	g['owner'] = obj['id'];
	newObject(g);

	if (lifeChange(-1, obj['colour']) <= 1) {	// one or less players are alive
		endRound();
		return true;
	}
	return false;

};

var force_directions = {
	'perpendicular':function(object_one, object_two) {
			var td = getDir(object_two['pos'],object_two['dest']);
			
			var cd = getDir(object_two['pos'],object_one['pos']);	
	
			var d_dir = (td-cd);
			if (d_dir > 0) {
				td = (td-90);			
				if (td < 0) td = 360+td;
			} else {
				td = (td+90)%360;
			}
			return td;	
	},
	'emitting':function(object_one, object_two) {
		return getDir(object_two['pos'],object_one['pos']);
	},
	'pulling':function(object_one, object_two) {
		return (getDir(object_two['pos'],object_one['pos'])+180)%360;
	},
};

function witch_ai (obj) {
	if (obj['action'] == 'still') {
		obj['dest'] = [1200,1200];
		obj['dir'] = getDir(obj['pos'], obj['dest']);
	}

}

function follow_target (obj) {
	var tar = -1;
	if ('target' in obj && obj['target'] != null) {
		tar = obj['target'];
	} else {
		tar = obj['owner'];
	}
	if (tar == -1) return;

	var pos = CURRENT_ROUND['objects'][tar]['pos'];
	obj['dest'] = [pos[0],pos[1]];
	if (obj['dest'][0] != obj['pos'][0] && obj['dest'][1] != obj['pos'][1]) {
		
		obj['sp'] = CURRENT_ROUND['objects'][tar]['sp']*1.2;
		if (obj['sp'] == null || obj['sp'] <= 0) {
			obj['sp'] = CURRENT_ROUND['settings']['speed']*1.2;
		}
		if ('chasing_speed' in obj && obj['chasing_speed'] != null) {
			obj['sp'] = obj['chasing_speed'];		
		}
		obj['dir'] = getDir(obj['pos'],obj['dest']);
		
	}

}
function grab_on_tick (obj) {
	follow_target(obj);
	tug(obj);
	
}
function tug (obj) {

	var owner = CURRENT_ROUND['objects'][obj['owner']];
	var target = CURRENT_ROUND['objects'][obj['target']];

	var tension = 1;
	
	var dist = getDist(owner['pos'][0], owner['pos'][1], target['pos'][0], target['pos'][1]);
	var max_dist = 400;
	tension = dist/max_dist;
	

	var temp = {'pos':target['pos'],'owner':obj['owner'],'type':obj['type']};
	var force = findForce(owner, temp);    
	force['sp'] *= tension;
	actingForce(owner, force);
	
	temp = {'pos':owner['pos'],'owner':obj['owner'],'type':obj['type']};
	force = findForce(target, temp);
	force['sp'] *= tension;
	actingForce(target, force);

	tension = 1;	// don't want tension involved after this

	var approaching = true;
	var dir = getDir(owner['pos'],target['pos']);
	if (owner['dir'] != null) {
		if (Math.abs(owner['dir'] - dir) > 60) {
			approaching = false;
		}
	}
	
	if (target['dir'] != null) {
		if (Math.abs(target['dir'] - (dir+180)%360) > 60) {
			approaching = false;
		}
	}
	if (approaching) return;	// if both side are approaching one another
	
	function act (actor, acted) {
		if (actor['dir'] == null) {
			temp = {'pos':actor['dest'],'owner':actor['id'],'type':actor['type']};
			force = findForce(acted, force);
		} else {
			force = {'sp':actor['sp']*tension,'dir':actor['dir']};
		}
		console.log(force);
		actingForce(acted, force);
	}
	
	if (owner['sp'] != null && target['sp'] != null && owner['sp'] != target['sp']) {
		if (owner['sp'] > target['sp']) {
		console.log('owner');
			act(owner, target);
		} else {
		console.log('target');
			act(target, owner);
		}
		return;
	}
	if (owner['sp'] != null) {
		act(owner, target);
	}	
	
	if (target['sp'] != null) {
		act(target, owner);
	}
	// TODO - if one is going super fast make it pull the other
}
function boomerang_circle (obj) {
	obj['dir'] = (obj['dir_change']+obj['dir']);//%360;
	obj['current_steps']++;
	
	if (obj['current_steps'] > obj['max_steps']/8) {
		obj['returning'] = true;
	}
	if (obj['current_steps'] > obj['max_steps']) {
		killObject(obj);
	}
}

/*
	animation
	hitboxes
	on_destination
	on_collision
	on_death
	
	
	maybe have
	'on_tick'
	which is an array of 'cc's which can be dynamically managed
*/

var OBJECTS = {
	'shot':{
		'cost':[2],
		'hotkey':'S',
		'cd':[1],
		'buy':false,
		'hitbox':hitboxes['point'],
		'size':10,
		'animation': shot_animation,
		'force':4, 
		'tooltip':'Fast, weak and boring.',
	},
	'beam':{
		'cost':[6,6,6],
		'hotkey':'B',
		'cd':[8,7,6],
		'buy':false,
		'hitbox':hitboxes['line'],
		'size':20,
		'animation': beam_animation,
		'force':6,
		'force_direction':force_directions['perpendicular'],
		'tooltip':'Direction and fixed length beam.',
		'level_tooltip':['','cd: 8->7','cd: 7->6'],
		'sustained':true,
	},

	'fire':{
		'cost':[4,4,4],
		'hotkey':'F',
		'cd':[4,4,3],
		'buy':false,
		'hitbox':hitboxes['point'],
		'size':10,
		'animation': fire_animation,
		'force':8,
		'tooltip':'Packs more punch than shot.',
	},
	'boomerang':{
		'cost':[6,4,4],
		'hotkey':'G',
		'cd':[8,7,6],
		'buy':false,
		'hitbox':hitboxes['point'],
		'size':10,
		'animation': boomerang_animation,
		'on_collision':pickup_collision,
		'on_tick':boomerang_circle,
		'force':8,
		'tooltip':'Returns to where sender was standing.',
	},
	
	'bomb':{
		'cost':[10,4,4],
		'hotkey':'O',
		'cd':[12,10,8],
		'buy':false,
		'hitbox':hitboxes['point'],
		'size':10,
		'animation': bomb_animation,
		'on_destination':bomb_to_explosion,
		'force':4,
		'tooltip':'Explodes when reaching destination.',
	},
	
	'explosion':{
		'cost':[10,4,4],
		'hotkey':'',
		'cd':[12,10,8],
		'buy':false,
		'hitbox':hitboxes['point'],
		'size':50,
		'animation': explosion_animation,
		'force':16,
		'force_direction':force_directions['emitting'],
		'tooltip':'The explosion from bomb.',
	},
	
	'sonic':{
		'cost':[10,6,6],
		'hotkey':'S',
		'cd':[8,6,4],
		'animation': sonic_animation,
		'force':12,
		'size':200,
		'hitbox':hitboxes['triangle'],
		'force_direction':force_directions['emitting'],
		'tooltip':'Fans out from user.',
		'level_tooltip':['','cd: 8->6,</br>spread:30->60','cd: 6->4,</br>spread:60->90'],
		'sustained':true,
	},
		
	'lightning':{
		'cost':[10,6,6],
		'hotkey':'T',
		'cd':[8,6,4],
		'animation': lightning_animation,
		'force':8,
		'size':30,
		'hitbox':hitboxes['point'],
		'force_direction':force_directions['emitting'],
		'tooltip':'Direct and instantenous.',
		'level_tooltip':['','cd: 8->6','cd: 6->4'],
		'aim_range':400,
	},
	
	'ice':{
		'cost':[6,4,4],
		'hotkey':'I',
		'cd':[12,10,8],
		'animation': ice_animation,
		'force':3,
		'hitbox':hitboxes['point'],
		'size':10,
		'on_collision':slow_collision,
		'tooltip':'Slows on collision.',
	},

	'homing':{
		'cost':[10,6,6],
		'hotkey':'H',
		'cd':[16,14,12],
		'animation': homing_animation,
		'force':8,
		'size':10,
		'health':20,
		'hitbox':hitboxes['point'],
		'on_tick':follow_target,
		'tooltip':'Follows closest target.',
		'level_tooltip':['','cd: 8->6','cd: 6->4'],
		'global':true,
	},
		
	'lifesteal':{
		'cost':[10,6,6],
		'hotkey':'N',
		'cd':[8,6,4],
		'animation': lifesteal_animation,
		'force':8,
		'size':10,
		'hitbox':hitboxes['point'],
		'on_collision':lifesteal_collision,
		'tooltip':'Warning: The returning health can be intercepted.',
		'level_tooltip':['','cd: 8->6','cd: 6->4'],
	},
	'lifeReturn':{
		'hotkey':'',
		'cost':[0],
		'animation':lifeReturn_animation,
		'on_tick':follow_target,
		'force':1,
		'size':10,
		'hitbox':hitboxes['point'],
	},
	
	'grab':{
		'cost':[10,6,6],
		'hotkey':'M',
		'cd':[1,12,10],
		'animation': grab_animation,
		'force':1,
		'size':10,
		'hitbox':hitboxes['point'],
		'force_direction':force_directions['pulling'],
		'on_collision':grab_collision,
		'on_destination':return_on_dest,
		'tooltip':'Connects you to something else.',
		'level_tooltip':['','cd: 8->6','cd: 6->4'],
		'aim_range':300,
		'global':true,
	},
	'gravity':{
		'cost':[10,6,6],
		'hotkey':'X',
		'cd':[18,14,12],
		'animation': gravity_animation,
		'force':16,
		'size':40,
		'hitbox':hitboxes['point'],
		'force_direction':force_directions['pulling'],
		'on_collision':gravity_collision,
		'tooltip':'Gravity well.',
		'level_tooltip':['','cd: 8->6','cd: 6->4'],
		'aim_range':400,
		'global':true,
	},
				
	'discharge':{
		'cost':[10,6,6],
		'hotkey':'D',
		'cd':[8,6,4],
		'animation': discharge_animation,
		'force':12,
		'size':30,
		'hitbox':hitboxes['point'],
		'force_direction':force_directions['emitting'],
		'tooltip':'Self-destruct.',
		'level_tooltip':['','cd: 8->6','cd: 6->4'],
		'sustained':true,
		// TODO - make only owner lose health
	},
		
	'sheild':{
		'cost':[10,6,6],
		'hotkey':'V',
		'cd':[8,6,4],
		'animation': sheild_animation,
		'force':8,
		'health':20,
		'size':30,
		'hitbox':hitboxes['point'],
		'on_collision':protect_collision,
		'on_tick':follow_target,
		'tooltip':'Protect oneself.',
		'level_tooltip':['','cd: 8->6','cd: 6->4'],
	},
		
		
		
		
		
		
		
		
		
		
		
		
		
	'jump':{
		'cost':[10,4,4],
		'hotkey':'J',
		'cd':[12,10,8],
		'animation': jump_animation,
		'force':12,
		'size':10,
		'hitbox':hitboxes['point'],
		/*'on_collision':kill,*/
		'tooltip':'Jump in chosen direction.',
	},
	
	'teleport':{
		'cost':[10,8,8],
		'hotkey':'Y',
		'cd':[22,16,12],
		'animation': teleport_animation,
		'force':12,
		'size':10,
		'hitbox':hitboxes['point'],
		'on_collision':teleport_collision,
		'tooltip':'Teleport to the selected point.',
		'aim_range':350,
		'sustained':true,
	},
		
	'sprint':{
		'cost':[8,4,4],
		'hotkey':'P',
		'cd':[16,12,8],
		'animation': sprint_animation,
		'force':-1,
		'size':10,
		'hitbox':hitboxes['point'],
		'on_collision':fast_collision,
		'tooltip':'Decreasing speed increase. </br>You won\'t be caught (dead or otherwise) wearing these.',
	},
	
	'cloak':{
		'cost':[10,4,4],
		'hotkey':'C',
		'cd':[36,28,20],
		'animation': cloak_animation,
		'force':-1,
		'size':10,
		'hitbox':hitboxes['point'],
		'on_collision':invisible_collision,
		'tooltip':'Makes user invisible.',
	},

	'new_player':{
		'hotkey':'N',
		'cd':[1],
		'buy':false,
		'tooltip':'For debugging',
	},
		
	'player':{
		'hotkey':'Z',
		'cd':[1],
		'buy':false,
		'animation': player_animation,
		'on_death':player_death,
		'health':100,
		'mana':100,
		'tooltip':'You',
	},
	'witch': {
		'hotkey':'}',
		'cd':[1],
		'buy':false,
		'animation': player_animation,
		'on_tick':witch_ai,
		'hitbox':hitboxes['point'],
		'size':10,
		'health':20,
		'tooltip':'An enemy',	
	},
	'column': {
		'hotkey':'L',
		'cd':[20,16,12],
		'cost':[10,8,6],
		'buy':false,
		'animation': column_animation,
		'hitbox':hitboxes['point'],
		'size':20,
		'tooltip':'An obstacle',	
	},	
	
	'gold':{
		'hotkey':'',
		'cd':1,
		'buy':false,
		'hitbox':hitboxes['point'],
		'size':10,
		'animation': gold_animation,
		'on_collision':gold_collision,
		'tooltip':'Used to purchase more spells.',
	},

};
for (a in OBJECTS) {
	//OBJECTS[a]['ccd'] = 0;
	if ('buy' in OBJECTS[a]) {
	} else {
		OBJECTS[a]['buy'] = false;
	}
	OBJECTS[a]['level'] = 0;
}

//----		REMOVE SOME THINGS		----//
//OBJECTS['column'] = null;
OBJECTS['witch'] = null;


function constructObject (t, d, owner) {
  var starting_speed = 0;
	if (CURRENT_ROUND != null) starting_speed = CURRENT_ROUND['settings']['speed'];

	var lv = 0;
	var fr = 0;
	var hp = 0;
	var invis = false;
	if (CURRENT_ROUND != null) {
		lv = CURRENT_ROUND['lives'];
		fr = CURRENT_ROUND['settings']['friction'];
		invis = CURRENT_ROUND['settings']['invisible'];
		hp = WORLD_STATE['attacks'][t]['health']*(CURRENT_ROUND['settings']['health']/100);
	}
  
  var max_dist = -1;
  if ('aim_range' in WORLD_STATE['attacks'][t] && WORLD_STATE['attacks'][t]['aim_range'] != null) {
  	max_dist = WORLD_STATE['attacks'][t]['aim_range'];
  }
  var o = {type:t, sp:starting_speed, dead:false, 'action':'still', size:OBJECTS[t]['size'], 'current_animation':0, 'id':-2,'collidable':false,'level':(WORLD_STATE['attacks'][t]['level']+1)};
  
  if (t == "player") {
    o['dest'] = d;
    o['health'] = hp;
	o['mana'] = 0;
    o['pos'] = d;
	o['invisible'] = invis;
	o['move_speed'] = o['sp'];
    o['default_move_speed'] = o['move_speed'];
    o['invincible'] = 50;
	o['collidable'] = true;
	
	o['lives'] = lv;
	o['friction'] = fr;
	o['size'] = 2;
	o['sprinting'] = false;
	o['frozen'] = false;
	o['casting'] = false;

  } else {
    o['pos'] = owner['pos'];
	if (o['pos'] == null) {
		o['pos'] = [0,0];
	}
	o['dir'] = getDir(o['pos'], d);
    o['owner'] = owner['id'];
    o['hitbox'] = [o['pos']];
	o['damage'] = 10;
	o['sp'] = o['sp']*1.2;
	
	if ('opening' in OBJECTS[t]['animation'] && OBJECTS[t]['animation']['opening'] != null) {
		o['action'] = 'opening';
	}
	o['casting'] = 20;
  }
  d = cutShort(max_dist, o['pos'], d);
  
  if (t == "shot") {
	o['sp'] = starting_speed*2;

  } else if (t == "beam") {
	var len = 350;
	var ax = Math.sin(o['dir']/RAD)*(len);
	var ay = Math.cos(o['dir']/RAD)*(len);
	o['dest'] = [];
    o['dest'][0] = o['pos'][0]-ax;
    o['dest'][1] = o['pos'][1]-ay;
	o['no_movement'] = true;

	o['sp'] = 0;
	o['remains'] = true;

  } else if (t == "fire") {
	o['damage'] *= (o['level']);

  } else if (t == "bomb") {
    o['dest'] = d;
    o['dir'] = null;
  } else if (t == "explosion") {
	o['dest'] = d;
	o['pos'] = d;
    o['dir'] = null;
	o['sp'] = 0;
	o['remains'] = true;
    o['range'] = OBJECTS[t]['size'];

  } else if (t == "boomerang") {
	o['final_dir'] = getDir(d,o['pos']);
	
	o['sp'] = starting_speed;
	o['returning'] = false;
	
	o['dir'] += 90;
	
	if (CURRENT_ROUND != null) {
		var dist = getDist(o['pos'][0],o['pos'][1],d[0],d[1]);
		var steps = (dist*Math.PI/2)/(o['sp']/CURRENT_ROUND['settings']['speed_res']);
		o['dir_change'] = -180/steps;
		o['max_steps'] = steps*2+1;
		o['current_steps'] = 0;
	}


  } else if (t == "ice") {

  } else if (t == "lightning") {
	o['dest'] = d;
	o['pos'] = d;
	o['sp'] = 0;
	o['no_movement'] = true;
	o['remains'] = true;
	
  } else if (t == "gravity") {
	o['dest'] = d;
	o['pos'] = d;
	o['sp'] = 0;
	o['no_movement'] = true;
	o['remains'] = true;
	o['damage'] = 0;
	
  } else if (t == "sonic") {
  
	//var dist = getDist(o['pos'][0],o['pos'][1],d[0],d[1]);
	var ax = Math.sin(o['dir']/RAD)*(OBJECTS[t]['size']);
	var ay = Math.cos(o['dir']/RAD)*(OBJECTS[t]['size']);
	o['dest'] = [];
    o['dest'][0] = o['pos'][0]-ax;
    o['dest'][1] = o['pos'][1]-ay;
	o['sp'] = 0;
	o['no_movement'] = true;
	//o['dir'] = null;
	o['force'] = 5;
	o['remains'] = true;
	o['spread'] = 30*(o['level']);
	
  } else if (t == "gold") {
	o['pos'] = d;
	o['dest'] = d;
    o['dir'] = null;
	o['sp'] = 0;
	
  } else if (t == "jump") {
	//o['dir'] += 180;
	o['damage'] = 0;
	o['owner'] = -1;
	
  } else if (t == "teleport") {
	o['dir'] = null;
	if ('pos' in owner && owner['pos'] != null) {
		o['pos'] = [owner['pos'][0],owner['pos'][1]];
	}
	o['dest'] = [d[0],d[1]];
	o['sp'] = null;

  } else if (t == "sprint") {
	o['dir'] = null;
	o['damage'] = 0;
	
  }  else if (t == "sheild") {
	o['dir'] = null;
	o['damage'] = 0;
	o['collidable'] = true;
	o['tangible'] = false;
	o['health'] = hp;

  } else if (t == "discharge") {
	o['dir'] = null;
	o['damage'] *= 2;
	o['no_movement'] = true;
	o['sp'] = 0;
	o['remains'] = true
	o['casting'] = 30;
	
  } else if (t == "lifesteal") {
  } else if (t == "lifeReturn") {
	o['target'] = CURRENT_ROUND['objects'][owner['owner']]['id'];
	o['owner'] = CURRENT_ROUND['objects'][owner['owner']]['id'];
	o['owner'] = -1;
	o['dest'] = d;
	o['sp'] = o['sp']*3/2;
	o['damage'] = -o['damage'];

  } else if (t == "homing") {
	o['target'] = closestPlayer(d, owner);
	o['health'] = hp;
	o['collidable'] = true;
//	o['tangible'] = false;
	o['chain'] = [];

  } else if (t == "grab") {
	o['returning'] = false;
	o['remains'] = true;
	o['inv_frames'] = 2;
	o['chasing_speed'] = o['sp'];
	o['dest'] = [d[0],d[1]];
	
  } else if (t == "cloak") {
	o['dir'] = null;
	o['damage'] = 0;
	
  } else if (t == "witch") {
	o['pos'] = d;
	o['action'] = 'still';
    o['health'] = hp;
	o['dest'] = d;
	o['owner'] = -1;
	o['collidable'] = true;
	o['friction'] = fr;
	o['remains'] = true;

  } else if (t == 'column') {
  	o['collidable_type'] = 'point';
	o['obstacle'] = true;
	o['action'] = 'still';
	o['pos'] = d;
	o['dest'] = d;
	o['sp'] = null;
	o['owner'] = -1;
	o['collidable'] = true;
	o['remains'] = true;
	o['damage'] = 0;
	o['tangible'] = false;

  } else {
    
  }
  
//  o['move_speed'] = o['sp'];
//  o['default_move_speed'] = o['move_speed'];

  return o;
}

function cutShort (max, p, d) {
	if (max <= 1) return d;
	
	if (getDist(p[0],p[1],d[0],d[1]) <= max) return d;
	
	var dir = getDir(p,d);
	var x = p[0]-Math.sin(dir/RAD)*(max);
	var y = p[1]-Math.cos(dir/RAD)*(max);

	return [x,y];
}
function closestPlayer (d, owner) {
	if (CURRENT_ROUND == null) return -1;

	var lowest = -1;
	var lowest_id = -1;
	for (var os in CURRENT_ROUND['objects']) {
		var o = CURRENT_ROUND['objects'][os];

		if (o == null) continue;
		if (owner['id'] == o['id']) continue;
		
		if (o['type'] == 'player') {
			var cur = Math.abs(getDist(d[0],d[1],o['pos'][0],o['pos'][1]));
			if (lowest == -1 || cur < lowest) {
				lowest = cur;
				lowest_id = o['id'];
			}
		}
	}
	return lowest_id;
}