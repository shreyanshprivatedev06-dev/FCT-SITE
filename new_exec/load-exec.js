/* FCT demo: executive layer loader. Include in the <body> of screens/home/desk.html, after assets/js/load.js.
   Adds Inter, the executive styles, d3 for the globe view, the page shell, the P2P, O2C, R2R and SC data and models, and the executive scripts, in that order. */
(function(){
  var me = document.currentScript.src, root = me.replace(/assets\/js\/exec\/load-exec\.js.*$/, '');
  var h = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">' +
          '<link rel="stylesheet" href="' + root + 'assets/vendor/leaflet/leaflet.css">' +
          '<link rel="stylesheet" href="' + root + 'assets/css/exec.css">';
  /* the shell must be defined before it is written, so load it synchronously here */
  document.write(h + '<script src="' + root + 'assets/js/exec/exec-shell.js"><\/script>' +
    '<script>document.write(window.FCT_EXEC_SHELL);<\/script>');
  /* Leaflet 1.9.4 (vendored, as on the tower maps) draws the home-page map */
  document.write('<script src="' + root + 'assets/vendor/leaflet/leaflet.js"><\/script>');
  /* d3-geo and topojson draw the globe view of the map; if the CDN is blocked the Map / Globe toggle hides itself */
  document.write('<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js"><\/script>' +
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/topojson/3.0.2/topojson.min.js"><\/script>');
  [ 'data/p2p/master.js', 'data/p2p/ledger.js', 'assets/js/p2p/p2p-model.js',
    'data/o2c/master.js', 'data/o2c/ledger.js', 'assets/js/o2c/o2c-model.js',
    'data/r2r/master.js', 'data/r2r/ledger.js', 'assets/js/r2r/r2r-model.js',
    'data/sc/master.js', 'data/sc/ledger.js', 'assets/js/sc/sc-model.js',
    'assets/js/exec/exec-ui.js', 'assets/js/exec/exec-globe.js', 'assets/js/exec/exec-views.js'
  ].forEach(function(s){ document.write('<script src="' + root + s + '"><\/script>'); });
})();