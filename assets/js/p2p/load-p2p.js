/* FCT demo — P2P tower loader. Include after assets/js/load.js on P2P screens.
   Adds the vendored React stack (same exact versions as the SC tower), the P2P master data and seeded ledger, the engine and the components. */
(function(){
  var me = document.currentScript.src, root = me.replace(/assets\/js\/p2p\/load-p2p\.js.*$/, '');
  var v = root + 'assets/vendor/';
  /* react 18.3.1 · react-dom 18.3.1 · prop-types 15.8.1 · recharts 2.12.7 · framer-motion 11.3.31 · htm 3.1.1 */
  var js = [v+'react.js', v+'react-dom.js', v+'prop-types.js', v+'recharts.js', v+'framer-motion.js', v+'htm.js',
    root+'assets/js/sc/icons.js', root+'data/p2p/master.js', root+'data/p2p/ledger.js', root+'assets/js/p2p/p2p-model.js', root+'assets/js/p2p/p2p-ui.js', root+'assets/js/shared/explore.js', root+'assets/js/shared/playbook.js', root+'assets/js/shared/act.js', root+'assets/js/p2p/p2p-views.js'];
  /* Inter (Google Fonts) for every P2P screen: clean, tabular figures */
  var h = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"><link rel="stylesheet" href="'+root+'assets/css/p2p.css">';
  js.forEach(function(s){ h += '<script src="'+s+'"><\/script>'; });
  document.write(h);
})();
