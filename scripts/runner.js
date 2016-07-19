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

var Q = window.Q = Quintus({ audioSupported: ['mp3']})
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
  return ob.isA("Shark") || ob.isA("Pig");
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
      this.die();
    }
  },

  die: function() {
    this.play("explode");
    Q.stage().pause();
    Q.audio.stop();
    setTimeout(stageGame, 1000);
  },

  stomp: function(coll) {
    if(isEnemy(coll.obj)) {
      coll.obj.destroy();
      this.p.vy = -700; // make the player jump
    } else if (isPlatform(coll.obj)) {
      this.p.landed = 1;
    }
  },

  step: function(dt) {
    this.p.speed += Q.state.get("acc");


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
  init: function() {

    var player = Q("Player").first();
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
Q.Sprite.extend("Shark",{
  init: function() {

    var player = Q("Player").first();
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

Q.GameObject.extend("PlatformThrower", {
  init: function() {
    this.p = {
      shouldLaunch: 0
    }
  },
  update: function(dt) {
    if ( this.p.shouldLaunch > 0 ) {
      this.stage.insert(new Q.Platform());
      this.p.shouldLaunch = 0;
    }
  },
  launch: function() {
    this.p.shouldLaunch = 1;
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
          this.stage.insert(new Q.Shark());
        } else if ( thing == "pig" ) {
          this.stage.insert(new Q.Pig());
        }
        this.p.launch = this.p.launchDelay + this.p.launchRandom * Math.random();
      }
    }
  }

});

var bgNormal = "derek-background.png";
var bgInverse = "derek-background-inverse.png";
Q.Repeater.extend("BackgroundWall",{
  init: function() {
    this._super({
      asset: bgNormal,
      repeatY: false,
      speedX: 1.00,
      y: 47.5
    });
  },
  update: function(dt) {
    //this.p.speedX += dt;
  },
  invert: function(dt) {
    if (this.p.asset == bgNormal) {
      this.p.asset = bgInverse;
    } else {
      this.p.asset = bgNormal;
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
  init: function(p) {
    var player = Q("Player").first();
    this._super({
      x: player.p.x + Q.width + 50,
      y: 450,
      scale: 5.0,
      type: SPRITE_BOX,
      sheet: "platform",
      sprite: "platform",
    });
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
    this._super(p, {
      x:200,
      y: 20,
      label: "0",
      color: "white",
      counter: 0
    });

  },
  step: function(dt) {
    if (!Q.state.get("paused")) {
      this.p.counter += dt;
      var secondsElapsed = Math.floor(this.p.counter, -1);
      Q.state.set("time", secondsElapsed);

      this.p.label = "" + secondsElapsed;

    }
  }
});

Q.scene("level1",function(stage) {
  Q.state.set("acc", 0);
  Q.state.set("throwSharks", false);
  Q.state.set("throwPigs", false);
  Q.state.set("nextThrowShark", false);
  Q.state.set("moving", true);

  var background = new Q.BackgroundWall();
  stage.insert(background);

  stage.insert(new Q.BackgroundFloor());

  var thrower = stage.insert(new Q.Thrower());
  var platformThrower = stage.insert(new Q.PlatformThrower());

  var player = new Q.Player();
  stage.insert(player);
  stage.add("viewport").follow(player, {x: true, y: false});
  stage.viewport.offsetX = -275;
  stage.viewport.centerOn(player.p.x, 400 );

  // SCRIPT
  Q.state.on("change.time",function() {
    var currTime = Q.state.get("time");
    switch(currTime) {
      case 2:
        platformThrower.launch();
        break;
      case 3:
        platformThrower.launch();
        break;
      case 4:
        platformThrower.launch();
        break;
      case 11: // enemys start TODO can we do something on a half strike?
        Q.state.set("throwPigs", true);
        break;
      case 25:
        thrower.p.launchDelay = .75;
        thrower.p.launch = 0;
        Q.state.set("nextThrowShark", true);
        Q.state.set("throwSharks", true);
        break;
    }
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
    Q.audio.play('SHARKWHIRL.mp3');
    Q.stageScene("level1");
    Q.stageScene("hud", 3, Q('Player').first().p);
};
  
Q.load("logo.png, jump.png, duck.png, cones.png, SHARKWHIRL.mp3, dude.json, dude.png, pig.png," +
       " pig.json, shark.png, shark.json, derek-background.png, derek-background-inverse.png, street.png," +
       " platform.png, platform.json",
  function() {
    Q.compileSheets("dude.png", "dude.json");
    Q.compileSheets("shark.png","shark.json");
    Q.compileSheets("pig.png", "pig.json");
    Q.compileSheets("platform.png", "platform.json");
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
    stageGame();
  
});

document.addEventListener("blur", function() {
  Q.state.set("paused",true);
  Q.stage().pause();
  Q.audio.stop();
}, true);

document.addEventListener("focus", function() {
  stageGame();
}, true);


});
