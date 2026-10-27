/* FCT demo — R2R tower loader. Include after assets/js/load.js on R2R screens.
   Adds the vendored React stack (same exact versions as P2P and SC), the R2R master data and seeded close ledger, the engine,
   the shared tower components (assets/js/p2p/p2p-ui.js, which read window.TOWERM = R2RM) and the R2R views. */
(function(){
  var me = document.currentScript.src, root = me.replace(/assets\/js\/r2r\/load-r2r\.js.*$/, '');
  var v = root + 'assets/vendor/';
  /* react 18.3.1 · react-dom 18.3.1 · prop-types 15.8.1 · recharts 2.12.7 · framer-motion 11.3.31 · htm 3.1.1 */
  var js = [v+'react.js', v+'react-dom.js', v+'prop-types.js', v+'recharts.js', v+'framer-motion.js', v+'htm.js',
    root+'assets/js/sc/icons.js', root+'data/r2r/master.js', root+'data/r2r/ledger.js', root+'assets/js/r2r/r2r-model.js', root+'assets/js/p2p/p2p-ui.js', root+'assets/js/shared/explore.js', root+'assets/js/shared/playbook.js', root+'assets/js/shared/act.js', root+'assets/js/r2r/r2r-views.js'];
  /* Inter for every tower screen; R2R reuses the P2P stylesheet and adds a few R2R-only rules */
  var h = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"><link rel="stylesheet" href="'+root+'assets/css/p2p.css"><link rel="stylesheet" href="'+root+'assets/css/r2r.css">';
  js.forEach(function(s){ h += '<script src="'+s+'"><\/script>'; });
  document.write(h);
})();
