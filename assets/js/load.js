/* FCT demo — loader. One include per page; writes fonts, styles, chart lib, data and app scripts in order (works on file:// and http). */
(function(){
  var me = document.currentScript.src, root = me.replace(/assets\/js\/load\.js.*$/, '');
  var css = ['https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&display=swap', root+'assets/css/fct.css'];
  var js = ['https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js',
    root+'data/core.js', root+'data/exceptions.js', root+'data/p2p.js', root+'data/o2c.js', root+'data/r2r.js', root+'data/sc.js', root+'data/cmp.js', root+'data/sc/demand.js', root+'data/sc/anomalies.js', root+'data/xtower.js', root+'data/rca.js',
    root+'assets/js/fct-core.js', root+'assets/js/fct-ui.js'];
  var h = '<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22%3E%3Crect width=%2232%22 height=%2232%22 rx=%226%22 fill=%22%230F3B3A%22/%3E%3Ctext x=%2216%22 y=%2222%22 font-family=%22Georgia%22 font-size=%2214%22 fill=%22%23fff%22 text-anchor=%22middle%22%3EF%3C/text%3E%3C/svg%3E"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>';
  css.forEach(function(c){ h += '<link rel="stylesheet" href="'+c+'">'; });
  js.forEach(function(s){ h += '<script src="'+s+'"><\/script>'; });
  document.write(h);
})();
