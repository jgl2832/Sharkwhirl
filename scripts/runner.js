function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)", "i"),
  results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

window.addEventListener("load",function() {

// TODO
// better collision detection with the sharks
// training walls

var Q = window.Q = Quintus({ audioSupported: ['mp3','ogg']})
        .include("Audio, Sprites, Scenes, Input, 2D, Anim, Touch, UI")
        .setup({ width: 800, height: 600, scaleToFit: true })
        .controls().touch()
        .enableSound();

if ( getParameterByName("debug") === "true" ) {
  Q.debug = true;
  Q.debugFill = true;
}

var SPRITE_BOX = 1;

Q.gravityY = 1750;


var isEnemy = function(ob) {
  return ob.isA("Scribblemn") || ob.isA("Susman") || ob.isA("Shark") || ob.isA("Pig") || ob.isA("ConeBomb")
    || ob.isA("Shuriken") || ob.isA("MurderSg") || ob.isA("BassDude") || ob.isA("Apple") || ob.isA("Bubbles")
    || ob.isA("Morbel") || ob.isA("JumpingMan") || ob.isA("Smack") || ob.isA("TorbJr") || ob.isA("Noze");
};
var isStompable = function(ob) {
  return ob.isA("Shark") || ob.isA("Pig") || ob.isA("Scribblemn") || ob.isA("Susman") || ob.isA("MurderSg")
    || ob.isA("BassDude") || ob.isA("Bubbles") || ob.isA("Morbel") || ob.isA("JumpingMan") || ob.isA("Smack")
    || ob.isA("TorbJr") || ob.isA("Noze");
};

var isPlatform = function(ob) {
  return ob.isA("Platform");
}

Q.Sprite.extend("Player",{

  init: function(p) {

    this._super(p,{
      sheet: "dude",
      sprite: "dude",
      scale: 3,
      collisionMask: SPRITE_BOX, 
      x: -700,
      y: 400,
      gravity: 2,
      standingPoints: [ [-10,-16], [-10, 16], [4, 16], [4, -16] ],
      duckingPoints: [ [-10, -6], [-10, 16], [4, 16], [4, -6] ],
      speed: 300,
      jump: -1200
    });

    this.p.points = this.p.standingPoints;
    this.on("bump.left", this, "bumpAction");
    this.on("bump.right", this, "bumpAction");
    this.on("bump.top", this, "bumpAction");
    this.on("bump.bottom", this, "stomp");

    this.add("2d, animation");
    this.play("stand_right");
  },

  bumpAction: function(coll) {
    if(isEnemy(coll.obj)) {
      this.die(coll);
    }
  },

  die: function(coll) {
    this.play("explode");
    Q.stage().pause();
    Q.audio.stop();
    setTimeout(stageGame, 1000);
  },

  stomp: function(coll) {
    if(isStompable(coll.obj)) {
      coll.obj.destroy();
      this.p.vy = -700; // make the player jump
    } else if (isPlatform(coll.obj)) {
      this.p.landed = 1;
    } else {
      this.die(coll);
    }
  },

  step: function(dt) {
    this.p.vx += (this.p.speed - this.p.vx)/4;


    if(this.p.y > 555) {
      this.p.y = 555;
      this.p.landed = 1;
      this.p.vy = 0;
    } else if (this.p.landed == 0) {
      this.p.landed = 0;
    }

    if(Q.state.get("moving") && Q.inputs['up'] && this.p.landed > 0) {
      this.p.vy = this.p.jump;
      this.p.landed = 0;
    } 

    this.p.points = this.p.standingPoints;
    if (Q.state.get("moving")) {
      if(this.p.landed) {
        if(Q.inputs['down']) { 
          this.play("duck_right");
          this.p.points = this.p.duckingPoints;
        } else {
          this.play("walk_right");
        }
      } else {
        this.play("jump_right");
      }
    } else {
      this.play("stand_right");
    }

    //this.stage.viewport.centerOn(this.p.x + 300, 400 );
  }
});

Q.Sprite.extend("Pig",{
  init: function(player) {

    this._super({
      x: player.p.x + Q.width + 50,
      y: 565,
      frame: Math.random() < 0.5 ? 1 : 0,
      scale: .75,
      type: SPRITE_BOX,
      sheet: "pig",
      sprite: "pig",
      points: [ [-30,-40], [-50, 40], [50, 40], [30, -40] ],
      vx: -400 + 200 * Math.random(),
      vy: 0,
      ay: 0
    });


    this.add("animation");
  },

  step: function(dt) {
    this.play("walk_left");
    this.p.x += this.p.vx * dt;


    this.p.vy += this.p.ay * dt;
    this.p.y += this.p.vy * dt;

    if(this.p.y > 800) { this.destroy(); }

  },
  

});

Q.Sprite.extend("ConeBomb", {
  init: function(xStart, yStart) {
    this._super({
      x: xStart,
      y: yStart,
      scale: 1.0,
      type: SPRITE_BOX,
      points: [ [-7,-26], [-36, /**/36], [28, /**/36], [3, -26] ],
      sheet: "conebomb",
      sprite: "conebomb",
      exploded: 0,
    });
    this.add("animation");
  },

  step: function(dt) {
    // explode when near/under the player
    var player = Q("Player").first();

    if (player.p.x > (this.p.x - 50) && this.p.exploded == 0) {
      this.play("explode");
      this.p.exploded = 1;
    }
  }
});
Q.Sprite.extend("Scribblemn", {
  init: function(player) {

    this._super({
      x: player.p.x + Q.width + 50,
      y: 565,
      scale: 1,
      type: SPRITE_BOX,
      points: [ [-33.5,-37], [-33.5, /**/37], [33.5, /**/37], [33.5, -37] ],
      sheet: "scribblemn",
      sprite: "scribblemn",
      vx: 0,
      vy: 0,
      ay: 0
    });
    this.add("animation");
  },
  step: function(dt) {
    this.play("scribble");
  },
});
Q.Sprite.extend("Susman", {
  init: function(player) {

    this._super({
      x: player.p.x + Q.width + 50,
      y: 565,
      scale: .5,
      type: SPRITE_BOX,
      sheet: "susman",
      sprite: "susman",
      points: [ [-100,-200], [-100, 200], [100, 200], [100, -200] ],
      vx: -200,
      vy: 0,
      ay: 0
    });
    this.add("animation");
  },
  step: function(dt) {
    this.play("spin_left");
    this.p.x += this.p.vx * dt;
  },
});
Q.Sprite.extend("Apple", {
  init: function(player) {
    this._super({
      x: player.p.x + Q.width + 50,
      y: 100,
      scale: 1.5,
      type: SPRITE_BOX,
      sheet: "apple",
      sprite: "apple",
      vx: -140,
      vy: 0,
      ay: 0,
      gravity: 2.5,
      angle: 0
    });
    this.add("2d, animation");
    this.on("bump.bottom", this, "bounce");
  },
  step: function(dt) {
    this.play("apple_left");
    this.p.x += this.p.vx * dt;
    this.p.angle += 15
    if(this.p.y > 555) {
      this.p.y = 555;
      this.p.vy = -1500;
    }
  },
  bounce: function(coll) {
    if (isPlatform(coll.obj)) {
      this.p.vy = -1500; // make the apple bounce
    }
  },
});
Q.Sprite.extend("Bubbles", {
  init: function(player) {
    this._super({
      x: player.p.x + Q.width + 50,
      y: 565,
      scale: 2.0,
      type: SPRITE_BOX,
      sheet: "bubbles",
      sprite: "bubbles",
      vx: -250,
      vy: 0,
      ay: 0
    });
    this.add("animation");
  },
  step: function(dt) {
    this.play("bubble_left");
    this.p.x += this.p.vx * dt;
  },
});
Q.Sprite.extend("JumpingMan", {
  init: function(player, offset) {
    this._super({
      x: player.p.x + Q.width + 50 + offset,
      y: 525,
      scale: 2,
      type: SPRITE_BOX,
      points: [ [-22,-44], [-22, 44], [37, 44], [37, -44] ],
      sheet: "jumpingman",
      sprite: "jumpingman",
      vx: -250,
      vy: 0,
      ay: 0
    });
    this.add("animation");
  },
  step: function(dt) {
    this.play("jump_left");
    this.p.x += this.p.vx * dt;
  },
});
Q.Sprite.extend("Smack", {
  init: function(player, offset) {
    this._super({
      x: player.p.x + Q.width + 50 + offset,
      y: 560,
      scale: 2.5,
      type: SPRITE_BOX,
      points: [ [-40,-45], [-40, 58], [50, 58], [50, -45] ],
      sheet: "smack",
      sprite: "smack",
      vx: -200,
      vy: 0,
      ay: 0
    });
    this.add("animation");
  },
  step: function(dt) {
    this.play("smack_left");
    this.p.x += this.p.vx * dt;
  },
});
Q.Sprite.extend("TorbJr", {
  init: function(player) {
    this._super({
      x: player.p.x + Q.width + 50,
      y: 560,
      scale: 2.5,
      type: SPRITE_BOX,
      sheet: "torbjr",
      sprite: "torbjr",
      vx: -200,
      vy: 0,
      ay: 0
    });
    this.add("animation");
  },
  step: function(dt) {
    this.play("torb_left");
    this.p.x += this.p.vx * dt;
  },
});
Q.Sprite.extend("Apj", {
  init: function(player) {
    this._super({
      x: player.p.x + Q.width + 50,
      y: 500,
      scale: 2,
      type: SPRITE_BOX,
      sheet: "apj",
      sprite: "apj",
      vx: 0,
      vy: 0,
      ay: 0
    });
    this.add("animation");
  },
  step: function(dt) {
    this.play("stand");
    this.p.x += this.p.vx * dt;
  },
});
Q.Sprite.extend("Noze", {
  init: function(player) {
    this._super({
      x: player.p.x + Q.width + 50,
      y: 560,
      scale: 2.5,
      points: [ [-23,-51], [-23, 51], [23, 51], [23, -51] ],
      type: SPRITE_BOX,
      sheet: "noze",
      sprite: "noze",
      vx: -200,
      vy: 0,
      ay: 0
    });
    this.add("animation");
  },
  step: function(dt) {
    this.play("noze_left");
    this.p.x += this.p.vx * dt;
  },
});
Q.Sprite.extend("Morbel", {
  init: function(player, speed) {
    this._super({
      x: player.p.x + Q.width + 50,
      y: 565,
      scale: 2.0,
      type: SPRITE_BOX,
      sheet: "morbel",
      sprite: "morbel",
      vx: speed,
      vy: 0,
      ay: 0
    });
    this.add("animation");
  },
  step: function(dt) {
    this.play("morb_left");
    this.p.x += this.p.vx * dt;
  },
});
Q.Sprite.extend("BassDude", {
  init: function(player) {
    this._super({
      x: player.p.x + Q.width + 50,
      y: 565,
      scale: 3,
      type: SPRITE_BOX,
      sheet: "bassdude",
      sprite: "bassdude",
      points: [ [-21,-32], [-21, 32], [21, 32], [21, -32] ],
      vx: -350,
      vy: 0,
      ay: 0
    });
    this.add("animation");
  },
  step: function(dt) {
    this.play("bass_left");
    this.p.x += this.p.vx * dt;
  },
});
Q.Sprite.extend("MurderSg", {
  init: function(player, initialOffset) {
    this._super({
      x: player.p.x + Q.width + 50 + initialOffset,
      y: 460,
      scale: 2.0,
      type: SPRITE_BOX,
      sheet: "murdersg",
      sprite: "murdersg",
      points: [ [-32,-16], [-32, 8], [32, 8], [32, -16] ],
      vx: -400,
      vy: 0,
      ay: 0
    });
    this.add("animation");
  },
  step: function(dt) {
    this.play("murder_left");
    this.p.x += this.p.vx * dt;
  },
});
Q.Sprite.extend("Shuriken", {
  init: function(player, offset) {

    this._super({
      x: player.p.x + Q.width + 50 + offset,
      y: 565,
      scale: .75,
      type: SPRITE_BOX,
      sheet: "shuriken",
      sprite: "shuriken",
      points: [ [-48,-48], [-48, 48], [48, 48], [48, -48] ],
      vx: -400,
      vy: 0,
      ay: 0
    });
    this.add("animation");
  },
  step: function(dt) {
    this.play("spin_left");
    this.p.x += this.p.vx * dt;
  },
});
Q.Sprite.extend("Shark",{
  init: function(player) {
    this._super({
      x: player.p.x + Q.width + 50,
      y: 500,
      frame: Math.random() < 0.5 ? 1 : 0,
      scale: .75,
      type: SPRITE_BOX,
      sheet: "shark",
      sprite: "shark",
      vx: -400 + 200 * Math.random(),
      vy: 0,
      ay: 0
    });


    this.add("animation");
  },

  step: function(dt) {
    this.play("swim_left");
    this.p.x += this.p.vx * dt;


    this.p.vy += this.p.ay * dt;
    this.p.y += this.p.vy * dt;

    if(this.p.y > 800) { this.destroy(); }

  },
  

});

Q.GameObject.extend("GenericLauncher", {
  init: function() {
    this.p = {
      toLaunch: []
    }
  },
  update: function(dt) {
    if (this.p.toLaunch.length > 0) {
      var thingToLaunch = this.p.toLaunch.shift();
      this.stage.insert(thingToLaunch);
    }
  },
  launchScribblemn: function(player) {
    this.p.toLaunch.push(new Q.Scribblemn(player));
  },
  launchSusman: function(player) {
    this.p.toLaunch.push(new Q.Susman(player));
  },
  launchShuriken: function(player,numInRow, initialOffset) {
    for (i=0; i < numInRow; i++ ) {
      this.p.toLaunch.push(new Q.Shuriken(player, initialOffset + i*100));
    }
  },
  launchMurderSg: function(player, initialOffset) {
    this.p.toLaunch.push(new Q.MurderSg(player, initialOffset));
  },
  launchBassDude: function(player) {
    this.p.toLaunch.push(new Q.BassDude(player));
  },
  launchBubbles: function(player) {
    this.p.toLaunch.push(new Q.Bubbles(player));
  },
  launchApple: function(player) {
    this.p.toLaunch.push(new Q.Apple(player));
  },
  launchMorbel: function(player, speed) {
    this.p.toLaunch.push(new Q.Morbel(player, speed));
  },
  launchJumpingMan: function(player, offset) {
    this.p.toLaunch.push(new Q.JumpingMan(player, offset));
  },
  launchSmack: function(player, offset) {
    this.p.toLaunch.push(new Q.Smack(player, offset));
  },
  launchTorbJr: function(player) {
    this.p.toLaunch.push(new Q.TorbJr(player));
  },
  launchNoze: function(player) {
    this.p.toLaunch.push(new Q.Noze(player));
  },
  launchApj: function(player) {
    this.p.toLaunch.push(new Q.Apj(player));
  },
  launchPig: function(player) {
    this.p.toLaunch.push(new Q.Pig(player));
  },
  launchShark: function(player) {
    this.p.toLaunch.push(new Q.Shark(player));
  }

});

Q.GameObject.extend("PlatformThrower", {
  init: function() {
    this.p = {
      toLaunch: []
    }
  },
  update: function(dt) {

    var player = Q("Player").first();
    if ( this.p.toLaunch.length > 0 ) {
      var data = this.p.toLaunch.shift();
      var baseDist = player.p.x + Q.width + 30 + data.initialOffset;
      if ( data.platformWidth > 0 ) {
        this.stage.insert(new Q.Platform(data.platformWidth, data.initialOffset));
      }
      if ( data.bottomConeArray.length > 0 ) {
        for (i = 0; i < data.bottomConeArray.length; i++) {
          if ( data.bottomConeArray[i] > 0 ) {
            var dist = baseDist + (i * 100); 
            this.stage.insert(new Q.ConeBomb(dist, 565));
          }
        }
      }
      if ( data.topConeArray.length > 0 ) {
        for (i = 0; i < data.topConeArray.length; i++) {
          if ( data.topConeArray[i] > 0 ) {
            var dist = baseDist + (i * 100); 
            this.stage.insert(new Q.ConeBomb(dist, 460));
          }
        }
      }
    }
  },
  launch: function(platformWidth, bottomConeArray, topConeArray, initialOffset) {
    var data = {
      platformWidth: platformWidth,
      bottomConeArray: bottomConeArray,
      topConeArray: topConeArray,
      initialOffset: initialOffset
    };
    this.p.toLaunch.push(data);
  }
});

Q.GameObject.extend("Thrower",{
  init: function() {
    this.p = {
      launchDelay: 1.25,
      launchRandom: 1,
      launch: 0
    }
  },

  update: function(dt) {
    var thingsToThrow = [];

    var player = Q("Player").first();
    if (Q.state.get("throwSharks")) {
      thingsToThrow.push("shark");
    }
    if (Q.state.get("throwPigs")) {
      thingsToThrow.push("pig");
    }
    if (thingsToThrow.length > 0) {
      this.p.launch -= dt;

      if(this.p.launch < 0) {
        if (Q.state.get("nextThrowShark") && Q.state.get("throwSharks")) {
          thing = "shark";
          Q.state.set("nextThrowShark", false);
        } else {
          thing = thingsToThrow[Math.floor(Math.random() * thingsToThrow.length)];
        }

        if ( thing == "shark" ) {
          this.stage.insert(new Q.Shark(player));
        } else if ( thing == "pig" ) {
          this.stage.insert(new Q.Pig(player));
        }
        this.p.launch = this.p.launchDelay + this.p.launchRandom * Math.random();
      }
    }
  }

});

Q.Repeater.extend("BackgroundWall",{
  init: function() {
    this._super({
      //asset: bgNormal,
      sheet: "bg",
      sprite: "bg",
      frame: 0,
      repeatY: false,
      speedX: 1.00,
      y: 48
    });
  },
  update: function(dt) {
    //this.p.speedX += dt;
  },
  invert: function(dt) {
    if (this.p.frame == 0) {
      this.p.frame = 1;
    } else {
      this.p.frame = 0;
    }
  },
});

Q.Repeater.extend("BackgroundFloor",{
  init: function() {
    this._super({
      asset: "street.png",
      repeatY: false,
      speedX: 1.0,
      y: 295
    });
  },
  update: function(dt) {
    //this.p.speedX += dt;
  }
});

Q.Sprite.extend("Platform", {
  init: function(width, initialOffset) {
    var player = Q("Player").first();
    this._super({
      x: player.p.x + Q.width + width/2 + initialOffset,
      y: 500,
      w: width,
      h: 25
    });
  },
  draw: function(ctx) {
    ctx.fillStyle = "#FF0000";
    ctx.fillRect(-this.p.cx,-this.p.cy,this.p.w,this.p.h);
  }
});

Q.Sprite.extend("Logo", {
  init: function(p) {
    this._super(p, {
      x: Q.width/2,
      y: Q.height/2 - 50,
      type: Q.SPRITE_NONE,
      asset: "logo.png"
    });
  }
});

Q.Sprite.extend("Jump", {
  init: function(p) {
    this._super(p, {
      x: Q.width/2,
      y: Q.height/2 - 50,
      type: Q.SPRITE_NONE, 
      asset: "jump.png"
    });
  }
});

Q.Sprite.extend("Duck", {
  init: function(p) {
    this._super(p, {
      x: Q.width/2,
      y: Q.height/2 - 50,
      type: Q.SPRITE_NONE, 
      asset: "duck.png"
    });
  }
});

Q.Sprite.extend("Cones", {
  init: function(p) {
    this._super(p, {
      x: Q.width/2,
      y: Q.height/2 - 50,
      type: Q.SPRITE_NONE, 
      asset: "cones.png"
    });
  }
});

Q.UI.Text.extend("Timer",{
  init: function(p) {
    // TODO debug stuff - should probably remove afterwards
    var startParam = parseInt(getParameterByName("startAt"));
    var startTime = startParam && startParam != NaN ? startParam : 0;
    this._super(p, {
      x:200,
      y: 20,
      label: "0",
      color: "white",
      counter: startTime
    });

  },
  step: function(dt) {
    if (!Q.state.get("paused") && Q.state.get("canPause") ) {
      this.p.counter += dt;
      timesTen = this.p.counter * 10;
      var secondsElapsedTimesTen = Math.floor(timesTen, -1);
      var secondsElapsed = secondsElapsedTimesTen/10;
      Q.state.set("time", secondsElapsed);

      this.p.label = "" + secondsElapsed;

    }
  }
});

Q.scene("level1",function(stage) {
  Q.state.set("throwSharks", false);
  Q.state.set("throwPigs", false);
  Q.state.set("nextThrowShark", false);
  Q.state.set("moving", true);
  Q.state.set("strobe", 0);
  Q.state.set("canPause", true);
  Q.state.set("frame", 0);

  var background = new Q.BackgroundWall();
  stage.insert(background);

  stage.insert(new Q.BackgroundFloor());

  var thrower = stage.insert(new Q.Thrower());
  var platformThrower = stage.insert(new Q.PlatformThrower());
  var genericLauncher = stage.insert(new Q.GenericLauncher());

  var player = new Q.Player();
  stage.insert(player);
  stage.add("viewport").follow(player, {x: true, y: false});
  stage.viewport.offsetX = -275;
  stage.viewport.centerOn(player.p.x, 400 );

  var playerStartSpeed = player.p.speed;

  // SCRIPT
  Q.state.on("change.time",function() {
    var currTime = Q.state.get("time");

    // Strobe controls, so we don't have to control this so finely:
    var strobeVal = Q.state.get("strobe");
    switch(strobeVal) {
      case 0:
        break;
      case 1:
        if ( (currTime * 10) % 2 == 0 ) {
          background.invert();
        }
        break;
      case 2:
        background.invert();
        break;
    }

    // Speed controls (so that debug mode is always going at the right speed 
    if (currTime < 25) {
      player.p.speed = playerStartSpeed;
    } else if ( currTime >= 25 && currTime < 45 ) {
      player.p.speed = playerStartSpeed * 1.25;
    } else if ( currTime >= 45 && currTime < 55 ) {
      player.p.speed = playerStartSpeed * 1.25 * 1.5;
    } else if ( currTime >= 55 && currTime < 63 ) {
      player.p.speed = playerStartSpeed * 1.25;
    } else if ( currTime >= 63 && currTime < 66.6 ) {
      player.p.speed = playerStartSpeed * 1.25 * 1.5;
    } else if ( currTime >= 66.6 && currTime < 98 ) {
      player.p.speed = playerStartSpeed * 1.25 * 1.5 * 1.1;
    } else if ( currTime >= 98 ) {
      player.p.speed = 0;
    }

    switch(currTime) {
      case 11: // enemys start
        Q.state.set("throwPigs", true);
        break;
      case 15: // small platform with 3 cones underneath
        Q.state.set("throwPigs", false);
        platformThrower.launch(250, [1,1,1], [], 0);
        break;
      case 18:
        Q.state.set("throwPigs", true);
        break;
      case 25: // Sharks start, things speed up
        thrower.p.launchDelay = .75;
        thrower.p.launch = 0;
        Q.state.set("nextThrowShark", true);
        Q.state.set("throwSharks", true);
        break;
      case 28: // medium platform with cones underneath and one on top right
        Q.state.set("throwPigs", false);
        Q.state.set("throwSharks", false);
        platformThrower.launch(460, [1,1,1,1,1], [0,0,0,1,0], 0);
        break;
      case 32:
        Q.state.set("throwPigs", true);
        Q.state.set("throwSharks", true);
        break;
      case 34:
        Q.state.set("throwPigs", false);
        Q.state.set("throwSharks", false);
        break;
      case 35: // some scribblemn show up
        genericLauncher.launchScribblemn(player);
        break;
      case 37:
        genericLauncher.launchPig(player);
        break;
      case 38:
        genericLauncher.launchScribblemn(player);
        break;
      case 40:
        genericLauncher.launchShark(player);
        genericLauncher.launchScribblemn(player);
        break;
      case 42:
        genericLauncher.launchShark(player);
        genericLauncher.launchScribblemn(player);
        break;
      case 45: // launch susman + plus speedup
        genericLauncher.launchSusman(player);
        break;
      case 47:
        genericLauncher.launchSusman(player);
        break;
      case 48: // long platform
        platformThrower.launch(1500, [],[], 0);
        genericLauncher.launchShuriken(player, 27, 500);
        break;
      case 49:
        genericLauncher.launchMurderSg(player, 0);
        break;
      case 50:
        genericLauncher.launchMurderSg(player, 0);
        break;
      case 52:
        genericLauncher.launchShark(player);
        break;
      case 53:
        genericLauncher.launchBassDude(player);
        break;
      case 53.5:
        genericLauncher.launchShark(player);
        break;
      case 54.2:
        genericLauncher.launchPig(player);
        break;
      case 55: // slow down
        break;
      case 63.8: // invert, speedup, shuriken
        background.invert();
        genericLauncher.launchShuriken(player, 1, 0);
        break;
      case 64.5:
        background.invert(); //normal
        break;
      case 65.2:
        background.invert(); // invert
        break;
      case 65.9:
        background.invert(); // normal
        genericLauncher.launchApple(player);
        break;
      case 66.6: // strobe every .2 seconds
        background.invert(); // kick off strobe
        Q.state.set("strobe", 1); // level 1 strobing
        // another speed up
        // bubbles shows up
        genericLauncher.launchBubbles(player);
        break;
      case 67.5:
        genericLauncher.launchPig(player);
        break;
      case 68.2:
        genericLauncher.launchShark(player);
        break;
      case 68.4:
        genericLauncher.launchShark(player);
        break;
      case 69:
        Q.state.set("strobe", 2);
        genericLauncher.launchBubbles(player);
        break;
      case 71:
        genericLauncher.launchMorbel(player, -250);
        break;
      case 72:
        genericLauncher.launchShark(player);
        break;
      case 73:
        genericLauncher.launchJumpingMan(player, 0);
        break;
      case 74:
        genericLauncher.launchShark(player);
        break;
      case 75:
        genericLauncher.launchBubbles(player);
        break;
      case 76:
        genericLauncher.launchSusman(player);
        break;
      case 77.5:
        Q.state.set("strobe", 2); // TODO sync up timing better and moar strobe
        // TODO after sync up - more speed
        genericLauncher.launchSmack(player, 0); // todo fix frame lineup of other two with when they encounter the player
        genericLauncher.launchSmack(player, 950);
        genericLauncher.launchSmack(player, 1800);
        break;
      case 82:
        genericLauncher.launchTorbJr(player);
        break;
      case 83:
        genericLauncher.launchShark(player);
        break;
      case 84:
        genericLauncher.launchBassDude(player);
        break;
      case 86:
        genericLauncher.launchNoze(player);
        break;
      case 88:
        genericLauncher.launchJumpingMan(player, 0);
        genericLauncher.launchJumpingMan(player, 350);
        genericLauncher.launchJumpingMan(player, 650);
        break;
      case 91:
        platformThrower.launch(350, [1,1,1,1,1,1,1], [0,0,0,0,0,0,0], 0);
        platformThrower.launch(1200, [1,1,1,1,1,1,1,1,1,1,1,1], [0,0,0,0,0,0,0,0,0,0,0,0], 665);
        // TODO
        // flash faster, w/ black and white?
        // more speedup
        break;
      case 93:
        genericLauncher.launchMurderSg(player, 0);
        genericLauncher.launchMurderSg(player, 300);
        break;
      case 94: 
        genericLauncher.launchApple(player);
        break;
      case 96:
        genericLauncher.launchMorbel(player, 0);
        genericLauncher.launchTorbJr(player);
        break;
      case 97.5:
        genericLauncher.launchApj(player);
        break;
      case 98:
        Q.state.set("canPause", false);
        // Stop movement (above)
        Q.state.set("strobe", 0);
        // Stop character animation
        Q.state.set("moving", false);
        // Sound stopped
        Q.audio.stop();
        // Cones 'raining from sky'
        // 'Download the song' link
        // You won! banner on top


        // end?
        // yeah, i think the game could end with the background going back to normal, "APJ" shows up like a stationary enemy would, then the game stops scrolling with APJ on the right side of the screen and the main character on the left (with the main character no longer moving his legs) and maybe a bunch of the "Cone up" sprites raining down from the sky
        // and just sits there 'forever' with that and cones raining down?
        // with no sound playing
        // and i think we'll want to somehow have a link to a free download of the song pop up either in the game or outside of it, or it automatically redirects you after a few seconds to a page with the download
        // maybe it says "You Won!" or "You're the Best!" on a big banner or something also
        //
        break;
    }
    // TODO bigger apple, murdersg, bassdude
  });
});

Q.scene('hud',function(stage) {
  Q.state.set("start_time", Date.now());
  
  var container = stage.insert(new Q.UI.Container({x: 50, y: 0 }));

  var label = container.insert(new Q.Timer());
 
  var logo = new Q.Logo();
  logo.hide();
  stage.insert(logo);

  var jump = new Q.Jump();
  jump.hide();
  stage.insert(jump);
  
  var duck = new Q.Duck();
  duck.hide();
  stage.insert(duck);
  
  var cones = new Q.Cones();
  cones.hide();
  stage.insert(cones);

  // HUD loop
  Q.state.on("change.time",function() {
    var currTime = Q.state.get("time");
    switch(currTime) {
      case 3:
        // show logo
        logo.show();
        break;
      case 6:
        // stop showing logo
        logo.hide();
        break;
      case 7:
        // show duck instructions
        duck.show();
        break;
      case 9:
        // hide duck instructions
        duck.hide();
        break;
      case 10:
        // show jump instructions
        jump.show();
        break;
      case 13:
        // hide jump instructions
        jump.hide();
        break;
      case 15:
        // show cones instructions
        cones.show();
        break;
      case 19:
        // hide cones instructions
        cones.hide();
        break;
    }
  });

  container.fit(20);
});

var stageGame = function() {
    Q.audio.stop();
    Q.clearStages();
    Q.state.set("paused", false);
    Q.audio.play('sharkwhirl-new.mp3');
    Q.stageScene("level1");
    Q.stageScene("hud", 3, Q('Player').first().p);
};
  
Q.load("logo.png, jump.png, duck.png, cones.png, sharkwhirl-new.mp3, sharkwhirl-new.ogg, dude.json, dude.png, pig.png," +
       " pig.json, shark.png, shark.json, street.png," +
       " platform.png, platform.json, conebomb.png, conebomb.json, scribblemn.png, scribblemn.json," +
       " susman.png, susman.json, shuriken.png, shuriken.json, murdersg.png, murdersg.json, bassdude.png, bassdude.json," +
       " apple.png, apple.json, bubbles.png, bubbles.json, morbel.png, morbel.json, jumpingman.png, jumpingman.json," +
       " smack.png, smack.json, torbjr.png, torbjr.json, noze.png, noze.json, apj.png, apj.json, bg.json, bg.png",
  function() {
    Q.compileSheets("dude.png", "dude.json");
    Q.compileSheets("shark.png","shark.json");
    Q.compileSheets("pig.png", "pig.json");
    Q.compileSheets("platform.png", "platform.json");
    Q.compileSheets("conebomb.png", "conebomb.json");
    Q.compileSheets("scribblemn.png", "scribblemn.json");
    Q.compileSheets("susman.png", "susman.json");
    Q.compileSheets("shuriken.png", "shuriken.json");
    Q.compileSheets("murdersg.png", "murdersg.json");
    Q.compileSheets("bassdude.png", "bassdude.json");
    Q.compileSheets("apple.png", "apple.json");
    Q.compileSheets("bubbles.png", "bubbles.json");
    Q.compileSheets("morbel.png", "morbel.json");
    Q.compileSheets("jumpingman.png", "jumpingman.json");
    Q.compileSheets("smack.png", "smack.json");
    Q.compileSheets("torbjr.png", "torbjr.json");
    Q.compileSheets("noze.png", "noze.json");
    Q.compileSheets("apj.png", "apj.json");
    Q.compileSheets("bg.png", "bg.json");

    Q.animations("dude", {
      walk_right: {frames: [0,1,2,3,4,5,6,7], rate: 1/13, loop: true},
      jump_right: {frames: [4], rate: 1/20, flip: false},
      stand_right: {frames: [2], rate: 1/20, flip: false},
      duck_right: {frames:[8,9], rate: 1/8, flip: false},
      explode: {frames:[11], rate: 1/20, flip: false},
    });
    Q.animations("shark", {
      swim_left: { frames: [0,1,2,3], rate: 1/5, loop: true}
    });
    Q.animations("pig", {
      walk_left: { frames: [0,1,2,3], rate: 1/5, loop: true}
    });
    Q.animations("conebomb", {
      exist: { frames: [0], rate: 1, loop: true},
      explode: { frames: [5,6,7,8], rate: 1/4, loop: false}
    });
    Q.animations("scribblemn", {
      scribble: { frames: [ 0,1,2,3,4,5,6,7], rate: 1/5, loop: true}
    });
    Q.animations("susman", {
      spin_left: { frames: [0,1,2,3], rate: 1/5, loop: true }
    });
    Q.animations("shuriken", {
      spin_left: { frames: [0,1,2,3], rate: 1/10, loop: true }
    });
    Q.animations("murdersg", {
      murder_left: { frames: [0,1,2], rate: 1/5, loop: true }
    });
    Q.animations("bassdude", {
      bass_left: { frames: [0,1], rate: 1/5, loop: true }
    });
    Q.animations("apple", {
      apple_left: { frames: [0,1,2,3,4,5,6,7,8,9,10], rate: 1/7, loop: true }
    });
    Q.animations("bubbles", {
      bubble_left: { frames: [0,1,2], rate: 1/5, loop: true}
    });
    Q.animations("morbel", {
      morb_left: { frames: [0,1], rate: 1/5, loop: true }
    });
    Q.animations("jumpingman", {
      jump_left: { frames: [0,1,2,3,4,5,6,7,8], rate: 1/5, loop: true }
    });
    Q.animations("smack", {
      smack_left: { frames: [0,1,2,3,4,5], rate: 1/5, loop: true }
    });
    Q.animations("torbjr", {
      torb_left: { frames: [0,1], rate: 1/5, loop: true }
    });
    Q.animations("noze", {
      noze_left: { frames: [0,1,2,3,4,5,6,7,8,9], rate: 1/10, loop: true }
    });
    Q.animations("apj", {
      stand: { frames: [0,1], rate: 3/4, loop: true }
    });
    Q.animations("bg", {
      reg: { frames: [1], rate: 1, loop: true }
    });
    stageGame();
  
});

document.addEventListener("blur", function() {
  if ( Q.state.get("canPause") ) {
    Q.state.set("paused",true);
    Q.stage().pause();
    Q.audio.stop();
  }
}, true);

document.addEventListener("focus", function() {
  if ( Q.state.get("canPause") ) {
    stageGame();
  }
}, true);


});
