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
      sheet: "player",
      sprite: "player",
      collisionMask: SPRITE_BOX, 
      x: 40,
      y: 555,
      standingPoints: [ [ -16, 44], [ -23, 35 ], [-23,-48], [23,-48], [23, 35 ], [ 16, 44 ]],
      duckingPoints : [ [ -16, 44], [ -23, 35 ], [-23,-10], [23,-10], [23, 35 ], [ 16, 44 ]],
      speed: 0,
      jump: -700
    });

    this.p.points = this.p.standingPoints;

    this.add("2d, animation");
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

    if(Q.inputs['up'] && this.p.landed > 0) {
      this.p.vy = this.p.jump;
    } 

    this.p.points = this.p.standingPoints;
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

    this.stage.viewport.centerOn(this.p.x + 300, 400 );

  }
});

Q.Sprite.extend("Box",{
  init: function() {

    var levels = [ 565, 540, 500, 450 ];

    var player = Q("Player").first();
    this._super({
      x: player.p.x + Q.width + 50,
      y: levels[Math.floor(Math.random() * 3)],
      frame: Math.random() < 0.5 ? 1 : 0,
      scale: 2,
      type: SPRITE_BOX,
      sheet: "crates",
      vx: -600 + 200 * Math.random(),
      vy: 0,
      ay: 0,
      theta: (300 * Math.random() + 200) * (Math.random() < 0.5 ? 1 : -1)
    });


    this.on("hit");
  },

  step: function(dt) {
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
    /*
    this.p.type = 0;
    this.p.collisionMask = Q.SPRITE_NONE;
    this.p.vx = 200;
    this.p.ay = 400;
    this.p.vy = -300;
    this.p.opacity = 0.5;
    */
  }
  

});

Q.GameObject.extend("BoxThrower",{
  init: function() {
    this.p = {
      launchDelay: 0.75,
      launchRandom: 1,
      launch: 2
    }
  },

  update: function(dt) {
    this.p.launch -= dt;

    if(this.p.launch < 0) {
      this.stage.insert(new Q.Box());
      this.p.launch = this.p.launchDelay + this.p.launchRandom * Math.random();
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

Q.UI.Text.extend("OpeningTitle",{
  init: function(p) {
    this._super(p, {
      x: Q.width/2,
      y: Q.height/2,
      label: "Sharkwhirl"
    });
  },
  step: function(dt) {
    //this.p.x = this.stage.viewport.x + 100;
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

  stage.insert(new Q.Sky());

  stage.insert(new Q.BackgroundWall());

  stage.insert(new Q.BackgroundFloor());

  stage.insert(new Q.OpeningTitle());

  stage.insert(new Q.BoxThrower());

  stage.insert(new Q.Player());
  stage.add("viewport");

  Q.state.on("change.time",function() {
    var currTime = Q.state.get("time");
    switch(currTime) {
      case 1:
        Q.state.set("acc", 1);
        break;
      case 5:
        Q.state.set("acc", 0);
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
  
Q.load("SHARKWHIRL.mp3, blue.png, player.json, player.png, city.png, background-floor.png, crates.png, crates.json", function() {
    Q.compileSheets("player.png","player.json");
    Q.compileSheets("crates.png","crates.json");
    Q.animations("player", {
      walk_right: { frames: [0,1,2,3,4,5,6,7,8,9,10], rate: 1/15, flip: false, loop: true },
      jump_right: { frames: [13], rate: 1/10, flip: false },
      stand_right: { frames:[14], rate: 1/10, flip: false },
      duck_right: { frames: [15], rate: 1/10, flip: false },
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
