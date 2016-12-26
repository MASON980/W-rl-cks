
//---			PATHFINDING AROUND OBSTACLES			---//
	
/*
COLLIDABLES example
{'pos':[80,120],'size':20,'collidable_type':'line', 'dest':[180,40]},
{'pos':[700,680],'size':20,'collidable_type':'point'},

call 
	calc_collidables();
		with your current path (an array which houses an object with a pos, dest, and size)	-- I would avoid making the array house multiple objects
		// TODO - sort out handing in multiple objects
			// I don't think it will be a problem, I just haven't tested it properly
		
			an array of collidables, like above
		it will return an array of paths

*/
	
	
function give_berth (cp, op, size, skirt, dest) {
	// move cp slightly (based upon size) in a direction (based upon op)
	// if skirt==fasle the direction is the far side from the perspective of op
		// skirt == true makes it horizontally far but vertically close
		
	// use the dest to determine which corners to go at
	var need_second = false;
	var cp2 = [cp[0],cp[1]];
	var og_cp = [cp[0],cp[1]];
	var og_size = size;
	if ((Math.abs(cp[1] - op[1]) <= size*1.5) && skirt)  {
	// swap the way being skirted if the y is too similar (y because y axis is the one which stays the same)
		size = -size;
		need_second = true;
	}
	var same_x = false;
	if ((Math.abs(cp[0] - op[0]) <= size*1.5) && skirt)  {
	// swap the way being skirted if the y is too similar (y because y axis is the one which stays the same)
		size = -size;
		need_second = true;
		same_x = true;
	}
	
	// corner
	if (cp[0] > op[0]) {
		// left half
		cp[0] += size;
		cp2[0] -= size;
	} else /*if (cp[0] > op[0]) */{
		// right half
		cp[0] -= size;		
		cp2[0] -= size;

	}
	if (!skirt) {
		size = -size;
	}

	if (cp[1] < op[1]) {
		// bottom half
		cp[1] += size;
		cp2[1] += size;
	} else /*if (cp[1] > op[1])*/ {
		// top half
		cp[1] -= size;				
		//cp2[1] -= size;
		cp2[1] -= size;
	}

	if (!need_second) {
	console.log('one');
		return [cp];
	} else {
		console.log('two');
		var one = [];
		var two = [];
		
		var brp = getDist(og_cp[0]+og_size,og_cp[1]+og_size,op[0],op[1]);
		var trp = getDist(og_cp[0]+og_size,og_cp[1]-og_size,op[0],op[1]);
		var blp = getDist(og_cp[0]-og_size,og_cp[1]+og_size,op[0],op[1]);
		var tlp = getDist(og_cp[0]-og_size,og_cp[1]-og_size,op[0],op[1]);
		if (brp < trp && brp < blp && brp < tlp) {
			// brp closest
			one = [og_size, og_size];
			brp = null;
		} else if (trp < brp && trp < blp && trp < tlp) {		
			// trp closest
			one = [og_size, -og_size];
			trp = null;
		} else if (blp < trp && blp < brp && blp < tlp) {
			// blp closest		
			one = [-og_size, og_size];
			blp = null;
		} else if (tlp < trp && tlp < blp && tlp < brp) {
			// tlp closest		
			one = [-og_size, -og_size];
			tlp = null;
		} else {
		
		}
		var found = true;
		
		var brd = getDist(og_cp[0]+og_size,og_cp[1]+og_size,dest[0],dest[1]);
		var trd = getDist(og_cp[0]+og_size,og_cp[1]-og_size,dest[0],dest[1]);
		var bld = getDist(og_cp[0]-og_size,og_cp[1]+og_size,dest[0],dest[1]);
		var tld = getDist(og_cp[0]-og_size,og_cp[1]-og_size,dest[0],dest[1]);
	
		if (trp == null || blp == null) {
			if (brd < tld) {
				two = [og_size, og_size];			
			} else {
				two = [-og_size, -og_size];				
			}
		}
		if (brp == null || tlp == null) {
			if (trd < bld) {		
				two = [og_size, -og_size];								
			} else {
				two = [-og_size, og_size];				
			}
		} 

		return [
			[og_cp[0]+one[0], og_cp[1]+one[1]],
			[og_cp[0]+two[0], og_cp[1]+two[1]],			
		];
	}
}
	
function calc_collidables (path, collidables) {
// the main thing
console.log('calc');
console.log('calc');
console.log('calc');
console.log('calc');
console.log('calc');
console.log('calc');
console.log('calc');
	if (collidables != null && collidables.length > 0) {			
		if (all_collidables([path[0]['pos']], null, collidables, 1) != -1) {
			// the pos is already being hit by a collidable
			console.log('no stick');
			return path;
		}	

		if (all_collidables([path[0]['dest']], null, collidables, 1.2) != -1) {
			console.log('dont');
			return null;	// don't move there
		}	
		var ret = [];
		var step = 0;	// safety loop
		do {
			ret = loop_collidables(path, collidables, step);
			path = ret[1];
			step++;
			if (step == collidables.length){
				console.log('step maxed');
				console.log(path);
				break;
			}
		} while (ret[0] == true);
	}
	
	var ret = [false];
	do {
		//ret = cleanPath(path);
		//path = ret[1];
		
	} while (ret[0]);
	console.log(path);
	return path;
}

function cleanPath (paths) {
	// clean up path by removing any paths in between ones which share the same dest

	var safety = 0;
	for (var i = 0; i < paths.length; i++) {
		if (paths[i] == null) continue;
		var sz = paths[i]['size'];
		for (var j = paths.length-2; j > i; j--) {
				if (paths[j] == null) continue;
				/*
				count down instead of up, I'm having trouble explaining, but because of the likely way that the calcing would mess up it would be better to count from the end
				
				the calcing would probably mess up by looping in between two or three positions, this could happen for dozens of times (which almost certainly goining to be more than the actual needed distance), so rather than go through each time splicing, I could just go to the end size the end is good ~~~~~~~~~~~ if you don't like it then change it, there are probably other things which can be done to make it more efficient
				*/
			if (paths[i] == null) break;
			if (paths[i]['dest'][0] - paths[j]['dest'][0] < sz &&
			paths[i]['dest'][1] - paths[j]['dest'][1] < sz) {
		
				safety++;
				if (safety > 10) {
					console.log('cleaning break');
					console.log(paths);
					return [false, paths];
				}
				paths.splice(i, j-i-1);
			
				j = paths.length-2;	// start counting up from the redone array
				//return [true, path];
			}
		}
	}
	return [false, paths];
}

function loop_collidables (path, collidables, step) {	
	// loop through every path and every collidable

	for (var j = 0; j < path.length; j++) {
		if (path[j] == null) continue;
		path[j]['pos'] = [Math.round(path[j]['pos'][0]), Math.round(path[j]['pos'][1])];
		path[j]['dest'] = [Math.round(path[j]['dest'][0]), Math.round(path[j]['dest'][1])];
		
		console.log(j);
		if (all_collidables([path[j]['pos']], null, collidables, 1.3) != -1) {
			// the pos is already being hit by a collidable
			console.log('this should not hit unless j==0 and j='+j);
			continue;
		}	

		for (var i = step; i < collidables.length; i++) {
			if (collidables[i] == null) continue;

			var keep_size = path[j]['size'];
			if (path[j]['size'] < collidables[i]['size'])path[j]['size'] = collidables[i]['size'];
			var return_path = find_path(collidables[i], path[j], collidables);
			path[j]['size'] = keep_size;
			
			if (return_path == null) {
				
			} else {
				// if the path is changed jump out and recheck from the start
				path[j] = null;
				path = insert_array(path, return_path, j);
				return [true, path];
				
			}
		}
	}
	return [false, path];
}

function all_collidables (split_pos, split_dest, collidables, size_increase) {
	// go through all collidables and check if split_pos hits any of them (using point_collision() to check)
	for (var j = 0; j < split_pos.length; j++) {
		if (split_pos[j] == null || split_pos[j] === true) continue;

		for (var i = 0; i < collidables.length; i++) {
			var ret = false;
			var temp_coll = {'pos':collidables[i]['pos'],'dest':collidables[i]['dest'],'size':collidables[i]['size']*size_increase};
						
			if (collidables[i]['collidable_type'] == 'point') {
				ret = point_collision(temp_coll, {'pos':split_pos[j]}, DRAWING_SIZE);
				
				// TODO - below is currently not being used, but it could be
				if (split_dest != null) {
					var gdir = getDir(split_pos[j], split_dest[j]);
					var gdir2 = getDir(split_pos[j], temp_coll['pos']);
					var gd_diff = getDirDiff(gdir, gdir2);
					if (gd_diff > 45) {
						//ret = false;
					}	
				}				
			} else if (collidables[i]['collidable_type'] == 'line') {
				ret = line_collision(temp_coll, {'pos':split_pos[j]}, DRAWING_SIZE);
			}
			if (ret) {
				return i;
			}
		}
	}
	return -1;
}

function directo_check (coll, path) {
	// checks the direction of both objects to know if they are too similar to be treated as a line (if the directions are the same then path only sees coll as a point)

	var d1 = getDir(coll['pos'], coll['dest']);
	var d2 = getDir(path['pos'], path['dest']);

	if (getDirDiff(d1, d2) < 20) {	// TODO - see if this number is enough
		return false;
	}
	return true;
}

function find_path (coll, path, collidables) {
	// splits the path up if coll and path hit each other
		// level keeps track of recursion
		// collidables is to avoid global
		
	// going through this once should make the chance of the path hitting coll 0, so you don't need to check any part of path against this coll again

		var to_array = true;
		
		// check if the path will collide with the collidable
		if (coll['collidable_type'] == 'point' ) {	
			// path is heading away from the collidable
			var gdir = getDir(path['pos'], path['dest']);
			var gdir2 = getDir(path['pos'], coll['pos']);
			var gd_diff = getDirDiff(gdir, gdir2);
			if (gd_diff > 45) {
				return null;
			}	
		} else if (coll['collidable_type'] == 'line' ) {	
			// path is heading away from the collidable
			var gdir = getDir(path['pos'], path['dest']);
			var gdir2 = getDir(path['pos'], coll['pos']);
			var gd_diff = getDirDiff(gdir, gdir2);
			if (gd_diff > 45) {
				return null;
			}	
		}
		if ((coll['collidable_type'] == 'line' && (double_line_collision(coll, path, DRAWING_SIZE)) ) || (line_collision(path, coll, DRAWING_SIZE) && coll['collidable_type'] == 'point') ) {

			to_array = false;

			var coll_pos = [coll['pos'][0],coll['pos'][1]];
			var sz = path['size'];
			if (coll['size'] > path['size']) sz = coll['size'];
			sz += 20*DRAWING_SIZE;	// TODO - sort out this bufferesque thing
			
			var berth_type = true;
						
			var going_around = [path['pos'][0], path['pos'][1]];
			
			if (coll['collidable_type'] == 'line' && directo_check(coll, path)) {
				
				// find which end  of the line is closest
				var close_pos = [];
				var far_pos = [];
				
				var dist1 = getDist(coll_pos[0], coll['pos'][0], coll_pos[1], coll['pos'][1]);
				
				var dist2 = getDist(coll_pos[0], coll['dest'][0], coll_pos[1], coll['dest'][1]);

				if (dist1 < dist2) {
					close_pos = coll_pos;
					far_pos = coll['dest'];
				} else {
					close_pos = coll['dest'];
					far_pos = coll_pos;
				}
				coll_pos = [close_pos[0], close_pos[1]];
				berth_type = false;
				going_around = [far_pos[0], far_pos[1]];

			}
			var split_pos = [];

			var cc = 1;
			
			var safety = 0;
			do {
				safety++;
				if (safety > 10) {
					console.log('berth maxed');
					return null;
				}
				// loop around trying to find the closest open space
				split_pos = give_berth([coll_pos[0], coll_pos[1]], going_around, sz*cc, berth_type, path['dest']);
				
				//	1,-1,2,-2 etc., so it check both above and below in an order which minimise the distance of the path
				if (cc < 0) {
					cc = -cc;
					cc++;
				} else {
					cc = -cc;
				}
			} while (all_collidables(split_pos, null, collidables, 1) != -1);
			
			// if the distance between the first new pos and dest is less than the second new and dest then going to dest is redundant (unless there is another thing in the way, but that can be dealt with)
				// this extrapolates to more than two too, so remove everything after the index with the shortest distance
			var lowest = {'pos':-1,'val':-1};
			var sp_len = 0;
			for (var i = 0; i < split_pos.length; i++) {
				if (split_pos[i] == null || split_pos[i] === true) continue;
				sp_len++;
				var dist = getDistO(split_pos[i], path['dest']);
				console.log(dist);
				console.log([split_pos[i][0],split_pos[i][1]]);
				if (lowest['pos'] == -1 || (dist < lowest['val']) ) {
					lowest['pos'] = i;
					lowest['val'] = dist;
				}
			}			
			if (lowest['pos'] != -1 && lowest['val'] > 0 && lowest['pos'] != sp_len-1) {
				console.log('split');
				
				split_pos.splice(lowest['pos']+1, split_pos.length - lowest['pos']);
			}

			for (var i = 0; i < split_pos.length; i++) {
				if (split_pos[i] == null || split_pos[i] === true) continue;
				if (split_pos[i][0] == path['dest'][0] && split_pos[i][1] == path['dest'][1]) {
					console.log('split_pos and path_dest should not be the same. '+i);
					split_pos[i] = null;
					//return [path];
				}
			}

			var ret_path = [];
			for (var i = 0; i <= split_pos.length; i++) {
				if (split_pos[i] === null) continue;
				// create a new path
				var pp = [];
				if (i == 0) {
					pp = [Math.round(path['pos'][0]), Math.round(path['pos'][1])];
				} else {
					pp = [Math.round(split_pos[i-1][0]), Math.round(split_pos[i-1][1])];
				}
							
				var dp = [];
				if (i == split_pos.length) {
					dp = [path['dest'][0], path['dest'][1]];
				} else {
					dp = [split_pos[i][0], split_pos[i][1]];
				}
				var new_paths = [{'pos':pp,'dest':dp, 'size':path['size']}];
				console.log({'pos':[pp[0],pp[1]],'dest':[dp[0],dp[1]], 'size':path['size']});;

				// combine the new ones
				ret_path = insert_array(ret_path, new_paths, ret_path.length);
			}		
			if (ret_path.length == 0) {
				return path;
			}
			path = ret_path;
		}
	if (to_array) {
		return null;
	}
	return path;
	
}
function insert_array (arr1, arr2, pos) {
	// insert arr2 into arr1 at pos
	if (arr1 == null) return arr2;
	if (arr2 == null) return arr1;
	for (var i = 0; i < arr2.length; i++) {
		arr1.splice(pos+i, 0, arr2[i]); 
	}
	return arr1;
}
