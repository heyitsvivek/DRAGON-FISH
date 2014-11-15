/*

   TODO:
  
      Make a new MAT object that can easily create and keep track of all materials


  The Level does the following:

    - Begins Loading:
      - Handles loading of all the neccesary assests, including audio
      and models
      - called when previous level is initialized

    - Instansiate
      - Handles creation of neccesary meshes, including the creation of
      the path, creation of the crystal, creation of the skybox, creation
      of the stones, and creation of hook
      - called when finished loading

    - Initialize
      - Handles the adding of the objects to the scene that are neccesary
      to guide the user to the level, AKA, the Path, the Stones and the skybox
      -called when the previous level is completed

    - onStart
      - Handles adding hooks, and activating the level
      - Called when user reaches the center of this level and activates its crystal

    - Update
      - After the level is initialized, but not started, the update checks for
        removing the unused parts of the vertabrae, as well as looking for the
        distance to the crystal to see if it starts, and updates the path
      - Once the level is started, update takes care of updating all of the loops


*/
function Level( name , dragonFish , params ){

  this.name = name;
  this.params = params;

  this.newTypes = params.newTypes || [];
  this.oldTypes = params.oldTypes || [];


  this.lightUncertainty = params.lightUncertainty;
  this.dead = false;
  this.deathStarted = false;

  
  this.totalNeededToLoad = 0;
  this.totalLoaded = 0;
  this.fullyLoaded  = false;
  this.prepared     = false;
  this.crystalAdded = false;
  this.active = false;

    this.firstHook = false;
  
  this.startScore = 0;
  this.restartScore = 0;
  this.currentScore = 0;
  this.endScore = 0;
  this.length = 0;



  this.dragonFish = dragonFish;
  this.scene = new THREE.Object3D();

  this.scene.position.copy( params.position );


  this.hooksOnDeck = [];

  this.hooks = [];
  this.hookedHooks = [];


  this.allHooks = [];

}





/*
 
   LOADING LOADING LOADING LOADING LOADING LOADING LOADING LOADING LOADING LOADING LOADING LOADING LOADING LOADING LOADING LOADING LOADING LOADING LOADING LOADING LOADING LOADING LOADING LOADING LOADING LOADING LOADING LOADING LOADING LOADING LOADING LOADING LOADING LOADING LOADING LOADING LOADING LOADING LOADING LOADING LOADING LOADING LOADING LOADING LOADING LOADING 

*/

// Does the heavy lifting of Loading all the audio
Level.prototype.beginLoading = function(){


  for( var i = 0; i < this.params.path.notes.length; i++ ){

    this.loadNote(  this.params.path.notes[i] );

  }
 
  this.loadNote(  this.params.death.note );
  this.loadGeo(  this.params.death.geo );
  this.loadLoop( this.params.death.loop );

  this.loadGeo(   this.params.path.markerGeo  );  
  this.loadNote(  this.params.note            ); 
  this.loadLoop(  this.params.ambient         ); 
 
  console.log( 'AMBINES' );
  console.log( this.params );
  console.log( this.params.ambient );
  this.loadNote(  this.params.skybox.note     ); 
  this.loadGeo(   this.params.skybox.geo      );
  
  this.loadGeo(   this.params.crystal.geo     );
  this.loadGeo(   this.params.stones.geo     );

  for( var i = 0; i < this.newTypes.length; i++ ){

    // Loading Loops
    var loopName = this.newTypes[i].loop;
    this.loadLoop( loopName ); 
    // Loading Notes
    var noteName = this.newTypes[i].note;
    this.loadNote( noteName );

    // LoadingGeometry
    var geoName = this.newTypes[i].geo;
    this.loadGeo( geoName );

  }



}

Level.prototype.loadNote = function( noteName ){

  if( !NOTES[noteName] ){
   
    NOTES[noteName] == 'LOADING';

    var newName = 'audio/notes/' + noteName + '.mp3';

    this.totalNeededToLoad ++;
    var note = new LoadedAudio( audioController , newName ,{
      looping: false
    });

    var nn2 = noteName;
    note.onLoad = function(){
      this.onLoad();
    }.bind( this );

    NOTES[ noteName ] = note;

  }

}

Level.prototype.loadLoop = function( loopName ){
    
  if( !LOOPS[loopName] ){
     
    LOOPS[loopName] == 'LOADING';

    var newName = 'audio/loops/' + loopName + '.mp3';

    this.totalNeededToLoad ++;
    var loop = new LoadedAudio( audioController , newName ,{
      looping: true
    });

    loop.onLoad = function(){
      this.onLoad();
    }.bind( this );

    LOOPS[ loopName ] = loop;

  }

}

Level.prototype.loadGeo = function( geoName ){
 
  if( typeof geoName !== 'string' ){

    return;

  }

 // this.totalNeededToLoad ++;

  if( geoName && !GEOS[geoName] ){
    
    GEOS[geoName] == 'LOADING';
    var newName = 'models/' + geoName + '.obj'; 
    this.totalNeededToLoad ++;

    loader.OBJLoader.load( newName , function( object ){
      object.traverse( function ( child ) {
          if ( child instanceof THREE.Mesh ) {
            GEOS[geoName] = child.geometry;     
            GEOS[geoName].computeFaceNormals();
            GEOS[geoName].computeVertexNormals();
           // assignUVs( GEOS[geoName] );
           
            var m = new THREE.Mesh( GEOS[geoName] , new THREE.MeshNormalMaterial() );
            m.scale.multiplyScalar( .00001 );
            this.scene.add( m );
          }
      });

      this.onLoad();

    }.bind( this ));

  }

  if( GEOS[ geoName] ){
   //   this.onLoad();
  }

}



Level.prototype.onLoad = function(){
 
  this.totalLoaded ++;

  if( this.totalLoaded == this.totalNeededToLoad ){

    this.fullyLoaded = true;

    this.instantiate();

  }

}



/*

   INSTANTIATE INSTANTIATE INSTANTIATE INSTANTIATE INSTANTIATE INSTANTIATE INSTANTIATE INSTANTIATE INSTANTIATE INSTANTIATE INSTANTIATE INSTANTIATE INSTANTIATE INSTANTIATE INSTANTIATE INSTANTIATE INSTANTIATE INSTANTIATE INSTANTIATE INSTANTIATE INSTANTIATE INSTANTIATE INSTANTIATE INSTANTIATE INSTANTIATE INSTANTIATE INSTANTIATE INSTANTIATE INSTANTIATE INSTANTIATE INSTANTIATE INSTANTIATE INSTANTIATE 

*/


Level.prototype.instantiate = function(){


  this.note = NOTES[ this.params.note ];
  

  var l = this.newTypes.length;
  if( levelDebug ) l = 2;
  for( var  i = 0; i < l; i++ ){

    var loop  = LOOPS[ this.newTypes[i].loop ];
    var note  = NOTES[ this.newTypes[i].note ];
    var geo   = GEOS[  this.newTypes[i].geo  ];

    var mat = this.newTypes[i].mat
    if( typeof this.newTypes[i].mat === 'string' ){
      mat = MATS[ this.newTypes[i].mat ].clone();
    }



    var hooks = this.newTypes[i].instantiate( this , this.dragonFish, note ,loop , geo , mat );

    for( var j = 0; j < hooks.length; j++ ){

      this.hooksOnDeck.push( hooks[j] );

    }

  }


  looper.onNextLoop( this.startLoops.bind( this ) );

  // TODO
  /*
    this.createStones();
  */
 
  this.createDeath();
  this.createStones();
  this.createCrystal();
  this.createSkybox();
  this.createPath();

  this.prepared = true;

  this.onPrepared();
}



Level.prototype.onPrepared = function(){}

Level.prototype.startLoops = function(){

  for( var i = 0; i < this.newTypes.length; i++ ){

    var loop = LOOPS[ this.newTypes[i].loop ];

    if( !loop.playing ){

      loop.play();
      loop.gain.gain.value = 0;

    }


  }

}


Level.prototype.createStones = function(){

  this.stones = this.params.stones.init( GEOS[ this.params.stones.geo ] )

}

Level.prototype.createDeath = function(){

  this.death = {};
  this.death.loop = LOOPS[ this.params.death.loop ];
  this.death.note = NOTES[ this.params.death.note ];
  this.death.geo = GEOS[ this.params.death.geo ];
  this.death.mat = MATS[ this.params.death.mat ].clone();

  this.death.speed    = this.params.death.speed || 1;
  this.death.distance = this.params.death.distance || 100;
  this.death.follow   = this.params.death.follow || 1;

  if( this.death.mat.uniforms ){
    if( this.death.mat.uniforms.t_audio ) this.death.mat.uniforms.t_audio.value = audioController.texture;
    if( this.death.mat.uniforms.t_normal ){
      
      console.log('DAETHS');
      console.log( MATS.textures.normals.moss );
      this.death.mat.uniforms.t_normal.value = MATS.textures.normals.moss;

    }
    if( this.death.mat.uniforms.displacement ) this.death.mat.uniforms.displacement.value = .1;
  }
  this.death.mat.color= new THREE.Color( this.params.death.color );

  this.death.mesh = new THREE.Mesh( this.death.geo , this.death.mat );
  this.death.mesh.scale.multiplyScalar( this.params.death.scale );

  this.death.mesh.position.copy(this.params.death.position);

  if( !this.death.loop.playing ){

    this.death.loop.play();
    this.death.loop.gain.gain.value = 0;

  }

  this.death.plume = []

  if( this.params.death.plumeGeos ){
    
    for( var i = 0; i < this.params.death.plumeGeos.length; i++ ){

      var p = this.params.death;
      var geo = GEOS[p.plumeGeos[i]];
      var mat = MATS[p.plumeMats[i]].clone();

      if( mat.uniforms ){

        if( mat.uniforms.t_audio ) mat.uniforms.t_audio.value = audioController.texture;

      }
      var scale = p.plumeScales[i];

      var m = new THREE.Mesh( geo , mat );
      m.scale.multiplyScalar( scale );
      //console.log( m );
      this.death.plume.push( m );

    }

  }

}
Level.prototype.createSkybox = function(){

  var g = GEOS[this.params.skybox.geo];
  
  this.skybox = this.params.skybox.init( g );

}

Level.prototype.createCrystal = function(){

  if( !this.params.crystal.init ){
    
    var g = this.params.crystal.geo;
    var m = this.params.crystal.mat;


    // Overwrite if its a loaded geo 
    if( typeof this.params.crystal.geo === 'string' ){
      g = GEOS[this.params.crystal.geo];
    }
    if( typeof this.params.crystal.mat === 'string' ){
      m = MATS[this.params.crystal.mat].clone();
    }

    if( m.uniforms ){
      if( m.uniforms.t_audio ) m.uniforms.t_audio.value = audioController.texture;
      if( m.uniforms.displacement ) m.uniforms.displacement.value = this.params.crystal.displacement || .0001;
      if( m.uniforms.t_normal ) m.uniforms.t_normal.value = MATS.textures.normals.moss;
      if( m.uniforms.t_sem ) m.uniforms.t_sem.value = MATS.textures.sem.metal;
    }

    this.crystal = new THREE.Mesh( g , m );


  }else{
    
    this.crystal = this.params.crystal.init();

  }

  this.crystal.scale.multiplyScalar( this.params.crystal.scale );
  this.crystal.scale.multiplyScalar( 10 );
  //this.crystal.position.z = 2;

  this.crystal.size = this.params.crystal.size || 4;
  if( this.params.crystal.rotation ){
    this.crystal.rotation.copy( this.params.crystal.rotation );
  }
  if( this.params.crystal.position ){
    this.crystal.position.copy( this.params.crystal.position);
  }

}

Level.prototype.createPath = function(){

  var oPos;
  if( this.oldLevel ){
    oPos = this.oldLevel.scene.position;
  }else{
    oPos = new THREE.Vector3();
  }

  var pos = this.scene.position;

  var pathGeo = this.params.path.createGeometry( oPos , pos );

  var markers = [];

  for( var i = 0; i < pathGeo.vertices.length; i++ ){

  
    var g = GEOS[this.params.path.markerGeo];
    var m = this.params.path.markerMat;
    var mesh = new THREE.Mesh( g , m );

    mesh.position = pathGeo.vertices[i];

    mesh.scale.multiplyScalar( this.params.path.markerScale );

    if( i == pathGeo.vertices.length -1 ){

      mesh.scale.multiplyScalar( .01 );

    }
    markers.push( mesh );

  }

  var notes = [];
  for( var i = 0; i < this.params.path.notes.length; i++ ){

    var note = NOTES[ this.params.path.notes[i] ];
    notes.push( note );

  }
 
  this.path = {};

  this.path.notes = notes;
  this.path.update = this.params.path.update;
  this.path.scene = this.scene;
  this.path.dragonFish = this.dragonFish;
  this.path.guides = this.params.path.createGuides();
  this.path.markers = markers;


}







/*
 

   INITIALIZATION INITIALIZATION INITIALIZATION INITIALIZATION INITIALIZATION INITIALIZATION INITIALIZATION INITIALIZATION INITIALIZATION INITIALIZATION INITIALIZATION INITIALIZATION INITIALIZATION INITIALIZATION INITIALIZATION INITIALIZATION INITIALIZATION INITIALIZATION INITIALIZATION INITIALIZATION INITIALIZATION INITIALIZATION INITIALIZATION INITIALIZATION INITIALIZATION INITIALIZATION INITIALIZATION INITIALIZATION INITIALIZATION INITIALIZATION INITIALIZATION INITIALIZATION   


*/


Level.prototype.initialize = function(){

  scene.add( this.scene );

 // this.startText = new PhysicsText( this.params.startText );
 // this.deathText = new PhysicsText( this.params.deathText );

  if( !this.fullyLoaded || !this.prepared ){

    console.log( 'TOTALLY FUCKED' );

  }else{

    this.startScore   = SCORE;
    this.currentScore = 0;
    this.length       = this.hooksOnDeck.length;

    this.addPath();
    this.addSkybox();
    this.prepareVertabraeForDestruction();

    this.scene.add( this.crystal );
    this.scene.add( this.stones );
    this.crystalAdded = true;


    console.log('STARSTS');
    console.log(  LOOPS[ this.params.ambient ] );

    LOOPS[ this.params.ambient ].play();
    LOOPS[ this.params.ambient ].gain.gain.value = 0;
    var gainNode = LOOPS[ this.params.ambient ].gain;
    var t = audioController.ctx.currentTime;
    gainNode.gain.linearRampToValueAtTime(0, audioController.ctx.currentTime  );
    gainNode.gain.linearRampToValueAtTime(.5,  audioController.ctx.currentTime  + 10 ); 

    if( this.nextLevel ){

      this.nextLevel.beginLoading();
    }

  }

}


Level.prototype.prepareVertabraeForDestruction = function(){

  var from;

  if( this.oldLevel ){
    from = this.oldLevel.scene.position.clone();

    var oldH = this.oldLevel.hookedHooks;
    for( var i = 0; i < oldH.length; i++ ){
      //oldH[i].level = this;
      this.hookedHooks.push( oldH[i] );
    }



  }else{
    from = new THREE.Vector3();
  }
  this.distanceFromPreviousLevel = from.sub( this.scene.position ).length();
    //TODO: Make sure this works
  // Remove any unnecchesary hooks
  for( var i = 0; i < this.dragonFish.spine.length; i++ ){

    var verta = this.dragonFish.spine[i];
    var saved = false;

    if(  !verta.type || verta.type === 'alwaysSafe' ){
      saved = true;
      if( verta.type === 'alwaysSafe' ){
        console.log( 'WHY THE ACTUAL FUCK DOES THIS EXIST?!??!' );
        console.log( verta );
      }
    }
    for( var j = 0; j < this.oldTypes.length; j++ ){

      //console.log('VERTA TYPE' );
      //console.log( verta.type );
      //console.log( this.oldTypes[j] );
      if( verta.type == this.oldTypes[j] ){
        saved = true;      
      }
    }

    if( !saved ){

     // console.log( 'NOT SAVED' );
      verta.percentToDestruction = .5 + Math.random() * .4;
        //this.dragonFish.removeVertabraeById( i );
        
    }else{

     // console.log( 'SAVED' );

    }

  }

}

Level.prototype.addSkybox = function(){

  var marker = this.skybox;

  this.scene.add( this.skybox );
  if( this.skybox.gem ) this.skybox.gem.active = true;

  marker.init = { scale: 0 };
  marker.target = { scale: marker.scale.x };

  var tween = new TWEEN.Tween( marker.init ).to( marker.target , 500 );

  tween.easing( TWEEN.Easing.Quartic.In )

  tween.marker = marker;
  tween.note   = NOTES[ this.skybox.note ];

  tween.onUpdate( function(){

    this.scale.x = this.init.scale;
    this.scale.y = this.init.scale;
    this.scale.z = this.init.scale;

  }.bind( marker ));

  tween.onComplete( function(){
   // console.log( 'NOTE PLAYEd');
    //tween.note.play();
  }.bind( tween ));

  tween.start();

}


Level.prototype.addPath = function(){


  for( var i = 0; i < this.path.guides.length; i++ ){

    scene.add( this.path.guides[i] );

  }

  for( var  i = 0; i < this.path.markers.length; i++ ){

    var marker = this.path.markers[i];

    scene.add( marker );

  
    marker.init = { scale: 0 };
    marker.target = { scale: marker.scale.x };

    var tween = new TWEEN.Tween( marker.init ).to( marker.target , (i+1) * 1000 );

    tween.easing( TWEEN.Easing.Quartic.In )
  
    tween.marker = marker;
    tween.note   = this.path.note;

    tween.onUpdate( function(){

      this.scale.x = this.init.scale;
      this.scale.y = this.init.scale;
      this.scale.z = this.init.scale;

    }.bind( marker ));

    tween.onComplete( function(){
      //tween.note.play();
    }.bind( tween ));

    tween.start();



  }

}





/*

   START START START START START START START START START START START START START START START START START START START START START START START START START START START START START START START START START START START START START START START START START START START START START START START START START START START START START START START START START START 

*/


Level.prototype.onStart = function(){

  if( this.params.credits === true ){

   // starMap.material.map = MATS.textures.starMapWhite
    starMap.material = new THREE.MeshBasicMaterial({
      color:0xffffff,
      side: THREE.BackSide,
      depthWrite: false
    });
    starMap.materialNeedsUpdate = true;

    var b = new THREE.MeshBasicMaterial({ color:0x000000 });
    var cab = new THREE.Mesh( GEOS['logoGeo'] , b );
    cab.position.z = 3990;
    cab.scale.multiplyScalar( 6 );
    scene.add( cab );

    /*MATS.clueLine.blending = THREE.NoBlending;
    MATS.clueLine.transparent = false;
    MATS.clueLine.needsUpdate = true;*/
   // MATS.clueLine.
   // MATS.clueLine.tranparent
  }
  // puts the crystal on the head of the dragonfish
  scene.remove( this.crystal );

  //this.startText.activate();

  this.crystal.scale.multiplyScalar( .16 );
  // out with the old, in with the new
  if( this.oldLevel ){
    this.oldLevel.removeSkybox();
    this.oldLevel.removeStones();
    this.oldLevel.death.loop.playing = false;
  }

  for( var i =0; i < this.hookedHooks.length; i++ ){

    this.hookedHooks[i].level = this;

  }

  this.restartScore = this.startScore - this.hookedHooks.length;

  for( var i= 0; i < dragonFish.leader.body.children.length; i++){
    var c = dragonFish.leader.body.children[i];
    dragonFish.leader.body.remove( c );
  }

  this.crystal.position.z = 1
  
  dragonFish.leader.body.add( this.crystal );

  this.note.gain.gain.vaue = .1;
  this.note.play();
    this.note.gain.gain.value = .1;
  

  this.removePath();

  this.checkForNewHooks( this.currentScore );

 // this.startHooks();

  this.active = true;



}


Level.prototype.startDeath = function(){

  console.log( 'DEATH START' );
  this.deathStarted = true;
  //this.deathText.activate();

  soulSucker.beingChased.value = 1; 
  for( var i= 0; i < deathDragon.leader.body.children.length; i++){
    var c = deathDragon.leader.body.children[i];
    deathDragon.leader.body.remove( c );
  }

  deathDragon.leader.body.add( this.death.mesh );

  deathDragon.removePlume();
 

  var p = this.death.plume;
  
  var p1 = p[0];
  var p2 = p[1];
  var p3 = p[2];
  var p4 = p[3];

  if( this.params.death.plumeGeos ){

     deathDragon.initPlume( p1 , p2 , p3 , p4  );


  }else{
  //deathDragon.initPlume( undefined , p2 , p3);
    deathDragon.initPlume();

  }

  deathDragon.bait.position.copy( dragonFish.bait.position );
 
  var x =( Math.random() - .5 );
  var y =( Math.random() - .5 );
  var z =( Math.random() - .5 );

  var dir = new THREE.Vector3( 0, 0, -1 );
  dir.applyQuaternion( camera.quaternion );
  dir.multiplyScalar( this.death.distance );


  deathDragon.bait.position.add( dir );

  
  deathDragon.attack();

  /* HACKED */

  //setTimeout( function(){
 //   console.log( 'yes');

  /*

     Making sure everything arrives together
  */
  deathDragon.recursiveCall( deathDragon.leader , function( three , obj ){
    obj.velocity.set( 0 , 0 , 0 );
  });

  deathDragon.recursiveCall( deathDragon.leader , function( three , obj ){
    obj.position.copy( deathDragon.bait.position );
  });




 /* deathDragon.recursiveCall( deathDragon.plumeBabies[1] , function( obj ){
    obj.position.copy( deathDragon.bait.position );
  });
  

  deathDragon.recursiveCall( deathDragon.plumeBabies[2] , function( obj ){
    obj.position.copy( deathDragon.bait.position );
  });*/


}
Level.prototype.startHooks = function(){


  for( var i =0; i < this.hooks.length; i++ ){

    var hook = this.hooks[i];

    this.dragonFish.addToScene( hook.vertabrae );
    hook.activate();
  //  this.dragonFish.addToScene( hook.vertabrae );
  //  this.dragonFish.addToScene( hook.vertabrae );
    //setTimeout( function(){
   // }.bind( this ) , 1000 )

  }


}

Level.prototype.removeSkybox = function(){

    var marker = this.skybox;

    //scene.add( marker );

 
    //console.log( this.skybox );
    marker.init = { scale: marker.scale.x };
    marker.target = { scale: 0 };

    var tween = new TWEEN.Tween( marker.init ).to( marker.target , 1000 );

    tween.easing( TWEEN.Easing.Quartic.In )
  
    tween.marker = marker;
    tween.note   = this.path.note;

    tween.onUpdate( function(){

      this.scale.x = this.init.scale;
      this.scale.y = this.init.scale;
      this.scale.z = this.init.scale;

    }.bind( marker ));

    tween.onComplete( function(){
      scene.remove( this ); 
    }.bind( marker ));

    tween.start();




}

Level.prototype.removeStones = function(){

  this.scene.remove( this.stones );

}

//TODO:
//Not ACtually removing?
Level.prototype.removePath = function(){


  for( var  i = 0; i < this.path.markers.length; i++ ){

    var marker = this.path.markers[i];

    marker.init = { scale: marker.scale.x };
    marker.target = { scale: 0 };

    var tween = new TWEEN.Tween( marker.init ).to( marker.target , (i+1) * 300 );

    tween.easing( TWEEN.Easing.Quartic.In )
  
    tween.marker = marker;
    tween.note   = this.path.note;

    tween.onUpdate( function(){

      this.scale.x = this.init.scale;
      this.scale.y = this.init.scale;
      this.scale.z = this.init.scale;

    }.bind( marker ));

    tween.onComplete( function(){
      scene.remove( this ); 
    }.bind( marker ));

    tween.start();


  }

  for( var  i = 0; i < this.path.guides.length; i++ ){

    var marker = this.path.guides[i];

    marker.init = { scale: marker.scale.x };
    marker.target = { scale: 0 };

    var rand = Math.random() * .1 + .9;

    var tween = new TWEEN.Tween( marker.init ).to( marker.target , 1000 );

    tween.easing( TWEEN.Easing.Quartic.In )
  
    tween.marker = marker;
    tween.note   = this.path.note;

    tween.onUpdate( function(){

      this.scale.x = this.init.scale;
      this.scale.y = this.init.scale;
      this.scale.z = this.init.scale;

    }.bind( marker ));

    tween.onComplete( function(){
      scene.remove( this ); 
    }.bind( marker ));

    tween.start();

  }

}




/*


   UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE  
*/


Level.prototype.update = function(){


  if( this.crystalAdded === true && this.active === false ){
  
    this.path.update.bind( this.path );//.bind( this );
    this.path.update();
    this.checkVertabraeForDestruction();

    if( this.skybox.gem ) this.skybox.gem.update();
    var dif = this.scene.position.clone().sub( this.dragonFish.leader.position );
  
    if( dif.length() <= this.crystal.size * 3 ){

      this.onStart();

    }

  }

  if( this.active ){

    if( this.skybox.gem ) this.skybox.gem.update();
    //this.startText.update();
    //this.deathText.update();
    this.updateHooks();

  }

}

Level.prototype.checkVertabraeForDestruction = function(){


  var from = this.dragonFish.leader.position.clone();
  var dif = from.sub( this.scene.position );


  
  var length = 1 - dif.length() / this.distanceFromPreviousLevel;
  var percentToLocation = length; 
  for( var i = 0; i < this.dragonFish.spine.length; i++ ){

   var verta = this.dragonFish.spine[i];

   if( percentToLocation > verta.percentToDestruction ){

     //console.log( verta.percentToDestruction );
   
     this.dragonFish.removeVertabraeById( i );
     this.removeHookUI( verta );

     for( var j=0; j < this.hookedHooks.length; j++ ){

       if( this.hookedHooks[j].id === verta.id ){

         //console.log('hook removed');
         this.hookedHooks.splice( j , 1 );
         j--;

       }

     }
     //i--;


   }


  }

}

Level.prototype.updateHooks = function(){

  for( var i = 0; i < this.hooks.length; i++ ){
    this.hooks[i].updateForces( this );
  }

  for( var i= 0; i < this.hooks.length; i++ ){

    this.hooks[i].updatePosition();
    this.hooks[i].checkForCollision( 2 , i );
  }

  //console.log( this.hooks[0].position.x );
  
  if( !paused ){
    this.dragonFish.update();
  }

}

/*
 
   HOOK EVENTS HOOK EVENTS HOOK EVENTS HOOK EVENTS HOOK EVENTS HOOK EVENTS HOOK EVENTS HOOK EVENTS HOOK EVENTS HOOK EVENTS HOOK EVENTS HOOK EVENTS HOOK EVENTS HOOK EVENTS HOOK EVENTS HOOK EVENTS HOOK EVENTS HOOK EVENTS HOOK EVENTS HOOK EVENTS HOOK EVENTS HOOK EVENTS 

*/

// Check to see if we should put any more hooks into circulation
Level.prototype.onHook = function( index , hook ){


  SCORE ++;


  if( this.params.skybox.onHook ){
    var func = this.params.skybox.onHook.bind( this.skybox );
    func( hook );
  }

  if( this.params.crystal.onHook ){
    var func = this.params.crystal.onHook.bind( this.crystal );
    func( hook );
  }

  if( this.params.stones.onHook ){
    var func = this.params.stones.onHook.bind( this.stones );
    func( hook );
  }

  this.currentScore = SCORE - this.startScore;

  // when we hook the first, fade out our ambient loop
  if( this.currentScore == 1 && this.firstHook === false && this.params.credits !== true  ){

    this.firstHook = true;
  
    var l = LOOPS[ this.params.ambient ];
//     LOOPS[ this.params.ambient ].play();
//    LOOPS[ this.params.ambient ].gain.gain.value = 0;
    var gainNode = LOOPS[ this.params.ambient ].gain;
    var t = audioController.ctx.currentTime;
    gainNode.gain.linearRampToValueAtTime(.5, audioController.ctx.currentTime  );
    gainNode.gain.linearRampToValueAtTime(0,  audioController.ctx.currentTime  + 6 ); 
    /*setTimeout( function(){


      console.log('hello' );
      LOOPS[ this.params.ambient ].stop();

    }.bind( this ) , 6000 );
    console.log( 'FIRST' );*/

  }

  this.percentComplete = this.currentScore / this.length;

  this.checkForNewHooks( this.currentScore );

  var cs = this.currentScore;
  /*if( cs == 2 && this.startText.active === true ){
    this.startText.kill();
  }*/

  if( cs === this.params.death.startScore && this.deathStarted === false ){

    this.startDeath();

  }

  if( this.deathStarted && this.death.tilAttack ){

    this.death.tilAttack -= 1;

    if( this.death.tilAttack === 0 ){

      console.log('REATTRAC');
       deathDragon.bait.position.copy( dragonFish.bait.position );
 
      var x =( Math.random() - .5 );
      var y =( Math.random() - .5 );
      var z =( Math.random() - .5 );

      var dir = new THREE.Vector3( 0, 0, 1 );
      dir.applyQuaternion( camera.quaternion );
      dir.multiplyScalar( this.death.distance );

      deathDragon.bait.position.add( dir );
       
      /* HACKED */
      
      /*

         Making sure everything arrives together
      */
      deathDragon.recursiveCall( deathDragon.leader , function( three , obj ){
        obj.velocity.set( 0 , 0 , 0 );
      });

      deathDragon.recursiveCall( deathDragon.leader , function( three , obj ){
        obj.position.copy( deathDragon.bait.position );
      });


     /* deathDragon.recursiveCall( deathDragon.plumeBabies[0] , function( obj ){
        obj.position.copy( deathDragon.bait.position );
      });

      deathDragon.recursiveCall( deathDragon.plumeBabies[1] , function( obj ){
        obj.position.copy( deathDragon.bait.position );
      });
      

      deathDragon.recursiveCall( deathDragon.plumeBabies[2] , function( obj ){
        obj.position.copy( deathDragon.bait.position );
      });
*/

      deathDragon.attack();
     // this.death.tilAttack = undefined;

    }

  }

  /*if( cs === (this.params.death.startScore + 2 ) && this.deathText.active === true ){

    this.deathText.kill();

  }*/

  document.getElementById( 'hookCount' ).innerHTML = SCORE;

  hook.explode();

  this.hooks.splice( index , 1 );

  this.hookedHooks.push( hook );

  if( this.percentComplete == 1 ){

    this.onComplete();

  }

  this.updateHookUI( hook );

}



Level.prototype.checkForNewHooks = function( score ){

  for( var i = 0; i < this.hooksOnDeck.length; i++ ){

    var hook = this.hooksOnDeck[i];

    if( hook.startScore <= score ){

      this.hooksOnDeck.splice( i , 1 );
      this.hooks.push( hook );

      hook.activate();
      this.dragonFish.addToScene( hook.vertabrae );

      i--;

      this.addHookUI( hook );

    }


  }
}


Level.prototype.onDeath = function(){

  if( !this.dead ){
    
    this.dead = true;
    this.death.note.play();

    deathDragon.retreat();
    //this.deathText.kill();
    
    if( this.dragonFish.spine[0] ){
   
      for( var i=0; i < this.dragonFish.spine.length; i++ ){
        //console.log('removeds');
        this.dragonFish.removeVertabraeById( i );
        i--;
      }

      this.tmpHooks = [];
      for( var  i =0; i < this.hookedHooks.length; i++ ){
        
        var h = this.hookedHooks[i];
        this.deactivateHookUI( h );

        this.tmpHooks.push( h );

      }



      window.setTimeout( function(){
        
        for( var  i =0; i < this.tmpHooks.length; i++ ){

          var h = this.tmpHooks[i];

          this.hooks.push( h );

          h.activate();
          this.dragonFish.addToScene( h.vertabrae );


        }

        this.death.tilAttack = this.params.death.startScore;
       
        this.tmpHooks = null;
        this.hookedHooks = [];

      }.bind( this ) , 5000 );

      SCORE = this.restartScore;
      this.currentScore = SCORE - this.startScore;


     // this.hookedHooks = [];


    }else{

      alert('totally dead');

    }

    setTimeout( function(){

      this.dead = false;

    }.bind( this ) , 1000 );

  }

}


Level.prototype.onComplete = function(){

  //TODO:
  //PLAY FINISH NOISE

  deathDragon.bait.position.set( 0 , -10000 , -10000 );
  deathDragon.retreat();

  //this.death.loop.gain.gain.value = 0; 
  soulSucker.beingChased.value = 0; 

  if( this.nextLevel ){
    this.nextLevel.initialize();
    CURRENT_LEVEL ++;
    
  }else{

    this.endGame();
    console.log( 'TODO: FINISH GAME' );

  }

}

Level.prototype.endGame = function(){
    document.getElementById( 'hookCount' ).innerHTML = 'YOU WON';
}

Level.prototype.onEnd = function(){


}


/*

   HOOK UI

*/

Level.prototype.addHookUI = function( hook ){

  if( !hook.ui ){

    var hookRow = document.getElementById( hook.type );

   
    var color = hook.color.getHexString();

    if( !hookRow ){
      

      hookRow = document.createElement('div');
      hookRow.classList.add( 'hookRow');
      hookRow.id = hook.type;

      var numOf = 1 / hook.power;

      var hookInfo = document.getElementById('hookInfo');
      hookInfo.appendChild( hookRow );

    }

    var hookCounter = document.createElement('div' );
    hookCounter.classList.add( 'hookCounter' );
    hookCounter.classList.add( 'inactive' );
    hookCounter.style.border = '1px  solid #'+color;

    hook.ui = hookCounter;
    hookRow.appendChild( hookCounter );

  }


}

Level.prototype.deactivateHookUI = function( hook ){

  //console.log( hook );
  var el = $( hook.ui );
  el.removeClass( 'active' );
  el.addClass( 'inactive' );
  el.css( 'background' , 'none' );

}
Level.prototype.updateHookUI = function( hook ){

 // var hookRow = document.getElementById( hook.type );


 // for( var i = 0; i < hookRow.childNodes.length; i++ ){

  var el = $( hook.ui )

  var inactive = el.hasClass('inactive');
  if( inactive ){

    var color = '#'+hook.color.getHexString();
    el.removeClass('inactive');
    el.addClass('active');
    el.css( 'background' ,  color);
   // break;
  }


}


Level.prototype.removeHookUI = function( hook ){

  var hookRow = document.getElementById( hook.type );

  /*console.log( hook.type );

  console.log( hook );
  console.log( hookRow );*/

 // for( var i = hookRow.childNodes.length; i >= 0; i-- ){

   // var el = $( hookRow.childNodes[i] );
    hookRow.removeChild( hook.ui );
    
    if( hookRow.childNodes.length == 0 ){
      //console.log('WHAOSSSDASSD');
      hookRow.parentNode.removeChild( hookRow );
    }
    


 // }


}




/*
    
    - New Hooks - instantiate
    - Clear Hooks - clear all of the unneed hooks that are part of the dragonfish
    - Skybox - Object needs to be loaded
    - Pathway - some sort of representation of how to get to the next level
    - level complete Noise


*/

