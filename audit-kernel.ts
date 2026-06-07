// boot_kernel_audit.ts — paste this content and run
async function auditKernel() {
  const results = [];
  
  const tests = [
    { name: 'Kernel loads successfully', check: () => {
      try {
        const k = require('@/lib/kernel').kernel || require('@/lib/kernel').default;
        return { pass: !!k, msg: k ? 'Kernel instance found' : 'Kernel is null' };
      } catch(e) { return { pass: false, msg: e.message }; }
    }},
    { name: 'Event bus operational', check: () => {
      try {
        const eb = require('@/lib/kernel/eventBus').eventBus || require('@/lib/kernel/eventBus').default;
        return { pass: eb && typeof eb.emit === 'function', msg: eb ? 'Event bus found' : 'Event bus missing' };
      } catch(e) { return { pass: false, msg: e.message }; }
    }},
    { name: 'Runtime registry operational', check: () => {
      try {
        const rr = require('@/lib/kernel/runtimeRegistry').runtimeRegistry || require('@/lib/kernel/runtimeRegistry').default;
        return { pass: rr && typeof rr.register === 'function', msg: rr ? 'Registry found' : 'Registry missing' };
      } catch(e) { return { pass: false, msg: e.message }; }
    }},
    { name: 'Module registration operational', check: () => {
      try {
        const mr = require('@/lib/kernel/moduleRegistry').moduleRegistry || require('@/lib/kernel/moduleRegistry').default;
        return { pass: mr && typeof mr.register === 'function', msg: mr ? 'Module registry found' : 'Module registry missing' };
      } catch(e) { return { pass: false, msg: e.message }; }
    }},
    { name: 'Permission engine operational', check: () => {
      try {
        const pe = require('@/lib/kernel/permissionEngine').permissionEngine || require('@/lib/kernel/permissionEngine').default;
        return { pass: pe && typeof pe.check === 'function', msg: pe ? 'Permission engine found' : 'Permission engine missing' };
      } catch(e) { return { pass: false, msg: e.message }; }
    }},
    { name: 'Error boundary operational', check: () => {
      try {
        const eb = require('@/lib/kernel/errorBoundary').errorBoundary || require('@/lib/kernel/errorBoundary').default;
        return { pass: eb && typeof eb.capture === 'function', msg: eb ? 'Error boundary found' : 'Error boundary missing' };
      } catch(e) { return { pass: false, msg: e.message }; }
    }},
    { name: 'Recovery mode operational', check: () => {
      try {
        const rm = require('@/lib/kernel/recoveryMode').recoveryMode || require('@/lib/kernel/recoveryMode').default;
        return { pass: rm && typeof rm.enable === 'function', msg: rm ? 'Recovery mode found' : 'Recovery mode missing' };
      } catch(e) { return { pass: false, msg: e.message }; }
    }},
    { name: 'Safe mode operational', check: () => {
      try {
        const sm = require('@/lib/kernel/safeMode').safeMode || require('@/lib/kernel/safeMode').default;
        return { pass: sm && typeof sm.activate === 'function', msg: sm ? 'Safe mode found' : 'Safe mode missing' };
      } catch(e) { return { pass: false, msg: e.message }; }
    }},
    { name: 'Crash reporting operational', check: () => {
      try {
        const cr = require('@/lib/kernel/crashReporter').crashReporter || require('@/lib/kernel/crashReporter').default;
        return { pass: cr && typeof cr.report === 'function', msg: cr ? 'Crash reporter found' : 'Crash reporter missing' };
      } catch(e) { return { pass: false, msg: e.message }; }
    }},
    { name: 'System diagnostics operational', check: () => {
      try {
        const d = require('@/lib/kernel/diagnostics').diagnostics || require('@/lib/kernel/diagnostics').default;
        return { pass: d && typeof d.run === 'function', msg: d ? 'Diagnostics found' : 'Diagnostics missing' };
      } catch(e) { return { pass: false, msg: e.message }; }
    }}
  ];
  
  for (const test of tests) {
    const start = performance.now();
    const result = test.check();
    const loadTime = performance.now() - start;
    results.push({
      component: test.name,
      status: result.pass ? 'PASS' : 'FAIL',
      message: result.msg,
      loadTime
    });
  }
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  MTAA OS V1 — LAYER 1 KERNEL AUDIT RESULTS');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  let pass = 0, fail = 0;
  results.forEach(r => {
    const icon = r.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${r.component}`);
    console.log(`   ${r.message}${r.loadTime ? ` (${r.loadTime.toFixed(2)}ms)` : ''}\n`);
    if (r.status === 'PASS') pass++; else fail++;
  });
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  TOTAL: ${results.length} | ✅ PASS: ${pass} | ❌ FAIL: ${fail}`);
  console.log(`  SCORE: ${((pass / results.length) * 100).toFixed(1)}%`);
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  return { pass, fail, total: results.length, score: (pass / results.length) * 100 };
}

// Run it:
auditKernel().then(r => console.log('Audit complete:', r));
