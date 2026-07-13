/**
 * Verify a signed CBOM envelope: ML-DSA-65 signature + CycloneDX 1.6 schema.
 * Usage: pnpm cbom:verify <path-to-cbom.signed.json>
 * Exit code 0 = both checks pass; 1 = any failure.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { verifyCBOM } from '../src/cbom.js'
import type { SignedCBOM } from '../src/cbom.js'

const here = dirname(fileURLToPath(import.meta.url))
const file = process.argv[2]
if (!file) {
  console.error('Usage: pnpm cbom:verify <path-to-cbom.signed.json>')
  process.exit(1)
}

const signed = JSON.parse(readFileSync(file, 'utf8')) as SignedCBOM

const sigOk = verifyCBOM(signed)
console.log(`ML-DSA-65 signature: ${sigOk ? 'VALID' : 'INVALID'}`)

const ajv = new Ajv({ strict: false, allErrors: true })
addFormats(ajv)
ajv.addSchema(JSON.parse(readFileSync(join(here, 'schemas/spdx.schema.json'), 'utf8')))
ajv.addSchema(JSON.parse(readFileSync(join(here, 'schemas/jsf-0.82.schema.json'), 'utf8')))
const validate = ajv.compile(
  JSON.parse(readFileSync(join(here, 'schemas/bom-1.6.schema.json'), 'utf8')),
)
const schemaOk = validate(signed.cbom) as boolean
console.log(`CycloneDX 1.6 schema: ${schemaOk ? 'VALID' : 'INVALID'}`)
if (!schemaOk) console.error(validate.errors)

console.log(`components: ${signed.cbom.components.length}, target: ${signed.cbom.metadata.component.name}`)
process.exit(sigOk && schemaOk ? 0 : 1)
