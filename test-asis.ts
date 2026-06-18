import { AsisV3Engine } from './lib/asis/core/asisV3Engine';

async function test() {
  console.log('=== ASIS v3 Test ===\n');
  
  const asis = new AsisV3Engine();
  
  // Test 1: Math
  console.log('Test 1: Math');
  const math = await asis.ask("What is 2 + 2 * 2?");
  console.log(math);
  console.log('');
  
  // Test 2: Code
  console.log('Test 2: Code');
  const code = await asis.code("sort an array in TypeScript", "typescript");
  console.log(code);
  console.log('');
  
  // Test 3: Knowledge
  console.log('Test 3: Knowledge');
  const knowledge = await asis.ask("What is the capital of Kenya?");
  console.log(knowledge);
  console.log('');
  
  // Test 4: Benchmark
  console.log('Test 4: Benchmark');
  const report = await asis.benchmark("math");
  console.log(report);
}

test().catch(console.error);
