
var ONLINE = false;

// DEBUGGING VARIABLES
var NOW = 0;
var BEFORE = 0;
var START_TIMER = new Date().getTime();
var TICKS = 1;
var DEBUG_TICKS = 1;
var debugTimer = [];
var PAUSE = false;
var DEBUG = false;


var ROUND_SETTINGS = {		// shouldn't be changed outside of maybe remembering config updates
	'gold':0,
	'range':50,// default range for hit damage size (used to calc force, not collisions)
	'speed':70,// movement is speed/ROUND_STATE['settings']['speed_res']
	'speed_res':10,
	'friction':5,	// speed decrement per tick 
	'force':22,	// explosion force amplified by this factor in findForce()
	'health':100,
	'damage':100,
	'lava_level':1,
	'lava_tick':-30,
	'lava_increment':10,
	'lava_width':240,	
	'timer':180,
	'obstacles':0,	// columns
	'invisible':false,	
	'lives':3,	// number of lives each player starts with
	'bosses':false,	//bosses would be a bigger deal that just a single thing, it could turn into an object
	
};
var OG_ROUND_SETTINGS = {};
for (var v in ROUND_SETTINGS) OG_ROUND_SETTINGS[v] = ROUND_SETTINGS[v];

var CURRENT_ROUND;
var ROUND_STATE = {
	'player':'object',//{},
	'objects':'array',//[],
	'living':0,
	'living_colours':'array',//[],
	'obstacles':'array',//[],
	'cooling':'array',//[],
	'settings':'object',//{},
	'camera':'object',//{},
	'timer':0,
	'ticks':0,
	'message_queue':'array',	// TODO - maybe make it an object
	'lives':0,
};
var WORLD_STATE = {
	'started':false,
	'online':ONLINE,
	'mode':'',
	'click_to_start':true,
	'button_icon':false,
	'framerate':20,
	'frame_length':10,
	'attacks':OBJECTS || {},
	'logicTimer':null,
	'map':{top:0,bottom:2400,left:0,right:2400},
	'zoom':10,
	'screen':null,
	'viewport':null,
	'camera':null,	
	'shift':false,
	'touch':false,
	'gold':0,
	'match_in_progress':true,
};
var CURRENT_ROUND = null;
var ROUND_STARTED = false;
var SOCKET;
if (WORLD_STATE['online']) SOCKET = io.connect();

function initWorld(ws) {
	ws['screen'] = setSizes();
	ws['viewport'] = updateSizes(ws['screen'].width, ws['screen'].height);
	return ws;
}
document.addEventListener("keydown", keyboardInput);
document.addEventListener("keyup", shiftOff);
WORLD_STATE = initWorld(WORLD_STATE);

//--- 		CANVAS MAINTENANCE 		---//
var can=document.getElementById("canvas");
can.height = WORLD_STATE['screen'].height;
can.width = WORLD_STATE['screen'].width;
var ctx=can.getContext("2d");

var SPOTS = [];
function canvasOpening() {
	ctx.clearRect(0, 0, can.width, can.height);
	ctx.font="80px Calibri";
	ctx.fillColor="#000";
	
	// autumn
	var col = [
		'#425',
		'#A74',
		'#930',
		'#840',
		
		'#475',
		'#A53',
		'#974',
		'#874',
		
		'#445',
		'#A62',
		'#944',
		'#844',
		
		'#965',
		'#844',
		'#A90',
		'#993',
		'#524',
		
		'#824',
		'#A94',
		'#943',
		'#531',

		'#834',
		'#A54',
		'#973',
		'#534',
	];
	var ran = Math.random()*50+20;
	var spots = [];
	var range_x = WORLD_STATE['map'].right*9/10;
	var range_y = WORLD_STATE['map'].bottom*9/10;
	var c_spread = {};
	for (var i = 0; i < ran; i++) {
		var p = [Math.round(Math.random()*range_x+range_x/10),Math.round(Math.random()*range_y+range_y/10)];
		var sz = Math.random()*80 + 50;
		var c = Math.round(Math.random()*(col.length-1));
		
		if (c_spread[c] == null) c_spread[c] = 0;
		c_spread[c]++;
		
		var sh = [];
		var ran2 = Math.random()*16+8;
		var lump = Math.round(Math.random()*ran2*2-ran2);

		for (var j = 0; j < ran2; j++) {
			var s = 0;
			if (lump > 0) {
				s = j % lump;
				if (lump-s < s) s = lump-s;
				s = s*sz/lump*4;
			}
			var sx = 0;
			var sy = 0;
			if (lump % 2 == 0) {
				sx = s;
			} else {
				sy = s;
			}
			var x = Math.sin((360/ran2*j)/RAD)*(sz+Math.random()*sz/2+sx);
			var y = Math.cos((360/ran2*j)/RAD)*(sz+Math.random()*sz/2+sy);
			x = Math.round(x);
			y = Math.round(y);
			
			sh.push([x,y]);
		}
		var spot = {'pos':p,'colour':col[c],'shape':sh};
		spots.push(spot);
	}
	//console.log(c_spread);
	SPOTS = spots;
}

var DRAWING_SIZE = updateZoom(WORLD_STATE['screen'].height , WORLD_STATE['zoom']);

var img;
img=document.getElementById('background');
var fi = 'img/background_border.png';
img.src=fi;


var BACKGROUND_TILE_SIZE = 128;
var c2=document.getElementById("canvasBackground");
c2.height = (WORLD_STATE['map'].bottom/BACKGROUND_TILE_SIZE+1)*BACKGROUND_TILE_SIZE;
c2.width = (WORLD_STATE['map'].right/BACKGROUND_TILE_SIZE+1)*BACKGROUND_TILE_SIZE;
var ctxFloor=c2.getContext("2d");

var patFloor;
if (WORLD_STATE['online']) {
	patFloor=ctxFloor.createPattern(img,"repeat");
	ctxFloor.rect(0,0,(WORLD_STATE['map'].right/BACKGROUND_TILE_SIZE+1)*BACKGROUND_TILE_SIZE,(WORLD_STATE['map'].bottom/BACKGROUND_TILE_SIZE+1)*BACKGROUND_TILE_SIZE);
	ctxFloor.fillStyle=patFloor;
	ctxFloor.fill();
}


//-- 		ROUND MAINENANCE 		--//
function beginRound () {
	WORLD_STATE['started'] = false;
	WORLD_STATE['mode'] = "player";
	WORLD_STATE['camera'] = {x:WORLD_STATE['map'].right/2,y:WORLD_STATE['map'].bottom/2};
	
	if (WORLD_STATE['gold'] == 0) WORLD_STATE['gold'] = ROUND_SETTINGS['gold'];
	
	var round = initRound(ROUND_SETTINGS, ROUND_STATE);
	round['camera'] = {x:WORLD_STATE['map'].right/2,y:WORLD_STATE['map'].bottom/2};

	setupButtons();
	document.getElementById("timer_counter").innerHTML = round['timer'];

	return round;
}
function initRound(r_settings, r_state) {
	var new_round = {};
	
	for (var v in r_state) {
		if (r_state[v] === 'object') {
			new_round[v] = {};
		} else if (r_state[v] === 'array') {
			new_round[v] = [];
		} else {
			new_round[v] = r_state[v];		
		}
	}
	new_round['lives'] = r_settings['lives'];
	new_round['player'] = {'id':-1, 'lives':new_round['lives']};
	new_round['timer'] = r_settings['timer'];
	new_round['settings'] = {};
	for (var v in r_settings) {
		new_round['settings'][v] = r_settings[v];
	}
	return new_round;
}


function startRoundWrapper() {
	if (WORLD_STATE['starting']) return;
	WORLD_STATE['starting'] = true;
	
	if (WORLD_STATE['online']) {
        SOCKET.emit('round', 'start' );
	} else {
		startRound();
	}

}
function endRoundWrapper() {
	if (WORLD_STATE['online']) {
        SOCKET.emit('round', 'end' );
	} else {
		endRound();
	}
}

function startRound() {
	WORLD_STATE['starting'] = false;
	ROUND_STARTED = true;
	var round = beginRound(WORLD_STATE);
	CURRENT_ROUND = null;
	CURRENT_ROUND = round;
	
	setSizes();
	lifeChange(null,null);
	cooldown_cooldowns(null);
	document.getElementById("background_text").style.display = 'none';
	document.getElementById("config_wrapper").style.display = 'none';
	document.getElementById("endRound").style.display = 'block';
	document.getElementById("pauseRound").style.display = 'block';
	document.getElementById("startRound").style.display = 'none';

//	if (!WORLD_STATE['touch']) {
		var lv_b = document.getElementsByClassName("level_up");
		for (var i = 0; i < lv_b.length; i++) {
			lv_b[i].style.display = 'none';
		}
//	}

	clearInterval(WORLD_STATE['logicTimer']);
	WORLD_STATE['logicTimer'] = setInterval(tickWorld, WORLD_STATE['framerate']);
	
	
	spawnPlayer([CURRENT_ROUND['camera'].x, CURRENT_ROUND['camera'].y]);
}
function endRound(t) {
	if (!ROUND_STARTED) return;
	
	ROUND_STARTED = false;
	WORLD_STATE['started'] = false;
	drawScenery();
  
	cooldown_cooldowns(null);
	resizeButtons(window.innerWidth, window.innerHeight);

	document.getElementById("background_text").style.display = 'block';
	document.getElementById("background_text").innerHTML = '<div>Click to begin!</div>';
	
	document.getElementById("config_wrapper").style.display = 'block';
	document.getElementById("endRound").style.display = 'none';
	document.getElementById("pauseRound").style.display = 'none';
	document.getElementById("startRound").style.display = 'block';


	if (!WORLD_STATE['touch']) {
		var lv_b = document.getElementsByClassName("level_up");
		for (var i = 0; i < lv_b.length; i++) {
			var type = lv_b[i].id.split('_')[0];
			if (type == 'new') type = 'new_player';
			
			if (WORLD_STATE['attacks'][type]['cost'].length == WORLD_STATE['attacks'][type]['level']+1) {
			} else {
				lv_b[i].style.display = 'block';
			}
		}
	}

	//CURRENT_ROUND = null;
	clearInterval(WORLD_STATE['logicTimer']);
	WORLD_STATE['logicTimer'] = setInterval(drawWorld, WORLD_STATE['framerate']);
}


//--         WORLD MAINTENANCE       --//
var buttons_position = [
	function (index) {
		if (index == 0) {
			return 0;
		}
		return WORLD_STATE['viewport'].width / 6;
	}, 
	function (index) {
		return index*WORLD_STATE['viewport'].height/16;
	}
];
var HOVER_TOOLTIP = null;

function drawScenery() {
	
	ctx.clearRect(0, 0, can.width, can.height);
	ctx.strokeStyle="#000";
	
	// background
	ctx.beginPath();
	ctx.fillStyle="#A73";
	ctx.fillRect(0,0, WORLD_STATE['screen'].width, WORLD_STATE['screen'].height);
	if (CURRENT_ROUND == null) return;

	// spots
	for (var sp in SPOTS) {
		var s = SPOTS[sp];
		ctx.fillStyle=s['colour'];

		var p = map_to_screen(s['pos']);
		var x = p[0];
		var y = p[1];
		draw_shape(x, y, s['shape'], ctx, DRAWING_SIZE);
	}
	draw_shape(-10,-10,[-10,-10],ctx,1);	// hack to avoid html giving stuff a line

	// lava
	ctx.fillStyle="#A00";
	//ctx.globalAlpha = 0.7;
	var lava_lvl = CURRENT_ROUND['settings']['lava_level'];
	var lava_w = CURRENT_ROUND['settings']['lava_width'];
	var closeBound_xy = map_to_screen([lava_lvl * lava_w, lava_lvl * lava_w]);
	var farBound_xy = map_to_screen([WORLD_STATE['map'].right - lava_lvl * lava_w, WORLD_STATE['map'].bottom - lava_lvl * lava_w]);

	ctx.fillRect(0,0, closeBound_xy[0], WORLD_STATE['screen'].height);
	ctx.fillRect(0,0, WORLD_STATE['screen'].width, closeBound_xy[1]);
	
	ctx.fillRect(farBound_xy[0], 0, WORLD_STATE['screen'].width, WORLD_STATE['screen'].height);
	ctx.fillRect(0,farBound_xy[1], WORLD_STATE['screen'].width, WORLD_STATE['screen'].height);

	ctx.globalAlpha = 1;
	ctx.fillStyle="#000";

	if (WORLD_STATE['mode'] == "observer") {
		ctx.fillText("OBSERVING",WORLD_STATE['screen'].width/2-50,WORLD_STATE['screen'].height/5);		
	}
	

	var living_symbol_size = 40;
	for (var i = 0; i < CURRENT_ROUND['living_colours'].length; i++) {
		ctx.fillStyle='#fff';		
		ctx.fillRect(/*WORLD_STATE['screen'].width - */((i/*+1*/)*living_symbol_size),WORLD_STATE['screen'].height - living_symbol_size, living_symbol_size, living_symbol_size);	

		if (CURRENT_ROUND['living_colours'][i] == null) continue;

		ctx.fillStyle=CURRENT_ROUND['living_colours'][i]['colour'];
		ctx.fillRect(/*WORLD_STATE['screen'].width - */((i/*+1*/)*living_symbol_size-1),WORLD_STATE['screen'].height - living_symbol_size+2, living_symbol_size-2, living_symbol_size-4);	

	}
	LIVES_CHANGED = false;
    ctx.stroke();   

}

function drawWorld () {

	ctx.lineWidth = 1;
	
	ctx.font="40px Calibri";
	drawScenery();
	
	ctx.fillStyle="#000";

	if (CURRENT_ROUND == null) return;
	
    CURRENT_ROUND['objects'].forEach(function (object) {
		if (object == null || (object['dead'])) return;
		
		if ('invisible' in object && !isNaN(object['invisible']) && object['invisible'] > 0) {		
		// TODO - && object['action'] == 'still'		--	only invis when not moving
				// this about how you want this to work
			return;
		}
	
        draw(object);
    });
	if ('invisible' in CURRENT_ROUND['player'] && !isNaN(CURRENT_ROUND['player']['invisible']) && CURRENT_ROUND['player']['invisible'] > 0) {
		ctx.globalAlpha = 0.3;
		draw(CURRENT_ROUND['player']);
		ctx.globalAlpha = 1;
	}
	
	
	// draw a cross on the destination position
	if (CURRENT_ROUND['player']['dead'] != true && CURRENT_ROUND['player']['dest'] != null && CURRENT_ROUND['player']['dest'][0] != CURRENT_ROUND['player']['pos'][0] && 
	CURRENT_ROUND['player']['dest'][1] != CURRENT_ROUND['player']['pos'][1]) {
		var ds = map_to_screen(CURRENT_ROUND['player']['dest']);
		ctx.beginPath();
		ctx.strokeStyle = '#000';
		ctx.lineWidth = 4;
		var xs = 14;
		ctx.moveTo(ds[0]-xs,ds[1]-xs);
		ctx.lineTo(ds[0]+xs,ds[1]+xs);
		ctx.moveTo(ds[0]-xs,ds[1]+xs);
		ctx.lineTo(ds[0]+xs,ds[1]-xs);
	}
	ctx.stroke();   

	ctx.strokeStyle = '#000';
	var mode = WORLD_STATE['mode'];
	if (mode != 'player' && mode != 'observer') {
		if ('aim_range' in WORLD_STATE['attacks'][mode] && WORLD_STATE['attacks'][mode]['aim_range'] > 1) {
			var ps = map_to_screen(CURRENT_ROUND['player']['pos']);
			var sz = WORLD_STATE['attacks'][mode]['aim_range']*DRAWING_SIZE;
			
			ctx.beginPath();
			ctx.arc(ps[0],ps[1],sz, 0, 2*Math.PI);
		}
	}
	ctx.stroke();   

 
}

function tickWorld () {
    if (PAUSE || !ROUND_STARTED) {
      return;
    }

	CURRENT_ROUND['ticks']++;
	if (false && CURRENT_ROUND['ticks'] in CURRENT_ROUND['message_queue']) {
		for (var msg in CURRENT_ROUND['message_queue'][CURRENT_ROUND['ticks']]) {
			execute_message(CURRENT_ROUND['message_queue'][CURRENT_ROUND['ticks']][msg]);
		}
		CURRENT_ROUND['message_queue'][CURRENT_ROUND['ticks']] = null;
		delete CURRENT_ROUND['message_queue'][CURRENT_ROUND['ticks']]; 
	}
	
	if (CURRENT_ROUND['ticks'] > 1000*1000) {
	// 20 sec should be 1000 atm
		CURRENT_ROUND['ticks'] = 0;
	}
	
    if (BEFORE != 0) {
      NOW = new Date();
	  var elapsedTime = (NOW.getTime() - BEFORE.getTime());

      while (elapsedTime > WORLD_STATE['framerate']*2) {		
	  // TODO - run additional logics to cath up if necessary
			// this would only be necessary if we need stuff frame perfect, which may be the case when considering the 'tick'/'message_queue' stuff above
			debugWrapper(logicWorld, null, 'logic');

        elapsedTime-=WORLD_STATE['framerate'];
      }
    }
    BEFORE = NOW;

	for (var i = 0; i < CURRENT_ROUND['objects'].length; i++) {
		if (CURRENT_ROUND['objects'][i] != null && CURRENT_ROUND['objects'][i]['dead']) {
			if (CURRENT_ROUND['player']['id'] != i && 
				CURRENT_ROUND['objects'][i]['type'] != 'player') {
				CURRENT_ROUND['objects'][i] = null;
			}
		}
	}

//    logicWorld();
	debugWrapper(logicWorld, null, 'logic');
//	drawWorld();
	debugWrapper(drawWorld, null, 'draw');
	if (DEBUG) showDebugInfo();
  
}
function cooldown_cooldowns (change) {
	if (CURRENT_ROUND == null) return;

	for (cd in CURRENT_ROUND['cooling']) {
		if (CURRENT_ROUND['cooling'][cd] == null) continue;
		if (change == null) {
			CURRENT_ROUND['cooling'][cd] = 0;		
		} else {
			CURRENT_ROUND['cooling'][cd] += change;
		}
		if (WORLD_STATE['button_icon']) {
			document.getElementById(cd).innerHTML = CURRENT_ROUND['cooling'][cd];
			if (CURRENT_ROUND['cooling'][cd] <= 0) {
				document.getElementById(cd).className = 'attack attack_button';
				CURRENT_ROUND['cooling'][cd] = null;
				drawAttackButton(cd, document.getElementById(cd), null);
			} else {
			
			}
		
		} else {
			drawAttackButton (cd, document.getElementById(cd), CURRENT_ROUND['cooling'][cd]);

			if (CURRENT_ROUND['cooling'][cd] <= 0) {
				document.getElementById(cd).className = 'attack attack_button';
				CURRENT_ROUND['cooling'][cd] = null;

				drawAttackButton (cd, document.getElementById(cd), WORLD_STATE['attacks'][cd]['hotkey']);
			} else {	
			
			}
		}
	}
}
function drawAttackButton (id, el, bracket) {
				
	var icon_string = "<span id='"+id+"_icon_canvas' class='icon_canvas'></span>";
	var size = 40;
	
	if (WORLD_STATE['button_icon']) {
		el.innerHTML = icon_string;
		var ic = document.getElementById(id+"_icon_canvas");
		drawIconCanvas(id, ic, null, size);
	
		
	} else {
		el.innerHTML = icon_string+"<span style='position:relative;top:4px;'>"+id.toUpperCase()+"("+bracket+")</span>";		
		el.style.width = '240px';
	
		var ic = document.getElementById(id+"_icon_canvas");
		drawIconCanvas(id, ic, null, size);
		if (BUTTON_LEFT) {
			ic.style.float = 'left';
		} else {
			ic.style.float = 'right';
		}
		var ic_can = document.getElementById(id+"_canvas");
		if (ic_can != null) ic_can.style.position = 'relative';
	}

}
function logicWorld () {
	TICKS++;
	DEBUG_TICKS++;

	if (TICKS >= 1000/WORLD_STATE['framerate']) {
		TICKS = 0;
		cooldown_cooldowns(-1);
		CURRENT_ROUND['settings']['lava_tick']++;
		if (CURRENT_ROUND['settings']['lava_tick'] >= CURRENT_ROUND['settings']['lava_increment']) {
			CURRENT_ROUND['settings']['lava_level']++;
			CURRENT_ROUND['settings']['lava_tick'] = 0;
		}
		document.getElementById('timer_counter').innerHTML = --CURRENT_ROUND['timer'];

	}

	CURRENT_ROUND['objects'].forEach(function (object) {
		if (object == null || (object['dead'])) return;
		
		if (object['casting'] !== false && object['casting'] >= 0) {
			object['casting']--;
			return;
		}
		if ('on_tick' in object) {
			object['on_tick'](object);
		} else if ('on_tick' in WORLD_STATE['attacks'][object['type']]) {
			WORLD_STATE['attacks'][object['type']]['on_tick'](object);
		}
		
		if ('invisible' in object && !isNaN(object['invisible']) && object['invisible'] > 0) {
			if (object['invisible'] !== true) {
				object['invisible']--;
			}
		}
		if ('invincible' in object && !isNaN(object['invincible']) && object['invincible'] > 0) {
			if (object['invincible'] !== true) {
				object['invincible']--;
			}
		}

		debugWrapper(change_move, object, 'move');
        if (object['collidable'] === true) {
			debugWrapper(collide_check, object, 'collide_check');
          //collide_check(object);
        }
    
    });
}
function change_move (object) {
	if (move(object)) object['redraw'] = true;
}
function pauseWrapper() {
	if (WORLD_STATE['online']) {
        SOCKET.emit('round', 'pause' );
	} else {
		pause();
	}	
}
function pause() {
  console.log(CURRENT_ROUND);
  PAUSE = !PAUSE;
}
function exitWrapper() {
	if (WORLD_STATE['online']) {
        SOCKET.emit('round', 'exit' );
	} else {
		exit();
	}	
}
function exit() {
	console.log("exited");
	clearInterval(WORLD_STATE['logicTimer']);
	document.getElementById('debug').innerHTML = "exited";
}

function goldChange (dif) {
   WORLD_STATE['gold'] += dif;
   document.getElementById('gold_counter').innerHTML = WORLD_STATE['gold'];
   
   var shop = document.getElementsByClassName('shop_items');
   for (var i = 0; i < shop.length; i++) {
     var type = shop[i].id;

	 if (!(type in WORLD_STATE['attacks'])) {
		// TODO - this is not very nice
		type = type.split('_')[0];
		if (type == "new") type = "new_player";
	 }
	 if (!('cost' in WORLD_STATE['attacks'][type])) continue;

	 var cur_l = WORLD_STATE['attacks'][type]['level'];
	 
	 if (WORLD_STATE['attacks'][type]['buy'] == false) cur_l++;
			// TODO - sort out how to handle costs on items which you don't need to initially buy
	 
	 var cost = WORLD_STATE['attacks'][type]['cost'][cur_l];
	 var lv = '';
	 if (shop[i].id.indexOf('level_up') != -1) {
		lv = ' level_up'; 
	 }

     if (cost <= WORLD_STATE['gold']) {
       shop[i].className = "shop_items buyable attack_button"+lv;
     } else {
       shop[i].className = "shop_items attack_button"+lv;
     }
   }
}

function outOfWorld(xy) {
	if (WORLD_STATE['map'].right < xy[0] || WORLD_STATE['map'].left > xy[0] ||  WORLD_STATE['map'].top > xy[1] || WORLD_STATE['map'].bottom < xy[1]) {
		return true;
	}
	return false;
}

function collidableChange (new_object, delete_object_index) {
	// pass any changes to CURRENT_ROUND['obstacles'] through here
	// add or remove obstacles from the CURRENT_ROUND['obstacles'] global
		// then re-pathfind any movements

	if (new_object != null) {
		for (var i = 0; i < new_object.length; i++) {
			new_object[i]['obstacle_id'] = addToArray(CURRENT_ROUND['obstacles'], new_object[i]);	
		}
	}
	if (delete_object_index != null) {
		for (var i = 0; delete_object_index.length; i++) {
			CURRENT_ROUND['obstacles'][delete_object_index[i]] = null;
		}
	}
	
	for (var i = 0; i < CURRENT_ROUND['objects'].length; i++) {
		if (CURRENT_ROUND['objects'][i] != null && CURRENT_ROUND['objects'][i]['collidable'] && ('obstacle' in CURRENT_ROUND['objects'][i]) && CURRENT_ROUND['objects'][i]['obstace']) {
			newPlayerMovement(CURRENT_ROUND['objects'][i], CURRENT_ROUND['objects'][i]['dest'], false);
		}
	}
}
  
  
  
  
  
  
//--         OBJECT MAINTENANCE      --//
function addToArray (array, object) {
	var id = -1;
	if (array == null) return id;
	
	for (var i = 0; i < array.length; i++) {
		if (array[i] == null) {
			array[i] = object;
			return i;
		}
	}
	array.push(object);
	id = array.length-1;
	return id;
}
function animateFrame (obj, canvas, ds) {
	var xy = map_to_screen(obj['pos']);

	var x = xy[0];
	var y = xy[1];

	var fr = WORLD_STATE['attacks'][obj['type']]['animation'][obj['action']];
	
	if (fr == null) {
		obj['current_animation']++;
		return;
	}
	
	var index = 0;
	var cr = obj['current_animation'];
	while (fr['animations']['frames'][index]*WORLD_STATE['frame_length'] < cr ) {
		cr -= fr['animations']['frames'][index]*WORLD_STATE['frame_length'];
		index++;
		if (index >= (fr['total'])) {
			cr = 0;
			obj['current_animation'] = cr;
			index = 0;
			if (fr['finish'](obj)) return;
		}
	}	
	if (obj['casting'] !== false && obj['casting'] >= 0) {
		casting_animation(obj, canvas, ds);
		return;
	}
	var not_nice = null;
	if (obj['type'] == "player") not_nice = obj['colour'];
	fr['animations']['func'][index](obj, canvas, cr, not_nice, ds);
	
	obj['current_animation']++;
}

function spawnPlayer (xy) {
	if (xy == null) xy = [0,0];
	
	if ('alive' in CURRENT_ROUND['player'] && CURRENT_ROUND['player']['alive']) {
		if (CURRENT_ROUND['player']['lives'] == 0) {
			return;
		}
		var o = constructObject("player", xy, null);
		o['id'] = CURRENT_ROUND['player']['id'];
		o['colour'] = CURRENT_ROUND['player']['colour'];
		CURRENT_ROUND['player'] = o;
		CURRENT_ROUND['player']['dead'] = false;
		CURRENT_ROUND['objects'][CURRENT_ROUND['player']['id']] = CURRENT_ROUND['player'];
		//lifeChange(o['lives'], o['colour']);

		// TODO - type respawn is accounted for in the server, will also need some way to know who is respawning
		if (WORLD_STATE['online']) {
		  SOCKET.emit('client', {type:'respawn', obj:o} );
		}
	} else {

		var o = constructObject("player", xy, null);
		
		if (WORLD_STATE['online']) {
		  SOCKET.emit('client', {type:'new', obj:o} );
		} else {
			var colours = ['#F00','#00F','#0F0','#888'];
			o['colour'] = colours[CURRENT_ROUND['living']];
		  if (WORLD_STATE['mode'] == "player") {
			var new_id = newObject(o);
			CURRENT_ROUND['player']['id'] = new_id;
			CURRENT_ROUND['objects'][CURRENT_ROUND['player']['id']]['id'] = CURRENT_ROUND['player']['id'];
			CURRENT_ROUND['player'] = CURRENT_ROUND['objects'][CURRENT_ROUND['player']['id']];

			var bt_can = document.getElementById("player_icon_canvas");
			var size = 40;
			drawIconCanvas("player", bt_can, null, size);
		  }  
		}
	}
	CURRENT_ROUND['player']['alive'] = true;

	WORLD_STATE['started'] = true;
    changeMode("player");
	document.getElementById("background_text").style.display = 'none';


}
function lifeChange(x, c){
	if (CURRENT_ROUND == null) return;

	if (c != null) {
		if (x > 0) {
			addToArray(CURRENT_ROUND['living_colours'], {'colour':c,'lives':x});
		} else {
			for (var i = 0; i < CURRENT_ROUND['living_colours'].length; i++) {
				if (CURRENT_ROUND['living_colours'][i] == null) continue;
				
				if (CURRENT_ROUND['living_colours'][i]['colour'] == c) {
					CURRENT_ROUND['living_colours'][i]['lives'] +=x;
					if (CURRENT_ROUND['living_colours'][i]['lives'] <= 0) {
						CURRENT_ROUND['living_colours'][i] = null;
					}
				}
			}
		}
	}
	CURRENT_ROUND['living'] += x;

	var living_symbol_size = 40;
	var lives_box = document.getElementById('lives_box');
	lives_box.innerHTML = '';
	for (var i = 0; i < CURRENT_ROUND['living_colours'].length; i++) {
		if (CURRENT_ROUND['living_colours'][i] == null) continue;
		var txt = CURRENT_ROUND['living_colours'][i]['lives'];
		var left_p = (i*living_symbol_size);
		var top_p = WORLD_STATE['screen'].height - living_symbol_size;
		lives_box.innerHTML += "<span class='lives_slot' style='left:"+left_p+"px;top:"+top_p+"px'>"+txt+"</span>";
	}
	

	//document.getElementById("player_counter").innerHTML = CURRENT_ROUND['living'];
	var living = 0;
	for (var i = 0; i < CURRENT_ROUND['living_colours'].length; i++) {
		if (CURRENT_ROUND['living_colours'][i] != null) {
			living++;
		}
	}
	return living;
}
function getCollisionBox(xy) {
	var loc = xy[0]/WORLD_STATE['map'].width + (xy[1]/WORLD_STATE['map'].height * 10);
	return loc;
}
function newObject (msg) {
	var index = -1;
    var obj = {};
    obj = msg;
	if (obj['type'] == "player") {
		lifeChange(obj['lives'], obj['colour']);
		goldChange(0);
	} else if ('obstacle' in obj && obj['obstacle'] == true) {
		collidableChange([obj], null);
	}
	index = addToArray(CURRENT_ROUND['objects'], obj);	
	CURRENT_ROUND['objects'][index]['id'] = index;

	if (obj['collidable'] == true && obj['type'] != 'player' && obj['type'] != 'sheild' && obj['type'] != 'homing' ) {
		CURRENT_ROUND['objects'][index]['owner'] = index;
	}
	
	if ('sustained' in WORLD_STATE['attacks'][obj['type']] && WORLD_STATE['attacks'][obj['type']]['sustained'] != null) {
		if (CURRENT_ROUND['objects'][obj['owner']]['sustaining'] == null) CURRENT_ROUND['objects'][obj['owner']]['sustaining'] = [];
		addToArray(CURRENT_ROUND['objects'][obj['owner']]['sustaining'], index);
		
		// TODO - this messes up because of the delay, try make the dest and pos of owner into the pos of the object
		var des = [CURRENT_ROUND['objects'][obj['owner']]['pos'][0], CURRENT_ROUND['objects'][obj['owner']]['pos'][1]];
		CURRENT_ROUND['objects'][obj['owner']]['dest'] = des;
		
		CURRENT_ROUND['objects'][index]['sustained'] = obj['owner'];
	}

	return index;
}
function killObject(object) {
	if (object == null || object['dead']) return;
	object['dead'] = true;
	
	if ('on_death' in WORLD_STATE['attacks'][object['type']] && WORLD_STATE['attacks'][object['type']]['on_death']) {
		var ret = WORLD_STATE['attacks'][object['type']]['on_death'](object);
		if (ret) return;
	}

	if (object['id'] == CURRENT_ROUND['player']['id']) {
		CURRENT_ROUND['player']['lives']--;
		CURRENT_ROUND['lives']--;
		if (CURRENT_ROUND['lives'] > 0) { 
			WORLD_STATE['started'] = false;
			document.getElementById("background_text").style.display = 'block';
			document.getElementById("background_text").innerHTML = "<div>Click to respawn!</div>";
	// TODO - respawn
			return;
		} else {
			changeMode("observer");
		}
	}
	if ('obstacle' in object && object['obstacle'] == true) {
		collidableChange(null, object['obstacle_id']);
	}
		
	if ('sustained' in object && object['sustained'] != null) {
		var sust = CURRENT_ROUND['objects'][object['sustained']]['sustaining'];
		for (var id in sust) {
			if (sust[id] == object['id']) sust[id] = null;
			console.log(id);
		}
		CURRENT_ROUND['objects'][object['sustained']]['sustaining'] = sust;
		
	}
	
	if (object['type'] == 'player') return;
	object = null;
	
}
function getOwner (obj) {
	if (CURRENT_ROUND == false) return null;
	if (!('owner' in obj)) return null;
	if (obj['owner'] <= -1) return null;
	return CURRENT_ROUND['objects'][obj['owner']];
}
function popMoveQueue (object) {
	// make player act upon next destination in the movement queue
	if ('move_queue' in object && object['move_queue'] != null && object['move_queue'].length > 0) {
		var mpos = null;
		while (mpos == null) {
			if (object['move_queue'].length == 0) return;
			mpos = object['move_queue'].shift();
			if (mpos === false) {
				mpos = null;
				object['pathfound'] = false;
			}
		}
		newPlayerMovement (object, mpos, false);
		
	}
}
function calcPlayerMovement (object, updating) {
	// pathfind the players movement
	
	// TODO this is run even if the path was found earlier and the dests haven't change, is an efficiency issue
	if ('pathfound' in object && object['pathfound'] == true) return true;
	
	if (CURRENT_ROUND['obstacles'] != null && CURRENT_ROUND['obstacles'].length > 0) {
		var pp = [object['pos'][0], object['pos'][1]];
		var dp = [object['dest'][0], object['dest'][1]];
		var sp = object['size'];
		
		var new_paths = calc_collidables([{'pos':pp, 'dest':dp,'size':sp}], CURRENT_ROUND['obstacles']);
				
		if (new_paths == null || new_paths[0] == false) return false;

		var clean_paths = [];
		var index = 0;
		for  (var i = 1; i < new_paths.length; i++) {
			if (new_paths[i] != null) {
				clean_paths[index] = new_paths[i]['dest'];
				index++;
			}
		}
		clean_paths[index] = false;
		
		
		// remove all the most recently expanded (pathfound) values
		var prev_exp = false;	// if they exist
		if (object['move_queue'] != null && object['move_queue'].length > 0) {
			for (var i = 0; i < object['move_queue'].length; i++) {
				if (object['move_queue'][i] === false) {
					prev_exp = true;
					break;
				}
			}
		}
		if (updating && prev_exp) {

			var del_pos = null;
			do {
				del_pos = object['move_queue'].shift();
			} while (del_pos !== false);
		}
		object['move_queue'] = insert_array(object['move_queue'], clean_paths, 0);
		object['dest'] = new_paths[0]['dest'];
		object['pathfound'] = true;

	}
	return true;
}
function newPlayerMovement (object, new_pos, empty) {
// direct player to move to new_pos
	// if empty, empty out the 'move_queue'
	if (empty) {
		if ('move_queue' in object && object['move_queue'] != null && object['move_queue'].length > 0) {
			object['move_queue'] = [];
		}
		object['pathfound'] = false;
	}
	object['dest'] = new_pos;
	
	if (calcPlayerMovement(object, false)) {	
		object['dir'] = getDir(object['pos'],object['dest']);
		object['sp'] = object['move_speed'];
	} else {
		object['dest'] = object['pos'];
	}
}
function addPlayerMovement (object, new_pos) {
// add a destination to the 'move_queue'
	if (!('move_queue' in object)) {
		object['move_queue'] = [];
	}
	object['move_queue'].push(new_pos);	
}

function updateObject (msg) {
	if (CURRENT_ROUND['objects'][msg['id']]['type'] == "player") {
		
		// remove any attacks being sustained by the player
		if ('sustaining' in CURRENT_ROUND['objects'][msg['id']] && CURRENT_ROUND['objects'][msg['id']]['sustaining'] != null) {
			for (var i = 0; i < CURRENT_ROUND['objects'][msg['id']]['sustaining'].length; i++) {
				var id = CURRENT_ROUND['objects'][msg['id']]['sustaining'][i];
				killObject(CURRENT_ROUND['objects'][id]);
			}	
		}
		
    	CURRENT_ROUND['objects'][msg['id']]['action'] = 'moving';

		if (msg['key'] == 'dest') {

			if (CURRENT_ROUND['objects'][msg['id']]['dest'] == null) {
				// TODO - incorporate this into movement queeu and newPlayerMovement etc. - ~maybe~
				var force = {'sp':CURRENT_ROUND['objects'][msg['id']]['move_speed'],'dir':getDir(CURRENT_ROUND['objects'][msg['id']]['pos'],msg['value'])};
						
				actingForce(CURRENT_ROUND['objects'][msg['id']], force);		
			} else {

				newPlayerMovement (CURRENT_ROUND['objects'][msg['id']], msg['value'], true);

			}
		} else if (msg['key'] == 'move_queue') {
			addPlayerMovement (CURRENT_ROUND['objects'][msg['id']], msg['value']);

		} else {
			CURRENT_ROUND['objects'][msg['id']][msg['key']] = msg['value'];
		}
		if (msg['id'] == CURRENT_ROUND['player']['id']) {
			CURRENT_ROUND['player'] = CURRENT_ROUND['objects'][CURRENT_ROUND['player']['id']];
		}
		
	} else {
	    CURRENT_ROUND['objects'][msg['id']][msg['key']] = msg['value'];
	//	CURRENT_ROUND['objects'][msg['id']]['dir'] = null;
	}
}
function collision(object_one, object_two) {

  if ('on_collision' in WORLD_STATE['attacks'][object_two['type']]) {
    var ret = WORLD_STATE['attacks'][object_two['type']]['on_collision'](object_one, object_two);
	if (ret[0]) return ret[1];
  }

  if (object_two['owner'] == object_one['id'] || object_one['owner'] == object_two['id']) {
	return true; // TODO - URGENT - put this back on, s
  }
  
  if ('mana' in object_one) {
	object_one['mana']++;
	if (object_one['mana'] > WORLD_STATE['attacks'][object_one['type']]['mana']) {
		object_one['mana'] = WORLD_STATE['attacks'][object_one['type']]['mana'];
	}
  }
  var owner = getOwner(object_two);
  if (owner != null && 'mana' in owner) {
	owner['mana']++;
	if (owner['mana'] > WORLD_STATE['attacks'][owner['type']]['mana']) {
		owner['mana'] = WORLD_STATE['attacks'][owner['type']]['mana'];
	}
  }

  object_one['health'] -= object_two['damage'];
  if (object_one['health'] <= 0) {
	object_one['action'] = 'death';
	killObject(object_one);
	return false;
  }
  object_one['dest'] = null;
  var force = findForce(object_one, object_two);  
  
  actingForce(object_one, force, true);
  
  return false;

}

//--         DRAW          --//

function draw (obj) {   
/*	if (!obj['redraw']) {
		return;
	} else {
		obj['redraw'] = false;
	}*/
	var screen_pos = map_to_screen(obj['pos']);
	var fs = obj['size']*DRAWING_SIZE;
	if (screen_pos[0]+fs < 0 || screen_pos[1]+fs < 0 || 
		screen_pos[0]-fs < WORLD_STATE['screen'][0] || screen_pos[1]-fs < WORLD_STATE['screen'][1]) {
		// TODO - do not draw objects which are not on the screen
		if ('global' in WORLD_STATE['attacks'][obj['type']] && WORLD_STATE['attacks'][obj['type']]['global'] == true) {
		} else {
			return;	
		}
	}
  
  if ('health' in obj) {	// draw hp bar
  	var old = ctx.globalAlpha;
	ctx.globalAlpha = 1;

	var cur = obj['health'];
	var max = WORLD_STATE['attacks'][obj['type']]['health'];
	    
    ctx.fillStyle="#F00";
	var above = 20*DRAWING_SIZE;
	if (above < 10) above = 10;

	drawBar(screen_pos[0], screen_pos[1], cur, max, above, "#F00", "#0F0");
    
	ctx.globalAlpha = old;
  }
  if ('mana' in obj) {	// draw mana bar
  	var old = ctx.globalAlpha;
	ctx.globalAlpha = 1;

	var cur = obj['mana'];
	var max = WORLD_STATE['attacks'][obj['type']]['mana'];
	    
	var above = 18*DRAWING_SIZE;
	if (above < 8) above = 8;

	drawBar(screen_pos[0], screen_pos[1], cur, max, above, "#999", "#00F");
    
	ctx.globalAlpha = old;
  }
	var ds = DRAWING_SIZE;
	if (ds == null) ds = 1;
	animateFrame(obj, ctx, ds);
	

}  
function drawBar (x, y, cur, max, above, c1, c2) {
	ctx.beginPath();

	var width = 10*DRAWING_SIZE;
	if (width < 5) width = 5;
    ctx.fillStyle=c1;
    ctx.fillRect(x-width,y-above,width*2,4);   
    
	var h_perc = cur / max * width*2;
    ctx.fillStyle=c2;
    ctx.fillRect(x-width,y-above,h_perc,4);   
	ctx.fill();
}
     
//--         INPUT HANDLING      --// 
function checkForButton(xy) {
	var i = 0;
	for (var at in WORLD_STATE['attacks']) {
		buttons_position[1](i), buttons_position[0](i+1), buttons_position[1](i+1)
		if (xy[0] > buttons_position[0](0) && xy[0] < buttons_position[0](i+1) && 
			xy[1] > buttons_position[1](i) && xy[1] < buttons_position[1](i+1)) {
			return at;
		}
		i++;
	}
	return -1;
}

document.getElementById("canvas").onclick = playerClick;
document.getElementById("background_text").onclick = playerClick;

function playerClick (event) {
	if (WORLD_STATE['match_in_progress']) return;
	
  var xy = getCursorPosition(event);
	var old_xy = [xy[0],xy[1]];
	var cxy = screen_to_map(xy);
	xy[0] = cxy[0];
	xy[1] = cxy[1];

	if (WORLD_STATE['started']){// && WORLD_STATE['mode'] != "new_player") {
  //CURRENT_ROUND['objects'][0]['dest'] = xy;
    if (WORLD_STATE['mode'] == "player") {
      
      if (outOfWorld(xy)) { return;};
	  
	  var msg_key = 'dest';
		if (WORLD_STATE['shift']) {
			msg_key = 'move_queue';
		}
      if (WORLD_STATE['online']) {
        SOCKET.emit('client', {type:'move', key:msg_key, value:xy, id:CURRENT_ROUND['player']['id']} );
      } else {
        updateObject({'key':msg_key,'value':xy,'id':CURRENT_ROUND['player']['id']});
      }

  // dont remmeber what below is for
        //		var o = constructObject(WORLD_STATE['mode'], xy, CURRENT_ROUND['player']);
        //		newObject(o);

    } else if (WORLD_STATE['mode'] == "observer") {
      CURRENT_ROUND['camera'].x = xy[0];
      CURRENT_ROUND['camera'].y = xy[1];

    } else {
	  if (WORLD_STATE['mode'] == "new_player") changeMode("player");
      var o = constructObject(WORLD_STATE['mode'], xy, CURRENT_ROUND['player']); 
	  if (WORLD_STATE['mode'] == "player") {
	  		var colours = ['#F00','#00F','#0F0','#888'];
		o['colour'] = colours[CURRENT_ROUND['living']];
	  }
      if (WORLD_STATE['online']) {
        SOCKET.emit('client', {type:'new', obj:o} );
      } else {
        newObject(o);       
      }      

      CURRENT_ROUND['cooling'][WORLD_STATE['mode']] = WORLD_STATE['attacks'][WORLD_STATE['mode']]['cd'][WORLD_STATE['attacks'][WORLD_STATE['mode']]['level']];		
      document.getElementById(WORLD_STATE['mode']).className = 'attack attack_button cooldown';
	  if (WORLD_STATE['button_icon']) {
	  	document.getElementById(WORLD_STATE['mode']).innerHTML = CURRENT_ROUND['cooling'][WORLD_STATE['mode']];
	  } else {
		drawAttackButton(WORLD_STATE['mode'], document.getElementById(WORLD_STATE['mode']), CURRENT_ROUND['cooling'][WORLD_STATE['mode']]);
		
	  }
      changeMode("player");
      
    }
  } else {

	if (!ROUND_STARTED) {
		startRoundWrapper();
		return;
	}
    //xy = [CURRENT_ROUND['camera'].x,CURRENT_ROUND['camera'].y];
	CURRENT_ROUND['camera'].x = xy[0];
	CURRENT_ROUND['camera'].y = xy[1];

	spawnPlayer(xy);
  }  

}
/*
document.getElementById("canvasGUI").onmousemove = function(event) {

  var xy = getCursorPosition(event);
  
  var button = checkForButton(xy);

  if (button == -1) {
  	HOVER_TOOLTIP = null;
  	return;
  }
  HOVER_TOOLTIP = {'text':button,'left':xy[0],'top':xy[1]};
};
*/
function keyboardInput (e) {
	var keynum;

    if(window.event) { // IE                    
      keynum = e.keyCode;
    } else if(e.which){ // Netscape/Firefox/Opera                   
      keynum = e.which;
    }
	if (keynum === 16) {
		WORLD_STATE['shift'] = true;
		return;
	}

   // alert(String.fromCharCode(keynum));
	hotkeyAttack(String.fromCharCode(keynum));
}
function shiftOff (e) {
	var keynum;

    if(window.event) { // IE                    
      keynum = e.keyCode;
    } else if(e.which){ // Netscape/Firefox/Opera                   
      keynum = e.which;
    }
	if (keynum === 16) {
		WORLD_STATE['shift'] = false;
		return;
	}	
}
function hotkeyAttack (c) {
	var hotkeys = document.getElementById('attack_div').getElementsByTagName('button');
	for (var i = 0; i < hotkeys.length; i++) {
		if ((hotkeys[i].id in WORLD_STATE['attacks']) && WORLD_STATE['attacks'][hotkeys[i].id]['hotkey'] == c) {
			changeMode(hotkeys[i].id, false);
			return;
		}
	}
}

function changeMode (item_id, touch) {

	if (item_id == 'observer') {
		WORLD_STATE['mode'] = item_id;
		return;
	}
	if (item_id == null) item_id = WORLD_STATE['mode'];
	
	/*
	if (WORLD_STATE['touch'] && touch == null && CURRENT_ROUND == null) {
		// if touch screen put up the tooltip with a confirm button
		showTooltip(item_id, null, null);
		var tt = document.getElementById('tooltip');
		tt.innerHTML += "<button class='attack_button' onlick='levelUp(\""+item_id+"\",true)'>Confirm</button>";
		return;
	}
	*/
	
	if (WORLD_STATE['mode'] == 'observer' || CURRENT_ROUND == null) {
		return;
	}

	// return if still cooling down
	for (cd in CURRENT_ROUND['cooling']) {
		if (cd == item_id && CURRENT_ROUND['cooling'][cd] != null) {
			return;
		}
	}
	// buy the attack if applicable
	if (WORLD_STATE['attacks'][item_id]['buy']) {
		var item = document.getElementById(item_id);
		var cost = WORLD_STATE['attacks'][item_id]['cost'][WORLD_STATE['attacks'][item_id]['level']];
		if (WORLD_STATE['gold'] < cost) {
			return;
		}
		item.className = "attack attack_button";
		WORLD_STATE['attacks'][item_id]['buy'] = false;
		goldChange(-cost);
		return;
	}

	var sel = document.getElementsByClassName('selected_button');
	if (sel.length > 0) {
		sel[0].className = 'attack_button attack';
	}
	document.getElementById(item_id).className = 'attack_button selected_button attack';
	
	var sel = document.getElementsByClassName('selected_button_canvas');
	if (sel.length > 0) {
		sel[0].className = "icon_canvas";
	}
	document.getElementById(item_id+"_icon_canvas").className = 'icon_canvas selected_button_canvas';
	
	WORLD_STATE['mode'] = item_id;

}
function levelUp (type, touch) {
	if (WORLD_STATE['touch'] && touch == null) {
		// if touch screen put up the tooltip with a confirm button
		
		// TODO - incorporate this with the equivalent in changeMode() and I think other things too
		showTooltip(type, null, 'level');
		var tt = document.getElementById('tooltip');
		tt.innerHTML += "<button class='attack_button' onlick='levelUp(\""+type+"\",true)'>Confirm</button>";
		return;
	}
	
	var cur_l = WORLD_STATE['attacks'][type]['level'];
	if (WORLD_STATE['attacks'][type]['cost'].length <= cur_l+1) {
		return;	// shouldn't even be appearing if this is the case
	}
	var cost = WORLD_STATE['attacks'][type]['cost'][cur_l+1];// want the next level
	if (WORLD_STATE['gold'] < cost) {
		return;
	}
	WORLD_STATE['attacks'][type]['level']++;
	showTooltip(type, null, "level");	
	
	if (WORLD_STATE['attacks'][type]['cost'].length == cur_l+2) {
		document.getElementById(type+'_level_up').style.display = 'none';
	}
	goldChange(-cost);
}
function showTooltip (type, string, further) {
	var tt = document.getElementById('tooltip');
	tt.innerHTML = '';
	if (type != null) {
		tt.innerHTML += "<b>"+type.toUpperCase()+"</b></br>";
	}
	if (string == null) {
		if (further == null &&  'tooltip' in WORLD_STATE['attacks'][type]) {

			if (WORLD_STATE['attacks'][type]['buy']) {
				var cost = "Cost: " +WORLD_STATE['attacks'][type]['cost'][0]+"</br>";
				tt.innerHTML = cost;
			}
			tt.innerHTML += WORLD_STATE['attacks'][type]['tooltip'];

		} else if (further == 'level') {
			var cur_l = WORLD_STATE['attacks'][type]['level'];
			 if (WORLD_STATE['attacks'][type]['buy'] == false) cur_l++;

			var cost = "Cost: " +WORLD_STATE['attacks'][type]['cost'][cur_l];
			tt.innerHTML += cost;
			if (further+'_tooltip' in WORLD_STATE['attacks'][type] && WORLD_STATE['attacks'][type][further+'_tooltip'].length > cur_l) {
				tt.innerHTML += "</br>" + WORLD_STATE['attacks'][type][further+'_tooltip'][cur_l];
			} else {
				tt.style.display = 'block';
				return;
			}
		} else {
			return;
		}
	} else {
		tt.innerHTML += string;	
	}
	tt.style.display = 'block';
	
}
function hideTooltip () {
	document.getElementById("tooltip").style.display = 'none';
	
}
 	
 	
      	
//--         MESSAGE HANDLING        --//
if (WORLD_STATE['online']) {
	SOCKET.on('server', function (msg) {
	
		CURRENT_ROUND['message_queue'].push(msg);
		// TODO - do not execute here, instead execute in tick world if the messages 'tick' value is the same as CURRENT_ROUND's
		execute_message(msg);
	});
	function execute_message (msg) {

		if (msg['type'] == 'new') {

		  var new_id = newObject(msg['obj']);
		  if  (msg['obj']['type'] == "player") {
			  CURRENT_ROUND['objects'][new_id]['pos'][0] -= msg['offset'][0];
			  CURRENT_ROUND['objects'][new_id]['pos'][1] -= msg['offset'][1];
			  CURRENT_ROUND['objects'][new_id]['dest'][0] -= msg['offset'][0];
			  CURRENT_ROUND['objects'][new_id]['dest'][1] -= msg['offset'][1];
	
		  }      
		} else if (msg['type'] == 'returning_respawn') {		// the response to a message which this client sent to the server

		} else if (msg['type'] == 'respawn') {		// the response to a message which this client sent to the server
			CURRENT_ROUND['objects'][msg['obj']['id']] = msg['obj'];

		} else if (msg['type'] == 'returning') {		// the response to a message which this client sent to the server
		  var new_id = newObject(msg['obj']);
		
		  if  (msg['obj']['type'] == "player") {
			if (WORLD_STATE['mode'] == "player") {
				
				CURRENT_ROUND['camera'].x -= msg['offset'][0];
				CURRENT_ROUND['camera'].y -= msg['offset'][1];

			  CURRENT_ROUND['player']['id'] = new_id;
			  CURRENT_ROUND['objects'][CURRENT_ROUND['player']['id']]['id'] = CURRENT_ROUND['player']['id'];
			  CURRENT_ROUND['objects'][CURRENT_ROUND['player']['id']]['pos'][0] -= msg['offset'][0];
			  CURRENT_ROUND['objects'][CURRENT_ROUND['player']['id']]['pos'][1] -= msg['offset'][1];
			  CURRENT_ROUND['objects'][CURRENT_ROUND['player']['id']]['dest'][0] -= msg['offset'][0];
			  CURRENT_ROUND['objects'][CURRENT_ROUND['player']['id']]['dest'][1] -= msg['offset'][1];
			  ;
			  CURRENT_ROUND['player'] = CURRENT_ROUND['objects'][CURRENT_ROUND['player']['id']];
			  CURRENT_ROUND['player']['alive'] = true;

			  
			      
				var bt_can = document.getElementById("player_icon_canvas");
				var size = 40;
				drawIconCanvas("player", bt_can, null, size);
			}
		  }
		} else if (msg['type'] == 'move' || msg['type'] == 'returning_move') {
		  updateObject(msg);
		} else {
		  console.log(msg);
		}
		
	}
	SOCKET.on('round', function (msg) {
		if (msg == 'start') {
			startRound();
		} else if (msg == 'end') {
			endRound();
			WORLD_STATE['match_in_progress'] = false;
			document.getElementById('background_text').innerHTML = '<div>Round over. Click to begin!</div>';
			
		} else if (msg == 'pause') {
			pause();
		} else if (msg == 'exit') {
			exit();
		}
	});
	SOCKET.on('config', function (new_conf) {
		for (var v in new_conf) {
			ROUND_SETTINGS[v] = new_conf[v];
		}	
	});
	SOCKET.on('register', function (msg) {
		var room = window.location.href;

		var url_end = room.split('?room=');
		if (url_end.length <= 1) {
			return;
		}
		room = url_end[1].split('&')[0];
		console.log(room);
		SOCKET.emit('register', room );
		
	});
	SOCKET.on('dc', function (msg) {
		if (CURRENT_ROUND == null) return;
		
		for (var i = 0; i < CURRENT_ROUND['objects'].length; i++) {
			if (('colour' in CURRENT_ROUND['objects'][i]) && CURRENT_ROUND['objects'][i]['colour'] == msg) {
				if (lifeChange(-CURRENT_ROUND['objects'][i]['lives'], CURRENT_ROUND['objects'][i]['colour']) <= 1) {	// one or less players are alive
					endRound();
				} else {
					CURRENT_ROUND['objects'][i] = null;
				}
			}
		}
	});
	SOCKET.on('world', function (msg) {
		if (msg == 'in_progress') {
			// there is currently a match in progress
			WORLD_STATE['match_in_progress'] = true;
			document.getElementById('background_text').innerHTML = '<div>Currently a round is ongoing, please wait.</div>';
			
		} else if (msg == 'host') {
			WORLD_STATE['host'] = true;
			if (CONFIG_SHOWN) configHostCheck();
			
		} else if (msg == 'open') {
			roundReady();
		}
	});
}
  
//--        CALCULATE           --//
var RAD = 57.296;
function getDir (p, d) {
  var dx = (p[0] - d[0]);
  var dy = (p[1] - d[1]);
	var dir = Math.atan2(dx, dy)*RAD;
	if (dir < 0) dir = (180-Math.abs(dir))+180;
	return Math.floor(dir);
}
function getDirDiff (d, d2) {
	var d = Math.abs(d - d2);
	if (d > 180) d = (360-(d));
	return d;
}
function getDist (x,y,x2,y2) {
	var dx = Math.abs(x2 - x);
	var dy = Math.abs(y2 - y);
	return Math.floor(Math.sqrt(dx*dx + dy*dy));
}
function getDistO (xy,xy2) {
	return getDist(xy[0],xy[1],xy2[0],xy2[1]);
}
function stopMove (object) {
	if ('move_queue' in object && object['move_queue'] != null && object['move_queue'].length > 0) {
		popMoveQueue(object);
		return false;
	}
	
	object['sp'] = 0;
	object['dir'] = null;
	object['action'] = 'still';
	if ('on_destination' in WORLD_STATE['attacks'][object['type']]) {
		WORLD_STATE['attacks'][object['type']]['on_destination'](object);
	}
	return true;
}
function move (object) {

    if (object == null || ('no_movement' in object && object['no_movement'] == true) || object['sp'] == null) {
      return false;// object;
    }
	if (outOfWorld(object['pos'])) {
		killObject(object);
		return false;
	}

	object['sp'] = Math.floor(object['sp']);
    if (object['sp'] < 0) {
		object['sp']++;
		return false;
	} else if (object['sp'] == 0) {
	
		if (stopMove(object)) return false;
	}
    if (object['dest'] != null) {
      if (object['dest'] == object['pos']) {
		
		if (stopMove(object)) return false;// object;
      }

	  if (Math.abs(object['dest'][0] - object['pos'][0]) < (object['sp']/CURRENT_ROUND['settings']['speed_res'])+5 && Math.abs(object['dest'][1] - object['pos'][1]) < (object['sp']/CURRENT_ROUND['settings']['speed_res'])+5) {
		if (object['sp'] < 5) {
		
			object['pos'] = object['dest'];
			if (stopMove(object)) {
				object['dest'] = object['pos'];

				return true;
			}
		}
		object['sp'] /= 4;
 
		  if (Math.abs(object['dest'][0] - object['pos'][0]) < (20) && Math.abs(object['dest'][1] - object['pos'][1]) < (20)+5) { 
			object['pos'] = object['dest'];
			
			if (stopMove(object)) {
				object['dest'] = object['pos'];
			}
		  }
      }
    } else {
		if ('friction' in object && object['sp'] > 0) {
		// TODO - player could be replaced by some attribute
			object['sp'] -= object['friction'];
		}
    }

    if (object['dir'] == null && object['dest'] != null) {
        var dir = getDir(object['pos'], object['dest']);

		object['dir'] = dir;
    }
 	if (object['sp'] <= 1) {
		object['sp'] = 0;
		object['dest'] = object['pos'];
	}   
    
    var np = [];
	var ax = Math.sin(object['dir']/RAD)*(object['sp']/CURRENT_ROUND['settings']['speed_res']);
	var ay = Math.cos(object['dir']/RAD)*(object['sp']/CURRENT_ROUND['settings']['speed_res']);

	if (object['id'] == CURRENT_ROUND['player']['id']) {
		CURRENT_ROUND['camera'].x = object['pos'][0] -= ax;
		CURRENT_ROUND['camera'].y = object['pos'][1] -= ay;
		
	} else {
		np[0] = object['pos'][0] - ax;
		np[1] = object['pos'][1] - ay;
		object['pos'] = np;
	}

	
	if (object['type'] == "player") {
		if (object['move_speed'] < object['default_move_speed']) {
			object['move_speed']++;
		} else if (object['move_speed'] > object['default_move_speed']) {
			object['move_speed']--;
		}
		if (object['move_speed'] == object['default_move_speed']) {
			object['sprinting'] = false;
			object['frozen'] = false;
		}
    }

	return true;


}

function collide_check (object) {

	var lava_lvl = CURRENT_ROUND['settings']['lava_level'];
	var lava_w = CURRENT_ROUND['settings']['lava_width'];
	var exy = map_to_screen([lava_lvl * lava_w, lava_lvl * lava_w]);
	var exy2 = map_to_screen([WORLD_STATE['map'].right - lava_lvl * lava_w, WORLD_STATE['map'].bottom - lava_lvl * lava_w]);
	
	var pos_screen = map_to_screen(object['pos']);
	if (pos_screen[0] < exy[0] || 
		pos_screen[0] > exy2[0] || 
		pos_screen[1] < exy[1] || 
		pos_screen[1] > exy2[1]) {
			
		object['health']--;
		if (object['health'] <= 0) {
			killObject(object);
			return;
		}
	}
  if (object['invincible'] > 0) {
  	return;// object;
  }
  for (var i = 0; i < CURRENT_ROUND['objects'].length; i++) {
  	if (CURRENT_ROUND['objects'][i] == null || CURRENT_ROUND['objects'][i]['type'] == 'player' ||  
  	/*CURRENT_ROUND['objects'][i]['owner'] == object['id'] ||*/ 
  	('tangible' in CURRENT_ROUND['objects'][i] && CURRENT_ROUND['objects'][i]['tangible'] == false) ||
  	CURRENT_ROUND['objects'][i]['id'] == object['id'] ||
	CURRENT_ROUND['objects'][i]['action'] == 'opening' || 
	(CURRENT_ROUND['objects'][i]['casting'] !== false && CURRENT_ROUND['objects'][i]['casting'] >= 0)
	) {
  		
  	} else {

		if ('invincible' in CURRENT_ROUND['objects'][i] && CURRENT_ROUND['objects'][i]['invincible'] > 0) {
			continue;
		}
	
		if (WORLD_STATE['attacks'][CURRENT_ROUND['objects'][i]['type']]['hitbox'](CURRENT_ROUND['objects'][i],object, DRAWING_SIZE)) {

			var ret = collision(object, CURRENT_ROUND['objects'][i]);

			if (ret) continue;
			
			if ('hit' in WORLD_STATE['attacks'][CURRENT_ROUND['objects'][i]['type']]['animation']) {
				CURRENT_ROUND['objects'][i]['action'] = 'hit';
			}
			var inv = 50;
			if ('inv_frames' in CURRENT_ROUND['objects'][i] && CURRENT_ROUND['objects'][i]['inv_frames'] != null) inv = CURRENT_ROUND['objects'][i]['inv_frames'];
			object['invincible'] = inv;
	
			if (!('remains' in CURRENT_ROUND['objects'][i]) || !CURRENT_ROUND['objects'][i]['remains']) {
				killObject(CURRENT_ROUND['objects'][i]);
			}
			object['action'] = 'hit';
			break;
		}
	}
  } 
}


function findForce (object_one, object_two) {

	if ('find_force' in object_two && object_two['find_force'] != null) {
		//object_two['force'](object_one, object_two);
		
	} else {
		var owner = getOwner(object_two);
		var mana_power = 1;
		if (owner != null) mana_power = owner['mana'] / (WORLD_STATE['attacks'][owner['type']]['mana'] / 4)+1;
		// mana power ratio
		// between 1 and 4

		var dist = getDist(object_one['pos'][0], object_one['pos'][1], object_two['pos'][0], object_two['pos'][1]);
		
		var range = CURRENT_ROUND['settings']['range'];
		if ('range' in object_two) {
			range = object_two['range'];
		}
		var speed = range / dist;
		var MAX_SPEED = 10;
		var MIN_SPEED = 1;
		
		if (speed > MAX_SPEED) speed = MAX_SPEED;
		if (speed < MIN_SPEED) speed = MIN_SPEED;
		if ('force' in WORLD_STATE['attacks'][object_two['type']]) {
			speed = WORLD_STATE['attacks'][object_two['type']]['force'];
		}		

		var new_dir = 0;
		if ('force_direction' in WORLD_STATE['attacks'][object_two['type']] && WORLD_STATE['attacks'][object_two['type']]['force_direction'] != null) {
			new_dir = WORLD_STATE['attacks'][object_two['type']]['force_direction'](object_one, object_two);
		} else {
			new_dir = object_two['dir'];
		}
		
		var force = {'sp':speed*CURRENT_ROUND['settings']['force']*mana_power,'dir':new_dir};
		return force;
	}
	return null;
	

}

function actingForce (object, acting, debug) {
// acting needs a sp (speed) and dir (direction)
console.log(acting);
	var diminish = {'start':100,'degree':10};
	var nf = calc_actingForce(object, acting, diminish);
	object['dir'] = nf['dir'];
	object['sp'] = nf['sp'];
	
	while (object['dir'] < 0) object['dir']+=360;
	object['dir'] = object['dir']%360;
	object['dest'] = null;

}

// physics engine, I guess
function calc_actingForce (object, force, diminish) {
	// direction and magnitude

	if (force == null || object == null || object['sp'] == null) return;
	
	var orig_force = {'dir':object['dir'],'sp':object['sp']};
	if (orig_force['dir'] == null) {
		orig_force['dir'] = force['dir'];
	}

	if (orig_force['sp'] == null) {
		orig_force['sp'] = 0;
	}
	
	var d_diff = getDirDiff(orig_force['dir'], force['dir']);
	
	var m_diff = force['sp']/(orig_force['sp']+force['sp']);

	var new_force = {'dir':orig_force['dir'],'sp':orig_force['sp']};
	
	new_force['dir'] = orig_force['dir']+d_diff*m_diff;
	
	// map 		0 => 1, 90 => 0, 180 => -1
		//			y = -(x/90 - 1)
	var m_change = (force['sp'] * -(d_diff / 90 - 1));
	
	// diminishing returns
	var m_avg = m_change/2 + orig_force['sp'];
	if (diminish['start'] < m_avg) {
		m_change -= diminish['start'];

		m_change = m_change*Math.pow(2, -(m_avg-diminish['start'])/diminish['degree']);
		m_change += diminish['start'];
	}

	new_force['sp'] =  orig_force['sp'] + m_change;
	
	
	return new_force;
}
	

function calc_vector (current_speed, current_pos, acting_speed, acting_pos) {
    
}

function calc_damage (total_damage, damage_formula, damager_pos, damagee_pos) {
    
}



//--		UI				--//
var CONFIG_SHOWN = false;
document.getElementById("config_wrapper_button").onclick = toggleConfig;

function toggleConfig () {
	configHostCheck();
	if (ROUND_STARTED) {
		document.getElementById("round_config").style.display = 'none';
		return;
	}
	if (CONFIG_SHOWN) {
		document.getElementById("round_config").style.display = 'none';
	} else { 
		document.getElementById("round_config").style.display = 'block';
	}
	CONFIG_SHOWN = !CONFIG_SHOWN;
}
function configHostCheck() {
		// submit / reset
	if (WORLD_STATE['host']) {
		document.getElementById("meta_config").innerHTML ="<button class='attack_button config_button' onclick='resetConfig()'>Reset</button>"+
		"<button class='attack_button config_button' onclick='submitConfigWrapper()'>Submit</button>";
	} else {
		document.getElementById("meta_config").innerHTML ="You are not the host, so you any adjustments will not take effect."+
		"<button class='attack_button config_button' onclick='toggleConfig()'>Close</button>";
	}
}
var MENU_SHOWN = false;
document.getElementById("menu_wrapper_button").onclick = function(event) {
	if (MENU_SHOWN) {
		document.getElementById("menu").style.display = 'none';
	} else { 
		document.getElementById("menu").style.display = 'block';
	}
	MENU_SHOWN = !MENU_SHOWN;
};

function setupButtons () {
	var attack_div = document.getElementById("attack_div");
	attack_div.innerHTML = "";
	for (a in WORLD_STATE['attacks']) {
		if (WORLD_STATE['attacks'][a] == null || WORLD_STATE['attacks'][a]['hotkey'] == '') {
			continue;
		}
		var c = '';
		var o = '';
		var h = WORLD_STATE['attacks'][a]['hotkey'];
		if (WORLD_STATE['attacks'][a]['buy'] == true) {
			c = 'shop_items attack_button';
		} else {
			c = 'attack attack_button';
		}
		if (a == 'player') {
			c = 'selected_button attack attack_button';
		}
		o = '';//'changeMode(\"'+a+'\")';
		var lvlup = '';
		if ('cost' in WORLD_STATE['attacks'][a]) {
			lvlup = "<button id='"+a+"_level_up' class='level_up attack_button shop_items' style='float:right;' onclick='levelUp(\""+a+"\")' onmouseover='showTooltip(\""+a+"\", null, \"level\")' onmouseout='hideTooltip()'>"+a+"</button>";
		}
		var init_w = '';
		if (window.innerWidth < 840 || window.innerHeight < 840) init_w = "style='width:36px'";
		attack_div.innerHTML += "<div><button id='"+a+"' class='"+c+"' "+init_w+" onclick='"+o+"' onmouseover='showTooltip(\""+a+"\", null, null)' onmouseout='hideTooltip()'>"+a+"("+h+") </button>"+
		lvlup+"</div>";
	}
	
	var level_ups = document.getElementsByClassName("level_up");
	for (var i = 0; i < level_ups.length; i++) {
		if (BUTTON_LEFT) level_ups[i].style.float = 'left';
		
		var id = level_ups[i].innerHTML;
		var size = 40;
		drawIconCanvas(id+"_level_up", level_ups[i], level_up_animation, size);
	}
	resizeButtons(window.innerWidth, window.innerHeight);

	var level_ups = document.getElementsByClassName("attack");
	for (var i = 0; i < level_ups.length; i++) {
		if (BUTTON_LEFT) level_ups[i].style.float = 'right';
		level_ups[i].onclick = function () {
			changeMode(this.id);
		};
	}
	
	var atbuttons = document.getElementsByClassName('attack_button');
	for (var i = 0;i < atbuttons.length; i++) {
		atbuttons[i].onmousedown = function () {
			this.style.borderColor = '#DDD';
		};
		atbuttons[i].onmouseup = function () {
			this.style.borderColor = '#4D0B0B';
		};

		
	}

}
function resizeButtons (width, height) {

	var buttons = document.getElementsByClassName('attack_button');
	var row = -1;
	var size = 40;
	if (WORLD_STATE['touch']) size = 80;
	
	height -= (size+size/2-1);
	var max_rows = Math.round(height/size);
		
	// how many buttons exist
	var r = 0;
	for (var i = 0; i < buttons.length; i++) {
		var id = buttons[i].id;
		if (id in WORLD_STATE['attacks']) {
			r++;
		}
	}

	for (var i = 0; i < buttons.length; i++) {
		var id = buttons[i].id;
		if (!(id in WORLD_STATE['attacks'])) continue;
		row++;
		buttons[i].removeAttribute("style");

		var icon_string = "<span id='"+id+"_icon_canvas' class='icon_canvas'></span>";
		buttons[i].innerHTML = icon_string;
		
		if (width >= 840 &&  height >= (r)*size-size/2 && !WORLD_STATE['touch']) {
			WORLD_STATE['button_icon'] = false;
			var h = WORLD_STATE['attacks'][id]['hotkey'];
			buttons[i].innerHTML = icon_string+"<span style='position:relative;top:4px;'>"+id.toUpperCase()+"("+h+")</span>";		
			buttons[i].style.width = '240px';
			
			drawAttackButton(id, buttons[i], h);


			if (!ROUND_STARTED) {
				var bt_l = document.getElementById(id+"_level_up");				
				if (bt_l == null) continue;
				bt_l.style.top = '';
				bt_l.style.left = '';
				bt_l.style.right = '';
				bt_l.style.position = 'relative';				
			}
		} else {
			WORLD_STATE['button_icon'] = true;
			var bt_can = document.getElementById(id+"_icon_canvas");
			buttons[i].style.width = size+'px';
			buttons[i].style.height = size+'px';
			drawIconCanvas(id, bt_can, null, size);
			
			var lvl_up = 1;
			if (!ROUND_STARTED) lvl_up = 2;
			var slide = Math.floor(row/(max_rows) )*(size*lvl_up);
			var drop = Math.floor(row%(max_rows) )*size;
			buttons[i].style.top = drop+'px';
			if (BUTTON_LEFT) {
				buttons[i].style.left = slide+'px';
				buttons[i].style.right = '';
			} else {
				buttons[i].style.right = slide+'px';
				buttons[i].style.left = '';
			}
			buttons[i].style.position = 'absolute';
			
			if (!ROUND_STARTED) {
				var bt_l = document.getElementById(id+"_level_up");
				if (bt_l == null) continue;
				slide += size;
				bt_l.style.top = drop+'px';
				if (BUTTON_LEFT) {
					bt_l.style.left = slide+'px';
					bt_l.style.right = '';
				} else {
					bt_l.style.right = slide+'px';
					bt_l.style.left = '';
				}			
				bt_l.style.position = 'absolute';				
			}

		}
	}

	var buttons = document.getElementsByClassName('slider_wrapper');
	var row = -1;
	height -= 10;
	var max_rows = Math.round(height/70)-1;

	var col_width = 100/Math.ceil(buttons.length / max_rows);

	// TODO - if too many buttons, allow for scrolling
	if (col_width * window.innerWidth / 100 < 100) {
		// less than 100px
		col_width = 100/window.innerWidth * 100;
		max_rows = buttons.length / (100/col_width);
		// allow the buttons to drop further down
	}
	
	for (var i = 0; i < buttons.length; i++) {
		var id = buttons[i].id;
		row++;
		buttons[i].removeAttribute("style");


		var slide = Math.floor(row/(max_rows) )* col_width;
		var drop = Math.floor(row%(max_rows) )*70+80;
		buttons[i].style.top = drop+'px';
		buttons[i].style.left = slide+'%';
		buttons[i].style.position = 'absolute';
		buttons[i].style.width = col_width+'%';

	}
	cooldown_cooldowns(0);
	var small = false;
	if (width <= 640 ||  height <= 640 || WORLD_STATE['touch']) {
		small = true;
	} else {
		small = false;		
	}
	if (small) {
		document.getElementsByTagName('body')[0].style.fontSize = '14px';
	} else {
		document.getElementsByTagName('body')[0].style.fontSize = '20px';
	}
	var sz = '5';
	if (WORLD_STATE['button_icon']) {
		sz = '5';
	} else {
		sz = '15';
	}
	var buts = document.getElementsByClassName("attack");
	for (var i = 0; i < buts.length; i++) {
		buts[i].style.borderRadius = '0px';
		if (BUTTON_LEFT) {
			buts[i].style.borderBottomRightRadius = sz+'px';
			buts[i].style.borderTopRightRadius = sz+'px';
			buts[i].style.float = 'left';
			
		} else {
			buts[i].style.borderBottomLeftRadius = sz+'px';
			buts[i].style.borderTopLeftRadius = sz+'px';
			buts[i].style.float = 'right';
		}
	}
	changeMode(null);

}

function drawIconCanvas(id, el, type, size) {
	if (WORLD_STATE['touch']) size = 80;
	
	var canvas_size = size-6;

	el.style.width = canvas_size+'px';
	el.style.height = canvas_size+'px';
	
	var type_func = false;
	if (type == null) type = id;
	if (type in WORLD_STATE['attacks']) {
		if (!('animation' in WORLD_STATE['attacks'][type])) {
			el.innerHTML = type;
			return;
		}
	} else {
		// type is a function
		type_func = true;
	}
	var canvas = "<canvas class='button_canvas' id='"+id+"_canvas'> </canvas>";
	el.innerHTML = canvas;
	var but_can=document.getElementById(id+"_canvas");
	but_can.height = canvas_size;//buttons[i].height;
	but_can.width = canvas_size;//buttons[i].width;
	var but_ctx=but_can.getContext("2d");
	
	if (type_func) {
		type(canvas_size/2, canvas_size/2, but_ctx);
		return;
	}
///	but_ctx.fillColor = '#f5f5f2';
		
	var o = constructObject(type, [0,0], {pos:null, id:-1});
	var x_o = 1;
	if (WORLD_STATE['button_icon']) x_o = 3;

	o['casting'] = false;	
	o['pos'] = screen_to_map([canvas_size/2-x_o,canvas_size/2]);
	if (type == 'beam') {
		o['pos'] = screen_to_map([5, canvas_size/2]);
		o['dest'] = screen_to_map([canvas_size-10, canvas_size/2]);
		
	} else if (type == 'fire') {
		o['pos'] = screen_to_map([canvas_size/2, canvas_size/2+size/10]);
		
	}  else if (type == 'player') {
		if (CURRENT_ROUND != null && ('player' in CURRENT_ROUND) && CURRENT_ROUND['player'] != null
				&& ('colour' in CURRENT_ROUND['player']) && CURRENT_ROUND['player']['colour'] != null) {
			o['colour'] = CURRENT_ROUND['player']['colour'];
		} else {
			o['colour'] = '#72B';
		}
	}

	if ('icon' in WORLD_STATE['attacks'][type]['animation']) {
		o['action'] = 'icon';
		o['pos'] = [canvas_size/2,canvas_size/2];
	}
	if (type == 'grab') {
		o['dest'] = [canvas_size-10, canvas_size-10];
		o['pos'] = [10, 10];
		
	}
//	but_ctx.fillRect(0,0,canvas_size,canvas_size);
	animateFrame(o, but_ctx, size/40);
			
	
		
}
var BUTTON_LEFT = false;
function swapSide() {
	document.getElementById("attack_div").removeAttribute("style");
	document.getElementById("menu_wrapper").removeAttribute("style");
	if (!BUTTON_LEFT) {
		document.getElementById("attack_div").style.left = '0px';
		document.getElementById("menu_wrapper").style.right = '0px';

		var buts = document.getElementsByClassName("attack");
		for (var i = 0; i < buts.length; i++) {
			buts[i].style.borderRadius = '0px';
		//	buts[i].style.borderBottomRightRadius = '15px';
		//	buts[i].style.borderTopRightRadius = '15px';
			buts[i].style.float = 'left';
		}
		var buts = document.getElementsByClassName("level_up");
		for (var i = 0; i < buts.length; i++) {
			buts[i].style.float = 'right';
		}
		var buts = document.getElementsByClassName("icon_canvas");
		for (var i = 0; i < buts.length; i++) {
			buts[i].style.float = 'left';
		}		
		
	} else { 
	
		document.getElementById("attack_div").style.right = '0px';
		document.getElementById("menu_wrapper").style.left = '0px';

		var buts = document.getElementsByClassName("attack");
		for (var i = 0; i < buts.length; i++) {
			buts[i].style.borderRadius = '0px';
		//	buts[i].style.borderBottomLeftRadius = '15px';
		//	buts[i].style.borderTopLeftRadius = '15px';
			buts[i].style.float = 'right';
			
		}
		var buts = document.getElementsByClassName("level_up");
		for (var i = 0; i < buts.length; i++) {
			buts[i].style.float = 'left';
		}
		var buts = document.getElementsByClassName("icon_canvas");
		for (var i = 0; i < buts.length; i++) {
			buts[i].style.float = 'right';
		}		
	}
	BUTTON_LEFT = !BUTTON_LEFT;
	resizeButtons(window.innerWidth, window.innerHeight);
}





function drawConfigItem(config, i) {
	var min = config['min'];
	var max = config['max'];
	var id = "config_"+config['id'];
	var name = config['id'].replace('_', ' ');
	name = name.toUpperCase();
	var def = config['value'];
	var tooltip = config['tooltip'];

	if ('label' in config) {
		var label = config['label'];
		var str = "<div id='"+id+"_wrapper' class='slider_wrapper'> <span class='slider_title'>"+label+"</span>"+"<input type='checkbox' id='"+id+"_checkbox' class='config_data checkbox_config' "+
		"onmouseover='showTooltip(null,\""+config['tooltip']+"\", null)'>";
		return str;
	}

	var string = "<div id='"+id+"_wrapper' class='slider_wrapper'> <span class='slider_title'>"+name+"</span>"+
		"<input type='text' id='"+id+"_text' class='config_data slider_text' value='"+def+"' /></br>"+
		"<input id='"+id+"_slider' class='config_data slider_slider' type='range' min='"+min+"' max='"+max+"' defaultValue='"+def+"' "+
		"onmouseover='showTooltip(null,\""+config['tooltip']+"\", null)'"+
		"/>"+
		"</div>";

	return string;

}

function valueDown(id) {
	var el = id+'_slider';
	document.getElementById(el).stepDown();
	valueUpdate(el);
}
function valueUp(id) {
	var el = id+'_slider';
	document.getElementById(el).stepUp();
	valueUpdate(el);
}

function grabId (e) {
	var found_id = '';
	if (typeof(e) == 'string') {
		found_id = e;
	} else {
		found_id = e['target']['id'];
	}
	if (found_id == '' || found_id == null) return null;
	return found_id;
	
}
function valueUpdate(e) {

	var el_id = grabId(e);
	if (el_id == null) return;

	var ids = el_id.split('_');
	ids[ids.length-1] = '';
	var id = ids.join('_');

	var slider = document.getElementById(id+'slider');
	var text_one = document.getElementById(id+'text');
	if (text_one.value != slider.value) {
		var types = el_id.split('_');
		var type = types[types.length-1];
		if (type == 'slider') {
			text_one.value = slider.value;
		} else if (type == 'text') {
			slider.value = text_one.value;	
		} 	
	}
	var global_var = slider.value;
};
function submitConfigWrapper () {
	if (WORLD_STATE['online']) {
		var new_conf = updateConfig(null);
	    SOCKET.emit('config', new_conf);
		document.getElementById("round_config").style.display = 'none';
	} else {
		submitConfig();
	}
}
function submitConfig() {
	var new_conf = updateConfig(null);
	for (var v in new_conf) {
		ROUND_SETTINGS[v] = new_conf[v];
	}
	document.getElementById("round_config").style.display = 'none';
}
function resetConfig() {
	updateConfig(OG_ROUND_SETTINGS);
	
}
function updateConfig(cnf) {
	var new_cnf = {};

	var configs = document.getElementsByClassName('config_data');
	
	if (cnf != null) {
		for (var sl in configs) {
			var v = configs[sl].id
			if (v == null || v == '') continue;
			v = v.replace('config_', '');
			v = v.replace('_slider', '');
			v = v.replace('_text', '');
			v = v.replace('_checkbox', '');
			if (!(v in cnf)) continue;
			
			if (configs[sl].type == 'range' || configs[sl].type == 'text') {
				configs[sl].value = cnf[v];
			} else {
				configs[sl].checked = cnf[v];
			}
		}
		
	} else {
		for (var sl in configs) {
			var v = configs[sl].id
			if (v == null || v == '') continue;
			v = v.replace('config_', '');
			v = v.replace('_slider', '');
			v = v.replace('_checkbox', '');
			if (configs[sl].type == 'range') {
				new_cnf[v] = parseInt(configs[sl].value);
			} else {
				new_cnf[v] = configs[sl].checked;
			}
		}
	}
	return new_cnf;
}

function configSetup () {
	document.getElementById("round_config").innerHTML = "<div id='config_title'>CONFIG:</div>";
	
	for (var i = 0; i < CONFIGS.length; i++) {
		var str = drawConfigItem(CONFIGS[i], i);
		document.getElementById('round_config').innerHTML += str;
	}

	// tabs
	document.getElementById("round_config").innerHTML += "<div id='config_buttons'><button class='attack_button config_button' onclick='swapSide()'>Swap Button Side</button>"+
	"<div id='meta_config' class='meta_config_buttons'></div></div>";


	var sls = document.getElementsByClassName('slider_slider');
	var slt = document.getElementsByClassName('slider_text');
	var cbc = document.getElementsByClassName('checkbox_config');
	
	for (var i = 0; i < sls.length; i++) {
		sls[i].onmouseout = hideTooltip;
		sls[i].oninput = valueUpdate;

		slt[i].onmouseout = hideTooltip;
		slt[i].oninput = valueUpdate;
	}
	for (var i = 0; i < cbc.length; i++) {
		cbc[i].onmouseout = hideTooltip;
	}
	resetConfig();

}






//-- 		CONFIG				--//
var CONFIGS = [
	{'id':'gold',
	 'min':-100,
	 'max':1000,
	 'steps':['none', 'unlimited'],
	 'value':0,
	 'tooltip':'How much gold each player starts with.',
	},
	{'id':'lava_level',
	 'min':0,
	 'max':5,
	 'steps':['full'],
	 'value':1,
	 'tooltip':'What level of growth the lava is on.',
	},
	{'id':'lava_increment',
	 'min':-1,
	 'max':100,
	 'steps':['never'],
	 'value':10,
	 'tooltip':'How long it takes for the lava to grow.',
	},
	{'id':'lava_tick',
	 'min':-100,
	 'max':0,
	 'steps':['never'],
	 'value':30,
	 'tooltip':'How long to delay the first lava growth.',
	},
	{'id':'timer',
	 'min':-1,
	 'max':1000,
	 'steps':['no limit'],
	 'value':180,
	 'tooltip':'How long the round goes for. This currently doesnt do anything',
	},
	{'id':'force',
	 'min':-100,
	 'max':200,
	 'steps':['none'],
	 'value':100,
	 'tooltip':'Strength/Knockback of attacks.',
	},
	{'id':'damage',
	 'min':-100,
	 'max':200,
	 'steps':['none', 'one shot'],
	 'value':100,
	 'tooltip':'Damage of attacks.',
	},
	{'id':'health',
	 'min':1,
	 'max':1000,
	 'steps':['infinite'],
	 'value':100,
	 'tooltip':'Starting health of players.',
	},
	{'id':'lives',
	 'min':1,
	 'max':100,
	 'steps':['infinite', 'stealing'],
	 'value':1,
	 'tooltip':'Number of lives each player has.',
	},
	{'id':'speed',
	 'min':0,
	 'max':200,	// TODO - be careful about this, high speed causes problems			-- at 200 'shot' attacks start missing
	 'steps':['none'],
	 'value':40,
	 'tooltip':'How fast the players and the abilities are.',
	},
	{'id':'invisible',
	 'label':'Everyone is invisible',
	 'value':false,
	 'tooltip':'Make every player invisible.',
	},
	{'id':'obstacles',
	 'min':0,
	 'max':20,
	 'value':0,
	 'tooltip':'How many columns randomly appear on the map. Currently doesnt do anything',
	},
];

//----				WORLD_STATE['screen'] SIZING/ZOOMING	---//
//----				NOT NICE				---//
function setSizes() {
	// set the size of the screen and all the buttons and set up the scrolling/zoomingvar 
	var width = window.innerWidth;
	var height = window.innerHeight;
	
	DRAWING_SIZE = height/720 * (WORLD_STATE['zoom'])/10;
	resizeButtons(width, height);
	return {'width':width, 'height':height};
}
function updateSizes(w, h) {
	var vp = {top:0,bottom:Math.floor(h/(WORLD_STATE['zoom']/10)),left:0,right:Math.floor(w/(WORLD_STATE['zoom']/10))};
	vp['width'] = vp.right - vp.left;
	vp['height'] = vp.bottom - vp.top;

	updateViewGlobals(vp);
	return vp;
}
function updateViewGlobals (vp) {

	if (WORLD_STATE['viewport'] == null) return;
	var ch = WORLD_STATE['viewport'];
	ch.right -= vp.right;
	ch.bottom -= vp.bottom;
	ch.width -= vp.width;
	ch.height -= vp.height;
	
	WORLD_STATE['viewport'] = vp;

	can.height = WORLD_STATE['screen'].height;
	can.width = WORLD_STATE['screen'].width;
	
}
function updateZoom (height, z) {
	var ds = height/720 * (z)/10;
	if (WORLD_STATE['viewport'] != null) {
		var s = setSizes();
		WORLD_STATE['viewport'] = updateSizes(s.width, s.height);
	}
	return ds;
}

window.onresize = function(event) {
    WORLD_STATE['screen'] = setSizes();
	WORLD_STATE['viewport'] = updateSizes(WORLD_STATE['screen'].width, WORLD_STATE['screen'].height);
	lifeChange(0,null);
	drawWorld();
};
window.onwheel=function(e){
	if (e.deltaY > 0) WORLD_STATE['zoom']--;
	if (e.deltaY < 0) WORLD_STATE['zoom']++;
	
	if (WORLD_STATE['zoom'] > 20) WORLD_STATE['zoom'] = 20;
	if (WORLD_STATE['zoom'] < 1) WORLD_STATE['zoom'] = 1;
	
	var ds = updateZoom(WORLD_STATE['screen'].height , WORLD_STATE['zoom']);
	DRAWING_SIZE = ds;
	drawWorld();	
}; 

function beginTouch () {
	WORLD_STATE['touch'] = true;
    window.removeEventListener('touchstart', beginTouch);  
}
window.addEventListener('touchstart', beginTouch, false);
    
//--         UTILITY  / USER      --//
function getCursorPosition(e) {		// Finds what pixel was clicked on	-	not made by me
 //
	var x;
    var y;
    if (e.pageX != undefined && e.pageY != undefined) {
	x = e.pageX;
	y = e.pageY;
    }
    else {
	x = e.clientX + document.body.scrollLeft +
            document.documentElement.scrollLeft;
	y = e.clientY + document.body.scrollTop +
            document.documentElement.scrollTop;
    }
    x -= canvas.offsetLeft;
    y -= canvas.offsetTop;
    
    return [x,y];	
}
function map_to_screen (xy) {
	if (CURRENT_ROUND == null) return xy;

	var x = WORLD_STATE['screen'].width/2 + (xy[0] - CURRENT_ROUND['camera'].x) * (DRAWING_SIZE);
	var y = WORLD_STATE['screen'].height/2 + (xy[1] - CURRENT_ROUND['camera'].y) * (DRAWING_SIZE);
	x = Math.floor(x);
	y = Math.floor(y);
	return [x,y];
	
	//(X - CAM) * CONV + screen/2
}    

function screen_to_map (xy) {
	if (CURRENT_ROUND == null) return xy;
	
	var x = (xy[0] - WORLD_STATE['screen'].width/2) / (DRAWING_SIZE) + CURRENT_ROUND['camera'].x;
	var y = (xy[1] - WORLD_STATE['screen'].height/2) / (DRAWING_SIZE) + CURRENT_ROUND['camera'].y;
	return [x,y];
}    	
      	
      	
//--         UTILITY / DEBUG        --//    
function ts() {     // timer start
    return new Date().getTime();
}
function te (t) {   // timer end
    return new Date().getTime() - t;
}


function goldup() {
  goldChange(1);
  CURRENT_ROUND['timer']++;
}
function golddown() {
  goldChange(-1);
  CURRENT_ROUND['timer']--;
}

function showDebugInfo () {
	
	var sec = false;
	var nn = new Date().getTime();
	var fr = (nn - START_TIMER);
	if (fr < 1000) {return;};
	fr = 1000 / (fr / DEBUG_TICKS);

		document.getElementById('framerate').innerHTML = "Total Framerate:"+ Math.floor(fr) + " , </br> Current: "+nn+"</br>";
		
		START_TIMER = new Date().getTime();
		DEBUG_TICKS = 1;
		
		for (dt in debugTimer) {
			document.getElementById('framerate').innerHTML += dt + ": "+debugTimer[dt]['total']+", "+debugTimer[dt]['times']+" times </br>";
			
			debugTimer[dt]['total'] = 0;
			debugTimer[dt]['times'] = 0;
			
	}

	
}

function debugWrapper(func, param, name) {
	//if (!DEBUG) func(param);
	var dt = new Date();
	var fr = dt.getTime();
	func(param);
	dt = new Date();
	var t = (dt.getTime() - fr);
	if (name in debugTimer) {
		debugTimer[name]['times'] ++;
		debugTimer[name]['total'] += t;
	} else {
		debugTimer[name] = {'total':t,'times':1};
	}

}

var TO_CONSOLE = true;
function cl (con) {
	if (TO_CONSOLE) console.log(con);
}






//--- 		INIT RUNNING		---//
console.log('start');
swapSide();
configSetup();
setSizes();
canvasOpening();
drawScenery();
if (!WORLD_STATE['online']) {
	roundReady();
	WORLD_STATE['host'] = true;
}

function roundReady () {
 	WORLD_STATE['match_in_progress'] = false;
	document.getElementById('background_text').innerHTML = '<div>Click to Begin!</div>';
	/*document.getElementById('gui').style.height = '100%';
	document.getElementById('gui').style.width = '100%';*/
	document.getElementById('gui').style.display = 'block';
	
}

