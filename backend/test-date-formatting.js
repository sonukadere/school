import assert from 'node:assert'
import {
  parseDate,
  formatDate,
  toDateOnly,
  isValidDateParts,
} from './src/utils/helpers.js'

console.log('==================================================')
console.log('  STANDARDIZED DD/MM/YYYY DATE TEST SUITE')
console.log('==================================================\n')

let passed = 0
let failed = 0

function test(description, fn) {
  try {
    fn()
    console.log(`  ✅ PASS: ${description}`)
    passed++
  } catch (err) {
    console.error(`  ❌ FAIL: ${description}`)
    console.error(`     Error: ${err.message}`)
    failed++
  }
}

// -----------------------------------------------------------------
// Test 1: User-Specified Key Dates
// -----------------------------------------------------------------
console.log('--- Test Suite 1: Specific Target Dates (DD/MM/YYYY) ---')

test('Test Date 1: 01/01/2026 parses and formats strictly as 01/01/2026', () => {
  const parsed = parseDate('01/01/2026')
  assert.ok(parsed instanceof Date)
  assert.strictEqual(parsed.getUTCFullYear(), 2026)
  assert.strictEqual(parsed.getUTCMonth(), 0) // January
  assert.strictEqual(parsed.getUTCDate(), 1)
  assert.strictEqual(formatDate(parsed), '01/01/2026')
  assert.strictEqual(formatDate('01/01/2026'), '01/01/2026')
})

test('Test Date 2: 06/09/2026 parses strictly as 6 September 2026 (NEVER 9 June 2026)', () => {
  const parsed = parseDate('06/09/2026')
  assert.ok(parsed instanceof Date)
  assert.strictEqual(parsed.getUTCFullYear(), 2026)
  assert.strictEqual(parsed.getUTCMonth(), 8) // Month index 8 = September
  assert.strictEqual(parsed.getUTCDate(), 6) // Day 6
  // Ensure it was NOT parsed as June (month index 5)
  assert.notStrictEqual(parsed.getUTCMonth(), 5)
  assert.strictEqual(formatDate(parsed), '06/09/2026')
  assert.strictEqual(formatDate('2026-09-06'), '06/09/2026')
})

test('Test Date 3: 15/09/2026 parses and formats strictly as 15/09/2026', () => {
  const parsed = parseDate('15/09/2026')
  assert.ok(parsed instanceof Date)
  assert.strictEqual(parsed.getUTCFullYear(), 2026)
  assert.strictEqual(parsed.getUTCMonth(), 8) // September
  assert.strictEqual(parsed.getUTCDate(), 15)
  assert.strictEqual(formatDate(parsed), '15/09/2026')
  assert.strictEqual(formatDate('2026-09-15'), '15/09/2026')
})

test('Test Date 4: 31/12/2026 parses and formats strictly as 31/12/2026', () => {
  const parsed = parseDate('31/12/2026')
  assert.ok(parsed instanceof Date)
  assert.strictEqual(parsed.getUTCFullYear(), 2026)
  assert.strictEqual(parsed.getUTCMonth(), 11) // December
  assert.strictEqual(parsed.getUTCDate(), 31)
  assert.strictEqual(formatDate(parsed), '31/12/2026')
  assert.strictEqual(formatDate('2026-12-31'), '31/12/2026')
})

// -----------------------------------------------------------------
// Test 2: ISO Database Date -> Display DD/MM/YYYY Formatting
// -----------------------------------------------------------------
console.log('\n--- Test Suite 2: ISO & Database Date -> DD/MM/YYYY Conversion ---')

test('ISO string 2026-09-06 formats to 06/09/2026', () => {
  assert.strictEqual(formatDate('2026-09-06'), '06/09/2026')
})

test('ISO timestamp 2026-09-06T00:00:00.000Z formats to 06/09/2026', () => {
  assert.strictEqual(formatDate('2026-09-06T00:00:00.000Z'), '06/09/2026')
})

test('UTC midnight Date object formats to 06/09/2026', () => {
  const d = new Date(Date.UTC(2026, 8, 6))
  assert.strictEqual(formatDate(d), '06/09/2026')
})

test('Empty or null date formats safely to empty string', () => {
  assert.strictEqual(formatDate(null), '')
  assert.strictEqual(formatDate(''), '')
  assert.strictEqual(formatDate(undefined), '')
})

// -----------------------------------------------------------------
// Test 3: Date Validation & Invalid Date Rejections
// -----------------------------------------------------------------
console.log('\n--- Test Suite 3: Date Validation & Edge Cases ---')

test('Rejects invalid date: 32/01/2026 (day 32 in January)', () => {
  assert.strictEqual(isValidDateParts(32, 1, 2026), false)
  assert.strictEqual(parseDate('32/01/2026'), null)
})

test('Rejects invalid date: 31/02/2026 (February 31)', () => {
  assert.strictEqual(isValidDateParts(31, 2, 2026), false)
  assert.strictEqual(parseDate('31/02/2026'), null)
})

test('Rejects invalid date: 00/12/2026 (day 0)', () => {
  assert.strictEqual(isValidDateParts(0, 12, 2026), false)
  assert.strictEqual(parseDate('00/12/2026'), null)
})

test('Rejects invalid month: 15/13/2026 (month 13)', () => {
  assert.strictEqual(isValidDateParts(15, 13, 2026), false)
  assert.strictEqual(parseDate('15/13/2026'), null)
})

test('Handles leap year: 29/02/2024 is valid (leap year)', () => {
  assert.strictEqual(isValidDateParts(29, 2, 2024), true)
  const parsed = parseDate('29/02/2024')
  assert.ok(parsed instanceof Date)
  assert.strictEqual(parsed.getUTCDate(), 29)
  assert.strictEqual(parsed.getUTCMonth(), 1)
})

test('Handles non-leap year: 29/02/2025 is invalid', () => {
  assert.strictEqual(isValidDateParts(29, 2, 2025), false)
  assert.strictEqual(parseDate('29/02/2025'), null)
})

// -----------------------------------------------------------------
// Test 4: Backend toDateOnly Consistency
// -----------------------------------------------------------------
console.log('\n--- Test Suite 4: Backend toDateOnly Uniformity ---')

test('toDateOnly produces identical UTC midnight Date from DD/MM/YYYY and YYYY-MM-DD', () => {
  const fromDisplay = toDateOnly('06/09/2026')
  const fromIso = toDateOnly('2026-09-06')
  assert.ok(fromDisplay instanceof Date)
  assert.ok(fromIso instanceof Date)
  assert.strictEqual(fromDisplay.toISOString(), fromIso.toISOString())
  assert.strictEqual(fromDisplay.toISOString(), '2026-09-06T00:00:00.000Z')
})

console.log('\n==================================================')
console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED`)
console.log('==================================================\n')

if (failed > 0) process.exit(1)
process.exit(0)
