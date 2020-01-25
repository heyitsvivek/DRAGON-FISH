  

      var SOCIAL_MEDIA = [
        ["Download" , "download_1.png" , "https://www.facebook.com/AutografOfficial/app_208195102528120"],
        ["Share on Twitter" ,"twitter_1.png" , "http://twitter.com/share?text=Psychedelic%20Snake%20with%20audio%20from%20@AutografMusic%20coded%20by%20@vivekzz%20&url=http://heyitsvivek.github.io/DRAGONFISH"],
        ["Share on Facebook", "facebook_1.png" , 'http://www.facebook.com/sharer.php?u=http://heyitsvivek.github.io/DRAGONFISH'],
        ["Autograf on Soundcloud" ,"soundcloud_1.png" , "https://soundcloud.com/autografmusic"],
        ["Cabbibo" , "cabbibo_1.png" , "http://repl.it/@vvc"],
        ["Information" , "info_1.png" , "" ],
      ]
      

  function addSocialMedia( smArray ){

        this.social = document.createElement('div');
        this.social.id = 'social';
        document.body.appendChild( this.social );

        window.titleEP  = document.createElement('a');
        window.titleEP.href = 'https://soundcloud.com/autografmusic/magicstick';
        window.titleEP.target = '_blank';
        window.titleEP.id = 'titleEP';
        window.titleEP.innerHTML = 'Autograf - Magic Stick';


        this.social.appendChild( window.titleEP  );

        for( var i  = 0; i < smArray.length; i ++ ){

          var a = document.createElement('a');

          if( i != smArray.length -1 ){
            a.href = smArray[i][2];
            if( i != 0 )
              a.target = '_blank';
          }else{
            a.onClick = "function(){ console.log('hello')}";
            a.id = "information"
          }



          a.style.background = 'url( icons/'+smArray[i][1]+')';
          a.style.backgroundSize = '100%';
          a.style.backgroundSize ="25px";
          a.style.backgroundPosition="center";
          a.style.backgroundRepeat="no-repeat";
          a.className += 'social';
          a.INFO_TEXT = smArray[i][0];

          this.social.appendChild( a );

        }

      }


