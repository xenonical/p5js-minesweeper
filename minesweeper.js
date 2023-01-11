/* p5.js minesweeper clone, pretty self explanatory. hold "f" to place a flag, 
 * controls are otherwise as you'd expect.
 * kinda janky but i did my best :-P
 */

let wSlider = document.getElementById("width");
let hSlider = document.getElementById("height");
let mSlider = document.getElementById("mines");
let fieldWidth;
let fieldHeight;
let numMines;
let numFlags;
let tilesLeft;
let tileSize;
let field = [];
let cursorX;
let cursorY;
let clock;
let gameState = 0;

function setup() {
  initTiles();
  document.getElementById("dWidth").innerHTML = fieldWidth;
  document.getElementById("dHeight").innerHTML = fieldHeight;
  document.getElementById("dMines").innerHTML = document.getElementById("mines").value;
  document.getElementById("numMines").innerHTML = floor(wSlider.value*hSlider.value*(mSlider.value/100));
  textAlign(CENTER, CENTER);
  frameRate(30);
  
}

function draw() {
  
  document.getElementById("minesLeft").innerHTML = numMines-numFlags;
  if(gameState==0) {
    document.getElementById("clock").innerHTML = clock;
  }
  if((frameCount+1)%30==0&&field.find(f => !f.isCovered)!=undefined) {
    clock++;
  }
  background(220);
  stroke(220);
  strokeWeight(tileSize/10);
  textSize(tileSize);
  for(let f of field) {
    f.uncoverNeighbors(false);
    f.draw();
  }
  if(tilesLeft==0) {
    gameState = 1;
  }
  if(gameState==0) {
    drawCursor();
  }
}

// slider updaters
wSlider.oninput = function() {
  document.getElementById("dWidth").innerHTML = this.value;
  document.getElementById("numMines").innerHTML = floor(wSlider.value*hSlider.value*(mSlider.value/100));
}
hSlider.oninput = function() {
  document.getElementById("dHeight").innerHTML = this.value;
  document.getElementById("numMines").innerHTML = floor(wSlider.value*hSlider.value*(mSlider.value/100));
}
mSlider.oninput = function() {
  document.getElementById("dMines").innerHTML = this.value;
  document.getElementById("numMines").innerHTML = floor(wSlider.value*hSlider.value*(mSlider.value/100));
}

// creates a field of fieldWidth by fieldHeight tiles with numMines mines, updates field size.
function initTiles() {
  gameState = -2;
  fieldWidth = wSlider.value;
  fieldHeight = hSlider.value;
  numMines = floor(fieldWidth*fieldHeight*(mSlider.value/100));
  clock = 0;
  createField();
  if(window.innerWidth/fieldWidth>window.innerHeight/fieldHeight) {
    tileSize = floor((window.innerHeight*0.8)/fieldHeight);
  }
  else {
    tileSize = floor((window.innerWidth*0.8)/fieldWidth); 
  }
  createCanvas(fieldWidth*tileSize, fieldHeight*tileSize);
  cursorX = floor(mouseX / tileSize);
  cursorY = floor(mouseY / tileSize);
  gameState = 0;
}

// creates a field of fieldWidth by fieldHeight tiles with numMines mines
function createField() {
  let m = numMines;
  let t = fieldWidth*fieldHeight;
  let r;
  numFlags = 0;
  tilesLeft = fieldWidth*fieldHeight-numMines;
  field = [];
  for(let x=0;x<fieldWidth;x++) {
    for(let y=0;y<fieldHeight;y++) {
      r = random(0,t);
      if(r<m) {
        field.push(new Tile(x,y,1));
        m--;
        t--;
      }
      else {
        field.push(new Tile(x,y,0));
        t--;
      }
    }
  }
  for(let f of field) {
    f.checkNeighbors();
  }
}

// draws a gray cursor where the mouse is
function drawCursor() {
  cursorX = floor(mouseX / tileSize);
  cursorY = floor(mouseY / tileSize);
  if(mouseIsPressed) {
  fill(0,0,0,50);
  }
  else {
    fill(0,0,0,25);
  }
  rect(cursorX*tileSize,cursorY*tileSize,tileSize,tileSize, tileSize/6);
}

// flags/uncovers tiles when mouse is clicked
function mouseClicked() {
  let t = field.find(tile => tile.x==cursorX&&tile.y==cursorY);
  // flags/unflags tiles
  if(keyIsDown(70)) {
    if(t.isFlagged||!t.isCovered) {
      t.isFlagged = false;
      numFlags--;
    }
    else {
      t.isFlagged = true;
      numFlags++;
    }
  }
  // uncovers 
  else if(cursorX>=0&&cursorX<fieldWidth&&cursorY>=0&&cursorY<fieldHeight&&!t.isFlagged&&gameState==0) {
    if(t.isCovered==false&&t.flagNeighbors()==t.numNeighbors) {
      t.uncoverNeighbors(true);
    }
    t.uncover();
  }
}

// resizes canvas and tiles when window is resized
function windowResized() {
  if(window.innerWidth/fieldWidth>window.innerHeight/fieldHeight) {
    tileSize = floor((window.innerHeight*0.8)/fieldHeight);
  }
  else {
    tileSize = floor((window.innerWidth*0.8)/fieldWidth); 
  }
  resizeCanvas(fieldWidth*tileSize, fieldHeight*tileSize);
}

// tile class
class Tile {
  constructor(x,y,isMine) {
    this.x = x;
    this.y = y;
    this.isMine = isMine;
    this.isCovered = true;
    this.isFlagged = false;
    this.numNeighbors = 0;
  }
  // draws the tile on the canvas
  draw() {
    if(this.isCovered&&(gameState==0||this.isMine==0)) {
      fill(150, 150, 150);
    }
    else if(this.isMine==1) {
      if(gameState==1) {
        fill(63,63,255);
      }
      else {
        fill(255,63,63);
      }
    }
    else {
      fill(220);
    }
    rect(this.x*tileSize,this.y*tileSize,tileSize,tileSize,tileSize/6);
    if(this.numNeighbors>0&&!this.isCovered) {
        colorMode(HSB);
        fill(255 - (this.numNeighbors ** 1.5 + this.numNeighbors * 29), 100, 75);
        text(this.numNeighbors, (this.x + 0.5) * tileSize, (this.y + 0.61) * tileSize);
        colorMode(RGB);
    }
    if(this.isFlagged&&gameState==0&&this.isCovered) {
      fill(220);
      noStroke();
      text("!", (this.x + 0.5) * tileSize, (this.y + 0.61) * tileSize);
      stroke(220);
    }
  }
  // checks the number of mines surrounding a tile
  checkNeighbors() {
    this.numNeighbors = 0;
    let t;
    if(this.isMine==1) {
      this.numNeighbors = -1;
    }
    else {
      if(this.x>0) {
        t = field.find(tile => tile.x==this.x-1&&tile.y==this.y);
        this.numNeighbors+=t.isMine;
        if(this.y>0) {
          t = field.find(tile => tile.x==this.x-1&&tile.y==this.y-1);
          this.numNeighbors+=t.isMine;
        }
        if(this.y<fieldHeight-1) {
          t = field.find(tile => tile.x==this.x-1&&tile.y==this.y+1);
          this.numNeighbors+=t.isMine;
        }
      }
      if(this.x<fieldWidth-1) {
        t = field.find(tile => tile.x==this.x+1&&tile.y==this.y);
        this.numNeighbors+=t.isMine;
        if(this.y>0) {
          t = field.find(tile => tile.x==this.x+1&&tile.y==this.y-1);
          this.numNeighbors+=t.isMine;
        }
        if(this.y<fieldHeight-1) {
          t = field.find(tile => tile.x==this.x+1&&tile.y==this.y+1);
          this.numNeighbors+=t.isMine;
        }
      }
      if(this.y>0) {
        t = field.find(tile => tile.x==this.x&&tile.y==this.y-1);
        this.numNeighbors+=t.isMine;
      }
      if(this.y<fieldHeight-1) {
        t = field.find(tile => tile.x==this.x&&tile.y==this.y+1);
        this.numNeighbors+=t.isMine;
      }
    }
  }
  // checks the number of neighboring flags to a tile
  flagNeighbors() {
    let t;
    let f = 0;
      if(this.x>0) {
        t = field.find(tile => tile.x==this.x-1&&tile.y==this.y);
        if(t.isFlagged) {
          f+=1;
        }
        if(this.y>0) {
          t = field.find(tile => tile.x==this.x-1&&tile.y==this.y-1);
          if(t.isFlagged) {
            f+=1;
          }
        }
        if(this.y<fieldHeight-1) {
          t = field.find(tile => tile.x==this.x-1&&tile.y==this.y+1);
          if(t.isFlagged) {
            f+=1;
          }
        }
      }
      if(this.x<fieldWidth-1) {
        t = field.find(tile => tile.x==this.x+1&&tile.y==this.y);
        if(t.isFlagged) {
          f+=1;
        }
        if(this.y>0) {
          t = field.find(tile => tile.x==this.x+1&&tile.y==this.y-1);
          if(t.isFlagged) {
          f+=1;
          }
        }
        if(this.y<fieldHeight-1) {
          t = field.find(tile => tile.x==this.x+1&&tile.y==this.y+1);
          if(t.isFlagged) {
          f+=1;
          }       
        }
      }
      if(this.y>0) {
        t = field.find(tile => tile.x==this.x&&tile.y==this.y-1);
        if(t.isFlagged) {
          f+=1;
        }
      }
      if(this.y<fieldHeight-1) {
        t = field.find(tile => tile.x==this.x&&tile.y==this.y+1);
        if(t.isFlagged) {
          f+=1;
        }
      }
     return f;
    }
  // uncovers tile
  uncover() {
    // if no tiles are uncovered and the tile clicked is a flag, run failsafe
    if(field.find(f => !f.isCovered)==undefined) {
      while(field.find(f => f.x==this.x&&f.y==this.y&&f.isMine)!=undefined) {
        createField();
      }
      field.find(f => f.x==this.x&&f.y==this.y).isCovered = false;
      tilesLeft--;
    }
    else if(!this.isFlagged) {
      // if tile is covered, uncover it
      if(this.isCovered) {
        tilesLeft--;
      }
      this.isCovered = false;
      // if tile is a mine, end the game
      if(this.isMine) {
        gameState = -1;
      }
    }
  }
  // uncovers surrounding tiles if a tile has no neighboring mines. hasAllFlags ensures that mines won't be unintentionally uncovered when function is called by mouseClicked 
  uncoverNeighbors(hasAllFlags) {
    if((this.numNeighbors == 0&&!this.isCovered)||hasAllFlags) {
      let t;
      if(this.x>0) {
        t = field.find(tile => tile.x==this.x-1&&tile.y==this.y);
        t.uncover();
        if(this.y>0) {
          t = field.find(tile => tile.x==this.x-1&&tile.y==this.y-1);
          t.uncover();
        }
        if(this.y<fieldHeight-1) {
          t = field.find(tile => tile.x==this.x-1&&tile.y==this.y+1);
          t.uncover();
        }
      }
      if(this.x<fieldWidth-1) {
        t = field.find(tile => tile.x==this.x+1&&tile.y==this.y);
        t.uncover();
        if(this.y>0) {
          t = field.find(tile => tile.x==this.x+1&&tile.y==this.y-1);
          t.uncover();
        }
        if(this.y<fieldHeight-1) {
          t = field.find(tile => tile.x==this.x+1&&tile.y==this.y+1);
          t.uncover();        
        }
      }
      if(this.y>0) {
        t = field.find(tile => tile.x==this.x&&tile.y==this.y-1);
        t.uncover();
      }
      if(this.y<fieldHeight-1) {
        t = field.find(tile => tile.x==this.x&&tile.y==this.y+1);
        t.uncover();
      }
    }
  }
}