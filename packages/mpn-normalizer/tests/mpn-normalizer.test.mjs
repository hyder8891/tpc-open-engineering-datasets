import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SUPPORTED_BRANDS,
  normalizeMpn,
  classifyOemBrand,
  repairOcrConfusions,
  parseBomLine,
} from '../index.mjs';

const GOLDEN_CASES = [
  // 1. ABB
  { raw: 'ABB 3BDS 005799 R1', canonical: '3BDS005799R1', brand: 'ABB', ocr: false },
  { raw: 'Original ABB 3BDSOO5799RI', canonical: '3BDS005799R1', brand: 'ABB', ocr: true },
  { raw: '3BSE0I8I57R1', canonical: '3BSE018157R1', brand: 'ABB', ocr: true },
  { raw: '3BHB005171R0101', canonical: '3BHB005171R0101', brand: 'ABB', ocr: false },
  { raw: 'ISDA073688RI', canonical: '1SDA073688R1', brand: 'ABB', ocr: true },
  { raw: 'ACS88O-OI-O45A-3', canonical: 'ACS880-01-045A-3', brand: 'ABB', ocr: true },
  { raw: 'ABB M2QA 132M4A', canonical: 'M2QA132M4A', brand: 'ABB', ocr: false },
  { raw: 'AZ2O/112112221112E/STD', canonical: 'AZ20/112112221112E/STD', brand: 'ABB', ocr: true },

  // 2. Siemens
  { raw: 'Siemens 6ES7 315-2EH14-0AB0', canonical: '6ES7315-2EH14-0AB0', brand: 'Siemens', ocr: false },
  { raw: '6ES73I5-2EHI4-OABO', canonical: '6ES7315-2EH14-0AB0', brand: 'Siemens', ocr: true },
  { raw: '6EP13321LB00', canonical: '6EP1332-1LB00', brand: 'Siemens', ocr: false },
  { raw: '3RW4O26-IBBI4', canonical: '3RW4026-1BB14', brand: 'Siemens', ocr: true },
  { raw: '3TF3200-OB-Z', canonical: '3TF3200-0B-Z', brand: 'Siemens', ocr: true },
  { raw: '3WLI1O8-2BB32-IAA2', canonical: '3WL1108-2BB32-1AA2', brand: 'Siemens', ocr: true },

  // 3. Allen-Bradley
  { raw: 'Allen-Bradley 1756 PA75', canonical: '1756-PA75', brand: 'Allen-Bradley', ocr: false },
  { raw: 'I747-L553/B', canonical: '1747-L553', brand: 'Allen-Bradley', ocr: true, rev: 'B' },
  { raw: '1784-KT', canonical: '1784-KT', brand: 'Allen-Bradley', ocr: false },
  { raw: '2O8O-LC5O-24QVB', canonical: '2080-LC50-24QVB', brand: 'Allen-Bradley', ocr: true },

  // 4. Schneider Electric
  { raw: 'SCHNEIDER 140 CPS 11420', canonical: '140CPS11420', brand: 'Schneider Electric', ocr: false },
  { raw: 'I4OCHSI1OOO', canonical: '140CHS11000', brand: 'Schneider Electric', ocr: true },
  { raw: 'LCID25M7', canonical: 'LC1D25M7', brand: 'Schneider Electric', ocr: true },
  { raw: 'BMXP342O2O', canonical: 'BMXP342020', brand: 'Schneider Electric', ocr: true },

  // 5. Yokogawa
  { raw: 'YOKOGAWA F3XD64-3N', canonical: 'F3XD64-3N', brand: 'Yokogawa', ocr: false },
  { raw: 'F3BUO6-ON', canonical: 'F3BU06-0N', brand: 'Yokogawa', ocr: true },
  { raw: 'CP345', canonical: 'CP345', brand: 'Yokogawa', ocr: false },
  { raw: 'AAII43-SOO', canonical: 'AAI143-S00', brand: 'Yokogawa', ocr: true },
  { raw: 'EJAI1OE-JMS5J-912EA', canonical: 'EJA110E-JMS5J-912EA', brand: 'Yokogawa', ocr: true },

  // 6. Rosemount
  { raw: 'Rosemount 3O5ICD-2A22AIAB4-M5', canonical: '3051CD2A22A1AB4M5', brand: 'Rosemount', ocr: true },
  { raw: '3051S2TG2A2E11A1AB4M5', canonical: '3051S2TG2A2E11A1AB4M5', brand: 'Rosemount', ocr: false },
  { raw: '3I44PD1A1E5B4M5', canonical: '3144PD1A1E5B4M5', brand: 'Rosemount', ocr: true },

  // 7. Bently Nevada
  { raw: 'Bently Nevada 330180 91 00', canonical: '330180-91-00', brand: 'Bently Nevada', ocr: false },
  { raw: '33OI3O-O45-OO-O5', canonical: '330130-045-00-05', brand: 'Bently Nevada', ocr: true },
  { raw: '35OO/42M-OI-OO', canonical: '3500/42M-01-00', brand: 'Bently Nevada', ocr: true },

  // 8. Hagglunds
  { raw: 'Hagglunds CA70 60', canonical: 'CA70-60', brand: 'Hagglunds', ocr: false },
  { raw: 'CA14O-I2O', canonical: 'CA140-120', brand: 'Hagglunds', ocr: true },
  { raw: 'CBM 2OOO', canonical: 'CBM-2000', brand: 'Hagglunds', ocr: true },

  // 9. EagleBurgmann
  { raw: 'EagleBurgmann MG13-28-Z', canonical: 'MG13/28-Z', brand: 'EagleBurgmann', ocr: false },
  { raw: 'MGI3/28-Z', canonical: 'MG13/28-Z', brand: 'EagleBurgmann', ocr: true },
  { raw: 'M74S2/I25-G95A', canonical: 'M74S2/125-G95A', brand: 'EagleBurgmann', ocr: true },
];

test('SUPPORTED_BRANDS exposes all 9 OEM industrial families', () => {
  assert.equal(SUPPORTED_BRANDS.length, 9);
  for (const expected of [
    'ABB',
    'Siemens',
    'Allen-Bradley',
    'Schneider Electric',
    'Yokogawa',
    'Rosemount',
    'Bently Nevada',
    'Hagglunds',
    'EagleBurgmann',
  ]) {
    assert.ok(SUPPORTED_BRANDS.includes(expected), `Missing ${expected}`);
  }
});

test('Golden normalization, OCR repair, and brand classification across all 9 OEMs', () => {
  for (const tc of GOLDEN_CASES) {
    const res = normalizeMpn(tc.raw);
    assert.equal(res.canonicalMpn, tc.canonical, `Failed canonical for ${tc.raw}`);
    assert.equal(res.brand, tc.brand, `Failed brand for ${tc.raw}`);
    assert.equal(res.ocrRepaired, tc.ocr, `Failed ocrRepaired flag for ${tc.raw}`);
    assert.equal(res.confidence, 'HIGH', `Expected HIGH confidence for ${tc.raw}`);
    if (tc.rev) {
      assert.equal(res.revisionOrSeries, tc.rev);
    }

    const secondPass = normalizeMpn(res.canonicalMpn, { brandHint: res.brand || '' });
    assert.equal(secondPass.canonicalMpn, tc.canonical, `Idempotence failed for ${tc.canonical}`);
    assert.equal(secondPass.ocrRepaired, false, `Second pass should not trigger repairs for ${tc.canonical}`);
  }
});

test('classifyOemBrand & repairOcrConfusions direct helpers', () => {
  const cls = classifyOemBrand('3BHB003154R0101');
  assert.equal(cls.brand, 'ABB');
  assert.equal(cls.confidence, 'HIGH');

  const rep = repairOcrConfusions('6ES73I52EHI4OABO');
  assert.equal(rep.token, '6ES7315-2EH14-0AB0');
  assert.equal(rep.brand, 'Siemens');
  assert.ok(rep.repairs.length >= 1);
});

test('parseBomLine extracts quantity, UOM, and normalized MPN cleanly', () => {
  const line1 = parseBomLine('Line 1: Genuine Siemens 6ES7 3I5-2EHI4-OABO Qty: 4 PCS | Urgent Basra');
  assert.ok(line1);
  assert.equal(line1.canonicalMpn, '6ES7315-2EH14-0AB0');
  assert.equal(line1.brand, 'Siemens');
  assert.equal(line1.quantity, 4);
  assert.equal(line1.uom, 'PCS');

  const line2 = parseBomLine('Item 2 - EagleBurgmann MGI3-28-Z x 12 SETS');
  assert.ok(line2);
  assert.equal(line2.canonicalMpn, 'MG13/28-Z');
  assert.equal(line2.brand, 'EagleBurgmann');
  assert.equal(line2.quantity, 12);
  assert.equal(line2.uom, 'SET');
  assert.ok(line2.searchAliases.includes('mg13-28-z'));

  assert.equal(parseBomLine('   '), null);
  assert.equal(normalizeMpn('').canonicalMpn, '');
});
