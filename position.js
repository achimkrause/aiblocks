class Position {
  constructor(){
    this.p0 = new Float32Array(2*11*9);
    this.p1 = new Float32Array(2*11*9);
    this.min_i = 5;
    this.max_i = 5;
    this.heights = [0,0,0,0,0,0,0,0,0,0,0];
    this.valid_moves = [{h:0,i:5,j:0}, {h:1,i:5,j:0}];
    this.result=null;
    this.flipped=false;
  }
  set(pos){
    this.p0.set(pos.p0);
    this.p1.set(pos.p1);
    this.min_i=pos.min_i;
    this.max_i=pos.max_i;
    for(let n=0; n<pos.heights.length; n++){
      this.heights[n]=pos.heights[n];
    }
    this.valid_moves=[];
    for(let n=0; n<pos.valid_moves.length; n++){
      this.valid_moves.push(pos.valid_moves[n]);
    }
    this.result=pos.result;
    this.flipped=pos.flipped;
  }
  copy(){
    let pos = new Position();
    pos.set(this);
    return pos;
  }
  move(move){
    let h = move.h;
    let i = move.i;
    let j = move.j;
    this.heights[i]+=1;
    this.heights[i+(h==0)]+=1;
    if(i<this.min_i){
      this.min_i = i;
    }
    if(i+(h==0) > this.max_i){
      this.max_i = i+(h==0);
    }
    this.p0[h*11*9 + i*9 + j] = 1.0;
    let shift = Math.floor((10 - this.min_i - this.max_i) / 2);
    this.min_i += shift;
    this.max_i += shift;
    if(shift>0){
      for(let n=2*11*9-1; n>=0; n--){
        if(n>=9*shift){
          this.p0[n] = this.p0[n-shift*9];
          this.p1[n] = this.p1[n-shift*9];
        }
        else{
          this.p0[n] = 0.0;
          this.p1[n] = 0.0;
        }
      }
      for(let n=11-1; n>=0;n--){
        if(n>=shift){
          this.heights[n]=this.heights[n-shift];
        }
        else{
          this.heights[n]=0;
        }
      }
    }
    else if(shift<0){
      for(let n=0; n<2*11*9; n++){
        if(n-9*shift<2*11*9){
          this.p0[n] = this.p0[n-9*shift];
          this.p1[n] = this.p1[n-9*shift];
        }
        else{
          this.p0[n] = 0.0;
          this.p1[n] = 0.0;
        }
      }
      for(let n=0; n<11;n++){
        if(n-shift<11){
          this.heights[n]=this.heights[n-shift];
        }
        else{
          this.heights[n]=0;
        }
      }
    }
    let tmp=this.p0;
    this.p0=this.p1;
    this.p1=tmp;
    this.flipped = !this.flipped;
    this._compute_valid_moves();
    this._detect_end(h,i+shift,j);
    if(this.result != null){
      this.valid_moves=[];
    }
  }
  _compute_valid_moves(){
    this.valid_moves = []
    if(this.max_i - this.min_i <= 6){
      if(this.p0[this.min_i*9] == 0){
        this.valid_moves.push({h:0, i: this.min_i-2, j:0});
      }
      if(this.p0[(this.max_i-1)*9] == 0){
        this.valid_moves.push({h:0, i: this.max_i+1, j:0});
      }
    }
    if(this.max_i - this.min_i <=7){
      this.valid_moves.push({h:1, i: this.min_i-1, j:0});
      this.valid_moves.push({h:1, i: this.max_i+1, j:0});
    }
    for(let i=this.min_i; i<=this.max_i; i++){
      let j=this.heights[i];
      if(i<10 && j<=8 && this.heights[i+1]==j && (i<=1 || this.p0[(i-2)*9+j]==0) && (i>=7 || this.p0[(i+2)*9+j]==0)){
        this.valid_moves.push({h:0,i:i, j:j});
      }
      if(j<=7 && (j<=1 || this.p0[11*9+i*9+j-2]==0)){
        this.valid_moves.push({h:1,i:i,j:j});
      }
    }
  }
  _check_pos(x,y){
    if(x<0 || x>10 || y<0 || y>8){
      return false;
    }
    if(this.p1[x*9+y]==1){
      return true;
    }
    if(this.p1[11*9+x*9+y]==1){
      return true;
    }
    if(x>0 && this.p1[(x-1)*9+y]==1){
      return true;
    }
    if(y>0 && this.p1[11*9+x*9+y-1]==1){
      return true;
    }
    return false;
  }
  _check_lines(x,y){
    let dircounts = [0,0,0,0,0,0,0,0];
    for(let n=1; n<=4; n++){
      if(!this._check_pos(x+n,y)){
        break;
      }
      dircounts[0]+=1;
    }
    for(let n=1; n<=4; n++){
      if(!this._check_pos(x+n,y+n)){
        break;
      }
      dircounts[1]+=1;
    }
    for(let n=1; n<=4; n++){
      if(!this._check_pos(x,y+n)){
        break;
      }
      dircounts[2]+=1;
    }
    for(let n=1; n<=4; n++){
      if(!this._check_pos(x-n,y+n)){
        break;
      }
      dircounts[3]+=1;
    }
    for(let n=1; n<=4; n++){
      if(!this._check_pos(x-n,y)){
        break;
      }
      dircounts[4]+=1;
    }
    for(let n=1; n<=4; n++){
      if(!this._check_pos(x-n,y-n)){
        break;
      }
      dircounts[5]+=1;
    }
    for(let n=1; n<=4; n++){
      if(!this._check_pos(x,y-n)){
        break;
      }
      dircounts[6]+=1;
    }
    for(let n=1; n<=4; n++){
      if(!this._check_pos(x+n,y-n)){
        break;
      }
      dircounts[7]+=1;
    }
    for(let n=0; n<4;n++){
      if(dircounts[n]+dircounts[n+4]>=4){
        return true;
      }
    }
    return false;
  }
  _detect_end(h,i,j){
    if(this._check_lines(i,j) || this._check_lines(i+(h==0),j+(h==1))){
      this.result=-1;
      return
    }
    if(this.valid_moves.length==0){
      let count=0;
      for(let n=0;n<this.p0.length;n++){
        if(this.p0[n]==1){
          count+=1;
        }
      }
      if(count==20){
        this.result=0;
      }
      else{
        this.result=-1;
      }
      return
    }
  }
}


