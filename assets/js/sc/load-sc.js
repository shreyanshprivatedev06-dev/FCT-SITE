/* FCT demo — Supply chain tower loader. Include after assets/js/load.js on SC screens.
   Adds the vendored React stack (same versions as P2P/O2C), the SC master data and seeded ledger, the engine and the components. */
(function(){
  var me = document.currentScript.src, root = me.replace(/assets\/js\/sc\/load-sc\.js.*$/, '');
  var v = root + 'assets/vendor/';
  /* react 18.3.1 · react-dom 18.3.1 · prop-types 15.8.1 · recharts 2.12.7 · framer-motion 11.3.31 · htm 3.1.1 */
  var js = [v+'react.js', v+'react-dom.js', v+'prop-types.js', v+'recharts.js', v+'framer-motion.js', v+'htm.js',
    root+'assets/js/sc/icons.js', root+'data/sc/master.js', root+'data/sc/ledger.js', root+'assets/js/sc/sc-model.js', root+'assets/js/sc/sc-ui.js', root+'assets/js/shared/explore.js', root+'assets/js/shared/playbook.js', root+'assets/js/shared/act.js', root+'assets/js/sc/sc-views.js'];
  var h = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"><link rel="stylesheet" href="'+root+'assets/css/p2p.css">';
  js.forEach(function(s){ h += '<script src="'+s+'"><\/script>'; });
  document.write(h);
})();
