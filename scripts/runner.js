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

Q.Sprite.extend("Player",{

  init: function(p) {

    this._super(p,{
      sheet: "derek2",
      sprite: "derek2",
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
    this.on("bump.left", this, "die");
    this.on("bump.right", this, "die");
    this.on("bump.top", this, "die");
    this.on("bump.bottom", this, "stomp");

    this.add("2d, animation");
    this.play("stand_right");
  },

  die: function() {
    this.play("explode");
    Q.stage().pause();
    Q.audio.stop();
    setTimeout(stageGame, 1000);
  },

  stomp: function(coll) {
    if(coll.obj.isA("Shark") || coll.obj.isA("Pig")) {
      coll.obj.destroy();
      this.p.vy = -700; // make the player jump
    }
  },

  step: function(dt) {
    this.p.speed += Q.state.get("acc");


    this.p.vx += (this.p.speed - this.p.vx)/4;

    if(this.p.y > 555) {
      this.p.y = 555;
      this.p.landed = 1;
      this.p.vy = 0;
    } else {
      this.p.landed = 0;
    }

    if(Q.state.get("moving") && Q.inputs['up'] && this.p.landed > 0) {
      this.p.vy = this.p.jump;
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

Q.Repeater.extend("BackgroundWall",{
  init: function() {
    this._super({
      asset: "city-large.png",
      repeatY: false,
      speedX: 0.75,
      scale: 1,
      y: 20
    });
  },
  update: function(dt) {
    //this.p.speedX += dt;
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

Q.Repeater.extend("Sky", {
  init: function() {
    this._super({
      asset: "blue.png"
    });
  }
});

Q.Sprite.extend("OpeningText", {
  init: function(p) {
    this._super(p, {
      x: Q.width/2 - 50,
      y: Q.height/2,
      type: Q.SPRITE_NONE, 
      asset: "SHARKWHIRL.png"
    });
  }
});

Q.Sprite.extend("JumpText", {
  init: function(p) {
    this._super(p, {
      x: 1000,
      y: Q.height/2,
      type: Q.SPRITE_NONE, 
      asset: "JUMP.png"
    });
  }
});

Q.Sprite.extend("DuckText", {
  init: function(p) {
    this._super(p, {
      x: 1500,
      y: Q.height/2,
      type: Q.SPRITE_NONE, 
      asset: "DUCK.png"
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

  stage.insert(new Q.Sky());

  stage.insert(new Q.BackgroundWall());

  stage.insert(new Q.BackgroundFloor());

  stage.insert(new Q.OpeningText());
  stage.insert(new Q.JumpText());
  stage.insert(new Q.DuckText());

  var thrower = stage.insert(new Q.Thrower());
  var player = new Q.Player();
  stage.insert(player);
  stage.add("viewport").follow(player, {x: true, y: false});
  stage.viewport.offsetX = -275;
  stage.viewport.centerOn(player.p.x, 400 );

  // SCRIPT
  Q.state.on("change.time",function() {
    var currTime = Q.state.get("time");
    switch(currTime) {
      case 5: // show instructions
        break;
      case 10: // enemys start TODO can we do something on a half strike?
        Q.state.set("throwPigs", true);
        break;
      case 25:
        thrower.p.launchDelay = .75;
        thrower.p.launch = 0;
        Q.state.set("nextThrowShark", true);
        Q.state.set("throwSharks", true);
        break;
      case 35: // increase number and variety of obstacles
        break;
      case 46: // Add a new type of obstacle, speed up a little bit
        //TODO
        break;
      case 56: // Stop obstacles, background changes color to make it more ominous
        //TODO
        break;
      case 63: // Right on the two musical “hits” (approx 1:03.5 and 1:05), holes in the ground open up, or some kind of new obstacle that appears suddenly and has to be avoided immediately
        //TODO
        break;
      case 66: // Speeds up, obstacles come back, maybe with some new ones
        //TODO
        break;
      case 67: // 1:07.5 - Speeds up more, background gets crazy (flashing? Rainbow?)
        // TODO (combine top two?)
        break;
      case 98: //1:38 - character gets to the end, everything is ok again!
        // TODO
        break;
    }
  });
});

Q.scene('hud',function(stage) {
  Q.state.set("start_time", Date.now());
  
  var container = stage.insert(new Q.UI.Container({x: 50, y: 0 }));

  var label = container.insert(new Q.Timer());

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
  
Q.load("SHARKWHIRL.png, JUMP.png, DUCK.png, SHARKWHIRL.mp3, blue.png, derek2.json, derek2.png, pig.png, pig.json, shark.png, shark.json, city-large.png, street.png", function() {
    Q.compileSheets("derek2.png", "derek2.json");
    Q.compileSheets("shark.png","shark.json");
    Q.compileSheets("pig.png", "pig.json");
    Q.animations("derek2", {
      walk_right: {frames: [0,1,2,3,4,5,6,7], rate: 1/7, loop: true},
      jump_right: {frames: [4], rate: 1/20, flip: false},
      stand_right: {frames: [2], rate: 1/20, flip: false},
      duck_right: {frames:[8], rate: 1/20, flip: false},
      explode: {frames:[9], rate: 1/20, flip: false},
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
