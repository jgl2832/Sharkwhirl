window.addEventListener("load",function() {

var Q = window.Q = Quintus({ audioSupported: ['mp3']})
        .include("Audio, Sprites, Scenes, Input, 2D, Anim, Touch, UI")
        .setup({ width: 800, height: 600, scaleToFit: true })
        .controls().touch()
        .enableSound();

var SPRITE_BOX = 1;

Q.gravityY = 2000;

Q.Sprite.extend("Player",{

  init: function(p) {

    this._super(p,{
      sheet: "suit",
      sprite: "suit",
      scale: 2,
      collisionMask: SPRITE_BOX, 
      x: 40,
      y: 555,
      gravity: 2,
      standingPoints: [ [-14,-26], [-14, 26], [14, 26], [14, -26] ],
      duckingPoints: [ [-14, -6], [-14, 26], [14, 26], [14, -6] ],
      //standingPoints: [ [ -16, 44], [ -23, 35 ], [-23,-48], [23,-48], [23, 35 ], [ 16, 44 ]],
      //duckingPoints : [ [ -16, 44], [ -23, 35 ], [-23,-10], [23,-10], [23, 35 ], [ 16, 44 ]],
      speed: 0,
      jump: -1200
    });

    this.p.points = this.p.standingPoints;

    this.add("2d, animation");
    this.play("stand_right");
  },

  step: function(dt) {
    // TODO smarter speedup?
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

    this.stage.viewport.centerOn(this.p.x + 300, 400 );

  }
});

Q.Sprite.extend("Box",{
  init: function() {

    var levels = [ 565, 540, 500, 440 ];

    var player = Q("Player").first();
    this._super({
      x: player.p.x + Q.width + 50,
      y: levels[Math.floor(Math.random() * 3)],
      frame: Math.random() < 0.5 ? 1 : 0,
      scale: .75,
      type: SPRITE_BOX,
      sheet: "shark",
      sprite: "shark",
      vx: -600 + 200 * Math.random(),
      vy: 0,
      ay: 0,
      theta: 0
    });


    this.on("hit");
    this.add("animation");
  },

  step: function(dt) {
    this.play("swim_left");
    this.p.x += this.p.vx * dt;


    this.p.vy += this.p.ay * dt;
    this.p.y += this.p.vy * dt;
    if(this.p.y != 565) {
      this.p.angle += this.p.theta * dt;
    }

    if(this.p.y > 800) { this.destroy(); }

  },

  hit: function() {
    stageGame();
  }
  

});

Q.GameObject.extend("BoxThrower",{
  init: function() {
    this.p = {
      launchDelay: 1.25,
      launchRandom: 1,
      launch: 0
    }
  },

  update: function(dt) {
    if (Q.state.get("throwBoxes")) {
      this.p.launch -= dt;

      if(this.p.launch < 0) {
        this.stage.insert(new Q.Box());
        this.p.launch = this.p.launchDelay + this.p.launchRandom * Math.random();
      }
    }
  }

});

Q.Repeater.extend("BackgroundWall",{
  init: function() {
    this._super({
      asset: "city.png",
      repeatY: false,
      speedX: 0.5,
      y: 80
    });
  },
  update: function(dt) {
    //this.p.speedX += dt;
  },
});

Q.Repeater.extend("BackgroundFloor",{
  init: function() {
    this._super({
      asset: "background-floor.png",
      repeatY: false,
      speedX: 1.0,
      y: 300
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
      collisionMask: Q.SPRITE_NONE, 
      asset: "SHARKWHIRL.png"
    });
  }
});

Q.Sprite.extend("JumpText", {
  init: function(p) {
    this._super(p, {
      x: 1500,
      y: Q.height/2,
      collisionMask: Q.SPRITE_NONE, 
      asset: "JUMP.png"
    });
  }
});

Q.Sprite.extend("DuckText", {
  init: function(p) {
    this._super(p, {
      x: 3000,
      y: Q.height/2,
      collisionMask: Q.SPRITE_NONE, 
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
  Q.state.set("throwBoxes", false);
  Q.state.set("moving", false);

  stage.insert(new Q.Sky());

  stage.insert(new Q.BackgroundWall());

  stage.insert(new Q.BackgroundFloor());

  stage.insert(new Q.OpeningText());
  stage.insert(new Q.JumpText());
  stage.insert(new Q.DuckText());

  var boxThrower = stage.insert(new Q.BoxThrower());
  stage.insert(new Q.Player());
  stage.add("viewport");

  Q.state.on("change.time",function() {
    var currTime = Q.state.get("time");
    switch(currTime) {
      case 5: // start to move away from title
        Q.state.set("acc", 1);
        Q.state.set("moving", true);
        break;
      case 9: // keep consistent speed and show instructions
        Q.state.set("acc", 0);
        break;
      case 25: // game starts, start throwing obstacles
        Q.state.set("throwBoxes", true);
        break;
      case 35: // increase number and variety of obstacles
        boxThrower.p.launchDelay = .5;
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
  
Q.load("SHARKWHIRL.png, JUMP.png, DUCK.png, SHARKWHIRL.mp3, blue.png, player.json, player.png, shark.png, shark.json, suit.png, suit.json, city.png, background-floor.png", function() {
    Q.compileSheets("player.png","player.json");
    Q.compileSheets("suit.png", "suit.json");
    Q.compileSheets("shark.png","shark.json");
    /*
    Q.animations("player", {
      walk_right: { frames: [0,1,2,3,4,5,6,7,8,9,10], rate: 1/10, flip: false, loop: true },
      jump_right: { frames: [13], rate: 1/10, flip: false },
      stand_right: { frames:[14], rate: 1/10, flip: false },
      duck_right: { frames: [15], rate: 1/10, flip: false },
    });
    */
    Q.animations("suit", {
      walk_right: {frames: [0,1,2,3], rate: 1/2, loop: true},
      jump_right: {frames: [4], rate: 1/2, flip: false },
      stand_right: {frames: [0], rate: 1/2, flip: false },
      duck_right: {frames: [5], rate: 1/2, flip: false }
    });
    Q.animations("shark", {
      swim_left: { frames: [0,1,2,3], rate: 1/5, loop: true}
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
